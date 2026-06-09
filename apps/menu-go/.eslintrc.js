module.exports = {
  ...require('config/eslint-preset'),
  overrides: [
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
  ],
};
