import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: [
      'src/core/**/*.test.ts',
      'src/worker/**/*.test.ts',
      'src/app/**/*.test.ts',
      'src/app/**/*.test.tsx',
      'tools/**/*.test.ts',
    ],
    environment: 'node',
    // SQLite WebAssembly start-up can exceed the 5 s default on a busy machine or CI runner.
    testTimeout: 20_000,
  },
});
