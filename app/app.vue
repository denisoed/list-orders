<script setup lang="ts">
interface Feature {
  title: string
  description: string
}

const features: Feature[] = [
  {
    title: 'Готовность к Tailwind CSS',
    description: 'В проект уже подключены пресеты Tailwind и PostCSS для удобной стилизации.',
  },
  {
    title: 'Типизированные компоненты',
    description: 'Компоненты используют современный синтаксис `<script setup lang="ts">` для строгой типизации.',
  },
  {
    title: 'Nuxt 4',
    description: 'Приложение готово к дальнейшему развитию на свежем стеке Nuxt 4 и Vue 3.',
  },
]
</script>

<template>
  <div class="min-h-screen bg-slate-950 text-slate-50">
    <NuxtRouteAnnouncer />
    <main class="mx-auto flex min-h-screen max-w-4xl flex-col items-center justify-center gap-12 px-6 py-20 text-center">
      <div class="flex flex-col gap-4">
        <p class="text-sm font-semibold uppercase tracking-[0.4em] text-slate-400">list-orders</p>
        <h1 class="text-4xl font-bold sm:text-5xl">Tailwind + TypeScript готовы к работе</h1>
        <p class="text-lg text-slate-300">
          Начните с редактирования <code class="rounded bg-slate-900 px-2 py-1 font-mono text-base text-emerald-400">app/app.vue</code>
          или создайте новый компонент в директории
          <code class="rounded bg-slate-900 px-2 py-1 font-mono text-base text-emerald-400">components/</code>.
        </p>
      </div>

      <ul class="grid w-full gap-6 sm:grid-cols-3">
        <li
          v-for="feature in features"
          :key="feature.title"
          class="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 text-left shadow-lg shadow-slate-950/40 backdrop-blur transition hover:border-emerald-400/80 hover:shadow-emerald-400/30"
        >
          <h2 class="text-xl font-semibold text-emerald-300">{{ feature.title }}</h2>
          <p class="mt-3 text-sm text-slate-300">{{ feature.description }}</p>
        </li>
      </ul>
    </main>
  </div>
</template>
