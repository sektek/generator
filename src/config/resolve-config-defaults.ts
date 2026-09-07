import { ConfigObject, loadConfig } from './config-loader.js';
import { configSearchPaths } from './config-paths.js';

export type ConfigDefaults = Record<string, unknown>;

/**
 * Resolves the merged config-file defaults for a generator namespace, by
 * walking `cwd`'s directory hierarchy (and `homeDir`) via
 * {@link configSearchPaths} and, per key, taking the first directory whose
 * config defines it — namespaced value (`<family>.<generator>.key`) if
 * present, else that directory's top-level value.
 *
 * Doesn't know or care about any option schema — a config file's keys are
 * returned as-is, whatever they are; the caller filters against its own
 * schema.
 *
 * @param namespace - The resolved generator namespace, e.g. `@sektek/js:app`.
 * @param dirs - Where to search from.
 * @param dirs.cwd - The directory to start the ancestor walk from.
 * @param dirs.homeDir - The user's home directory.
 * @returns The merged defaults found across the directory hierarchy.
 */
export async function resolveConfigDefaults(
  namespace: string,
  { cwd, homeDir }: { cwd: string; homeDir: string },
): Promise<ConfigDefaults> {
  const { family, generator } = parseNamespace(namespace);
  // Null-prototype + Object.hasOwn: a config file's own keys (parsed by
  // JSON.parse/yaml's parser, which define them directly rather than going
  // through a setter) are safe, but building this object up via bracket
  // assignment is not — a key literally named `__proto__` would otherwise
  // invoke Object.prototype's inherited setter and repoint this object's
  // own prototype instead of just storing a value under that key.
  const result: ConfigDefaults = Object.create(null) as ConfigDefaults;

  for (const dir of configSearchPaths(cwd, homeDir)) {
    const config = await loadConfig(dir);
    if (!config) {
      continue;
    }

    for (const [key, value] of Object.entries(
      effectiveDefaults(config, family, generator),
    )) {
      if (!Object.hasOwn(result, key)) {
        result[key] = value;
      }
    }
  }

  return result;
}

function parseNamespace(namespace: string): {
  family: string;
  generator: string;
} {
  const parts = namespace.split(':');
  const family = parts[0]?.split('/')[1];
  if (parts.length !== 2 || !family || !parts[1]) {
    throw new Error(
      `resolveConfigDefaults(): expected a resolved namespace like "@sektek/js:app", got ${JSON.stringify(namespace)}`,
    );
  }
  return { family, generator: parts[1] };
}

function effectiveDefaults(
  config: ConfigObject,
  family: string,
  generator: string,
): ConfigObject {
  // Object.fromEntries defines properties directly rather than assigning
  // through them, so a `__proto__` key here can't hijack this object's
  // prototype the way `topLevel[key] = value` could.
  const topLevel = Object.fromEntries(
    Object.entries(config).filter(
      ([, value]) => asConfigObject(value) === undefined,
    ),
  );

  const namespaced = asConfigObject(
    asConfigObject(config[family])?.[generator],
  );

  return { ...topLevel, ...namespaced };
}

function asConfigObject(value: unknown): ConfigObject | undefined {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? (value as ConfigObject)
    : undefined;
}

export default resolveConfigDefaults;
