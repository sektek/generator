import { expect } from 'chai';

import {
  deriveAuthorFromGitConfig,
  resetGitConfigReaderForTesting,
  setGitConfigReaderForTesting,
} from './git-identity.js';
import { authorPrompt } from './author-prompt.js';

describe('authorPrompt', function () {
  afterEach(function () {
    resetGitConfigReaderForTesting();
  });

  it('is a text prompt named "author"', function () {
    expect(authorPrompt.name).to.equal('author');
    expect(authorPrompt.type).to.equal('text');
    expect(authorPrompt.label).to.be.a('string').that.is.not.empty;
  });

  it('provider derives the default from git config', async function () {
    setGitConfigReaderForTesting(
      async key =>
        ({ 'user.name': 'Ada Lovelace', 'user.email': 'ada@example.com' })[key],
    );

    expect(authorPrompt.provider).to.equal(deriveAuthorFromGitConfig);
    expect(await deriveAuthorFromGitConfig()).to.equal(
      'Ada Lovelace <ada@example.com>',
    );
  });
});
