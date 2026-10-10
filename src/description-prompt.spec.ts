import { expect } from 'chai';

import * as barrel from '../index.js';

import { PromptContext } from './types/prompt-context.js';
import { descriptionPrompt } from './description-prompt.js';

describe('descriptionPrompt', function () {
  it('is a text prompt named "description"', function () {
    expect(descriptionPrompt.name).to.equal('description');
    expect(descriptionPrompt.type).to.equal('text');
    expect(descriptionPrompt.label).to.be.a('string').that.is.not.empty;
  });

  it('provides no default', async function () {
    const provider = descriptionPrompt.provider as (
      ctx: PromptContext,
    ) => undefined;

    expect(await provider({ answers: {}, flagsGiven: {}, configDefaults: {} }))
      .to.be.undefined;
  });

  it('is exported from the barrel', function () {
    expect(barrel.descriptionPrompt).to.equal(descriptionPrompt);
  });
});
