module.exports = {
  extends: [
    'next',
    'standard',
    'prettier',
    'standard-jsx',
    'standard-react',
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
  ],
  parser: '@typescript-eslint/parser',
  plugins: ['simple-import-sort', 'autofix', '@typescript-eslint'],
  settings: {
    next: {
      rootDir: ['apps/*/', 'packages/*/'],
    },
  },
  rules: {
    semi: 'off',
    'jsx-quotes': 'off',
    'react/jsx-curly-newline': 'off',
    'react/jsx-curly-brace-presence': 'off',
    'no-useless-constructor': 'off',
    'react/prop-types': 'off',
    'react/react-in-jsx-scope': 'off',
    'no-html-link-for-pages': 'off',
    'simple-import-sort/imports': 'error',
    'simple-import-sort/exports': 'error',
    '@typescript-eslint/ban-ts-comment': 'off',
    'import/no-anonymous-default-export': 'off',
  },
  env: {
    jest: true,
    node: true,
  },
  globals: {
    JSX: 'readonly',
    Macropay: 'readonly',
  },
  ignorePatterns: ['**/dist/**.js'],
};
