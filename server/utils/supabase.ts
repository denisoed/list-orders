import { createClient, SupabaseClient } from '@supabase/supabase-js'

let supabaseClient: SupabaseClient | null = null

/**
 * Initialize and return Supabase client for server-side usage.
 * The client is created once and reused for all subsequent calls (singleton pattern).
 * 
 * Usage in server API routes:
 * ```ts
 * import { getSupabaseClient } from '~/server/utils/supabase'
 * 
 * export default defineEventHandler(async (event) => {
 *   const supabase = getSupabaseClient()
 *   const { data, error } = await supabase.from('table').select('*')
 *   // ...
 * })
 * ```
 * 
 * @returns Supabase client instance
 * @throws Error if required environment variables are missing
 */
export function getSupabaseClient(): SupabaseClient {
  // Return existing client if already initialized
  if (supabaseClient) {
    return supabaseClient
  }

  // Check for required environment variables
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NUXT_SUPABASE_URL
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NUXT_SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl) {
    console.warn('[Supabase] Warning: SUPABASE_URL is not set. Supabase client will not be available.')
    throw new Error('SUPABASE_URL environment variable is required')
  }

  if (!supabaseServiceRoleKey) {
    console.warn('[Supabase] Warning: SUPABASE_SERVICE_ROLE_KEY is not set. Supabase client will not be available.')
    throw new Error('SUPABASE_SERVICE_ROLE_KEY environment variable is required')
  }

  // Create and cache the client
  supabaseClient = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })

  console.log('[Supabase] Client initialized successfully')
  return supabaseClient
}

