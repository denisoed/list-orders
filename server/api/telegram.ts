import { Telegraf, Markup } from 'telegraf'
import { eventHandler, readBody } from 'h3'
import { WEB_URL } from '~/server/constants/telegram'

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
      ...(replyMarkup && replyMarkup),
    })
  } catch (error) {
    console.error(`[Telegram] Failed to send message to user ${telegramId}:`, error)
  }
}

function createWelcomeMessage() {
  return (
    'Заказы теряются в WhatsApp чатах? 📱\n\n' +
    'Забываете про срочные заказы?\n' +
    'Сотрудники спрашивают "а что делать сегодня?"\n' +
    'Приходится скролить переписку в поисках адресов?\n\n' +
    'Все заказы — в одном месте:\n' +
    '✅ Фото и описание\n' +
    '✅ Контакты и адреса  \n' +
    '✅ Статусы работы\n' +
    '✅ Уведомления в Telegram\n\n' +
    'Создайте первый заказ за 30 секунд 👇'
  )
}

bot.start((ctx) => {
  ctx.replyWithHTML(
    createWelcomeMessage(),
    Markup.inlineKeyboard([
      [Markup.button.webApp('Открыть', WEB_URL)],
    ]),
  )
})

export default eventHandler(async (event) => {
  const update = await readBody(event)
  if (!update) return 'no update'

  await bot.handleUpdate(update)
  return 'ok'
})
