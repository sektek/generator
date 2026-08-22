import { expect } from 'chai';

import { choicesFor, pendingSpecs } from './wizard-steps.js';
import type { OptionSpec } from './schema.js';

const textSpec: OptionSpec = {
  key: 'description',
  flag: '--description <value>',
  prompt: 'Project description',
  kind: 'text',
};

const selectSpec: OptionSpec = {
  key: 'language',
  flag: '--language <value>',
  prompt: 'Language',
  kind: 'select',
  choices: ['javascript', 'typescript'],
  default: 'javascript',
};

const booleanSpec: OptionSpec = {
  key: 'private',
  flag: '--no-private',
  prompt: 'Private package?',
  kind: 'boolean',
  default: true,
};

describe('wizard-steps', function () {
  describe('pendingSpecs', function () {
    it('returns every spec when seed is empty', function () {
      expect(pendingSpecs([textSpec, selectSpec], {})).to.deep.equal([
        textSpec,
        selectSpec,
      ]);
    });

    it('skips a spec whose key is already in seed', function () {
      expect(
        pendingSpecs([textSpec, selectSpec], { description: 'already set' }),
      ).to.deep.equal([selectSpec]);
    });

    it('does not skip a spec seeded with undefined', function () {
      expect(
        pendingSpecs([textSpec], { description: undefined }),
      ).to.deep.equal([textSpec]);
    });
  });

  describe('choicesFor', function () {
    it('maps a select spec into label/value pairs', function () {
      expect(choicesFor(selectSpec)).to.deep.equal([
        { label: 'javascript', value: 'javascript' },
        { label: 'typescript', value: 'typescript' },
      ]);
    });

    it('returns a synthetic Yes/No choice list for a boolean spec', function () {
      expect(choicesFor(booleanSpec)).to.deep.equal([
        { label: 'Yes', value: true },
        { label: 'No', value: false },
      ]);
    });

    it('throws for a text spec', function () {
      expect(() => choicesFor(textSpec)).to.throw(/only supports/);
    });
  });
});
