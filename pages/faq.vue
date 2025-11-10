<script setup lang="ts">
import { useHead } from '#imports'

type FaqItem = {
  question: string
  answers: string[]
}

type FaqSection = {
  id: string
  title: string
  description?: string
  items: FaqItem[]
}

const faqSections: FaqSection[] = [
  {
    id: 'about',
    title: 'О проекте',
    description:
      'Коротко рассказываем, что такое ListOrders и как он помогает вашей команде работать с заказами и проектами.',
    items: [
      {
        question: 'Что такое ListOrders?',
        answers: [
          'ListOrders — это рабочая среда для менеджеров и команд, которая объединяет проекты, заказы и задачи в одном интерфейсе.',
          'Сервис помогает вести переписку с клиентами, отслеживать этапы работ и хранить всю историю взаимодействий.'
        ],
      },
      {
        question: 'Кому подойдёт платформа?',
        answers: [
          'ListOrders создан для небольших команд и студий, которым важно быстро запускать проекты и не терять детали.',
          'Вы можете собирать исполнителей в одну команду, подключать клиентов и делиться прогрессом по задачам.'
        ],
      },
    ],
  },
  {
    id: 'projects',
    title: 'Проекты и заказы',
    description: 'Разбираемся, как создаются проекты, добавляются задачи и распределяются исполнители.',
    items: [
      {
        question: 'Как создать новый проект?',
        answers: [
          'Откройте раздел «Проекты» и нажмите кнопку «Создать проект».',
          'Заполните название, сроки и описание — эти поля помогут команде быстрее понять задачи и стартовать работу.'
        ],
      },
      {
        question: 'Чем отличается проект от заказа?',
        answers: [
          'Проект — это общий контейнер, в котором вы собираете задачи и контролируете прогресс.',
          'Заказ (или задача) относится к конкретному клиенту: у него есть описание, список требований и история изменений.'
        ],
      },
      {
        question: 'Можно ли вернуть задачу из архива?',
        answers: [
          'Да. На странице профиля есть отдельный раздел «Заархивированные задачи».',
          'Откройте его, выберите нужный заказ и нажмите кнопку восстановления — задача снова появится в общем списке.'
        ],
      },
    ],
  },
  {
    id: 'tasks',
    title: 'Работа с задачами',
    description: 'Говорим про обновления статусов, вложения и комментарии внутри заказов.',
    items: [
      {
        question: 'Как обновить статус задачи?',
        answers: [
          'Откройте карточку заказа, выберите нужный статус из списка и подтвердите изменения.',
          'История изменения статусов сохранится автоматически — её можно посмотреть в блоке «История изменений» на странице задачи.'
        ],
      },
      {
        question: 'Где посмотреть примеры или вложения?',
        answers: [
          'В карточке заказа есть блок «Примеры». Если команда загрузила изображения или файлы, они появятся в этом разделе.',
          'Кликните по изображению, чтобы открыть полноразмерный просмотр и скачать оригинал.'
        ],
      },
      {
        question: 'Как оставить комментарий для команды?',
        answers: [
          'Используйте поле комментария внизу карточки задачи. Укажите, что нужно сделать, и нажмите «Отправить».',
          'Все участники проекта увидят комментарий и получат уведомления в Телеграме, если они включены в настройках.'
        ],
      },
    ],
  },
  {
    id: 'settings',
    title: 'Настройки и управление доступом',
    description: 'Подробности о профиле, уведомлениях и приглашениях в команду.',
    items: [
      {
        question: 'Как обновить личные данные?',
        answers: [
          'Перейдите в раздел «Редактирование профиля».',
          'Измените имя и фамилию, при необходимости обновите аватар, затем нажмите «Сохранить изменения» внизу страницы.'
        ],
      },
      {
        question: 'Можно ли сменить настройки уведомлений?',
        answers: [
          'Да. В настройках профиля переключите нужные типы уведомлений — изменения применяются сразу после сохранения.',
          'Если вы используете Telegram, убедитесь, что указали корректный идентификатор в профиле.'
        ],
      },
      {
        question: 'Как пригласить нового участника?',
        answers: [
          'Откройте нужный проект и нажмите кнопку «Пригласить».',
          'Скопируйте пригласительную ссылку или отправьте её из всплывающего окна — участник появится в списке после подтверждения.'
        ],
      },
    ],
  },
]

useHead({
  title: 'Часто задаваемые вопросы',
  htmlAttrs: {
    lang: 'ru',
    class: 'dark',
  },
  bodyAttrs: {
    class: 'bg-background-light dark:bg-background-dark font-display',
    style: 'min-height: 100dvh;',
  },
  link: [
    {
      rel: 'stylesheet',
      href: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700&display=swap',
    },
    {
      rel: 'stylesheet',
      href: 'https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined',
    },
  ],
})
</script>

<template>
  <div
    class="relative flex min-h-screen w-full flex-col bg-background-light text-black dark:bg-background-dark dark:text-white"
    :style="{ backgroundColor: 'var(--telegram-background-color, #f6f6f8)' }"
  >
    <header
      class="sticky top-0 z-20 flex items-center gap-3 border-b border-black/5 bg-background-light/95 px-4 py-3 backdrop-blur dark:border-white/10 dark:bg-background-dark/95"
    >
      <button
        type="button"
        class="flex size-12 shrink-0 items-center justify-center rounded-full bg-black/5 text-zinc-600 transition hover:bg-black/10 hover:text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary dark:bg-white/5 dark:text-zinc-300 dark:hover:bg-white/10"
        aria-label="Вернуться назад"
        @click="$router.back()"
      >
        <span class="material-symbols-outlined text-3xl">arrow_back</span>
      </button>

      <div class="flex min-w-0 flex-1 flex-col text-left">
        <h1 class="line-clamp-1 text-lg font-semibold leading-tight tracking-[-0.01em] text-zinc-900 dark:text-white">
          Часто задаваемые вопросы
        </h1>
        <p class="text-sm text-gray-500 dark:text-[#9da6b9]">Ответы на популярные вопросы про работу в ListOrders</p>
      </div>

      <div class="flex w-12 shrink-0 items-center justify-end"></div>
    </header>

    <main class="flex-1 space-y-8 px-4 py-6 pb-24">
      <section
        v-for="section in faqSections"
        :key="section.id"
        class="mx-auto flex w-full max-w-3xl flex-col gap-4"
      >
        <div class="space-y-2">
          <h2 class="text-xl font-semibold text-zinc-900 dark:text-white">{{ section.title }}</h2>
          <p v-if="section.description" class="text-sm text-gray-500 dark:text-[#9da6b9]">
            {{ section.description }}
          </p>
        </div>

        <div class="space-y-3">
          <details
            v-for="(item, index) in section.items"
            :key="item.question"
            class="group rounded-2xl bg-white p-4 shadow-sm transition-shadow hover:shadow-md dark:bg-[#1C2431]"
            :open="index === 0"
          >
            <summary
              class="flex cursor-pointer list-none items-center justify-between gap-4 text-base font-semibold text-black dark:text-white"
            >
              <span>{{ item.question }}</span>
              <span class="material-symbols-outlined shrink-0 text-gray-400 transition group-open:rotate-180">expand_more</span>
            </summary>
            <div class="mt-3 space-y-3 text-sm leading-6 text-gray-600 dark:text-[#9da6b9]">
              <p v-for="answer in item.answers" :key="answer">{{ answer }}</p>
            </div>
          </details>
        </div>
      </section>
    </main>
  </div>
</template>
