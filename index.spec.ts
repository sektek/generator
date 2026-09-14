import { expect } from 'chai';

import * as generator from './index.js';

describe('@sektek/generator public barrel', function () {
  it('exports deriveAuthorFromGitConfig', function () {
    expect(generator.deriveAuthorFromGitConfig).to.be.a('function');
  });

  it("does not export git-identity.ts's test-only reader setters", function () {
    expect(generator).not.to.have.property('setGitConfigReaderForTesting');
    expect(generator).not.to.have.property('resetGitConfigReaderForTesting');
  });
});
