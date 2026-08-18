import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

import { expect } from 'chai';
import { helper } from '@sektek/generator-test';

import { GitConfigGenerator } from './index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const generator = join(__dirname, 'index.js');

// GitConfigGenerator composes @sektek/base:gitconfig itself (see beforeQueue),
// so running it standalone still needs that namespace registered by path.
const run = () =>
  helper
    .run(generator)
    .withGenerators([
      [
        join(
          __dirname,
          '../../../generator-base/generators/gitconfig/index.js',
        ),
        { namespace: '@sektek/base:gitconfig' },
      ],
    ]);

describe('@sektek/js:gitconfig', function () {
  it('generates using GitConfigGenerator', async function () {
    const result = await run();
    expect(result.generator).to.be.instanceOf(GitConfigGenerator);
  });

  it('composes @sektek/base:gitconfig for the base gitignore/gitattributes', async function () {
    const { fs } = await run();
    expect(fs.exists('.gitattributes')).to.be.true;
    const gitignore = fs.read('.gitignore');
    expect(gitignore).to.include('END BASE GITIGNORE');
  });

  it('appends JS-specific rules after the base gitignore content', async function () {
    const { fs } = await run();
    const gitignore = fs.read('.gitignore');
    expect(gitignore).to.include('BEGIN JavaScript');
    expect(gitignore.indexOf('END BASE GITIGNORE')).to.be.lessThan(
      gitignore.indexOf('BEGIN JavaScript'),
    );
  });
});
