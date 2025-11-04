import { getSupabaseClient } from '~/server/utils/supabase'
import { getUserTelegramIdFromRequest } from '~/server/utils/getUserFromRequest'

/**
 * POST /api/images
 * Uploads an image file to Supabase Storage
 * 
 * Request body: FormData with 'file' field
 * Response: { url: string, path: string }
 */
export default defineEventHandler(async (event) => {
  try {
    // Get user telegram_id from request
    const userTelegramId = await getUserTelegramIdFromRequest(event)

    if (!userTelegramId) {
      return sendError(event, createError({
        statusCode: 401,
        message: 'Unauthorized: Invalid or missing initData'
      }))
    }

    // Read multipart form data
    const formData = await readMultipartFormData(event)

    if (!formData || formData.length === 0) {
      return sendError(event, createError({
        statusCode: 400,
        message: 'No file provided'
      }))
    }

    // Find the file in form data
    const fileData = formData.find(item => item.name === 'file')

    if (!fileData || !fileData.data) {
      return sendError(event, createError({
        statusCode: 400,
        message: 'File field is required'
      }))
    }

    // Validate file type
    const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/svg+xml', 'image/webp']
    const allowedExtensions = ['jpg', 'jpeg', 'png', 'svg', 'webp']
    
    // Get content type from file data or filename
    const contentType = fileData.type || ''
    const originalFileName = fileData.filename || ''
    const fileExtension = originalFileName.split('.').pop()?.toLowerCase() || ''
    
    // Validate by MIME type or extension
    const isValidByMimeType = contentType && allowedMimeTypes.includes(contentType)
    const isValidByExtension = fileExtension && allowedExtensions.includes(fileExtension)
    
    if (!isValidByMimeType && !isValidByExtension) {
      return sendError(event, createError({
        statusCode: 400,
        message: 'Invalid file type. Only JPEG, PNG, SVG, and WebP images are allowed'
      }))
    }
    
    // Use detected or default content type
    const finalContentType = contentType || 
      (fileExtension === 'jpg' || fileExtension === 'jpeg' ? 'image/jpeg' :
       fileExtension === 'png' ? 'image/png' :
       fileExtension === 'svg' ? 'image/svg+xml' :
       fileExtension === 'webp' ? 'image/webp' : 'image/jpeg')

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (fileData.data.length > maxSize) {
      return sendError(event, createError({
        statusCode: 400,
        message: 'File size exceeds maximum limit of 10MB'
      }))
    }

    // Generate unique file name
    const timestamp = Date.now()
    const randomString = Math.random().toString(36).substring(2, 15)
    const finalFileExtension = fileExtension || 'jpg'
    const uniqueFileName = `${timestamp}-${randomString}.${finalFileExtension}`
    const filePath = `order-images/${userTelegramId}/${uniqueFileName}`

    // Upload to Supabase Storage
    const supabase = getSupabaseClient()

    const { data, error } = await supabase.storage
      .from('order-images')
      .upload(filePath, fileData.data, {
        contentType: finalContentType,
        upsert: false,
      })

    if (error) {
      console.error('[Images API] Error uploading file:', error)
      return sendError(event, createError({
        statusCode: 500,
        message: `Failed to upload file: ${error.message}`
      }))
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('order-images')
      .getPublicUrl(data.path)

    return {
      url: urlData.publicUrl,
      path: data.path,
    }
  } catch (error) {
    console.error('[Images API] Unexpected error:', error)
    return sendError(event, createError({
      statusCode: 500,
      message: 'Internal server error'
    }))
  }
})

