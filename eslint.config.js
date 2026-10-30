import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['dist', 'dev-dist', 'reference', 'node_modules', 'export_data'] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.strict],
    files: ['**/*.{ts,tsx}'],
    languageOptions: { ecmaVersion: 2023, globals: { ...globals.browser, ...globals.worker } },
    rules: {
      // AGENTS.md: no force unwraps, no print-style logging (use `log` from core/support/log.ts).
      '@typescript-eslint/no-non-null-assertion': 'error',
      'no-console': 'error',
      eqeqeq: ['error', 'always'],
    },
  },
  {
    files: ['src/app/**/*.{ts,tsx}'],
    plugins: { 'react-hooks': reactHooks },
    rules: {
      ...reactHooks.configs.recommended.rules,
      // Layers: the app reaches the database only through the worker API (src/app/data/database.ts).
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@sqlite.org/sqlite-wasm'],
              message: 'The app talks to the database through src/app/data/database.ts.',
            },
            {
              group: ['**/core/db/*', '**/worker/*', '!**/worker/WorkerApi'],
              message: 'Use the worker API in src/app/data/database.ts.',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['src/core/**/*.ts'],
    rules: {
      // Layers: WorkoutCore is pure logic. No UI, no worker, no app code.
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['react', 'react-*', 'comlink', 'lucide-react'],
              message: 'WorkoutCore has no UI or threading code.',
            },
            {
              group: ['**/app/*', '**/worker/*'],
              message: 'Dependencies point inward only: core never imports app or worker.',
            },
          ],
        },
      ],
    },
  },
);
