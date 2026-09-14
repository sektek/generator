import { expect } from 'chai';

import { PromptCapability, clearable } from './prompt-capability.js';

describe('clearable', function () {
  it('is the clearable capability with no configured value', function () {
    expect(clearable).to.deep.equal({ type: 'clearable' });
  });

  it('is frozen', function () {
    expect(Object.isFrozen(clearable)).to.be.true;
  });

  it('rejects mutation at both the type level and at runtime', function () {
    expect(() => {
      // @ts-expect-error - clearable's inferred type is Readonly (via
      // `satisfies`, not a widening `: PromptCapability` annotation), so
      // this is a compile error too, not just a runtime throw.
      clearable.type = 'reloadable';
    }).to.throw(TypeError);
  });

  it('is usable as a PromptCapability<T> for any T, not just unknown', function () {
    const asString: PromptCapability<string> = clearable;
    const asNumber: PromptCapability<number> = clearable;

    expect(asString).to.equal(clearable);
    expect(asNumber).to.equal(clearable);
  });
});
