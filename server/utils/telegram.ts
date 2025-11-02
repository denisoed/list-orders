import { parse } from '@telegram-apps/init-data-node'
import { getSupabaseClient } from './supabase'

/**
 * TypeScript interface for Telegram user data extracted from initData
 */
export interface TelegramUser {
  id: number
  first_name: string
  last_name?: string
  username?: string
  language_code?: string
  is_premium?: boolean
  photo_url?: string
}

/**
 * Parses Telegram initData string and extracts user information.
 * Uses the parse function from @telegram-apps/init-data-node package.
 * 
 * @param initData - The initData string in URL query parameters format (e.g., `user=%7B%22id%22%3A123%7D&auth_date=...&hash=...`)
 * @returns TelegramUser object if parsing is successful, null otherwise
 * 
 * @example
 * ```ts
 * const initData = 'user=%7B%22id%22%3A123%2C%22first_name%22%3A%22John%22%7D&auth_date=1234567890&hash=...'
 * const user = parseInitDataUser(initData)
 * if (user) {
 *   console.log(user.id) // 123
 *   console.log(user.first_name) // "John"
 * }
 * ```
 */
export function parseInitDataUser(initData: string): TelegramUser | null {
  try {
    if (!initData || typeof initData !== 'string') {
      console.log('[Telegram User Save] Error: InitData is missing or invalid')
      return null
    }

    // Parse initData using the official package function
    const parsedData = parse(initData)

    // Check if user data exists in parsed initData
    if (!parsedData.user) {
      console.log('[Telegram User Save] Warning: User data not found in initData')
      return null
    }

    const userData = parsedData.user

    // Validate required fields
    if (typeof userData.id !== 'number' || typeof userData.firstName !== 'string') {
      console.log('[Telegram User Save] Error: Required user fields (id, firstName) are missing or invalid')
      return null
    }

    // Map camelCase fields from parsed data to snake_case format for database
    return {
      id: userData.id,
      first_name: userData.firstName,
      last_name: typeof userData.lastName === 'string' ? userData.lastName : undefined,
      username: typeof userData.username === 'string' ? userData.username : undefined,
      language_code: typeof userData.languageCode === 'string' ? userData.languageCode : undefined,
      is_premium: typeof userData.isPremium === 'boolean' ? userData.isPremium : undefined,
      photo_url: typeof userData.photoUrl === 'string' ? userData.photoUrl : undefined,
    }
  } catch (error) {
    console.log('[Telegram User Save] Error: Unexpected error during initData parsing', error)
    return null
  }
}

/**
 * Saves Telegram user to Supabase users table.
 * Checks if user already exists by telegram_id before inserting.
 * If user exists, the function completes without action.
 * 
 * @param user - TelegramUser object containing user data from initData
 * @returns Promise that resolves when the operation completes (successfully or not)
 * 
 * @example
 * ```ts
 * const user = { id: 123, first_name: 'John', last_name: 'Doe' }
 * await saveUserToSupabase(user)
 * ```
 */
export async function saveUserToSupabase(user: TelegramUser): Promise<void> {
  try {
    const supabase = getSupabaseClient()

    // Check if user already exists
    const { data: existingUser, error: selectError } = await supabase
      .from('users')
      .select('telegram_id')
      .eq('telegram_id', user.id)
      .single()

    // Handle select errors
    if (selectError) {
      // PGRST116 is the error code when no rows are found - this is expected for new users
      if (selectError.code === 'PGRST116' || selectError.message?.includes('No rows')) {
        // User doesn't exist, proceed with insertion
        console.log(`[Telegram User Save] User with telegram_id ${user.id} not found, proceeding with insertion`)
      } else {
        // Other error occurred during check
        console.log(`[Telegram User Save] Error checking user existence:`, selectError)
        return
      }
    } else if (existingUser) {
      // User already exists
      console.log(`[Telegram User Save] User with telegram_id ${user.id} already exists, skipping insertion`)
      return
    }

    // Insert new user if not found
    const userData = {
      telegram_id: user.id,
      first_name: user.first_name,
      last_name: user.last_name ?? null,
      username: user.username ?? null,
      language_code: user.language_code ?? null,
      is_premium: user.is_premium ?? null,
      photo_url: user.photo_url ?? null,
    }

    const { error: insertError } = await supabase
      .from('users')
      .insert([userData])

    if (insertError) {
      // Check if error is due to unique constraint violation (race condition)
      if (insertError.code === '23505' || insertError.message?.includes('duplicate key')) {
        console.log(`[Telegram User Save] User with telegram_id ${user.id} was already inserted (race condition), skipping`)
        return
      }
      console.log(`[Telegram User Save] Error inserting user:`, insertError)
      return
    }

    console.log(`[Telegram User Save] Successfully saved user with telegram_id ${user.id}`)
  } catch (error) {
    console.log('[Telegram User Save] Error: Unexpected error during user save', error)
  }
}

