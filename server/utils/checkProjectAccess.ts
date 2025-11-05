import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * Check if user has access to a project (either as owner or member)
 * @param supabase Supabase client instance
 * @param userTelegramId User's Telegram ID
 * @param projectId Project ID to check access for
 * @returns Promise<boolean> - true if user has access, false otherwise
 */
export async function checkProjectAccess(
  supabase: SupabaseClient,
  userTelegramId: number,
  projectId: string,
): Promise<boolean> {
  // Check if user owns the project
  const { data: ownedProject, error: ownedError } = await supabase
    .from('projects')
    .select('id')
    .eq('id', projectId)
    .eq('user_telegram_id', userTelegramId)
    .single()

  // If project found, user owns it
  if (ownedProject && !ownedError) {
    return true
  }

  // If error is not "not found" (PGRST116), there was a real error
  if (ownedError && ownedError.code !== 'PGRST116') {
    console.error('[checkProjectAccess] Error checking project ownership:', ownedError)
    return false
  }

  // Check if user is a member of the project
  const { data: memberProject, error: memberError } = await supabase
    .from('project_members')
    .select('project_id')
    .eq('project_id', projectId)
    .eq('member_telegram_id', userTelegramId)
    .single()

  // If member found, user has access
  if (memberProject && !memberError) {
    return true
  }

  // If error is not "not found" (PGRST116), there was a real error
  if (memberError && memberError.code !== 'PGRST116') {
    console.error('[checkProjectAccess] Error checking project membership:', memberError)
    return false
  }

  // User doesn't have access
  return false
}
