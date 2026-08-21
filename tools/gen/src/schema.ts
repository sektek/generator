export type OptionKind = 'text' | 'boolean' | 'select';

export type OptionSpec = {
  key: string;
  flag: string;
  prompt: string;
  kind: OptionKind;
  choices?: readonly string[];
  default?: unknown;
  required?: boolean;
};

// Options every generator understands, since CoreGenerator applies these
// as workspace-wide defaults regardless of which sub-generator runs.
export const CORE_OPTIONS: OptionSpec[] = [
  {
    key: 'namespace',
    flag: '--namespace <value>',
    prompt: 'Config namespace',
    kind: 'text',
    default: 'sektek',
  },
  {
    key: 'profile',
    flag: '--profile <value>',
    prompt: 'Profile',
    kind: 'text',
    default: 'default',
  },
  {
    key: 'description',
    flag: '--description <value>',
    prompt: 'Project description',
    kind: 'text',
  },
];

// Options specific to the @sektek/js:* generator family.
export const JS_OPTIONS: OptionSpec[] = [
  {
    key: 'language',
    flag: '--language <value>',
    prompt: 'Language',
    kind: 'select',
    choices: ['javascript', 'typescript'],
    default: 'javascript',
  },
  {
    key: 'packageScope',
    flag: '--package-scope <value>',
    prompt: 'npm scope',
    kind: 'text',
    default: 'sektek',
  },
  {
    key: 'author',
    flag: '--author <value>',
    prompt: 'Author',
    kind: 'text',
    default: 'Edward Kelly <eddie@sektek.net>',
  },
  {
    key: 'license',
    flag: '--license <value>',
    prompt: 'License',
    kind: 'text',
    default: 'UNLICENSED',
  },
  {
    // Negatable form: with default: true and a plain --private flag,
    // commander has no way to turn it off (there's no positive flag left
    // to negate). --no-private is commander's own convention for a
    // boolean that defaults true and needs to be overridable to false.
    key: 'private',
    flag: '--no-private',
    prompt: 'Private package?',
    kind: 'boolean',
    default: true,
  },
];

/**
 * Returns the option schema for a generator namespace: every composeWith
 * call passes its whole options object through unchanged, so the schema is
 * scoped per package family (`@sektek/base:*` vs `@sektek/js:*`), not per
 * individual sub-generator — a finer-grained schema would be spurious
 * precision the real generator code doesn't have.
 *
 * @param namespace - The generator namespace being run (e.g. `@sektek/js:app`).
 * @returns The option specs relevant to that namespace's package family.
 */
export function schemaFor(namespace: string): OptionSpec[] {
  return namespace.startsWith('@sektek/js:')
    ? [...CORE_OPTIONS, ...JS_OPTIONS]
    : CORE_OPTIONS;
}
