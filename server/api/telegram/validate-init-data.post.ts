import { validate, isAuthDateInvalidError, isSignatureInvalidError, isExpiredError } from '@telegram-apps/init-data-node'

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

    const botToken = process.env.NUXT_TELEGRAM_BOT_TOKEN || process.env.TELEGRAM_BOT_TOKEN

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
      return { success: true }
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

