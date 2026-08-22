import Environment from 'yeoman-environment';

import { registerAll } from './registry.js';

export type RunEnv = {
  destinationRoot: string;
  force: boolean;
};

/**
 * The one place either run mode (automated or interactive) actually
 * invokes Yeoman: registers every known generator, then runs exactly one
 * of them with a fully-resolved options object. Generator classes
 * themselves need zero changes to work through this path.
 *
 * `env.force` ends up in the conflicter's options the same way `yo`'s own
 * `--force`/`-f` flag does — but not via an `Environment` constructor
 * option (`yeoman-environment`@4's `Environment` has no such field;
 * verified against its installed types/source). `runGenerator()`
 * (`environment-base.js`) starts the conflicter from `generator.options`,
 * so `force` has to travel as a generator option, same as everything else
 * in `options`.
 *
 * @param generatorNamespace - The generator namespace to run (e.g. `@sektek/js:app`).
 * @param options - The fully-resolved options object to pass to the generator.
 * @param env - Where to write output, and whether to force-overwrite conflicts.
 */
export async function runGenerator(
  generatorNamespace: string,
  options: Record<string, unknown>,
  env: RunEnv,
): Promise<void> {
  const environment = new Environment({ cwd: env.destinationRoot });
  registerAll(environment);
  await environment.run([generatorNamespace], {
    ...options,
    force: env.force,
    destinationRoot: env.destinationRoot,
  });
}
