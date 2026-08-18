import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

import { expect } from 'chai';
import { helper } from '@sektek/generator-test';

import { PrettierGenerator } from './index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const generator = join(__dirname, 'index.js');

describe('@sektek/js:prettier', function () {
  it('generates using PrettierGenerator', async function () {
    const result = await helper
      .run(generator)
      .withOptions({ language: 'javascript' });
    expect(result.generator).to.be.instanceOf(PrettierGenerator);
  });

  it('generates prettier config files', async function () {
    const { fs } = await helper
      .run(generator)
      .withOptions({ language: 'javascript' });
    expect(fs.exists('.prettierrc.js')).to.be.true;
    expect(fs.exists('.prettierignore')).to.be.true;
  });
});
