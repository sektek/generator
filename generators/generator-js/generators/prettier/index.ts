import { BaseConfig } from '../../lib/types/base-config.js';
import { BaseFeatures } from '../../lib/types/base-features.js';
import { BaseGenerator } from '../../lib/base-generator.js';
import { BaseOptions } from '../../lib/types/base-options.js';

const DEFAULT_FEATURES: Partial<BaseFeatures> = {
  unique: true,
};

const TEMPLATES = {
  'prettierrc.js': '.prettierrc.js',
  prettierignore: '.prettierignore',
};

export class PrettierGenerator extends BaseGenerator<
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
    await this.addDevDependency('prettier');
    await this.addDevDependency('@sektek/prettier-config');
  }

  taskWriting() {
    Object.entries(TEMPLATES).forEach(([template, destination]) => {
      this.fs.copyTpl(
        this.templatePath(`${template}.ejs`),
        this.destinationPath(destination),
        { projectName: this.appname },
      );
    });

    this.writeDependencies();
  }
}

export default PrettierGenerator;
