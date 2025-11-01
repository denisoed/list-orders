<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from '#imports'
import { formatInviteLinkLabel } from '~/utils/projectTeam'

const props = defineProps({
  projectId: {
    type: String,
    default: '',
  },
  projectTitle: {
    type: String,
    default: '',
  },
  memberCount: {
    type: Number,
    default: 0,
  },
  returnPath: {
    type: String,
    default: '',
  },
})

const router = useRouter()

const isDisabled = computed(() => props.projectId.length === 0)
const inviteLabel = computed(() => formatInviteLinkLabel(props.projectTitle, props.memberCount))

const handleClick = () => {
  if (isDisabled.value) {
    return
  }

  const query: Record<string, string> = {}

  if (props.returnPath) {
    query.from = props.returnPath
  }

  router.push({
    path: `/projects/${props.projectId}/team`,
    query,
  })
}
</script>

<template>
  <div class="flex flex-col pt-2">
    <button
      type="button"
      class="group inline-flex max-w-full items-center gap-2 self-start rounded-lg px-2 py-1 text-sm font-medium text-primary transition hover:text-primary/80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:text-gray-400 disabled:hover:text-gray-400 dark:disabled:text-white/40 dark:disabled:hover:text-white/40"
      :aria-disabled="isDisabled"
      :disabled="isDisabled"
      @click="handleClick"
    >
      <span class="material-symbols-outlined text-lg transition group-hover:translate-x-0.5">group_add</span>
      <span class="truncate">{{ inviteLabel }}</span>
    </button>
    <p v-if="isDisabled" class="mt-1 text-xs text-gray-400 dark:text-white/60">
      Сохраните проект, чтобы поделиться ссылкой с коллегами
    </p>
  </div>
</template>
