import { expect } from 'chai';

import { Composite, CoreGenerator } from './core-generator.js';
import { CoreConfig } from './types/core-config.js';
import { CoreFeatures } from './types/core-features.js';
import { CoreOptions } from './types/core-options.js';
import { Prompt } from './types/prompt.js';

class TestGenerator extends CoreGenerator<
  CoreConfig,
  CoreOptions,
  CoreFeatures
> {}

const FAKE_PROMPT: Prompt = {
  name: 'fake',
  type: 'text',
  label: 'Fake',
  provider: () => undefined,
  includePrompt: () => true,
  capabilities: [],
};

class LeafGenerator extends CoreGenerator<
  CoreConfig,
  CoreOptions,
  CoreFeatures
> {
  static prompts(): Prompt[] {
    return [FAKE_PROMPT];
  }
}

class ComposerGenerator extends CoreGenerator<
  CoreConfig,
  CoreOptions,
  CoreFeatures
> {
  static composites(): Composite[] {
    return [{ name: 'leaf', generatorClass: LeafGenerator }];
  }
}

describe('CoreGenerator', function () {
  describe('prompts()', function () {
    it('defaults to no prompts, for a subclass that declares none', function () {
      expect(TestGenerator.prompts()).to.deep.equal([]);
    });

    it("defaults to flattening every composite's own prompts(), for a subclass that only overrides composites()", function () {
      // ComposerGenerator never overrides prompts() itself — this exercises
      // the inherited default's polymorphic `this.composites()` call.
      expect(ComposerGenerator.prompts()).to.deep.equal([FAKE_PROMPT]);
    });
  });

  describe('composites()', function () {
    it('defaults to no composed generators, for a subclass that composes with none', function () {
      expect(TestGenerator.composites()).to.deep.equal([]);
    });
  });
});
