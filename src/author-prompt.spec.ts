import { expect } from 'chai';

import { authorPrompt } from './author-prompt.js';

describe('authorPrompt', function () {
  it('is a text prompt named "author"', function () {
    expect(authorPrompt.name).to.equal('author');
    expect(authorPrompt.type).to.equal('text');
    expect(authorPrompt.message).to.be.a('string').that.is.not.empty;
  });
});
