import js from '@eslint/js';
import prettier from 'eslint-config-prettier';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import { defineConfig, globalIgnores } from 'eslint/config';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default defineConfig([
  globalIgnores(['dist', 'coverage', 'playwright-report', 'test-results']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat['recommended-latest'],
      reactRefresh.configs.vite,
      jsxA11y.flatConfigs.recommended,
    ],
    languageOptions: {
      ecmaVersion: 2023,
      globals: globals.browser,
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/consistent-type-imports': 'error',
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: 'axios',
              message:
                'Use os serviços de src/services (ou o cliente em src/services/api.ts).',
            },
          ],
        },
      ],
    },
  },
  {
    // Único ponto autorizado a importar o axios diretamente.
    files: ['src/services/api.ts', 'src/utils/errors.ts'],
    rules: { 'no-restricted-imports': 'off' },
  },
  {
    // Testes e2e rodam no Node (Playwright), não no navegador do app.
    files: ['e2e/**/*.ts', 'playwright.config.ts'],
    languageOptions: { globals: globals.node },
  },
  prettier,
]);
