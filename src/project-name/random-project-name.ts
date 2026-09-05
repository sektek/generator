import { ADJECTIVES } from './adjectives.js';
import { NOUNS } from './nouns.js';

/**
 * Builds a random `adjective-noun` name, e.g. `"brave-otter"`.
 *
 * @param random - Source of randomness in [0, 1); injectable for tests.
 * @returns The hyphenated name.
 */
export function randomProjectName(random: () => number = Math.random): string {
  const adjective = ADJECTIVES[Math.floor(random() * ADJECTIVES.length)];
  const noun = NOUNS[Math.floor(random() * NOUNS.length)];
  return `${adjective}-${noun}`;
}
