import { Telegraf, Markup } from 'telegraf'
import { eventHandler, readBody } from 'h3'

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN as string)

/**
 * Sends a message to a Telegram user by their telegram_id
 * @param telegramId - Telegram user ID
 * @param message - Message text (supports HTML)
 * @param replyMarkup - Optional inline keyboard markup for buttons
 * @returns Promise that resolves when message is sent
 */
export async function sendTelegramMessage(
  telegramId: number, 
  message: string, 
  replyMarkup?: any
): Promise<void> {
  try {
    if (!process.env.TELEGRAM_BOT_TOKEN) {
      console.error('[Telegram] Bot token is not configured')
      return
    }

    await bot.telegram.sendMessage(telegramId, message, {
      parse_mode: 'HTML',
      ...(replyMarkup && { reply_markup: replyMarkup }),
    })
  } catch (error) {
    console.error(`[Telegram] Failed to send message to user ${telegramId}:`, error)
  }
}

function createWelcomeMessage(ctx: any) {
    const firstName = ctx.from?.first_name || ''
    const lastName = ctx.from?.last_name || ''
    const fullName = `${firstName} ${lastName}`.trim() || 'Пользователь'

    return (
      `Привет <b>${fullName}</b>!\n\n` +
      'Добро пожаловать в систему управления заказами!\n\n' +
      'Мы сделали всё, чтобы ты мог быстро создавать проекты, управлять задачами и легко работать в команде.\n\n' +
      'Начинай прямо сейчас! Жми кнопку ниже 👇'
    )
  }

bot.start((ctx) => {
    ctx.replyWithHTML(
      createWelcomeMessage(ctx),
      Markup.inlineKeyboard([
        [Markup.button.webApp('Открыть', 'https://list-orders.vercel.app')],
      ]),
    )
  })

export default eventHandler(async (event) => {
  const update = await readBody(event)
  if (!update) return 'no update'

  await bot.handleUpdate(update)
  return 'ok'
})
