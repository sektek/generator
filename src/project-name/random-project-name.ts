import { ADJECTIVES } from './adjectives.js';
import { NOUNS } from './nouns.js';

/**
 * Draws one `random()` sample and turns it into an index into a list of
 * the given length, throwing if the sample isn't actually in the
 * documented `[0, 1)` range (a caller-supplied `random` producing `1`,
 * `NaN`, or another out-of-range value would otherwise silently index
 * past the list and put the literal string `"undefined"` into the name).
 *
 * @param random - Source of randomness in [0, 1).
 * @param length - The list length to index into.
 * @returns A valid index in `[0, length)`.
 */
function pickIndex(random: () => number, length: number): number {
  const value = random();
  if (!(value >= 0 && value < 1)) {
    throw new RangeError(
      `randomProjectName(): random() must return a finite number in [0, 1), got ${value}`,
    );
  }
  return Math.floor(value * length);
}

/**
 * Builds a random `adjective-noun` name, e.g. `"brave-otter"`.
 *
 * @param random - Source of randomness in [0, 1); injectable for tests.
 * @returns The hyphenated name.
 */
export function randomProjectName(random: () => number = Math.random): string {
  const adjective = ADJECTIVES[pickIndex(random, ADJECTIVES.length)];
  const noun = NOUNS[pickIndex(random, NOUNS.length)];
  return `${adjective}-${noun}`;
}
