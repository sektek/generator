import { basename, dirname, join } from 'node:path';
import {
  existsSync,
  readFileSync,
  realpathSync,
  unlinkSync,
  writeFileSync,
} from 'node:fs';
import { pathToFileURL } from 'node:url';
import { randomUUID } from 'node:crypto';

import { SingletonProvider, singleton } from '@sektek/utility-belt';
import { parse as parseYaml } from 'yaml';

export type ConfigObject = Record<string, unknown>;

const CONFIG_FORMATS = ['js', 'yaml', 'json'] as const;
type ConfigFormat = (typeof CONFIG_FORMATS)[number];

type ConfigFile = { path: string; format: ConfigFormat };

const providers = new Map<
  string,
  SingletonProvider<ConfigObject | undefined>
>();

/**
 * Loads and memoizes the `gen.config.{js,yaml,json}` file for `dir`, if
 * one exists (`js > yaml > json` precedence — only one file is loaded per
 * directory).
 *
 * @param dir - The directory to load a config file from.
 * @returns The parsed config object, or undefined if `dir` has no config file.
 */
export function loadConfig(dir: string): Promise<ConfigObject | undefined> {
  const key = realpathSync(dir);
  let provider = providers.get(key);
  if (!provider) {
    provider = singleton(() => readConfig(key));
    providers.set(key, provider);
  }
  return provider.get();
}

/**
 * @param dir - Directory to search.
 * @returns The matching file, or undefined.
 */
function findConfigFile(dir: string): ConfigFile | undefined {
  for (const format of CONFIG_FORMATS) {
    const path = join(dir, `gen.config.${format}`);
    if (existsSync(path)) {
      return { path, format };
    }
  }
  return undefined;
}

/**
 * @param dir - Directory to load a config file from.
 * @returns The parsed config, or undefined.
 */
async function readConfig(dir: string): Promise<ConfigObject | undefined> {
  const file = findConfigFile(dir);
  if (!file) {
    return undefined;
  }

  try {
    const value = await parse(file);
    if (typeof value !== 'object' || value === null || Array.isArray(value)) {
      throw new Error('expected the config to export a plain object');
    }
    return value as ConfigObject;
  } catch (error) {
    throw new Error(`Failed to load config file at ${file.path}`, {
      cause: error,
    });
  }
}

/**
 * @param file - The config file to parse.
 * @param file.path - Absolute path.
 * @param file.format - File format.
 * @returns The parsed value.
 */
async function parse({ path, format }: ConfigFile): Promise<unknown> {
  switch (format) {
    case 'json':
      return JSON.parse(readFileSync(path, 'utf8'));
    case 'yaml':
      return parseYaml(readFileSync(path, 'utf8'));
    case 'js':
      return loadJsModuleExport(path);
  }
}

// Matched instead of the bare error class, so a real bug in the user's
// config doesn't get misclassified as a module-format mismatch.
const ESM_UNDER_CJS_PATTERNS = [
  /^Cannot use import statement outside a module$/,
  /^Unexpected token 'export'$/,
];

/**
 * @param error - Error thrown by importing the config file.
 * @returns Whether it's specifically an ESM-under-CJS mismatch.
 */
function isEsmUnderCjsMismatch(error: unknown): error is SyntaxError {
  return (
    error instanceof SyntaxError &&
    ESM_UNDER_CJS_PATTERNS.some(pattern => pattern.test(error.message))
  );
}

/**
 * @param error - Error thrown by importing the config file.
 * @returns Whether it's specifically a CJS-under-ESM mismatch.
 */
function isCjsUnderEsmMismatch(error: unknown): error is ReferenceError {
  return (
    error instanceof ReferenceError &&
    error.message.includes('is not defined in ES module scope')
  );
}

/**
 * @param path - Absolute path to the `.js` config file.
 * @returns The default export, or the module namespace if there isn't one.
 */
async function loadJsModuleExport(path: string): Promise<unknown> {
  let mod: Record<string, unknown>;
  try {
    mod = (await import(pathToFileURL(path).href)) as Record<string, unknown>;
  } catch (error) {
    if (isEsmUnderCjsMismatch(error)) {
      mod = await importViaTempCopy(path, 'mjs');
    } else if (isCjsUnderEsmMismatch(error)) {
      mod = await importViaTempCopy(path, 'cjs');
    } else {
      throw error;
    }
  }

  return 'default' in mod ? mod.default : mod;
}

/**
 * @param path - Source file to copy.
 * @param ext - Forced extension (`mjs` for ESM, `cjs` for CommonJS).
 * @returns The imported module namespace.
 */
async function importViaTempCopy(
  path: string,
  ext: 'mjs' | 'cjs',
): Promise<Record<string, unknown>> {
  const tempFile = join(
    dirname(path),
    `.${basename(path)}.${randomUUID()}.${ext}`,
  );
  writeFileSync(tempFile, readFileSync(path, 'utf8'));
  try {
    return (await import(pathToFileURL(tempFile).href)) as Record<
      string,
      unknown
    >;
  } finally {
    unlinkSync(tempFile);
  }
}
