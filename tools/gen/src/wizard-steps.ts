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
    if (!spec.choices || spec.choices.length === 0) {
      throw new Error(`choicesFor(): select spec '${spec.key}' has no choices`);
    }
    return spec.choices.map(choice => ({ label: choice, value: choice }));
  }

  throw new Error(
    `choicesFor() only supports 'select'/'boolean' specs, got '${spec.kind}' for '${spec.key}'`,
  );
}

/**
 * The index within `choices` (as returned by `choicesFor(spec)`) matching
 * `spec`'s declared default value, for pre-selecting `<SelectInput>`'s
 * initial highlight so it actually reflects the schema's default instead
 * of always starting at the first item. Falls back to `0` when there's no
 * default, or the default doesn't match any choice.
 *
 * @param spec - The `select` or `boolean` option spec being rendered.
 * @param choices - That spec's choice list, as returned by `choicesFor(spec)`.
 * @returns The index to pass as `<SelectInput>`'s `initialIndex`.
 */
export function defaultIndexFor(
  spec: OptionSpec,
  choices: WizardChoice[],
): number {
  if (spec.default === undefined) {
    return 0;
  }
  const index = choices.findIndex(choice => choice.value === spec.default);
  return index === -1 ? 0 : index;
}
