import { validate, isAuthDateInvalidError, isSignatureInvalidError, isExpiredError } from '@telegram-apps/init-data-node'
import { parseInitDataUser, type TelegramUser } from '~/server/utils/telegram'
import { getSupabaseClient } from '~/server/utils/supabase'

/**
 * TypeScript interface for user data from Supabase
 */
interface SupabaseUser {
  telegram_id: number
  first_name: string | null
  last_name: string | null
  username: string | null
  language_code: string | null
  is_premium: boolean | null
  photo_url: string | null
  time_zone: string | null
  created_at: string | null
  updated_at: string | null
}

function sanitizeTimeZone(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null
  }

  const trimmed = value.trim()
  if (!trimmed) {
    return null
  }

  try {
    new Intl.DateTimeFormat('en-US', { timeZone: trimmed }).format(new Date())
    return trimmed
  } catch (error) {
    console.log(`[@list-orders] Invalid time zone received: ${trimmed}`, error)
    return null
  }
}

/**
 * Finds or creates a user in Supabase.
 * If user exists, returns the existing user. If not, creates and returns the new user.
 * 
 * @param user - TelegramUser object containing user data from initData
 * @returns Promise that resolves with the user data from Supabase, or null on error
 * 
 * @example
 * ```ts
 * const user = { id: 123, first_name: 'John', last_name: 'Doe' }
 * const dbUser = await findOrCreateUser(user)
 * ```
 */
async function findOrCreateUser(
  user: TelegramUser,
  timeZone: string | null,
): Promise<SupabaseUser | null> {
  try {
    const supabase = getSupabaseClient()

    // Check if user already exists
    const { data: existingUser, error: selectError } = await supabase
      .from('users')
      .select('*')
      .eq('telegram_id', user.id)
      .single()

    // Handle select result
    if (selectError) {
      // PGRST116 is the error code when no rows are found - proceed with insertion
      if (selectError.code === 'PGRST116' || selectError.message?.includes('No rows')) {
        console.log(`[Telegram User] User with telegram_id ${user.id} not found, proceeding with insertion`)
      } else {
        // Other error occurred during check
        console.log(`[Telegram User] Error checking user existence:`, selectError)
        return null
      }
    } else if (existingUser) {
      // User already exists, update timezone if needed
      console.log(`[Telegram User] User with telegram_id ${user.id} already exists`)

      if (timeZone && existingUser.time_zone !== timeZone) {
        const { data: updatedUser, error: updateError } = await supabase
          .from('users')
          .update({ time_zone: timeZone })
          .eq('telegram_id', user.id)
          .select('*')
          .single()

        if (updateError) {
          console.log(
            `[Telegram User] Failed to update time zone for telegram_id ${user.id}:`,
            updateError,
          )
          return existingUser as SupabaseUser
        }

        if (updatedUser) {
          return updatedUser as SupabaseUser
        }
      }

      return existingUser as SupabaseUser
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
      time_zone: timeZone,
    }

    const { data: newUser, error: insertError } = await supabase
      .from('users')
      .insert([userData])
      .select()
      .single()

    if (insertError) {
      // Check if error is due to unique constraint violation (race condition)
      if (insertError.code === '23505' || insertError.message?.includes('duplicate key')) {
        console.log(`[Telegram User] User with telegram_id ${user.id} was already inserted (race condition), fetching existing user`)
        
        // Fetch the existing user that was just created in parallel
        const { data: raceUser } = await supabase
          .from('users')
          .select('*')
          .eq('telegram_id', user.id)
          .single()
        
        if (raceUser && timeZone && raceUser.time_zone !== timeZone) {
          const { data: updatedUser, error: updateError } = await supabase
            .from('users')
            .update({ time_zone: timeZone })
            .eq('telegram_id', user.id)
            .select('*')
            .single()

          if (updateError) {
            console.log(
              `[Telegram User] Failed to update time zone for telegram_id ${user.id} after race condition:`,
              updateError,
            )
            return raceUser as SupabaseUser | null
          }

          return updatedUser as SupabaseUser | null
        }

        return raceUser as SupabaseUser | null
      }
      console.log(`[Telegram User] Error inserting user:`, insertError)
      return null
    }

    console.log(`[Telegram User] Successfully created user with telegram_id ${user.id}`)
    return newUser as SupabaseUser
  } catch (error) {
    console.log('[Telegram User] Error: Unexpected error during user operation', error)
    return null
  }
}

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const initData = body?.initData

    if (!initData || typeof initData !== 'string') {
      console.log('[Telegram InitData Validation] Error: InitData is missing or invalid')
      return sendError(event, createError({
        statusCode: 400,
        message: 'InitData is required'
      }))
    }

    const botToken = process.env.TELEGRAM_BOT_TOKEN

    if (!botToken) {
      console.log('[Telegram InitData Validation] Error: Bot Token is not configured')
      return sendError(event, createError({
        statusCode: 500,
        message: 'Server configuration error'
      }))
    }

    try {
      validate(initData, botToken)
      console.log('[Telegram InitData Validation] Success: InitData is valid')
      
      // Parse user data from initData
      const user = parseInitDataUser(initData)
      if (!user) {
        console.log('[Telegram InitData Validation] Warning: Could not parse user data from initData')
        return { success: true, user: null }
      }
      
      // Find or create user in Supabase
      const timeZone = sanitizeTimeZone(body?.timeZone)

      const dbUser = await findOrCreateUser(user, timeZone)
      
      if (!dbUser) {
        console.log('[Telegram InitData Validation] Warning: Could not get or create user in database')
        return { success: true, user: null }
      }
      
      // Return success with user data
      return { success: true, user: dbUser }
    } catch (error) {
      let errorMessage = 'Unknown error'
      let errorType = ''

      if (isAuthDateInvalidError(error)) {
        errorType = 'ERR_AUTH_DATE_INVALID'
        errorMessage = 'Auth date is invalid or missing'
      } else if (isSignatureInvalidError(error)) {
        errorType = 'ERR_HASH_INVALID'
        errorMessage = 'Signature is invalid or missing'
      } else if (isExpiredError(error)) {
        errorType = 'ERR_EXPIRED'
        errorMessage = 'InitData has expired'
      } else if (error instanceof Error) {
        errorMessage = error.message
      }

      const logMessage = errorType
        ? `[Telegram InitData Validation] Error: ${errorType} - ${errorMessage}`
        : `[Telegram InitData Validation] Error: ${errorMessage}`

      console.log(logMessage)

      return sendError(event, createError({
        statusCode: 400,
        message: 'InitData validation failed',
        data: { errorType, errorMessage }
      }))
    }
  } catch (error) {
    console.log('[Telegram InitData Validation] Error: Unexpected error occurred', error)
    return sendError(event, createError({
      statusCode: 500,
      message: 'Internal server error'
    }))
  }
})

