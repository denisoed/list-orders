import type { SupabaseClient } from '@supabase/supabase-js'

export interface OrderHistoryEntryInput {
  orderId: string
  eventType: string
  description: string
  icon?: string | null
  createdBy?: number | null
  createdByName?: string | null
  metadata?: Record<string, any> | null
  createdAt?: string
}

export interface OrderHistoryRecord {
  id: string
  order_id: string
  event_type: string
  description: string
  icon: string | null
  created_by: number | null
  created_by_name: string | null
  metadata: Record<string, any> | null
  created_at: string
}

const DEFAULT_HISTORY_ICON = 'history'

/**
 * Persists history entries for an order in a single bulk insert.
 */
export const addOrderHistoryEntries = async (
  supabase: SupabaseClient,
  entries: OrderHistoryEntryInput[],
): Promise<void> => {
  if (!entries.length) {
    return
  }

  const now = Date.now()
  const payload = entries.map((entry, index) => ({
    order_id: entry.orderId,
    event_type: entry.eventType,
    description: entry.description,
    icon: entry.icon ?? DEFAULT_HISTORY_ICON,
    created_by: entry.createdBy ?? null,
    created_by_name: entry.createdByName ?? null,
    metadata: entry.metadata ?? null,
    created_at: entry.createdAt ?? new Date(now + index).toISOString(),
  }))

  const { error } = await supabase.from('order_history').insert(payload)

  if (error) {
    console.error('[OrderHistory] Failed to add history entries:', error)
  }
}

/**
 * Returns chronological history for a specific order.
 */
export const fetchOrderHistory = async (
  supabase: SupabaseClient,
  orderId: string,
): Promise<OrderHistoryRecord[]> => {
  if (!orderId) {
    return []
  }

  try {
    const { data, error } = await supabase
      .from('order_history')
      .select('id, order_id, event_type, description, icon, created_by, created_by_name, metadata, created_at')
      .eq('order_id', orderId)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('[OrderHistory] Failed to fetch history:', error)
      return []
    }

    return data ?? []
  } catch (error) {
    console.error('[OrderHistory] Unexpected error while fetching history:', error)
    return []
  }
}
