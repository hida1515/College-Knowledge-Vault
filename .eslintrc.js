module.exports = {
  root: true,
  extends: [
    '@react-native',
    'plugin:@typescript-eslint/recommended',
  ],
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint'],
  rules: {
    // Enforce no explicit any
    '@typescript-eslint/no-explicit-any': 'warn',

    // Allow unused vars that start with underscore (common for placeholder params)
    '@typescript-eslint/no-unused-vars': ['error', {
      argsIgnorePattern: '^_',
      varsIgnorePattern: '^_',
    }],

    // React Native specific
    'react-native/no-inline-styles': 'warn',
    'react/react-in-jsx-scope': 'off', // Not needed with new JSX transform

    // General quality
    'no-console': ['warn', { allow: ['warn', 'error'] }],
    'prefer-const': 'error',
    'no-var': 'error',
  },
  ignorePatterns: [
    'node_modules/',
    'android/',
    'ios/',
    'scripts/',
    'coverage/',
    'supabase/',
    '*.js',
    '!.eslintrc.js',
  ],
};
