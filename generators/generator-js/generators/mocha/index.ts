import { BaseConfig } from '../../lib/types/base-config.js';
import { BaseFeatures } from '../../lib/types/base-features.js';
import { BaseGenerator } from '../../lib/base-generator.js';
import { BaseOptions } from '../../lib/types/base-options.js';

const DEFAULT_FEATURES: Partial<BaseFeatures> = {
  unique: true,
};

export const TEST_SCRIPT = 'mocha';
export const TEST_COVER_SCRIPT = 'c8 npm run test';
export const TEST_MIN_SCRIPT = 'mocha --config .mocharc.min.cjs';

export class MochaGenerator extends BaseGenerator<
  BaseConfig,
  BaseOptions,
  BaseFeatures
> {
  constructor(
    args: string[],
    options: BaseOptions,
    features: BaseFeatures = {} as BaseFeatures,
  ) {
    super(args, options, { ...DEFAULT_FEATURES, ...features });
  }

  async taskDefault() {
    const { language } = this.options;

    await this.addDevDependency('mocha');
    await this.addDevDependency('chai');
    await this.addDevDependency('chai-as-promised');
    await this.addDevDependency('sinon');
    await this.addDevDependency('sinon-chai');
    await this.addDevDependency('c8');

    if (language === 'typescript') {
      await this.addDevDependency('tsx');
      await this.addDevDependency('@types/mocha');
      await this.addDevDependency('@types/chai');
      await this.addDevDependency('@types/chai-as-promised');
      await this.addDevDependency('@types/sinon');
      await this.addDevDependency('@types/sinon-chai');
      // .nycrc.json (below) extends this config; declared explicitly here
      // rather than relying on it being hoisted in from somewhere else.
      await this.addDevDependency('@istanbuljs/nyc-config-typescript');
    }
  }

  taskWriting() {
    const { language } = this.options;

    this.fs.copyTpl(
      this.templatePath('mocharc.cjs.ejs'),
      this.destinationPath('.mocharc.cjs'),
      { language },
    );

    this.fs.copyTpl(
      this.templatePath('mocharc.min.cjs.ejs'),
      this.destinationPath('.mocharc.min.cjs'),
      {},
    );

    if (language === 'typescript') {
      this.fs.copyTpl(
        this.templatePath('nycrc.json.ejs'),
        this.destinationPath('.nycrc.json'),
        {},
      );
    }

    this.fs.extendJSON(this.destinationPath('package.json'), {
      scripts: {
        test: TEST_SCRIPT,
        'test:min': TEST_MIN_SCRIPT,
        'test:cover': TEST_COVER_SCRIPT,
      },
    });

    this.writeDependencies();
  }
}

export default MochaGenerator;
