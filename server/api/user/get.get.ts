import { getSupabaseClient } from '~/server/utils/supabase'

/**
 * TypeScript interface for user data from Supabase
 */
interface User {
  telegram_id: number
  first_name: string | null
  last_name: string | null
  username: string | null
  language_code: string | null
  is_premium: boolean | null
  photo_url: string | null
  created_at: string | null
  updated_at: string | null
}

/**
 * API endpoint to fetch user by telegram_id
 * GET /api/user/get?telegram_id=123456789
 */
export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event)
    const telegramId = query.telegram_id

    // Validate telegram_id parameter
    if (!telegramId) {
      console.log('[User Fetch] Error: telegram_id parameter is missing')
      return sendError(event, createError({
        statusCode: 400,
        message: 'telegram_id parameter is required'
      }))
    }

    // Convert telegram_id to number
    const telegramIdNumber = typeof telegramId === 'string' 
      ? Number.parseInt(telegramId, 10) 
      : Number(telegramId)

    // Validate that telegram_id is a valid number
    if (Number.isNaN(telegramIdNumber) || telegramIdNumber <= 0) {
      console.log('[User Fetch] Error: telegram_id is not a valid number', { telegramId })
      return sendError(event, createError({
        statusCode: 400,
        message: 'telegram_id must be a valid positive number'
      }))
    }

    console.log('[User Fetch] Fetching user with telegram_id:', telegramIdNumber)

    // Get Supabase client
    const supabase = getSupabaseClient()

    // Query user from database
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('telegram_id', telegramIdNumber)
      .single()

    // Handle database errors
    if (error) {
      // PGRST116 is the error code when no rows are found
      if (error.code === 'PGRST116' || error.message?.includes('No rows')) {
        console.log('[User Fetch] User not found with telegram_id:', telegramIdNumber)
        return sendError(event, createError({
          statusCode: 404,
          message: `User with telegram_id ${telegramIdNumber} not found in database`
        }))
      }

      // Other database errors
      console.log('[User Fetch] Database error:', error)
      return sendError(event, createError({
        statusCode: 500,
        message: 'Failed to fetch user from database',
        data: { error: error.message }
      }))
    }

    // User found, return data
    if (!user) {
      console.log('[User Fetch] User not found with telegram_id:', telegramIdNumber)
      return sendError(event, createError({
        statusCode: 404,
        message: `User with telegram_id ${telegramIdNumber} not found in database`
      }))
    }

    console.log('[User Fetch] Successfully fetched user with telegram_id:', telegramIdNumber)

    return {
      user: user as User
    }
  } catch (error) {
    console.log('[User Fetch] Error: Unexpected error occurred', error)
    return sendError(event, createError({
      statusCode: 500,
      message: 'Internal server error'
    }))
  }
})

