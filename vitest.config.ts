import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.test.ts'],
    exclude: ['src/client/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'json'],
      exclude: [
        'src/client/**',
        'node_modules/**',
        '**/*.test.ts',
        '**/*.d.ts',
        'src/assets/**',
        'src/test-utils.ts'
      ],
      lines: 100,
      functions: 100,
      branches: 100,
      statements: 100,
      Watermarks: {
        lines: [80, 95],
        functions: [80, 95],
        branches: [80, 95],
        statements: [80, 95]
      }
    },
    pool: 'threads',
    poolOptions: {
      threads: {
        singleThread: false
      }
    },
    testTimeout: 10000
  },
})
