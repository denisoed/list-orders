import { parse } from '@telegram-apps/init-data-node'

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
    if (typeof userData.id !== 'number' || typeof userData.first_name !== 'string') {
      console.log('[Telegram User Save] Error: Required user fields (id, firstName) are missing or invalid')
      return null
    }

    // Map camelCase fields from parsed data to snake_case format for database
    return {
      id: userData.id,
      first_name: userData.first_name,
      last_name: typeof userData.last_name === 'string' ? userData.last_name : undefined,
      username: typeof userData.username === 'string' ? userData.username : undefined,
      language_code: typeof userData.language_code === 'string' ? userData.language_code : undefined,
      is_premium: typeof userData.is_premium === 'boolean' ? userData.is_premium : undefined,
      photo_url: typeof userData.photo_url === 'string' ? userData.photo_url : undefined,
    }
  } catch (error) {
    console.log('[Telegram User Save] Error: Unexpected error during initData parsing', error)
    return null
  }
}
