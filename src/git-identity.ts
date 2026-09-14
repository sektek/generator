import childProcess from 'node:child_process';
import { promisify } from 'node:util';

export type GitConfigReader = (key: string) => Promise<string | undefined>;

async function readGitConfigFromCli(key: string): Promise<string | undefined> {
  const execFileAsync = promisify(childProcess.execFile);
  try {
    const { stdout } = await execFileAsync('git', ['config', '--get', key]);
    const value = stdout.trim();
    return value === '' ? undefined : value;
  } catch {
    return undefined;
  }
}

let reader: GitConfigReader = readGitConfigFromCli;

/**
 * Derives a default `author` string from the caller's own git identity —
 * the same `user.name`/`user.email` git itself would use to author a
 * commit — formatted the conventional npm `package.json` way:
 * `"Name <email>"`. Falls back to just whichever of the two resolved when
 * only one is set, and to `undefined` when neither is.
 *
 * @returns The derived author string, or `undefined` if git config has
 *   neither `user.name` nor `user.email` set.
 */
export async function deriveAuthorFromGitConfig(): Promise<string | undefined> {
  const [name, email] = await Promise.all([
    reader('user.name'),
    reader('user.email'),
  ]);

  if (name && email) {
    return `${name} <${email}>`;
  }
  return name ?? email ?? undefined;
}

/**
 * Test-only escape hatch: swaps the reader `deriveAuthorFromGitConfig`
 * uses, so specs can avoid shelling out to the real `git` CLI.
 *
 * @param testReader - The stand-in reader to install.
 */
export function setGitConfigReaderForTesting(
  testReader: GitConfigReader,
): void {
  reader = testReader;
}

/**
 * Test-only escape hatch: restores the real, CLI-backed reader after a
 * spec is done installing its own.
 */
export function resetGitConfigReaderForTesting(): void {
  reader = readGitConfigFromCli;
}

export default deriveAuthorFromGitConfig;
