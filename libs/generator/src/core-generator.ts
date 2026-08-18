import Generator from 'yeoman-generator/typed';

import { CoreConfig } from './types/core-config.js';
import { CoreFeatures } from './types/core-features.js';
import { CoreOptions } from './types/core-options.js';

const DEFAULT_OPTIONS: Partial<CoreOptions> = {
  skipInstall: false,
  namespace: 'sektek',
};
const DEFAULT_FEATURES: Partial<CoreFeatures> = {
  inheritTasks: true,
  taskPrefix: 'task',
};

// yeoman-generator's built-in priority names are lowercase single words
// (initializing, writing, ...), and taskPrefix matching does a literal
// `${taskPrefix}${priorityName}` concatenation with no capitalization, so
// task methods would otherwise have to be named e.g. `taskwriting`. These
// alias each built-in queue under a PascalCase priorityName pointing at
// the *same* queueName, so `taskWriting` runs at the same point in the
// lifecycle a plain `taskwriting` would have. Registering an alias for an
// already-registered queueName is a no-op (see Environment#addPriority),
// so this doesn't create a second run queue.
const PRIORITY_ALIASES: { priorityName: string; queueName: string }[] = [
  { priorityName: 'Initializing', queueName: 'initializing' },
  { priorityName: 'Prompting', queueName: 'prompting' },
  { priorityName: 'Configuring', queueName: 'configuring' },
  { priorityName: 'Default', queueName: 'default' },
  { priorityName: 'Writing', queueName: 'writing' },
  { priorityName: 'Transform', queueName: 'transform' },
  { priorityName: 'Conflicts', queueName: 'conflicts' },
  { priorityName: 'Install', queueName: 'install' },
  { priorityName: 'End', queueName: 'end' },
];

// Matches yeoman-generator's own composeWith overloads for passing a
// Generator class directly (rather than a namespace/path string). The
// constructor itself is intentionally untyped here — narrowing it further
// would mean depending on @yeoman/types' internal generator-constructor
// shape, which isn't part of this package's public dependency surface.
type GeneratorConstructorRef = { Generator: unknown; path: string };

// yeoman-generator's Generator takes a leading ConfigType generic ahead of
// Options/Features (its own persisted-config Storage, backed by
// .yo-rc.json); C defaults to CoreConfig, mirroring how O/F default on
// BaseGenerator, so existing two-arg usages (CoreGenerator<O, F>) are
// unaffected.
export abstract class CoreGenerator<
  O extends CoreOptions,
  F extends CoreFeatures,
  C extends CoreConfig = CoreConfig,
> extends Generator<C, O, F> {
  package: string | null = null;

  constructor(args: string | string[], options: O, features?: F) {
    super(
      // yeoman-generator's own constructor types this as string[] only, but
      // still accepts (and this codebase relies on) a single string at
      // runtime — see PRIORITY_ALIASES/callers passing either form.
      args as string[],
      {
        ...DEFAULT_OPTIONS,
        ...options,
      },
      {
        ...DEFAULT_FEATURES,
        ...(features ?? ({} as F)),
      },
    );
    this.registerPriorities(PRIORITY_ALIASES);
  }

  // These overloads mirror yeoman-generator's own composeWith overloads
  // (options: Partial<GetGeneratorOptions<G>> upstream), which are keyed
  // off each call's own generic G rather than this class's O. Narrowing
  // the options parameters to Partial<O> breaks override-compatibility
  // with the base class (TS2416) because the two generics don't unify;
  // reproducing GetGeneratorOptions<G> here would mean depending on
  // @yeoman/types' internals, which isn't part of this package's public
  // dependency surface. `any` is kept deliberately, matching upstream.
  /* eslint-disable @typescript-eslint/no-explicit-any */
  async composeWith<G extends Generator = Generator>(
    generator: string | GeneratorConstructorRef,
    immediately?: boolean,
  ): Promise<G>;
  async composeWith<G extends Generator = Generator>(
    generator: string[],
    immediately?: boolean,
  ): Promise<G[]>;
  async composeWith<G extends Generator = Generator>(
    generator: string | GeneratorConstructorRef,
    options: Partial<any>,
    immediately?: boolean,
  ): Promise<G>;
  async composeWith<G extends Generator = Generator>(
    generator: string[],
    options: Partial<any>,
    immediately?: boolean,
  ): Promise<G[]>;
  async composeWith<G extends Generator = Generator>(
    generator: string | GeneratorConstructorRef,
    args: string[],
    options?: Partial<any>,
    immediately?: boolean,
  ): Promise<G>;
  async composeWith<G extends Generator = Generator>(
    generator: string[],
    args: string[],
    options?: Partial<any>,
    immediately?: boolean,
  ): Promise<G[]>;
  async composeWith<G extends Generator = Generator>(
    generator: string,
    options?: Partial<any>,
  ): Promise<G[]>;
  async composeWith<G extends Generator = Generator>(
    generator: string | string[] | GeneratorConstructorRef,
    argsOrOptionsOrImmediately?: string[] | Partial<any> | boolean,
    optionsOrImmediately?: Partial<any> | boolean,
    immediately = false,
  ): Promise<G | G[]> {
    if (
      optionsOrImmediately !== undefined &&
      typeof optionsOrImmediately !== 'boolean'
    ) {
      optionsOrImmediately = {
        ...DEFAULT_OPTIONS,
        ...optionsOrImmediately,
      };
    }
    // Rewrite generator name if it's a string
    if (typeof generator === 'string') {
      generator = this.#rewriteGeneratorName(generator);
    }

    // Call parent with the same parameters
    return (await super.composeWith(
      generator as any,
      argsOrOptionsOrImmediately as any,
      optionsOrImmediately as any,
      immediately,
    )) as any;
  }
  /* eslint-enable @typescript-eslint/no-explicit-any */

  #rewriteGeneratorName(generatorName: string): string {
    if (this.package === null) {
      return generatorName;
    }

    return this.#generatorIsFullyQualified(generatorName)
      ? generatorName
      : `${this.package}:${generatorName}`;
  }

  #generatorIsFullyQualified(generatorName: string): boolean {
    return generatorName.includes(':');
  }
}
