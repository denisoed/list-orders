import { createError, defineEventHandler, getRouterParam, readMultipartFormData } from 'h3'

const ACCEPTED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp'])
const MAX_FILE_SIZE = 10 * 1024 * 1024
const MAX_FILES = 6
const MIN_COMMENT_LENGTH = 10
const MAX_COMMENT_LENGTH = 1000

export default defineEventHandler(async (event) => {
  const orderId = getRouterParam(event, 'id') ?? ''

  if (!orderId || orderId.trim().length === 0) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Некорректный идентификатор заказа.',
    })
  }

  const form = await readMultipartFormData(event)

  if (!form || form.length === 0) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Форма не содержит данных для отправки.',
    })
  }

  let comment = ''
  const attachments: Array<{ filename: string; size: number; type: string }> = []

  for (const part of form) {
    if (!part.name) {
      continue
    }

    if (part.type) {
      if (part.name !== 'photos') {
        continue
      }

      if (!ACCEPTED_TYPES.has(part.type)) {
        throw createError({
          statusCode: 415,
          statusMessage: `Формат файла «${part.filename ?? 'без имени'}» не поддерживается.`,
        })
      }

      const size = part.data?.length ?? 0

      if (size === 0) {
        continue
      }

      if (size > MAX_FILE_SIZE) {
        throw createError({
          statusCode: 413,
          statusMessage: `Файл «${part.filename ?? 'без имени'}» превышает лимит ${MAX_FILE_SIZE / (1024 * 1024)} МБ.`,
        })
      }

      if (attachments.length >= MAX_FILES) {
        throw createError({
          statusCode: 413,
          statusMessage: `Можно прикрепить не более ${MAX_FILES} фотографий.`,
        })
      }

      attachments.push({
        filename: part.filename ?? 'без имени',
        size,
        type: part.type,
      })
    } else if (part.name === 'comment') {
      comment = part.data.toString('utf-8').trim()
    }
  }

  if (attachments.length === 0) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Прикрепите хотя бы одно фото.',
    })
  }

  if (comment.length < MIN_COMMENT_LENGTH) {
    throw createError({
      statusCode: 400,
      statusMessage: `Комментарий должен содержать не менее ${MIN_COMMENT_LENGTH} символов.`,
    })
  }

  if (comment.length > MAX_COMMENT_LENGTH) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Комментарий слишком длинный. Сократите до 1000 символов.',
    })
  }

  console.info('[orders] review submission', {
    orderId,
    attachments: attachments.map((item) => ({
      filename: item.filename,
      size: item.size,
      type: item.type,
    })),
    commentLength: comment.length,
  })

  return {
    orderId,
    status: 'submitted_for_review' as const,
    attachments,
    comment,
    submittedAt: new Date().toISOString(),
  }
})
