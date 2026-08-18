import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

import { expect } from 'chai';
import { helper } from '@sektek/generator-test';

import { BasePackageGenerator } from './index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const generator = join(__dirname, 'index.js');

describe('@sektek/js:base-package', function () {
  it('generates using BasePackageGenerator', async function () {
    const result = await helper
      .run(generator)
      .withOptions({ language: 'javascript' });
    expect(result.generator).to.be.instanceOf(BasePackageGenerator);
  });

  describe('with language: javascript', function () {
    it('generates a package.json and a plain-JS entrypoint', async function () {
      const { fs } = await helper
        .run(generator)
        .withOptions({ language: 'javascript' });
      expect(fs.exists('package.json')).to.be.true;
      expect(fs.exists('index.js')).to.be.true;
      expect(fs.exists('index.spec.js')).to.be.true;
    });
  });

  describe('with language: typescript', function () {
    it('generates a package.json but no entrypoint', async function () {
      const { fs } = await helper
        .run(generator)
        .withOptions({ language: 'typescript' });
      expect(fs.exists('package.json')).to.be.true;
      expect(fs.exists('index.ts')).to.be.false;
      expect(fs.exists('index.js')).to.be.false;
    });
  });
});
