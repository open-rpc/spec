import eslint from '@eslint/js';
import tseslint from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import prettierConfig from 'eslint-config-prettier';
import prettierPlugin from 'eslint-plugin-prettier';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import globals from "globals";


const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default [
  eslint.configs.recommended,
  // Add ignores as a separate config object
  {
    ignores: [
      "package.json",
      "node_modules/", 
      "**/dist/",
      "dist/", 
      "docs/",  // This will now work
      "build/", 
      "coverage/",
      "*.config.js", 
      "**/*.config.ts", 
      "vitest.config.ts", 
      "vite.config.ts",
      "build.ts"  // Add this

    ]
  },
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        project: ['./tsconfig.json'],
        tsconfigRootDir: __dirname,
        ecmaVersion: 2022,
        sourceType: 'module',
        ecmaFeatures: {
          jsx: true
        }
      },
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.es6,
        chrome: 'readonly',
        browser: 'readonly'
      }
    },
    plugins: {
      '@typescript-eslint': tseslint,
      'prettier': prettierPlugin
    },
    rules: {
      ...tseslint.configs['recommended'].rules,
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'prettier/prettier': 'error'
    },
    settings: { }
  },
  // Jest test files configuration
  {
    files: ['**/*.test.{ts,tsx}', '**/*.spec.{ts,tsx}'],
    languageOptions: {
      globals: {
        ...globals.bun,
        ...globals.jest,
        ...globals.browser,
        ...globals.node,
        ...globals.es6,
        Bun: 'readonly',
        window: 'readonly',
        document: 'readonly',
        navigator: 'readonly',
        console: 'readonly',
        localStorage: 'readonly',
        sessionStorage: 'readonly',
        fetch: 'readonly',
        FormData: 'readonly',
        URLSearchParams: 'readonly',
        chrome: 'readonly',
        browser: 'readonly'
      }
    }
  },
  prettierConfig
]; 