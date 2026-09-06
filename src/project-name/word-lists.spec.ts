import { expect } from 'chai';

import { ADJECTIVES } from './adjectives.js';
import { NOUNS } from './nouns.js';

describe('word lists', function () {
  const cases: { name: string; list: readonly string[] }[] = [
    { name: 'ADJECTIVES', list: ADJECTIVES },
    { name: 'NOUNS', list: NOUNS },
  ];

  for (const { name, list } of cases) {
    describe(name, function () {
      it('contains only lowercase alphabetic words', function () {
        for (const word of list) {
          expect(word).to.match(/^[a-z]+$/);
        }
      });

      it('has no duplicates', function () {
        expect(new Set(list).size).to.equal(list.length);
      });

      it('has at least 1000 entries', function () {
        expect(list.length).to.be.at.least(1000);
      });
    });
  }
});
