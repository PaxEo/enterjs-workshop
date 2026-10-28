import js from '@eslint/js';
import reactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['dist', 'node_modules', 'playwright-report', 'test-results'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['src/**/*.{ts,tsx}'],
    languageOptions: { globals: globals.browser },
    plugins: { 'react-hooks': reactHooks },
    rules: {
      ...reactHooks.configs.recommended.rules,
      // Altlast in den Info-Panels, wird im Workshop migriert
      'react-hooks/set-state-in-effect': 'warn',
    },
  },
  {
    files: ['server/**/*.ts', 'scripts/**/*.{ts,mjs}', 'shared/**/*.ts', '*.config.{js,ts}'],
    languageOptions: { globals: globals.node },
  },
);
