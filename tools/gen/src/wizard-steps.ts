import type { OptionSpec } from './schema.js';

export type WizardChoice = {
  label: string;
  value: unknown;
};

// The step-sequencing logic pulled out of wizard.tsx: everything here is
// plain data transformation with no ink/React involved, so — unlike the
// actual ink TTY rendering, which is impractical to unit test — it can be
// exercised directly.

/**
 * The schema entries the wizard still needs to prompt for: any key
 * already supplied via `seed` (e.g. a CLI flag given alongside an
 * otherwise-interactive run) is pre-filled and skipped.
 *
 * @param schema - The full option schema for a namespace.
 * @param seed - Option values already supplied.
 * @returns The subset of `schema` not already covered by `seed`.
 */
export function pendingSpecs(
  schema: OptionSpec[],
  seed: Record<string, unknown>,
): OptionSpec[] {
  return schema.filter(spec => seed[spec.key] === undefined);
}

/**
 * The choice list to render for a `select` or `boolean` spec.
 * `ink-select-input` has no native checkbox, so a `boolean` spec gets a
 * synthetic Yes/No choice list mapped back to `true`/`false`.
 *
 * @param spec - A `select` or `boolean` option spec.
 * @returns The choices to pass to `ink-select-input`'s `<SelectInput>`.
 */
export function choicesFor(spec: OptionSpec): WizardChoice[] {
  if (spec.kind === 'boolean') {
    return [
      { label: 'Yes', value: true },
      { label: 'No', value: false },
    ];
  }

  if (spec.kind === 'select') {
    return (spec.choices ?? []).map(choice => ({
      label: choice,
      value: choice,
    }));
  }

  throw new Error(
    `choicesFor() only supports 'select'/'boolean' specs, got '${spec.kind}' for '${spec.key}'`,
  );
}
