import { computed, ref, watch, type Ref } from 'vue'
import type { Project } from '~/data/projects'
import { useProjectsStore } from '~/stores/projects'
import { ORDER_STATUS_FILTERS, type OrderStatusFilter } from '~/utils/orderStatuses'

export { ORDER_STATUS_FILTERS, type OrderStatusFilter }

export interface UseProjectOrdersResult {
  project: Ref<Project | undefined>
  searchQuery: Ref<string>
  activeStatus: Ref<OrderStatusFilter>
  isCreating: Ref<boolean>
  isUpdating: Ref<boolean>
  setSearchQuery: (value: string) => void
  setActiveStatus: (value: OrderStatusFilter) => void
}

// Legacy function for backward compatibility (deprecated, use Pinia store instead)
export const useProjectsState = () => {
  const store = useProjectsStore()
  return store.projects
}

export const useProjectOrders = (projectId: Ref<string> | string): UseProjectOrdersResult => {
  const store = useProjectsStore()
  const projectIdRef = computed(() => (typeof projectId === 'string' ? projectId : projectId.value))

  const project = computed(() => store.projects.find((item) => item.id === projectIdRef.value))

  const searchQuery = ref('')
  const activeStatus = ref<OrderStatusFilter>('in_progress')
  const isCreating = ref(false)
  const isUpdating = ref(false)

  watch(projectIdRef, () => {
    searchQuery.value = ''
    activeStatus.value = 'in_progress'
  })

  return {
    project,
    searchQuery,
    activeStatus,
    isCreating,
    isUpdating,
    setSearchQuery: (value: string) => {
      searchQuery.value = value
    },
    setActiveStatus: (value: OrderStatusFilter) => {
      activeStatus.value = value
    },
  }
}

export const useAllProjects = () => {
  const store = useProjectsStore()
  return computed(() => store.projects)
}

