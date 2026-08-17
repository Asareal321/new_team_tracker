// The one rule this project actually needed: no-undef.
//
// Three crashes this session were the same shape — a variable referenced in
// JSX that nothing had defined in that scope. `projects` inside PriorityBoard,
// `fetchProjectMembers` after a bad edit, and before that a deleted helper.
// Every one of them built cleanly: an undefined variable is a runtime scope
// error, and neither Vite nor esbuild looks for it. The crash then arrives on
// mount, which is the worst place to find it — the page is blank, and reloading
// can't clear it.
//
// So this config is deliberately narrow. It is not a style pass and it is not
// here to have opinions about the code that already works; almost everything is
// off. What's left is the set of rules that catch code that cannot run.

import js from '@eslint/js'
import globals from 'globals'
import react from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'

export default [
  { ignores: ['dist/**', 'node_modules/**'] },
  {
    files: ['**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: 'module',
      globals: { ...globals.browser, ...globals.node },
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    settings: { react: { version: 'detect' } },
    plugins: { react, 'react-hooks': reactHooks },
    rules: {
      ...js.configs.recommended.rules,

      // The whole point. JSX counts as a use, so a component referencing a prop
      // it was never given is an error rather than a blank page.
      'no-undef': 'error',
      'react/jsx-uses-vars': 'error',
      'react/jsx-uses-react': 'error',
      // A component used but never imported is the same bug wearing a hat.
      'react/jsx-no-undef': 'error',

      // Stale closures and missing deps are the other way this app breaks
      // silently, so hooks are checked — but deps stay a warning, since the
      // existing code has deliberate omissions with reasons written above them.
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',

      // Genuine mistakes, not taste.
      'no-dupe-keys': 'error',
      'no-unreachable': 'error',
      'no-cond-assign': 'error',
      'no-const-assign': 'error',
      'no-func-assign': 'error',
      'no-obj-calls': 'error',
      'no-sparse-arrays': 'error',
      'valid-typeof': 'error',

      // Off: this config is not a style pass. An unused variable is untidy;
      // it isn't a crash, and turning it on would bury the rules above under a
      // wall of warnings about existing code that works.
      'no-unused-vars': 'off',
      'no-empty': 'off',
      'no-useless-escape': 'off',
    },
  },
]
