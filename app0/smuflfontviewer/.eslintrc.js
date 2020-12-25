module.exports = {
  env: {
    browser: true,
    node: true,
    es6: true
  },
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaFeatures: {
      jsx: true
    },
    sourceType: 'module'
  },
  plugins: [
    'react',
    '@typescript-eslint'
  ],
  extends: [
    'eslint:recommended',
    'plugin:react/recommended',
    'plugin:@typescript-eslint/recommended',
  ],
  rules: {
  },
  overrides: [
    {
      'files': ['**/*.tsx'],
      'rules': {
        'react/prop-types': 'off'
      }
    }
  ]
};
