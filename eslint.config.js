'use strict'

// ESLint Flat Config — zwei Welten:
//   - electron/  : CommonJS, Node-Globals (Main-Prozess + Preload)
//   - src/       : ESM + JSX, Browser-Globals (Renderer)
// PowerShell-Skripte und Build-Output sind ausgenommen.

const js = require('@eslint/js')
const react = require('eslint-plugin-react')
const reactHooks = require('eslint-plugin-react-hooks')
const globals = require('globals')

module.exports = [
  { ignores: ['dist/**', 'release/**', 'node_modules/**', 'Ultimate/**'] },

  // Main-Prozess + Preload (CommonJS/Node).
  {
    files: ['electron/**/*.js', 'eslint.config.js'],
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: 'commonjs',
      globals: { ...globals.node },
    },
    rules: {
      ...js.configs.recommended.rules,
      'no-empty': ['error', { allowEmptyCatch: true }],
      'no-unused-vars': ['error', { argsIgnorePattern: '^_|^event$', caughtErrors: 'none' }],
    },
  },

  // Vite-Config (ESM/Node).
  {
    files: ['vite.config.js'],
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: 'module',
      globals: { ...globals.node },
    },
    rules: { ...js.configs.recommended.rules },
  },

  // Renderer (React/JSX, ESM).
  {
    files: ['src/**/*.{js,jsx}'],
    plugins: { react, 'react-hooks': reactHooks },
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: 'module',
      parserOptions: { ecmaFeatures: { jsx: true } },
      globals: { ...globals.browser },
    },
    settings: { react: { version: 'detect' } },
    rules: {
      ...js.configs.recommended.rules,
      ...react.configs.flat.recommended.rules,
      ...reactHooks.configs.recommended.rules,
      // JSX-Transform (React 17+) braucht kein `import React`.
      'react/react-in-jsx-scope': 'off',
      // Die App ist bewusst untypisiert (JS) — PropTypes wären reine Zeremonie.
      'react/prop-types': 'off',
      'no-empty': ['error', { allowEmptyCatch: true }],
      'no-unused-vars': ['error', { argsIgnorePattern: '^_', caughtErrors: 'none' }],
    },
  },
]
