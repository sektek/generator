import { expect } from 'chai';

import { PromptContext } from './types/prompt-context.js';
import { projectNamePrompt } from './project-name-prompt.js';

function context(overrides: Partial<PromptContext> = {}): PromptContext {
  return { answers: {}, flagsGiven: {}, configDefaults: {}, ...overrides };
}

describe('projectNamePrompt', function () {
  it('is a text prompt named "projectName"', function () {
    expect(projectNamePrompt.name).to.equal('projectName');
    expect(projectNamePrompt.type).to.equal('text');
    expect(projectNamePrompt.label).to.be.a('string').that.is.not.empty;
  });

  describe('provider', function () {
    let provider: (ctx: PromptContext) => string;

    before(function () {
      provider = projectNamePrompt.provider as (ctx: PromptContext) => string;
    });

    it('generates a plain adjective-noun name when neither configDefaults.projectName nor workspace is set', async function () {
      expect(await provider(context())).to.match(/^[a-z]+-[a-z]+$/);
    });

    it('prefixes with configDefaults.projectName when set', async function () {
      const name = await provider(
        context({ configDefaults: { projectName: 'sektek-messaging' } }),
      );

      expect(name).to.match(/^sektek-messaging-[a-z]+-[a-z]+$/);
    });

    it('prefixes with workspace.name when configDefaults.projectName is unset', async function () {
      const name = await provider(
        context({
          workspace: {
            root: 'sektek-messaging-workspace-root',
            name: 'sektek-messaging',
          },
        }),
      );

      expect(name).to.match(/^sektek-messaging-[a-z]+-[a-z]+$/);
    });

    it('prefers configDefaults.projectName over workspace.name when both are set', async function () {
      const name = await provider(
        context({
          configDefaults: { projectName: 'config-name' },
          workspace: { root: 'workspace-name-root', name: 'workspace-name' },
        }),
      );

      expect(name).to.match(/^config-name-[a-z]+-[a-z]+$/);
    });
  });

  it('is reloadable via the same provider that supplies its default', function () {
    expect(projectNamePrompt.capabilities).to.deep.equal([
      { type: 'reloadable', provider: projectNamePrompt.provider },
    ]);
  });
});
