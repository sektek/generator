import { existsSync } from 'node:fs';

import type Environment from 'yeoman-environment';
import { expect } from 'chai';
import sinon from 'sinon';

import { REGISTRY, registerAll } from './registry.js';

// One namespace per generator directory listed in each package's manifest,
// exercised end-to-end against the real, built @sektek/generator-base and
// @sektek/generator-js dist/ — this is the real proof that their exports
// map resolves for an external consumer, not just for their own specs
// running through tsx against source.
const EXPECTED_NAMESPACES = [
  '@sektek/base:app',
  '@sektek/base:editorconfig',
  '@sektek/base:gitconfig',
  '@sektek/base:readme',
  '@sektek/base:devcontainer',
  '@sektek/base:workspace',
  '@sektek/js:app',
  '@sektek/js:base-package',
  '@sektek/js:gitconfig',
  '@sektek/js:typescript',
  '@sektek/js:eslint',
  '@sektek/js:prettier',
  '@sektek/js:mocha',
  '@sektek/js:workspace',
];

describe('registry', function () {
  it('contains exactly the expected namespaces', function () {
    expect(REGISTRY.map(entry => entry.namespace)).to.have.members(
      EXPECTED_NAMESPACES,
    );
    expect(REGISTRY).to.have.lengthOf(EXPECTED_NAMESPACES.length);
  });

  it('resolves every namespace to a path that exists on disk', function () {
    for (const { namespace, path } of REGISTRY) {
      expect(existsSync(path), `${namespace} -> ${path}`).to.be.true;
    }
  });

  describe('registerAll', function () {
    it('registers every entry with the environment, by path and namespace', function () {
      const register = sinon.stub();
      const env = { register } as unknown as Environment;

      registerAll(env);

      expect(register.callCount).to.equal(REGISTRY.length);
      for (const { namespace, path } of REGISTRY) {
        expect(
          register.calledWithExactly(path, { namespace }),
          `expected registerAll to call register(${path}, { namespace: '${namespace}' })`,
        ).to.be.true;
      }
    });
  });
});
