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

// Precedence when more than one gen.config.* file exists in the same
// directory: only the first format found is loaded.
const CONFIG_FORMATS = ['js', 'yaml', 'json'] as const;
type ConfigFormat = (typeof CONFIG_FORMATS)[number];

type ConfigFile = { path: string; format: ConfigFormat };

// One SingletonProvider per directory, so a directory's config file is
// only ever read/parsed once per process run no matter how many times
// loadConfig() is called for it.
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
  // Normalize before using as both the memoization key and the path
  // readConfig()/findConfigFile() actually search — otherwise
  // loadConfig('some/dir') and loadConfig('/abs/.../some/dir') (the same
  // real directory, spelled differently) would create separate providers,
  // reread the file twice, and produce a relative path in error messages
  // despite the documented absolute-path guarantee.
  const key = realpathSync(dir);
  let provider = providers.get(key);
  if (!provider) {
    provider = singleton(() => readConfig(key));
    providers.set(key, provider);
  }
  return provider.get();
}

/**
 * Finds the highest-precedence `gen.config.*` file in `dir`, if any.
 *
 * @param dir - The directory to search.
 * @returns The matching file's absolute path and format, or undefined.
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
 * Finds and parses `dir`'s config file, if any, wrapping any failure with
 * the file's absolute path and the underlying cause.
 *
 * @param dir - The directory to load a config file from.
 * @returns The parsed config object, or undefined if `dir` has no config file.
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
 * Parses one config file's contents per its format.
 *
 * @param file - The config file to parse.
 * @param file.path - Absolute path to the config file.
 * @param file.format - The config file's format.
 * @returns The parsed value, as returned by that format's parser.
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

// Node's own diagnostic text for each mismatch (stable across Node's
// supported versions, verified empirically against Node 24 — see the
// PR discussion this narrowing was added to address). Matching on this
// instead of the bare error class stops an unrelated bug in the user's own
// config (e.g. a real `ReferenceError: someUndefinedVariable is not
// defined`) from being misclassified as a module-format mismatch, retried
// against the wrong forced extension, and surfacing a confusing SyntaxError
// that masks the actual problem.
const ESM_UNDER_CJS_PATTERNS = [
  /^Cannot use import statement outside a module$/,
  /^Unexpected token 'export'$/,
];

/**
 * True if `error` is Node's own diagnostic for ESM syntax (`export`/`import`)
 * evaluated under CommonJS parsing rules, not just any `SyntaxError`.
 *
 * @param error - The error thrown by a plain `import()` of the config file.
 * @returns Whether this is specifically an ESM-under-CJS mismatch.
 */
function isEsmUnderCjsMismatch(error: unknown): error is SyntaxError {
  return (
    error instanceof SyntaxError &&
    ESM_UNDER_CJS_PATTERNS.some(pattern => pattern.test(error.message))
  );
}

/**
 * True if `error` is Node's own diagnostic for CommonJS syntax
 * (`module`/`exports`/`require`) evaluated under real ES module rules, not
 * just any `ReferenceError`.
 *
 * @param error - The error thrown by a plain `import()` of the config file.
 * @returns Whether this is specifically a CJS-under-ESM mismatch.
 */
function isCjsUnderEsmMismatch(error: unknown): error is ReferenceError {
  return (
    error instanceof ReferenceError &&
    error.message.includes('is not defined in ES module scope')
  );
}

/**
 * Imports a `.js` config file's default export, tolerating either ESM
 * (`export default {...}`) or CommonJS (`module.exports = {...}`),
 * regardless of which one the file's own directory's ambient `package.json`
 * (if any) would otherwise force it to be parsed as.
 *
 * Tries a plain `import()` first (the common case: the file's syntax
 * already matches its ambient interpretation — usually CJS, since config
 * directories like the home dir rarely declare `"type": "module"`). Two
 * mismatches are possible if that throws:
 * - ESM syntax (`export default`) parsed under CJS rules throws a
 *   `SyntaxError` matching {@link isEsmUnderCjsMismatch} — retry by forcing
 *   ESM via a temp `.mjs` sibling.
 * - CJS syntax (`module.exports = ...`) evaluated under ESM (an ambient
 *   `"type": "module"`) throws a `ReferenceError` matching
 *   {@link isCjsUnderEsmMismatch} (`module`/`exports` isn't defined in a
 *   real ES module) — retry by forcing CJS via a temp `.cjs` sibling.
 * Either retry writes the source to a same-directory temp file (keeping any
 * relative `import()`/`require()` inside the config resolving against its
 * own directory) and deletes it in a `finally` block. Any other error —
 * including a `SyntaxError`/`ReferenceError` that isn't one of these two
 * specific Node diagnostics, e.g. a genuine bug in the config itself — or a
 * failure of the retry itself, propagates as-is rather than being retried.
 *
 * @param path - Absolute path to the `.js` config file.
 * @returns The module's `.default` export if present, otherwise the module namespace itself.
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
 * Imports `path`'s contents via a same-directory temp copy with a forced
 * extension, to make Node parse it as a specific module system regardless
 * of the ambient `package.json`.
 *
 * @param path - Absolute path to the source file to copy and import.
 * @param ext - The forced extension (`mjs` for ESM, `cjs` for CommonJS).
 * @returns The imported module's namespace object.
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
