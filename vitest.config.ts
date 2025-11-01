import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { defineConfig } from 'vitest/config'

const rootDir = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    include: ['tests/**/*.test.ts'],
  },
  css: {
    postcss: {
      plugins: [],
    },
  },
  resolve: {
    alias: {
      '~': rootDir,
      '~~': rootDir,
      '@': rootDir,
    },
  },
})
