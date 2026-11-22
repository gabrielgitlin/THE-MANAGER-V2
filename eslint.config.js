// Shared lint config for the new backend packages (apps/web keeps its own config).
import js from '@eslint/js';
import prettier from 'eslint-config-prettier';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['**/dist/**', '**/node_modules/**', 'apps/web/**', 'apps/mcp/**', 'supabase/**'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  prettier,
  {
    languageOptions: { globals: globals.node },
  },
  // CLEAN dependency rule: inner layers never import outer ones.
  {
    files: ['packages/domain/**/*.ts'],
    rules: {
      'no-restricted-imports': ['error', { patterns: ['@the-manager/*', 'drizzle-orm*', 'fastify*', 'postgres'] }],
    },
  },
  {
    files: ['packages/application/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            { group: ['@the-manager/*', '!@the-manager/domain'], message: 'application may only depend on domain.' },
            { group: ['drizzle-orm*', 'fastify*', 'postgres'], message: 'No frameworks in the application layer.' },
          ],
        },
      ],
    },
  },
);
