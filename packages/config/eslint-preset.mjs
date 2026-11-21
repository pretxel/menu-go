// Shared ESLint flat config (ESLint 9).
// Order matters: later entries override earlier ones, and prettier must come
// after every config that ships formatting rules.
import js from '@eslint/js';
import nextConfig from 'eslint-config-next';
import nextTypescript from 'eslint-config-next/typescript';
import prettier from 'eslint-config-prettier/flat';
import simpleImportSort from 'eslint-plugin-simple-import-sort';
import globals from 'globals';
import neostandard from 'neostandard';

export default [
  { ignores: ['**/dist/**', '**/.next/**', '**/generated/**'] },
  js.configs.recommended,
  // Successor of eslint-config-standard; formatting is left to prettier.
  ...neostandard({ noStyle: true, ts: true }),
  ...nextConfig,
  ...nextTypescript,
  prettier,
  {
    // ESLint 9 reports stale eslint-disable comments by default; ESLint 8 did not.
    linterOptions: { reportUnusedDisableDirectives: 'off' },
    plugins: { 'simple-import-sort': simpleImportSort },
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.jest,
        JSX: 'readonly',
      },
    },
    rules: {
      'no-useless-constructor': 'off',
      'react/prop-types': 'off',
      'react/react-in-jsx-scope': 'off',
      '@next/next/no-html-link-for-pages': 'off',
      'simple-import-sort/imports': 'error',
      'simple-import-sort/exports': 'error',
      '@typescript-eslint/ban-ts-comment': 'off',
      'import/no-anonymous-default-export': 'off',
      // New in eslint-plugin-react-hooks 7. Existing components hydrate state
      // from localStorage/props in effects; warn until they are refactored.
      'react-hooks/set-state-in-effect': 'warn',
    },
  },
];
