import type { SupabaseClient } from '@supabase/supabase-js'

interface SupabaseUserRecord {
  first_name: string | null
  last_name: string | null
  username: string | null
}

const formatUserName = (user: SupabaseUserRecord | null): string | null => {
  if (!user) {
    return null
  }

  const fullName = [user.first_name, user.last_name]
    .filter((part): part is string => Boolean(part && part.trim().length > 0))
    .join(' ')
    .trim()

  if (fullName.length > 0) {
    return fullName
  }

  if (user.username && user.username.trim().length > 0) {
    return user.username.trim()
  }

  return null
}

/**
 * Fetches a human-friendly display name for a Telegram user from Supabase.
 * Returns concatenated first/last name when available, otherwise falls back to username.
 */
export const getUserDisplayName = async (
  supabase: SupabaseClient,
  telegramId: number,
): Promise<string | null> => {
  if (!telegramId) {
    return null
  }

  try {
    const { data, error } = await supabase
      .from('users')
      .select('first_name, last_name, username')
      .eq('telegram_id', telegramId)
      .single<SupabaseUserRecord>()

    if (error) {
      if (error.code !== 'PGRST116') {
        console.error('[Users] Failed to fetch user display name:', error)
      }
      return null
    }

    return formatUserName(data)
  } catch (error) {
    console.error('[Users] Unexpected error while fetching user name:', error)
    return null
  }
}
