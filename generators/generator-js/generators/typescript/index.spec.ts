import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

import { expect } from 'chai';
import { helper } from '@sektek/generator-test';

import { TypescriptGenerator } from './index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const generator = join(__dirname, 'index.js');

describe('@sektek/js:typescript', function () {
  it('generates using TypescriptGenerator', async function () {
    const result = await helper
      .run(generator)
      .withOptions({ language: 'typescript' });
    expect(result.generator).to.be.instanceOf(TypescriptGenerator);
  });

  it('generates tsconfig files and a TS entrypoint', async function () {
    const { fs } = await helper
      .run(generator)
      .withOptions({ language: 'typescript' });
    expect(fs.exists('tsconfig.json')).to.be.true;
    expect(fs.exists('tsconfig.build.json')).to.be.true;
    expect(fs.exists('index.ts')).to.be.true;
    expect(fs.exists('index.spec.ts')).to.be.true;
  });
});
