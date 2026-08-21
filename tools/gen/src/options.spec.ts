import { expect } from 'chai';

import { resolve } from './options.js';

// Nothing in the real @sektek/base:*/@sektek/js:* schema is both required
// and default-less today (language is the closest candidate, and it
// resolves via a default instead of ever throwing), so the required-field
// error path is exercised against a namespace that doesn't match either
// real family, which schemaFor falls back to CORE_OPTIONS for — sufficient
// here since resolve()'s validation only cares about the resolved schema,
// not which namespace produced it.

describe('resolve', function () {
  it('fills in defaults when no flags are given', function () {
    const resolved = resolve('@sektek/base:app', {});

    expect(resolved).to.deep.equal({
      namespace: 'sektek',
      profile: 'default',
      description: undefined,
    });
  });

  it('lets a given flag override its default', function () {
    const resolved = resolve('@sektek/base:app', { namespace: 'acme' });

    expect(resolved.namespace).to.equal('acme');
    expect(resolved.profile).to.equal('default');
  });

  it('throws one aggregated error listing every missing required option', function () {
    expect(() =>
      resolve('@sektek/base:app', {}, [
        {
          key: 'apiKey',
          flag: '--api-key <value>',
          prompt: 'API key',
          kind: 'text',
          required: true,
        },
        {
          key: 'apiSecret',
          flag: '--api-secret <value>',
          prompt: 'API secret',
          kind: 'text',
          required: true,
        },
      ]),
    ).to.throw('Missing required option(s): apiKey, apiSecret');
  });
});
