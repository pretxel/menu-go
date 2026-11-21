import preset from 'config/eslint-preset.mjs';

export default [
  ...preset,
  {
    // Test files mock modules with loose shapes — `any` and require() are fine there.
    files: ['__test__/**/*'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-require-imports': 'off',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
    },
  },
];
