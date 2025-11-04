import { computed, type Ref } from 'vue'
import type { OrderReminderOffset } from '~/data/projects'

export interface OrderDraftData {
  title: string
  description: string
  clientName: string
  clientPhone: string
  deliveryAddress: string
  deliveryOption: 'pickup' | 'delivery' | ''
  dueDate: string
  dueTime: string
  selectedAssigneeId: string
  customAssignee: { name: string; avatarUrl: string } | null
  attachmentUrls: string[] // Only URLs, not blob URLs
  reminderOffset: OrderReminderOffset | null
  hasPrepayment: boolean
  paymentAmount: string
  prepaymentAmount: string
  projectId: string
}

const STORAGE_KEY_PREFIX = 'order_draft_'

/**
 * Get storage key for a specific project
 */
function getStorageKey(projectId: string): string {
  return `${STORAGE_KEY_PREFIX}${projectId}`
}

/**
 * Composable for managing order drafts in localStorage
 * Only works for creating new orders, not for editing existing ones
 */
export const useOrderDraft = (projectId: Ref<string> | string) => {
  const projectIdRef = computed(() => (typeof projectId === 'string' ? projectId : projectId.value))
  const storageKey = computed(() => getStorageKey(projectIdRef.value))

  /**
   * Save draft data to localStorage
   */
  const saveDraft = (data: Partial<OrderDraftData>): void => {
    if (!projectIdRef.value) {
      return
    }

    try {
      const existingDraft = loadDraft()
      const draftData: OrderDraftData = {
        ...existingDraft,
        ...data,
        projectId: projectIdRef.value,
      }

      // Only save non-empty attachment URLs (not blob URLs)
      if (data.attachmentUrls) {
        draftData.attachmentUrls = data.attachmentUrls.filter(
          (url) => url && !url.startsWith('blob:')
        )
      }

      localStorage.setItem(storageKey.value, JSON.stringify(draftData))
    } catch (error) {
      console.error('[useOrderDraft] Error saving draft:', error)
    }
  }

  /**
   * Load draft data from localStorage
   */
  const loadDraft = (): Partial<OrderDraftData> | null => {
    if (!projectIdRef.value) {
      return null
    }

    try {
      const stored = localStorage.getItem(storageKey.value)
      if (!stored) {
        return null
      }

      const draft = JSON.parse(stored) as OrderDraftData

      // Verify that the draft belongs to the current project
      if (draft.projectId !== projectIdRef.value) {
        return null
      }

      return draft
    } catch (error) {
      console.error('[useOrderDraft] Error loading draft:', error)
      return null
    }
  }

  /**
   * Clear draft data from localStorage
   */
  const clearDraft = (): void => {
    if (!projectIdRef.value) {
      return
    }

    try {
      localStorage.removeItem(storageKey.value)
    } catch (error) {
      console.error('[useOrderDraft] Error clearing draft:', error)
    }
  }

  /**
   * Check if draft exists
   */
  const hasDraft = (): boolean => {
    return loadDraft() !== null
  }

  /**
   * Create a debounced save function
   */
  const createDebouncedSave = (delay: number = 500) => {
    let timeoutId: NodeJS.Timeout | null = null

    return (data: Partial<OrderDraftData>) => {
      if (timeoutId) {
        clearTimeout(timeoutId)
      }

      timeoutId = setTimeout(() => {
        saveDraft(data)
        timeoutId = null
      }, delay)
    }
  }

  return {
    saveDraft,
    loadDraft,
    clearDraft,
    hasDraft,
    createDebouncedSave,
  }
}
