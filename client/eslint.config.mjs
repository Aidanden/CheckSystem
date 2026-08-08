import nextVitals from 'eslint-config-next/core-web-vitals';

/** @type {import('eslint').Linter.Config[]} */
const eslintConfig = [
  ...nextVitals,
  {
    ignores: ['public/**', 'node_modules/**'],
  },
  {
    // Pre-existing patterns; react-hooks v7 (via eslint-config-next 16) made these errors.
    rules: {
      'react-hooks/immutability': 'warn',
      'react-hooks/set-state-in-effect': 'warn',
      'react/no-unescaped-entities': 'warn',
    },
  },
];

export default eslintConfig;
