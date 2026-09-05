import { expect } from 'chai';

import { ADJECTIVES } from './adjectives.js';
import { NOUNS } from './nouns.js';
import { randomProjectName } from './random-project-name.js';

describe('randomProjectName', function () {
  it('picks the first adjective and noun when random always returns 0', function () {
    expect(randomProjectName(() => 0)).to.equal(`${ADJECTIVES[0]}-${NOUNS[0]}`);
  });

  it('picks the last adjective and noun without going out of bounds', function () {
    const result = randomProjectName(() => 0.999999);
    expect(result).to.equal(
      `${ADJECTIVES[ADJECTIVES.length - 1]}-${NOUNS[NOUNS.length - 1]}`,
    );
  });

  it('returns a hyphenated adjective-noun name using the real RNG', function () {
    for (let i = 0; i < 10; i++) {
      expect(randomProjectName()).to.match(/^[a-z]+-[a-z]+$/);
    }
  });

  it('throws instead of indexing out of bounds when random() returns 1', function () {
    expect(() => randomProjectName(() => 1)).to.throw(RangeError, /\[0, 1\)/);
  });

  it('throws instead of producing "undefined" when random() returns NaN', function () {
    expect(() => randomProjectName(() => NaN)).to.throw(RangeError, /\[0, 1\)/);
  });

  it('throws when random() returns a negative number', function () {
    expect(() => randomProjectName(() => -0.1)).to.throw(
      RangeError,
      /\[0, 1\)/,
    );
  });

  it('throws when random() returns a number greater than 1', function () {
    expect(() => randomProjectName(() => 1.5)).to.throw(RangeError, /\[0, 1\)/);
  });
});
