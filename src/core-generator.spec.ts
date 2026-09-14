import { expect } from 'chai';

import { CoreConfig } from './types/core-config.js';
import { CoreFeatures } from './types/core-features.js';
import { CoreGenerator } from './core-generator.js';
import { CoreOptions } from './types/core-options.js';

class TestGenerator extends CoreGenerator<
  CoreConfig,
  CoreOptions,
  CoreFeatures
> {}

describe('CoreGenerator', function () {
  describe('prompts()', function () {
    it('defaults to no prompts, for a subclass that declares none', function () {
      expect(TestGenerator.prompts()).to.deep.equal([]);
    });
  });

  describe('composites()', function () {
    it('defaults to no composed generators, for a subclass that composes with none', function () {
      expect(TestGenerator.composites()).to.deep.equal([]);
    });
  });
});
