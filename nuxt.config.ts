// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  modules: ['@nuxtjs/tailwindcss', '@pinia/nuxt'],
  css: ['~/assets/css/tailwind.css'],
  app: {
    head: {
      meta: [
        {
          name: 'viewport',
          content:
            'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no'
        }
      ],
      script: [
        {
          src: 'https://telegram.org/js/telegram-web-app.js',
        }
      ]
    }
  },
  runtimeConfig: {
    telegramInitData: process.env.TELEGRAM_INIT_DATA || '',
  },
})
