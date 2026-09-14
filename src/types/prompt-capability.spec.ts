import { expect } from 'chai';

import { clearable } from './prompt-capability.js';

describe('clearable', function () {
  it('is the clearable capability with no configured value', function () {
    expect(clearable).to.deep.equal({ type: 'clearable' });
  });

  it('is frozen', function () {
    expect(Object.isFrozen(clearable)).to.be.true;
  });
});
