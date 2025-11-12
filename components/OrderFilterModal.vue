<script setup lang="ts">
import { computed, onBeforeUnmount, ref, toRefs, watch } from 'vue'

type ProjectOption = {
  id: string
  label: string
}

type AssigneeOption = {
  id: number
  name: string
  avatarUrl: string | null
}

const props = defineProps<{
  isOpen: boolean
  projectOptions: ProjectOption[]
  assigneeOptions: AssigneeOption[]
  initialProjectIds: string[]
  initialAssigneeIds: number[]
}>()

const { isOpen, projectOptions, assigneeOptions, initialProjectIds, initialAssigneeIds } = toRefs(props)

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'apply', payload: { projectIds: string[]; assigneeIds: number[] }): void
  (e: 'clear'): void
}>()

const selectedProjectIds = ref<string[]>([])
const selectedAssigneeIds = ref<number[]>([])

const hasSelectedFilters = computed(
  () => selectedProjectIds.value.length > 0 || selectedAssigneeIds.value.length > 0,
)

const hasInitialFilters = computed(
  () => initialProjectIds.value.length > 0 || initialAssigneeIds.value.length > 0,
)

const syncInitialState = () => {
  selectedProjectIds.value = [...initialProjectIds.value]
  selectedAssigneeIds.value = [...initialAssigneeIds.value]
}

watch(
  isOpen,
  (isOpen) => {
    if (isOpen) {
      syncInitialState()
      document.addEventListener('keydown', handleEscape)
    } else {
      document.removeEventListener('keydown', handleEscape)
    }
  },
)

watch(
  [initialProjectIds, initialAssigneeIds],
  () => {
    if (isOpen.value) {
      syncInitialState()
    }
  },
  { deep: true },
)

onBeforeUnmount(() => {
  document.removeEventListener('keydown', handleEscape)
})

const toggleProject = (projectId: string) => {
  selectedProjectIds.value = selectedProjectIds.value.includes(projectId)
    ? selectedProjectIds.value.filter((id) => id !== projectId)
    : [...selectedProjectIds.value, projectId]
}

const toggleAssignee = (assigneeId: number) => {
  selectedAssigneeIds.value = selectedAssigneeIds.value.includes(assigneeId)
    ? selectedAssigneeIds.value.filter((id) => id !== assigneeId)
    : [...selectedAssigneeIds.value, assigneeId]
}

const handleBackdropClick = (event: MouseEvent) => {
  const target = event.target as HTMLElement
  if (target.classList.contains('modal-backdrop')) {
    emit('close')
  }
}

function handleEscape(event: KeyboardEvent) {
  if (event.key === 'Escape' && isOpen.value) {
    emit('close')
  }
}

const handleApply = () => {
  emit('apply', {
    projectIds: [...selectedProjectIds.value],
    assigneeIds: [...selectedAssigneeIds.value],
  })
}

const handleClear = () => {
  selectedProjectIds.value = []
  selectedAssigneeIds.value = []
  emit('clear')
}
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="isOpen"
        class="modal-backdrop fixed inset-0 z-50 flex items-end bg-black/50 backdrop-blur-sm sm:items-center sm:justify-center"
        @click="handleBackdropClick"
      >
        <Transition
          enter-active-class="transition duration-200 ease-out"
          enter-from-class="translate-y-full opacity-0 sm:translate-y-4 sm:scale-95"
          enter-to-class="translate-y-0 opacity-100 sm:scale-100"
          leave-active-class="transition duration-150 ease-in"
          leave-from-class="translate-y-0 opacity-100 sm:scale-100"
          leave-to-class="translate-y-full opacity-0 sm:translate-y-4 sm:scale-95"
        >
          <div
            v-if="isOpen"
            class="flex min-h-[50vh] max-h-[85vh] w-full flex-col rounded-t-2xl bg-background-light shadow-xl dark:bg-background-dark sm:max-w-md sm:rounded-2xl"
            @click.stop
          >
            <header
              class="sticky top-0 z-10 flex items-center justify-between border-b border-black/5 bg-background-light/95 px-4 py-4 backdrop-blur-sm dark:border-white/10 dark:bg-background-dark/95"
            >
              <h2 class="text-lg font-bold text-zinc-900 dark:text-white">Фильтры</h2>
              <button
                type="button"
                class="flex size-10 items-center justify-center rounded-full bg-black/5 text-zinc-600 transition hover:bg-black/10 hover:text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary dark:bg-white/5 dark:text-zinc-300 dark:hover:bg-white/10"
                aria-label="Закрыть"
                @click="emit('close')"
              >
                <span class="material-symbols-outlined text-2xl">close</span>
              </button>
            </header>

            <div class="flex-1 overflow-y-auto px-4 py-6">
              <div class="flex flex-col gap-6">
                <section>
                  <div class="flex items-center justify-between">
                    <h3 class="text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">Проекты</h3>
                    <span class="text-xs font-medium text-zinc-400 dark:text-zinc-500">{{ projectOptions.length }}</span>
                  </div>
                  <p v-if="!projectOptions.length" class="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
                    Нет доступных проектов.
                  </p>
                  <ul
                    v-else
                    class="mt-3 flex gap-2 overflow-x-auto pb-1 pr-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
                    role="list"
                  >
                    <li v-for="project in projectOptions" :key="project.id" class="flex-shrink-0" role="listitem">
                      <button
                        type="button"
                        class="flex items-center justify-between rounded-xl border px-4 py-3 text-left text-sm font-medium transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                        :class="selectedProjectIds.includes(project.id)
                          ? 'border-primary bg-primary/10 text-primary dark:border-primary/50 dark:bg-primary/20 dark:text-primary/90'
                          : 'border-black/10 bg-white text-zinc-900 hover:bg-gray-50 dark:border-white/10 dark:bg-[#1C2431] dark:text-white dark:hover:bg-white/10'"
                        @click="toggleProject(project.id)"
                      >
                        <span>{{ project.label }}</span>
                        <span class="material-symbols-outlined text-xl" :class="selectedProjectIds.includes(project.id) ? 'text-primary dark:text-primary/80' : 'text-zinc-400 dark:text-zinc-500'">
                          {{ selectedProjectIds.includes(project.id) ? 'check' : 'add' }}
                        </span>
                      </button>
                    </li>
                  </ul>
                </section>

                <section>
                  <div class="flex items-center justify-between">
                    <h3 class="text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">Исполнители</h3>
                    <span class="text-xs font-medium text-zinc-400 dark:text-zinc-500">{{ assigneeOptions.length }}</span>
                  </div>
                  <p v-if="!assigneeOptions.length" class="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
                    Нет доступных исполнителей.
                  </p>
                  <ul
                    v-else
                    class="mt-3 flex gap-2 overflow-x-auto pb-1 pr-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
                    role="list"
                  >
                    <li v-for="assignee in assigneeOptions" :key="assignee.id" class="flex-shrink-0" role="listitem">
                      <button
                        type="button"
                        class="flex items-center justify-between rounded-xl border px-4 py-3 text-left text-sm font-medium transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                        :class="selectedAssigneeIds.includes(assignee.id)
                          ? 'border-primary bg-primary/10 text-primary dark:border-primary/50 dark:bg-primary/20 dark:text-primary/90'
                          : 'border-black/10 bg-white text-zinc-900 hover:bg-gray-50 dark:border-white/10 dark:bg-[#1C2431] dark:text-white dark:hover:bg-white/10'"
                        @click="toggleAssignee(assignee.id)"
                      >
                        <div class="flex items-center gap-3">
                          <span
                            v-if="assignee.avatarUrl"
                            class="flex size-9 items-center justify-center overflow-hidden rounded-full border border-black/5 bg-white shadow-sm dark:border-white/10 dark:bg-[#161c29]"
                          >
                            <img
                              :src="assignee.avatarUrl"
                              :alt="`Аватар ${assignee.name}`"
                              class="h-full w-full object-cover"
                              loading="lazy"
                            />
                          </span>
                          <span
                            v-else
                            class="flex size-9 items-center justify-center rounded-full border border-black/5 bg-black/5 text-sm font-semibold text-zinc-600 dark:border-white/10 dark:bg-white/10 dark:text-white"
                          >
                            {{ assignee.name.charAt(0).toUpperCase() }}
                          </span>
                          <span>{{ assignee.name }}</span>
                        </div>
                        <span class="material-symbols-outlined text-xl" :class="selectedAssigneeIds.includes(assignee.id) ? 'text-primary dark:text-primary/80' : 'text-zinc-400 dark:text-zinc-500'">
                          {{ selectedAssigneeIds.includes(assignee.id) ? 'check' : 'add' }}
                        </span>
                      </button>
                    </li>
                  </ul>
                </section>
              </div>
            </div>

            <footer class="border-t border-black/5 p-4 pb-8 dark:border-white/10">
              <div class="flex flex-col gap-3 sm:flex-row-reverse">
                <button
                  type="button"
                  class="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-base font-semibold text-white shadow-lg transition hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white disabled:cursor-not-allowed disabled:opacity-70"
                  :disabled="!hasSelectedFilters && !hasInitialFilters"
                  @click="handleApply"
                >
                  <span class="material-symbols-outlined text-xl">done_all</span>
                  <span>Применить</span>
                </button>
                <button
                  type="button"
                  class="flex w-full items-center justify-center gap-2 rounded-xl border border-black/10 bg-white py-3 text-base font-semibold text-zinc-900 transition hover:bg-gray-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-70 dark:border-white/10 dark:bg-[#1C2431] dark:text-white dark:hover:bg-white/10"
                  :disabled="!hasSelectedFilters && !hasInitialFilters"
                  @click="handleClear"
                >
                  <span class="material-symbols-outlined text-xl">refresh</span>
                  <span>Сбросить</span>
                </button>
              </div>
            </footer>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>
