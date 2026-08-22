import { createElement } from 'react';
import { render } from 'ink';

import { Wizard } from './wizard.js';
import { schemaFor } from './schema.js';

// Plain .ts, not .tsx: this file has no JSX syntax of its own (createElement
// instead), so it doesn't need the tsx parser — only wizard.tsx does.

/**
 * Bridges ink's component/callback model into the async/await flow the
 * CLI needs: mounts the wizard, resolves once the user has answered every
 * remaining schema step, then unmounts.
 *
 * @param namespace - The generator namespace being run (e.g. `@sektek/js:app`).
 * @param seed - Option values already supplied via CLI flags, pre-filled/skipped by the wizard.
 * @returns The fully-resolved answers, keyed the same way as the namespace's schema.
 */
export function runWizard(
  namespace: string,
  seed: Record<string, unknown> = {},
): Promise<Record<string, unknown>> {
  return new Promise(resolve => {
    const { unmount } = render(
      createElement(Wizard, {
        schema: schemaFor(namespace),
        seed,
        onComplete: answers => {
          unmount();
          resolve(answers);
        },
      }),
    );
  });
}
