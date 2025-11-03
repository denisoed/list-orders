import { Telegraf, Markup } from 'telegraf'

/**
 * Bootstrap function to initialize and start Telegram bot
 * This function will be called automatically on server startup
 */
export default defineNitroPlugin(() => {
  const botToken = process.env.TELEGRAM_BOT_TOKEN

  if (!botToken) {
    console.warn('[Telegram Bot] Bot Token is not configured, bot will not be started')
    return
  }

  const bot = new Telegraf(botToken)

  /**
   * Creates welcome message for the bot
   * @param ctx - Telegram bot context
   * @returns HTML formatted welcome message
   */
  function createWelcomeMessage(ctx: any) {
    const firstName = ctx.from?.first_name || ''
    const lastName = ctx.from?.last_name || ''
    const fullName = `${firstName} ${lastName}`.trim() || 'Пользователь'

    return (
      `Привет <b>${fullName}</b>!\n\n` +
      'Добро пожаловать в систему для управления заказами и проектами!\n\n' +
      'Здесь ты можешь создавать новые проекты, добавлять задачи и управлять ими в командной работе. ' +
      'Ты в любой момент можешь получить доступ к своим проектам и задачам.\n\n' +
      'Нажми кнопку ниже, чтобы открыть приложение и начать работу.'
    )
  }

  // Handle /start command
  bot.start((ctx) => {
    ctx.replyWithHTML(
      createWelcomeMessage(ctx),
      Markup.inlineKeyboard([
        [Markup.button.webApp('Открыть', 'https://t.me/list_orders_bot/app')],
      ]),
    )
  })

  // Handle /login command (placeholder for future functionality)
  bot.command('login', (ctx) => {
    console.log('[Telegram Bot] Login command received:', ctx.from)
  })

  // Launch bot
  bot.launch()
    .then(() => {
      console.log('[Telegram Bot] Bot started successfully')
    })
    .catch((error) => {
      console.error('[Telegram Bot] Error starting bot:', error)
    })

  // Enable graceful stop
  process.once('SIGINT', () => {
    console.log('[Telegram Bot] Received SIGINT, stopping bot...')
    bot.stop('SIGINT')
  })

  process.once('SIGTERM', () => {
    console.log('[Telegram Bot] Received SIGTERM, stopping bot...')
    bot.stop('SIGTERM')
  })
})
