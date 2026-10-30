import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['src/core/**/*.test.ts', 'src/app/**/*.test.ts', 'tools/**/*.test.ts'],
    environment: 'node',
  },
});
