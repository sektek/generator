import Generator from 'yeoman-generator/typed';

import { CoreFeatures } from './types/core-features.js';
import { CoreOptions } from './types/core-options.js';

const DEFAULT_OPTIONS: Partial<CoreOptions> = {
  skipInstall: false,
  namespace: 'sektek',
};
const DEFAULT_FEATURES: Partial<CoreFeatures> = {
  inheritTasks: true,
  taskPrefix: 'task'
};
const QUEUES = [
  'initializing',
  'prompting',
  'configuring',
  'default',
  'writing',
  'transform',
  'conflicts',
  'install',
  'end',
];

const capitalize = (str: string) => str && str.charAt(0).toUpperCase() + str.slice(1);

export abstract class CoreGenerator<O extends CoreOptions, F extends CoreFeatures> extends Generator<O, F> {
  package: string | null = null;

  constructor(args: string | string[], options: O, features?: F) {
    super(
      args,
      {
        ...DEFAULT_OPTIONS,
        ...options,
      },
      {
        ...DEFAULT_FEATURES,
        ...(features ?? {} as F),
      }
    );
  }

  async composeWith<G extends Generator = Generator>(
    generator: string | { Generator: any; path: string },
    immediately?: boolean
  ): Promise<G>;
  async composeWith<G extends Generator = Generator>(
    generator: string[],
    immediately?: boolean
  ): Promise<G[]>;
  async composeWith<G extends Generator = Generator>(
    generator: string | { Generator: any; path: string },
    options: Partial<any>,
    immediately?: boolean
  ): Promise<G>;
  async composeWith<G extends Generator = Generator>(
    generator: string[],
    options: Partial<any>,
    immediately?: boolean
  ): Promise<G[]>;
  async composeWith<G extends Generator = Generator>(
    generator: string | { Generator: any; path: string },
    args: string[],
    options?: Partial<any>,
    immediately?: boolean
  ): Promise<G>;
  async composeWith<G extends Generator = Generator>(
    generator: string[],
    args: string[],
    options?: Partial<any>,
    immediately?: boolean
  ): Promise<G[]>;
  async composeWith<G extends Generator = Generator>(
    generator: string,
    options?: any
  ): Promise<G[]>;
  async composeWith<G extends Generator = Generator>(
    generator: string | string[] | { Generator: any; path: string },
    argsOrOptionsOrImmediately?: string[] | Partial<O> | boolean | any,
    optionsOrImmediately?: Partial<O> | boolean | any,
    immediately = false
  ): Promise<G | G[]> {
    if (optionsOrImmediately !== undefined && typeof optionsOrImmediately !== 'boolean') {
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
    return await super.composeWith(
      generator as any,
      argsOrOptionsOrImmediately as any,
      optionsOrImmediately as any,
      immediately
    ) as any;
  }

  #rewriteGeneratorName(generatorName: string): string {
    if (this.package === null) {
      return generatorName;
    }

    return this.#generatorIsFullyQualified(generatorName)
      ? generatorName
      : `${this.package}:${generatorName}`;
  }

  #generatorIsFullyQualified(generatorName: string): boolean {
    return true;
    // return generatorName.includes(':');
  }
}
