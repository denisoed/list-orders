<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import SearchField from '~/components/SearchField.vue'
import type { AvailableUser } from '~/composables/useProjectTeam'

interface Props {
  isOpen: boolean
  availableUsers: AvailableUser[]
  isLoading?: boolean
  isAdding?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  isLoading: false,
  isAdding: false,
})

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'add-user', user: AvailableUser): void
}>()

const searchQuery = ref('')
const filteredUsers = computed(() => {
  if (!searchQuery.value.trim()) {
    return props.availableUsers
  }

  const query = searchQuery.value.toLowerCase().trim()
  return props.availableUsers.filter(
    (user) =>
      user.name.toLowerCase().includes(query) ||
      (user.username && user.username.toLowerCase().includes(query))
  )
})

const handleAddUser = (user: AvailableUser) => {
  emit('add-user', user)
}

const handleBackdropClick = (event: MouseEvent) => {
  const target = event.target as HTMLElement
  if (target.classList.contains('modal-backdrop')) {
    emit('close')
  }
}

const handleEscape = (event: KeyboardEvent) => {
  if (event.key === 'Escape' && props.isOpen) {
    emit('close')
  }
}

onMounted(() => {
  document.addEventListener('keydown', handleEscape)
})

onBeforeUnmount(() => {
  document.removeEventListener('keydown', handleEscape)
})

watch(() => props.isOpen, (isOpen) => {
  if (isOpen) {
    searchQuery.value = ''
  }
})
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
        v-if="props.isOpen"
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
            v-if="props.isOpen"
            class="flex min-h-[70vh] max-h-[85vh] w-full flex-col rounded-t-2xl bg-background-light shadow-xl dark:bg-background-dark sm:max-w-md sm:rounded-2xl"
            @click.stop
          >
            <!-- Header -->
            <header class="sticky top-0 z-10 flex items-center justify-between border-b border-black/5 bg-background-light/95 px-4 py-4 backdrop-blur-sm dark:border-white/10 dark:bg-background-dark/95">
              <h2 class="text-lg font-bold text-zinc-900 dark:text-white">Выбрать пользователя</h2>
              <button
                type="button"
                class="flex size-10 items-center justify-center rounded-full bg-black/5 text-zinc-600 transition hover:bg-black/10 hover:text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary dark:bg-white/5 dark:text-zinc-300 dark:hover:bg-white/10"
                aria-label="Закрыть"
                @click="emit('close')"
              >
                <span class="material-symbols-outlined text-2xl">close</span>
              </button>
            </header>

            <!-- Search -->
            <div class="border-b border-black/5 px-4 py-3 dark:border-white/10">
              <SearchField
                v-model="searchQuery"
                placeholder="Поиск по имени или username"
                aria-label="Поиск пользователей"
              />
            </div>

            <!-- Content -->
            <div class="flex-1 overflow-y-auto px-4 py-3 pb-6">
              <div v-if="props.isLoading" class="flex items-center justify-center py-12">
                <div class="text-gray-500 dark:text-[#9da6b9]">Загрузка...</div>
              </div>
              <div v-else-if="filteredUsers.length === 0" class="py-12 text-center text-gray-500 dark:text-[#9da6b9]">
                {{ searchQuery ? 'Пользователи не найдены' : 'Нет доступных пользователей' }}
              </div>
              <div v-else class="flex flex-col gap-2">
                <button
                  v-for="user in filteredUsers"
                  :key="user.id"
                  type="button"
                  class="group flex items-center gap-4 rounded-xl bg-white p-4 shadow-sm text-left transition-shadow hover:shadow-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-50 disabled:cursor-not-allowed dark:bg-[#1C2431] dark:text-white"
                  :disabled="props.isAdding"
                  @click="handleAddUser(user)"
                >
                  <div
                    class="relative flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gray-200 text-gray-500 transition group-hover:ring-2 group-hover:ring-primary/50 dark:bg-[#282e39] dark:text-gray-300"
                  >
                    <img
                      v-if="user.avatarUrl"
                      :src="user.avatarUrl"
                      :alt="`Аватар ${user.name}`"
                      class="size-full object-cover"
                      loading="lazy"
                    />
                    <span v-else class="material-symbols-outlined text-2xl">person</span>
                  </div>
                  <div class="flex min-w-0 flex-1 flex-col gap-0.5">
                    <p class="truncate text-base font-medium leading-tight text-zinc-900 dark:text-white">
                      {{ user.name }}
                    </p>
                    <p v-if="user.username" class="truncate text-sm leading-normal text-zinc-500 dark:text-[#9da6b9]">
                      @{{ user.username }}
                    </p>
                  </div>
                  <span
                    v-if="props.isAdding"
                    class="material-symbols-outlined shrink-0 text-2xl animate-spin text-primary"
                  >
                    hourglass_empty
                  </span>
                  <span
                    v-else
                    class="material-symbols-outlined shrink-0 text-2xl text-zinc-400 transition group-hover:text-primary dark:text-[#9da6b9]"
                  >
                    add
                  </span>
                </button>
              </div>
            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>
