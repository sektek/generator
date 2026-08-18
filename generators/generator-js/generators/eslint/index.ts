import '../prettier/index.js';

import { BaseConfig } from '../../lib/types/base-config.js';
import { BaseFeatures } from '../../lib/types/base-features.js';
import { BaseGenerator } from '../../lib/base-generator.js';
import { BaseOptions } from '../../lib/types/base-options.js';

const DEFAULT_FEATURES: Partial<BaseFeatures> = {
  unique: true,
};

const TEMPLATES = {
  'eslint.config.js.ejs': 'eslint.config.js',
};

export const LINT_SCRIPT = 'eslint . --cache';

export class EslintGenerator extends BaseGenerator<
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

  async taskInitializing() {
    await this.composeWith('prettier', this.options, true);
  }

  async taskDefault() {
    await this.addDevDependency('eslint');
    await this.addDevDependency('@sektek/eslint-plugin');
  }

  taskWriting() {
    const { language } = this.options;

    Object.entries(TEMPLATES).forEach(([template, destination]) => {
      this.fs.copyTpl(
        this.templatePath(template),
        this.destinationPath(destination),
        { plugin: language === 'typescript' ? 'typescript' : 'recommended' },
      );
    });

    this.fs.extendJSON(this.destinationPath('package.json'), {
      scripts: {
        lint: LINT_SCRIPT,
      },
    });

    this.writeDependencies();
  }
}

export default EslintGenerator;
