import { getSupabaseClient } from '~/server/utils/supabase'
import { getUserTelegramIdFromRequest } from '~/server/utils/getUserFromRequest'
import { checkProjectAccess } from '~/server/utils/checkProjectAccess'
import { sendTelegramMessage } from '~/server/api/telegram'
import { Markup } from 'telegraf'
import { WEB_URL } from '~/server/constants/telegram'
import { getUserDisplayName } from '~/server/utils/users'
import { addOrderHistoryEntries } from '~/server/utils/orderHistory'
import type { OrderHistoryEntryInput } from '~/server/utils/orderHistory'
import { getOrderStatusLabel, mapDbStatusToOrderStatus } from '~/utils/orderStatuses'

const STATUS_HISTORY_ICONS: Record<string, string> = {
  pending: 'pending_actions',
  in_progress: 'play_arrow',
  review: 'rate_review',
  done: 'check_circle',
}

const normalizeStatus = (status: string | null | undefined) =>
  mapDbStatusToOrderStatus(status ?? 'new')

const getStatusHistoryDescription = (
  previousStatus: string | null | undefined,
  nextStatus: string | null | undefined,
  reviewAnswer: string | null,
): string => {
  const normalizedPrevious = normalizeStatus(previousStatus)
  const normalizedNext = normalizeStatus(nextStatus)
  const reason = reviewAnswer?.trim()

  if (normalizedNext === 'in_progress') {
    if (normalizedPrevious === 'review') {
      return reason && reason.length > 0
        ? `Задача возвращена на доработку: ${reason}`
        : 'Задача возвращена на доработку'
    }
    return 'Задача взята в работу'
  }

  if (normalizedNext === 'review') {
    return 'Задача отправлена на проверку'
  }

  if (normalizedNext === 'done') {
    return 'Задача завершена'
  }

  if (normalizedNext === 'pending') {
    return 'Задача возвращена в новые'
  }

  const fromLabel = getOrderStatusLabel(normalizedPrevious)
  const toLabel = getOrderStatusLabel(normalizedNext)
  return `Статус изменён: «${fromLabel}» → «${toLabel}»`
}

const applyRequiredFieldFallback = (
  value: string | null | undefined,
  fallback: string,
): string | undefined => {
  if (value === undefined) {
    return undefined
  }

  if (value === null) {
    return fallback
  }

  const trimmed = value.trim()
  return trimmed.length > 0 ? value : fallback
}

/**
 * PUT /api/orders/[id]
 * Updates an existing order for the authenticated user
 */
export default defineEventHandler(async (event) => {
  try {
    const orderId = getRouterParam(event, 'id')

    if (!orderId) {
      return sendError(event, createError({
        statusCode: 400,
        message: 'Order ID is required'
      }))
    }

    // Read body first to avoid reading it twice
    const body = await readBody(event)

    // Get user telegram_id from request (pass body to avoid reading it again)
    const userTelegramId = await getUserTelegramIdFromRequest(event, body)

    if (!userTelegramId) {
      return sendError(event, createError({
        statusCode: 401,
        message: 'Unauthorized: Invalid or missing initData'
      }))
    }

    const supabase = getSupabaseClient()

    // Prepare update data
  const updateData: {
    title?: string | null
    summary?: string
    description?: string
    status?: string
    assignee_telegram_id?: number | null
    project_id?: string | null
    due_date?: string | null
      delivery_address?: string | null
      reminder_offset?: string | null
      client_name?: string | null
      client_phone?: string | null
      payment_type?: string | null
      prepayment_amount?: number | null
      total_amount?: number | null
      assignee_telegram_name?: string | null
      assignee_telegram_avatar_url?: string | null
      image_urls?: string[]
      review_comment?: string | null
      review_images?: string[]
      review_answer?: string | null
      archived?: boolean
    } = {}

    if (body.title !== undefined) {
      if (body.title === null) {
        updateData.title = null
      } else if (typeof body.title === 'string') {
        updateData.title = body.title.trim() || null
      } else {
        return sendError(event, createError({
          statusCode: 400,
          message: 'Title must be a string'
        }))
      }
    }

    if (body.summary !== undefined) {
      updateData.summary = body.summary?.trim() || ''
    }

    if (body.description !== undefined) {
      updateData.description = body.description?.trim() || ''
    }

    if (body.status !== undefined) {
      updateData.status = body.status || 'new'
    }

    if (body.archived !== undefined) {
      if (typeof body.archived === 'boolean') {
        updateData.archived = body.archived
      } else {
        return sendError(event, createError({
          statusCode: 400,
          message: 'Archived must be a boolean'
        }))
      }
    }

    if (body.assignee_telegram_id !== undefined) {
      updateData.assignee_telegram_id = body.assignee_telegram_id || null
    }

    if (body.project_id !== undefined) {
      if (body.project_id === null) {
        updateData.project_id = null
      } else if (typeof body.project_id === 'string') {
        const trimmedProjectId = body.project_id.trim()
        updateData.project_id = trimmedProjectId.length > 0 ? trimmedProjectId : null
      } else {
        return sendError(event, createError({
          statusCode: 400,
          message: 'Project ID must be a string or null'
        }))
      }
    }

    if (body.due_date !== undefined) {
      updateData.due_date = body.due_date || null
    }

    if (body.delivery_address !== undefined) {
      updateData.delivery_address = body.delivery_address || null
    }

    if (body.reminder_offset !== undefined) {
      // Validate that reminder_offset is a string (not a timestamp)
      // It should be values like "1h", "3h", "1d"
      if (body.reminder_offset === null || typeof body.reminder_offset === 'string') {
        updateData.reminder_offset = body.reminder_offset || null
      } else {
        console.warn('[Orders API] Invalid reminder_offset type:', typeof body.reminder_offset)
        // Skip reminder_offset if it's not a string or null
      }
    }

    if (body.client_name !== undefined) {
      if (body.client_name === null) {
        updateData.client_name = null
      } else if (typeof body.client_name === 'string') {
        updateData.client_name = body.client_name.trim() || null
      } else {
        return sendError(event, createError({
          statusCode: 400,
          message: 'Client name must be a string'
        }))
      }
    }

    if (body.client_phone !== undefined) {
      if (body.client_phone === null) {
        updateData.client_phone = null
      } else if (typeof body.client_phone === 'string') {
        updateData.client_phone = body.client_phone.trim() || null
      } else {
        return sendError(event, createError({
          statusCode: 400,
          message: 'Client phone must be a string'
        }))
      }
    }

    if (body.payment_type !== undefined) {
      updateData.payment_type = body.payment_type || null
    }

    if (body.prepayment_amount !== undefined) {
      updateData.prepayment_amount = body.prepayment_amount !== null ? Number(body.prepayment_amount) : null
    }

    if (body.total_amount !== undefined) {
      updateData.total_amount = body.total_amount !== null ? Number(body.total_amount) : null
    }

    if (body.assignee_telegram_name !== undefined) {
      updateData.assignee_telegram_name = body.assignee_telegram_name || null
    }

    if (body.assignee_telegram_avatar_url !== undefined) {
      updateData.assignee_telegram_avatar_url = body.assignee_telegram_avatar_url || null
    }

    if (body.image_urls !== undefined) {
      // Validate image_urls is an array
      if (Array.isArray(body.image_urls)) {
        const filteredUrls = body.image_urls.filter((url: any) => typeof url === 'string' && url.trim().length > 0)
        updateData.image_urls = filteredUrls
        console.log('[Orders API] Updating image_urls:', {
          orderId,
          count: filteredUrls.length,
          urls: filteredUrls,
        })
      } else {
        updateData.image_urls = []
        console.log('[Orders API] image_urls is not an array, setting to empty array')
      }
    }

    if (body.review_comment !== undefined) {
      updateData.review_comment = body.review_comment?.trim() || null
    }

    if (body.review_images !== undefined) {
      // Validate review_images is an array
      if (Array.isArray(body.review_images)) {
        const filteredUrls = body.review_images.filter((url: any) => typeof url === 'string' && url.trim().length > 0)
        updateData.review_images = filteredUrls
        console.log('[Orders API] Updating review_images:', {
          orderId,
          count: filteredUrls.length,
          urls: filteredUrls,
        })
      } else {
        updateData.review_images = []
        console.log('[Orders API] review_images is not an array, setting to empty array')
      }
    }

    if (body.review_answer !== undefined) {
      updateData.review_answer = body.review_answer?.trim() || null
    }

    // Check if there's anything to update
    if (Object.keys(updateData).length === 0) {
      return sendError(event, createError({
        statusCode: 400,
        message: 'No fields to update'
      }))
    }

    const titleWithFallback = applyRequiredFieldFallback(updateData.title, 'Без названия')
    if (titleWithFallback !== undefined) {
      updateData.title = titleWithFallback
    }

    const clientNameWithFallback = applyRequiredFieldFallback(updateData.client_name, 'Без имени')
    if (clientNameWithFallback !== undefined) {
      updateData.client_name = clientNameWithFallback
    }

    const clientPhoneWithFallback = applyRequiredFieldFallback(updateData.client_phone, 'Не указан')
    if (clientPhoneWithFallback !== undefined) {
      updateData.client_phone = clientPhoneWithFallback
    }

    // First, fetch the order to check project access and get current status
    const { data: existingOrderData } = await supabase
      .from('orders')
      .select(`
        project_id,
        status,
        archived,
        user_telegram_id,
        assignee_telegram_id,
        assignee_telegram_name,
        review_answer,
        project:projects(title)
      `)
      .eq('id', orderId)
      .single()

    type ExistingOrderRecord = {
      project_id: string
      status: string
      archived: boolean | null
      user_telegram_id: number | null
      assignee_telegram_id: number | null
      assignee_telegram_name: string | null
      review_answer: string | null
      project?: {
        title?: string | null
      } | null
    }

    const existingOrder = existingOrderData as ExistingOrderRecord | null

    if (!existingOrder) {
      return sendError(event, createError({
        statusCode: 404,
        message: 'Order not found'
      }))
    }

    // Check if user has access to the project
    let hasAccess = false
    if (existingOrder.project_id) {
      hasAccess = await checkProjectAccess(supabase, userTelegramId, existingOrder.project_id)
    } else {
      hasAccess =
        existingOrder.user_telegram_id === userTelegramId ||
        existingOrder.assignee_telegram_id === userTelegramId
    }

    if (!hasAccess) {
      return sendError(event, createError({
        statusCode: 404,
        message: 'Order not found'
      }))
    }

    if (updateData.project_id) {
      const newProjectAccess = await checkProjectAccess(
        supabase,
        userTelegramId,
        updateData.project_id,
      )

      if (!newProjectAccess) {
        return sendError(event, createError({
          statusCode: 404,
          message: 'Project not found'
        }))
      }
    }

    const isOrderOwner = existingOrder.user_telegram_id === userTelegramId

    if (updateData.archived !== undefined && !isOrderOwner) {
      return sendError(event, createError({
        statusCode: 403,
        message: 'Only the owner can archive this order'
      }))
    }

    // Check if status is being changed to 'in_progress'
    const isStatusChangedToInProgress = 
      updateData.status === 'in_progress' && 
      existingOrder.status !== 'in_progress'

    // Update order
    const { data: order, error } = await supabase
      .from('orders')
      .update(updateData)
      .eq('id', orderId)
      .select()
      .single()

    if (error) {
      console.error('[Orders API] Error updating order:', error)
      return sendError(event, createError({
        statusCode: 500,
        message: 'Failed to update order'
      }))
    }

    const historyEntries: OrderHistoryEntryInput[] = []

    if (existingOrder.assignee_telegram_id !== order.assignee_telegram_id) {
      const isAssigned = Boolean(order.assignee_telegram_id)
      const assigneeName = order.assignee_telegram_name?.trim() || 'Неизвестный исполнитель'
      historyEntries.push({
        orderId,
        eventType: isAssigned ? 'assignee.assigned' : 'assignee.unassigned',
        description: isAssigned
          ? `Назначен исполнитель: ${assigneeName}`
          : 'Исполнитель снят',
        icon: isAssigned ? 'person_add' : 'person_off',
        createdBy: userTelegramId,
      })
    }

    if (existingOrder.status !== order.status) {
      const statusDescription = getStatusHistoryDescription(
        existingOrder.status,
        order.status,
        order.review_answer || null,
      )
      const normalizedNext = normalizeStatus(order.status)
      const statusIcon = STATUS_HISTORY_ICONS[normalizedNext] ?? 'sync'
      historyEntries.push({
        orderId,
        eventType: `status.${normalizedNext}`,
        description: statusDescription,
        icon: statusIcon,
        createdBy: userTelegramId,
        metadata: {
          from: existingOrder.status,
          to: order.status,
        },
      })
    }

    const wasArchived = existingOrder.archived === true
    const isArchivedNow = order.archived === true
    if (wasArchived !== isArchivedNow) {
      historyEntries.push({
        orderId,
        eventType: isArchivedNow ? 'archived' : 'unarchived',
        description: isArchivedNow
          ? 'Задача отправлена в архив'
          : 'Задача восстановлена из архива',
        icon: isArchivedNow ? 'inventory_2' : 'unarchive',
        createdBy: userTelegramId,
      })
    }

    if (historyEntries.length > 0) {
      const actorDisplayName = await getUserDisplayName(supabase, userTelegramId)
      historyEntries.forEach((entry) => {
        entry.createdByName = actorDisplayName
      })
      await addOrderHistoryEntries(supabase, historyEntries)
    }

    // Send notification if order was taken in work
    // Only send if: status changed to in_progress AND (no assignee OR was pending)
    const shouldSendNotification =
      isStatusChangedToInProgress &&
      existingOrder.user_telegram_id &&
      (!existingOrder.assignee_telegram_id || existingOrder.status === 'pending')

    if (shouldSendNotification) {
      const assigneeName = order.assignee_telegram_name || 'Исполнитель'
      const orderTitle = order.title || 'Задача'
      const projectTitle = existingOrder.project?.title || 'Без названия'
      const message = [
        '🛠️ <b>Задача взята в работу</b>',
        '',
        `Задача: <b>${orderTitle}</b>`,
        `Проект: <b>${projectTitle}</b>`,
        `Исполнитель: <b>${assigneeName}</b>`
      ].join('\n')
      
      // Create button with link to order
      const orderUrl = `${WEB_URL}/orders/${orderId}`
      
      const replyMarkup = Markup.inlineKeyboard([
        [Markup.button.webApp('Перейти к задаче', orderUrl)],
      ])
      
      try {
        await sendTelegramMessage(existingOrder.user_telegram_id, message, replyMarkup)
      } catch (error) {
        console.error('[Orders API] Failed to send notification:', error)
        // Don't fail the request if notification fails
      }
    }

    // Transform database fields to match frontend Order interface
    const transformedOrder = {
      id: order.id,
      code: order.code,
      title: order.title || '',
      summary: order.summary || '',
      description: order.description || '',
      status: order.status || 'new',
      archived: order.archived === true,
      assigneeTelegramId: order.assignee_telegram_id || null,
      assigneeTelegramAvatarUrl: order.assignee_telegram_avatar_url || null,
      assigneeTelegramName: order.assignee_telegram_name || null,
      creatorTelegramId: order.user_telegram_id || null,
      creatorTelegramName: null,
      dueDate: order.due_date || null,
      deliveryAddress: order.delivery_address || null,
      reminderOffset: order.reminder_offset || null,
      projectId: order.project_id,
      clientName: order.client_name || '',
      clientPhone: order.client_phone || '',
      paymentType: order.payment_type || null,
      prepaymentAmount: order.prepayment_amount ? Number(order.prepayment_amount) : null,
      totalAmount: order.total_amount ? Number(order.total_amount) : null,
      imageUrls: order.image_urls || [],
      reviewComment: order.review_comment || null,
      reviewImages: order.review_images || [],
      reviewAnswer: order.review_answer || null,
      createdAt: order.created_at,
      updatedAt: order.updated_at,
    }

    return transformedOrder
  } catch (error) {
    console.error('[Orders API] Unexpected error:', error)
    return sendError(event, createError({
      statusCode: 500,
      message: 'Internal server error'
    }))
  }
})
