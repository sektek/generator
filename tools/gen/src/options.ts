import type { Command } from 'commander';

import { type OptionSpec, schemaFor } from './schema.js';

/**
 * Adds one commander `.option(...)` per entry in a namespace's schema.
 *
 * @param command - The commander command to add options to.
 * @param namespace - The generator namespace being run (e.g. `@sektek/js:app`).
 * @returns The same command, for chaining.
 */
export function addSchemaOptions(command: Command, namespace: string): Command {
  for (const spec of schemaFor(namespace)) {
    command.option(spec.flag, spec.prompt, spec.default as string | boolean);
  }
  return command;
}

/**
 * Resolves a namespace's options by folding schema defaults under whatever
 * flags were actually given, then validates that every `required` key
 * still has a value. Throws one aggregated error listing every missing
 * required key, rather than failing on the first.
 *
 * @param namespace - The generator namespace being run (e.g. `@sektek/js:app`).
 * @param flagsGiven - Option values already supplied (CLI flags or wizard answers).
 * @param extraSpecs - Additional specs layered on top of `schemaFor(namespace)`;
 *   nothing in today's real schema is both `required` and default-less, so
 *   this is how tests exercise that validation path.
 * @returns The fully-resolved options object.
 */
export function resolve(
  namespace: string,
  flagsGiven: Record<string, unknown>,
  extraSpecs: OptionSpec[] = [],
): Record<string, unknown> {
  const schema = [...schemaFor(namespace), ...extraSpecs];
  const defaults = Object.fromEntries(
    schema.map(spec => [spec.key, spec.default]),
  );
  const resolved = { ...defaults, ...flagsGiven };

  const missing = schema
    .filter(spec => spec.required && resolved[spec.key] === undefined)
    .map(spec => spec.key);
  if (missing.length > 0) {
    throw new Error(`Missing required option(s): ${missing.join(', ')}`);
  }

  return resolved;
}
