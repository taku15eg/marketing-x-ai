import { dirname } from 'path';
import { fileURLToPath } from 'url';
import { FlatCompat } from '@eslint/eslintrc';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends('next/core-web-vitals'),
  {
    ignores: ['e2e/**', '__tests__/**'],
  },
  {
    rules: {
      // App Router loads fonts globally via layout.tsx <head>, not _document.js
      '@next/next/no-page-custom-font': 'off',
    },
  },
];

export default eslintConfig;
