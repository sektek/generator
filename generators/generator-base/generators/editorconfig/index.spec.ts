import { basename } from 'path';
import { expect } from 'chai';
// import { fileURLToPath } from 'url';
import { helper } from '@sektek/generator-test';

import { EditorConfigGenerator } from './index.js';

const generator = basename(import.meta.dirname);

describe('@sektek/base:editorconfig', function () {
  it('generates using EditorConfigGenerator', async function () {
    const result = await helper.run(`@sektek/base:${generator}`);
    expect(result.generator).to.be.instanceOf(EditorConfigGenerator);
  });

  it('generates an editorconfig', async function () {
    const { fs } = await helper.run(generator);
    expect(fs.exists('.editorconfig')).to.be.true;
  });
});
