import { Telegraf, Markup } from 'telegraf'
import { eventHandler, readBody } from 'h3'

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN as string)

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

bot.start((ctx) => {
    ctx.replyWithHTML(
      createWelcomeMessage(ctx),
      Markup.inlineKeyboard([
        [Markup.button.webApp('Открыть', 'https://t.me/list_orders_bot/app')],
      ]),
    )
  })

export default eventHandler(async (event) => {
  const update = await readBody(event)
  if (!update) return 'no update'

  await bot.handleUpdate(update)
  return 'ok'
})
