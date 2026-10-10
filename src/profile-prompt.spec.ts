import { expect } from 'chai';

import * as generator from '../index.js';

import { PromptContext } from './types/index.js';
import { profilePrompt } from './profile-prompt.js';

describe('profilePrompt', function () {
  it('is a text prompt named "profile"', function () {
    expect(profilePrompt.name).to.equal('profile');
    expect(profilePrompt.type).to.equal('text');
    expect(profilePrompt.label).to.be.a('string').that.is.not.empty;
  });

  it('provider resolves to "default"', async function () {
    const provider = profilePrompt.provider as (ctx: PromptContext) => string;

    expect(await provider({} as PromptContext)).to.equal('default');
  });

  it('is exported from the barrel', function () {
    expect(generator.profilePrompt).to.equal(profilePrompt);
  });
});
