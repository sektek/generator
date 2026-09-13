import { PredicateFn, ProviderFn, getComponent } from '@sektek/utility-belt';
import { expect, use } from 'chai';
import chaiAsPromised from 'chai-as-promised';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';

import { Prompt } from './types/prompt.js';
import { PromptBuilder } from './prompt-builder.js';
import { PromptContext } from './types/prompt-context.js';

use(chaiAsPromised);
use(sinonChai);

const context: PromptContext = { answers: {}, flagsGiven: {} };

const includePrompt = (prompt: Prompt, ctx: PromptContext) => {
  const test: PredicateFn<PromptContext> = getComponent(
    prompt.includePrompt,
    'test',
  );
  return test(ctx);
};
const provide = (prompt: Prompt, ctx: PromptContext) => {
  const get: ProviderFn<unknown, PromptContext> = getComponent(
    prompt.provider,
    'get',
  );
  return get(ctx);
};

describe('PromptBuilder', function () {
  describe('create()', function () {
    it('builds a prompt from explicit fields', function () {
      const provider = sinon.stub().resolves('value');
      const includePromptFn = sinon.stub().resolves(true);
      const capabilities = [{ type: 'clearable' as const }];

      const prompt = new PromptBuilder().create({
        name: 'author',
        type: 'text',
        message: 'Author',
        provider,
        includePrompt: includePromptFn,
        capabilities,
      });

      expect(prompt.name).to.equal('author');
      expect(prompt.type).to.equal('text');
      expect(prompt.message).to.equal('Author');
      expect(prompt.provider).to.equal(provider);
      expect(prompt.includePrompt).to.equal(includePromptFn);
      expect(prompt.capabilities).to.equal(capabilities);
    });

    it('defaults provider to a function resolving undefined', async function () {
      const prompt = new PromptBuilder().create({
        name: 'author',
        type: 'text',
        message: 'Author',
      });

      await expect(
        Promise.resolve(provide(prompt, context)),
      ).to.eventually.equal(undefined);
    });

    it('defaults includePrompt to a function resolving true', async function () {
      const prompt = new PromptBuilder().create({
        name: 'author',
        type: 'text',
        message: 'Author',
      });

      await expect(
        Promise.resolve(includePrompt(prompt, context)),
      ).to.eventually.equal(true);
    });

    it('defaults capabilities to an empty array', function () {
      const prompt = new PromptBuilder().create({
        name: 'author',
        type: 'text',
        message: 'Author',
      });

      expect(prompt.capabilities).to.deep.equal([]);
    });

    it('never calls provider/includePrompt itself — stores them for later', function () {
      const provider = sinon.stub();
      const includePromptFn = sinon.stub();

      new PromptBuilder().create({
        name: 'author',
        type: 'text',
        message: 'Author',
        provider,
        includePrompt: includePromptFn,
      });

      expect(provider).not.to.have.been.called;
      expect(includePromptFn).not.to.have.been.called;
    });

    it('throws when name, type, or message is missing and there is no seed', function () {
      expect(() =>
        new PromptBuilder().create({ type: 'text', message: 'Author' }),
      ).to.throw(/requires name, type, and message/);
    });
  });

  describe('from(prompt).create()', function () {
    let seed: Prompt;

    before(function () {
      seed = new PromptBuilder().create({
        name: 'author',
        type: 'text',
        message: 'Author',
      });
    });

    it('inherits every field from the seed when init omits them', function () {
      const prompt = new PromptBuilder().from(seed).create({});

      expect(prompt).to.deep.equal(seed);
    });

    it('plainly replaces name/type/message/provider/capabilities on override', function () {
      const provider = sinon.stub();
      const capabilities = [{ type: 'clearable' as const }];

      const prompt = new PromptBuilder().from(seed).create({
        name: 'license-author',
        type: 'select',
        message: 'License author',
        provider,
        capabilities,
      });

      expect(prompt.name).to.equal('license-author');
      expect(prompt.type).to.equal('select');
      expect(prompt.message).to.equal('License author');
      expect(prompt.provider).to.equal(provider);
      expect(prompt.capabilities).to.equal(capabilities);
    });

    it('composes includePrompt with the seed’s via AND, rather than replacing it', async function () {
      const seedWithIncludePrompt = new PromptBuilder().from(seed).create({
        includePrompt: (ctx: PromptContext) => ctx.answers.seedAnswer === true,
      });

      const prompt = new PromptBuilder().from(seedWithIncludePrompt).create({
        includePrompt: (ctx: PromptContext) =>
          ctx.answers.overrideAnswer === true,
      });

      const bothTrue = await Promise.resolve(
        includePrompt(prompt, {
          answers: { seedAnswer: true, overrideAnswer: true },
          flagsGiven: {},
        }),
      );
      const onlySeedTrue = await Promise.resolve(
        includePrompt(prompt, {
          answers: { seedAnswer: true, overrideAnswer: false },
          flagsGiven: {},
        }),
      );
      const onlyOverrideTrue = await Promise.resolve(
        includePrompt(prompt, {
          answers: { seedAnswer: false, overrideAnswer: true },
          flagsGiven: {},
        }),
      );

      expect(bothTrue).to.equal(true);
      expect(onlySeedTrue).to.equal(false);
      expect(onlyOverrideTrue).to.equal(false);
    });
  });
});
