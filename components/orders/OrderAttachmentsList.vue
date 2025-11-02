<script setup lang="ts">
import type { OrderAttachment } from '~/data/orders'

const props = defineProps<{
  attachments: OrderAttachment[]
}>()

const iconMap: Record<OrderAttachment['type'], string> = {
  image: 'image',
  document: 'description',
  archive: 'folder_zip',
}
</script>

<template>
  <section class="space-y-3 rounded-xl bg-white/60 p-4 dark:bg-white/5">
    <header class="flex items-center justify-between">
      <h2 class="text-base font-semibold text-gray-900 dark:text-white">Вложения</h2>
      <span class="text-sm text-gray-500 dark:text-gray-400">{{ props.attachments.length }} файла(ов)</span>
    </header>

    <p v-if="props.attachments.length === 0" class="rounded-lg bg-gray-100/70 p-4 text-sm text-gray-500 dark:bg-white/10 dark:text-gray-400">
      Файлы пока не добавлены. Загрузите материалы, чтобы команда могла ознакомиться с деталями заказа.
    </p>

    <ul v-else class="space-y-2">
      <li
        v-for="attachment in props.attachments"
        :key="attachment.id"
        class="flex items-center gap-3 rounded-xl bg-white p-3 shadow-sm transition hover:bg-black/5 dark:bg-white/10 dark:hover:bg-white/20"
      >
        <span class="flex size-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <span class="material-symbols-outlined">{{ iconMap[attachment.type] }}</span>
        </span>
        <div class="flex flex-1 flex-col">
          <p class="text-sm font-medium text-gray-900 dark:text-white">{{ attachment.name }}</p>
          <p class="text-xs text-gray-500 dark:text-gray-400">{{ attachment.sizeLabel }}</p>
        </div>
        <a
          class="flex size-11 items-center justify-center rounded-lg text-gray-500 transition hover:bg-gray-100 hover:text-gray-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary dark:text-gray-300 dark:hover:bg-white/10 dark:hover:text-white"
          :href="attachment.url"
          target="_blank"
          rel="noopener"
          :aria-label="`Скачать файл ${attachment.name}`"
        >
          <span class="material-symbols-outlined">download</span>
        </a>
      </li>
    </ul>
  </section>
</template>
