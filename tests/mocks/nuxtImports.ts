import { ref } from 'vue'

export const useState = <T>(key: string, init: () => T) => {
  console.warn('[tests] using default useState mock for key', key)
  return ref(init())
}

export const createError = (input: { statusCode?: number; statusMessage?: string }) => ({
  ...input,
  name: 'NuxtError',
  message: input.statusMessage ?? 'Ошибка',
})

export const useRoute = () => ({
  params: {},
  query: {},
})

export const useRouter = () => ({
  push: () => {},
  back: () => {},
})

export const useHead = () => {}
