import { getSupabaseClient } from '~/server/utils/supabase'
import { getUserTelegramIdFromRequest } from '~/server/utils/getUserFromRequest'

/**
 * POST /api/orders
 * Creates a new order for the authenticated user
 */
export default defineEventHandler(async (event) => {
  try {
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

    // Validate required fields
    if (!body.project_id || typeof body.project_id !== 'string' || !body.project_id.trim()) {
      return sendError(event, createError({
        statusCode: 400,
        message: 'Project ID is required'
      }))
    }

    if (!body.title || typeof body.title !== 'string' || !body.title.trim()) {
      return sendError(event, createError({
        statusCode: 400,
        message: 'Title is required and cannot be empty'
      }))
    }

    if (!body.client_name || typeof body.client_name !== 'string' || !body.client_name.trim()) {
      return sendError(event, createError({
        statusCode: 400,
        message: 'Client name is required and cannot be empty'
      }))
    }

    if (!body.client_phone || typeof body.client_phone !== 'string' || !body.client_phone.trim()) {
      return sendError(event, createError({
        statusCode: 400,
        message: 'Client phone is required and cannot be empty'
      }))
    }

    const supabase = getSupabaseClient()

    // Verify project exists and belongs to the user
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id')
      .eq('id', body.project_id)
      .eq('user_telegram_id', userTelegramId)
      .single()

    if (projectError || !project) {
      return sendError(event, createError({
        statusCode: 404,
        message: 'Project not found'
      }))
    }

    // Generate order code if not provided
    let orderCode = body.code
    if (!orderCode || typeof orderCode !== 'string' || !orderCode.trim()) {
      // Generate code based on timestamp and random string
      const timestamp = Date.now().toString(36)
      const random = Math.random().toString(36).substring(2, 6).toUpperCase()
      orderCode = `ORD-${timestamp}-${random}`
    }

    // Prepare order data
    const orderData: {
      project_id: string
      user_telegram_id: number
      code: string
      title: string
      summary?: string
      description?: string
      status?: string
      assignee_telegram_id?: number | null
      due_date?: string | null
      due_time?: string | null
      delivery_address?: string | null
      reminder_offset?: string | null
      client_name: string
      client_phone: string
      payment_type?: string | null
      prepayment_amount?: number | null
      total_amount?: number | null
      image_urls?: string[]
    } = {
      project_id: body.project_id.trim(),
      user_telegram_id: userTelegramId,
      code: orderCode.trim(),
      title: body.title.trim(),
      client_name: body.client_name.trim(),
      client_phone: body.client_phone.trim(),
    }

    // Add optional fields
    if (body.summary !== undefined) {
      orderData.summary = body.summary?.trim() || ''
    }

    if (body.description !== undefined) {
      orderData.description = body.description?.trim() || ''
    }

    if (body.status !== undefined) {
      orderData.status = body.status || 'new'
    }

    if (body.assignee_telegram_id !== undefined) {
      orderData.assignee_telegram_id = body.assignee_telegram_id || null
    }

    if (body.due_date !== undefined && body.due_date !== null) {
      orderData.due_date = body.due_date
    }

    if (body.due_time !== undefined) {
      orderData.due_time = body.due_time || null
    }

    if (body.delivery_address !== undefined) {
      orderData.delivery_address = body.delivery_address || null
    }

    if (body.reminder_offset !== undefined) {
      // Validate that reminder_offset is a string (not a timestamp)
      // It should be values like "1h", "3h", "1d"
      if (body.reminder_offset === null || typeof body.reminder_offset === 'string') {
        orderData.reminder_offset = body.reminder_offset || null
      } else {
        console.warn('[Orders API] Invalid reminder_offset type:', typeof body.reminder_offset)
        // Skip reminder_offset if it's not a string or null
        orderData.reminder_offset = null
      }
    }

    if (body.payment_type !== undefined) {
      orderData.payment_type = body.payment_type || null
    }

    if (body.prepayment_amount !== undefined && body.prepayment_amount !== null) {
      orderData.prepayment_amount = Number(body.prepayment_amount)
    }

    if (body.total_amount !== undefined && body.total_amount !== null) {
      orderData.total_amount = Number(body.total_amount)
    }

    if (body.image_urls !== undefined) {
      // Validate image_urls is an array
      if (Array.isArray(body.image_urls)) {
        orderData.image_urls = body.image_urls.filter((url: any) => typeof url === 'string' && url.trim().length > 0)
      } else {
        orderData.image_urls = []
      }
    }

    // Insert order
    const { data: order, error } = await supabase
      .from('orders')
      .insert([orderData])
      .select()
      .single()

    if (error) {
      console.error('[Orders API] Error creating order:', error)
      return sendError(event, createError({
        statusCode: 500,
        message: 'Failed to create order'
      }))
    }

    // Transform database fields to match frontend Order interface
    const transformedOrder = {
      id: order.id,
      code: order.code,
      title: order.title,
      summary: order.summary || '',
      description: order.description || '',
      status: order.status || 'new',
      assigneeTelegramId: order.assignee_telegram_id || null,
      assigneeTelegramAvatarUrl: order.assignee_telegram_avatar_url || null,
      assigneeTelegramName: order.assignee_telegram_name || null,
      dueDate: order.due_date || null,
      dueTime: order.due_time || null,
      deliveryAddress: order.delivery_address || null,
      reminderOffset: order.reminder_offset || null,
      projectId: order.project_id,
      clientName: order.client_name,
      clientPhone: order.client_phone,
      paymentType: order.payment_type || null,
      prepaymentAmount: order.prepayment_amount ? Number(order.prepayment_amount) : null,
      totalAmount: order.total_amount ? Number(order.total_amount) : null,
      imageUrls: order.image_urls || [],
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
