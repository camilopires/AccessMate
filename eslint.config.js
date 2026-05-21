// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');
const jsxA11y = require('eslint-plugin-jsx-a11y');
const prettier = require('eslint-plugin-prettier');
const prettierConfig = require('eslint-config-prettier');

module.exports = defineConfig([
  expoConfig,
  jsxA11y.flatConfigs.recommended,
  {
    plugins: { prettier },
    rules: {
      'prettier/prettier': 'error',
      // Idiomatic Zod pattern: `export const X = z.object(...); export type X = z.infer<typeof X>`.
      // TypeScript handles value/type namespacing; ESLint's redeclare rule can't tell them apart.
      '@typescript-eslint/no-redeclare': 'off',
    },
  },
  prettierConfig,
  {
    ignores: ['dist/*', 'node_modules/*', '.expo/*', 'web-build/*', 'coverage/*'],
  },
]);
