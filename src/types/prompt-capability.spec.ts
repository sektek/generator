import { expect } from 'chai';

import { clearable } from './prompt-capability.js';

describe('clearable', function () {
  it('is the clearable capability with no configured value', function () {
    expect(clearable).to.deep.equal({ type: 'clearable' });
  });
});
