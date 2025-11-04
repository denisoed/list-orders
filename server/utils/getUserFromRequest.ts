import { H3Event, getHeader, readBody } from 'h3'
import { validate } from '@telegram-apps/init-data-node'
import { parseInitDataUser } from './telegram'

/**
 * Extracts and validates Telegram user from request headers or body.
 * Looks for initData in X-Telegram-Init-Data header or in request body.
 * 
 * @param event - H3 event object
 * @param body - Optional pre-read body to avoid reading it twice (for POST/PUT requests)
 * @returns Telegram user ID if valid, null otherwise
 */
export async function getUserTelegramIdFromRequest(
  event: H3Event,
  body?: any
): Promise<number | null> {
  try {
    const botToken = process.env.TELEGRAM_BOT_TOKEN

    if (!botToken) {
      console.log('[getUserFromRequest] Error: Bot Token is not configured')
      return null
    }

    // Try to get initData from header first
    let initData = getHeader(event, 'x-telegram-init-data')

    // If not in header, try to get from body
    if (!initData) {
      // Use provided body if available, otherwise try to read from event
      let requestBody = body
      if (!requestBody) {
        try {
          requestBody = await readBody(event).catch(() => null)
        } catch (error) {
          // Body might not be available or already read
        }
      }
      initData = requestBody?.initData || requestBody?.['x-telegram-init-data']
    }

    if (!initData || typeof initData !== 'string') {
      console.log('[getUserFromRequest] Error: InitData is missing or invalid')
      return null
    }

    try {
      // Validate initData
      validate(initData, botToken)

      // Parse user from initData
      const user = parseInitDataUser(initData)
      if (!user) {
        console.log('[getUserFromRequest] Warning: Could not parse user data from initData')
        return null
      }

      return user.id
    } catch (error) {
      console.log('[getUserFromRequest] Error: InitData validation failed', error)
      return null
    }
  } catch (error) {
    console.log('[getUserFromRequest] Error: Unexpected error', error)
    return null
  }
}
