import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

import { expect } from 'chai';
import { helper } from '@sektek/generator-test';

import { MochaGenerator } from './index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const generator = join(__dirname, 'index.js');

describe('@sektek/js:mocha', function () {
  it('generates using MochaGenerator', async function () {
    const result = await helper
      .run(generator)
      .withOptions({ language: 'javascript' });
    expect(result.generator).to.be.instanceOf(MochaGenerator);
  });

  it('generates a .mocharc.min.cjs and a test:min script', async function () {
    const { fs } = await helper
      .run(generator)
      .withOptions({ language: 'javascript' });
    expect(fs.exists('.mocharc.min.cjs')).to.be.true;
    expect(fs.read('.mocharc.min.cjs')).to.include("require('./.mocharc.cjs')");
    const pkg = JSON.parse(fs.read('package.json'));
    expect(pkg.scripts['test:min']).to.equal('mocha --config .mocharc.min.cjs');
  });

  describe('with language: javascript', function () {
    it('generates a .mocharc.cjs targeting .spec.js files', async function () {
      const { fs } = await helper
        .run(generator)
        .withOptions({ language: 'javascript' });
      const mocharc = fs.read('.mocharc.cjs');
      expect(mocharc).to.include("spec: ['**/*.spec.js']");
      expect(mocharc).not.to.include('tsx/esm');
    });

    it('does not generate a .nycrc.json', async function () {
      const { fs } = await helper
        .run(generator)
        .withOptions({ language: 'javascript' });
      expect(fs.exists('.nycrc.json')).to.be.false;
    });
  });

  describe('with language: typescript', function () {
    it('generates a .mocharc.cjs targeting .spec.ts files via tsx/esm', async function () {
      const { fs } = await helper
        .run(generator)
        .withOptions({ language: 'typescript' });
      const mocharc = fs.read('.mocharc.cjs');
      expect(mocharc).to.include("spec: ['**/*.spec.ts']");
      expect(mocharc).to.include("import: 'tsx/esm'");
    });

    it('generates a .nycrc.json extending the typescript nyc config', async function () {
      const { fs } = await helper
        .run(generator)
        .withOptions({ language: 'typescript' });
      expect(fs.exists('.nycrc.json')).to.be.true;
      const nycrc = JSON.parse(fs.read('.nycrc.json'));
      expect(nycrc.extends).to.equal('@istanbuljs/nyc-config-typescript');
      expect(nycrc.include).to.deep.equal(['index.ts', 'src/**/*.ts']);
    });
  });
});
