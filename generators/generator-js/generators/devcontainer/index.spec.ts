import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

import { expect } from 'chai';
import { helper } from '@sektek/generator-test';

import { DevcontainerGenerator } from './index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const generator = join(__dirname, 'index.js');

// DevcontainerGenerator composes @sektek/base:devcontainer itself (see
// beforeQueue), so running it standalone still needs that namespace
// registered by path.
const run = (options: Record<string, unknown> = {}) =>
  helper
    .run(generator)
    .withOptions(options)
    .withGenerators([
      [
        join(
          __dirname,
          '../../../generator-base/generators/devcontainer/index.js',
        ),
        { namespace: '@sektek/base:devcontainer' },
      ],
    ]);

describe('@sektek/js:devcontainer', function () {
  it('generates using DevcontainerGenerator', async function () {
    const result = await run();
    expect(result.generator).to.be.instanceOf(DevcontainerGenerator);
  });

  describe('with the default profile', function () {
    it('overrides the Dockerfile with the JS/TS-specific image', async function () {
      const { fs } = await run();
      expect(fs.read('.devcontainer/Dockerfile')).to.include('typescript-node');
    });

    it('composes @sektek/base:devcontainer for the standalone devcontainer.json', async function () {
      const { fs } = await run();
      expect(fs.exists('.devcontainer/devcontainer.json')).to.be.true;
      expect(fs.read('.devcontainer/devcontainer.json')).not.to.include(
        'dockerComposeFile',
      );
    });
  });

  describe('with the workspace profile', function () {
    it('does not override the Dockerfile', async function () {
      const { fs } = await run({ profile: 'workspace' });
      expect(fs.read('.devcontainer/Dockerfile')).to.include(
        'sektek/devcontainer-base',
      );
    });

    it('composes @sektek/base:devcontainer for the compose-based devcontainer.json', async function () {
      const { fs } = await run({ profile: 'workspace' });
      expect(fs.exists('.devcontainer/docker-compose.yml')).to.be.true;
    });
  });
});
