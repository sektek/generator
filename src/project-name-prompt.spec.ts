import { expect } from 'chai';

import { projectNamePrompt } from './project-name-prompt.js';

describe('projectNamePrompt', function () {
  it('is a text prompt named "projectName"', function () {
    expect(projectNamePrompt.name).to.equal('projectName');
    expect(projectNamePrompt.type).to.equal('text');
    expect(projectNamePrompt.message).to.be.a('string').that.is.not.empty;
  });

  it('provider generates an adjective-noun name', async function () {
    const provider = projectNamePrompt.provider as () => string;

    expect(await provider()).to.match(/^[a-z]+-[a-z]+$/);
  });

  it('is reloadable via the same provider that supplies its default', function () {
    expect(projectNamePrompt.capabilities).to.deep.equal([
      { type: 'reloadable', provider: projectNamePrompt.provider },
    ]);
  });
});
