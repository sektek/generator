import { defineConfig } from 'eslint/config';
import sektek from '@sektek/eslint-plugin';

export default defineConfig([
  sektek.configs.typescript,
  {
    rules: {
      // Import blocks, top to bottom: Node built-ins, then dependencies
      // (external packages and local workspace packages alike), then
      // local (relative) files — a blank line between each block.
      'import/order': [
        'error',
        {
          groups: [
            'builtin',
            ['external', 'internal'],
            ['parent', 'sibling', 'index'],
          ],
          'newlines-between': 'always',
        },
      ],
    },
  },
  {
    // typescript-eslint's recommended config already parses JSX in .tsx
    // files with no extra setup (verified: @typescript-eslint/parser
    // enables JSX for files matching its default .tsx glob). The one gap
    // is check-file's naming rule, whose regex only covers .js/.ts — this
    // is the first package with .tsx files (the wizard component), so
    // extend it to require PascalCase for .tsx, matching React convention.
    // No eslint-plugin-react/-react-hooks yet: there's no JSX-authored
    // source in this package until the wizard lands, so add those when
    // there's real code to lint against them.
    files: ['**/*.tsx'],
    rules: {
      'check-file/filename-naming-convention': [
        'error',
        { '**/*.tsx': 'PASCAL_CASE' },
      ],
    },
  },
]);
