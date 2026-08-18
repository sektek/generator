import { BaseConfig } from '../../lib/types/base-config.js';
import { BaseFeatures } from '../../lib/types/base-features.js';
import { BaseGenerator } from '../../lib/base-generator.js';
import { BaseOptions } from '../../lib/types/base-options.js';

const DEFAULT_FEATURES: Partial<BaseFeatures> = {
  unique: true,
};

export class GitConfigGenerator extends BaseGenerator<
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

  // Composed here rather than in taskInitializing: beforeQueue runs before
  // this generator's own task queue is built, so @sektek/base:gitconfig
  // (composed with immediately: true) writes .gitignore before our own
  // taskWriting appends to it below.
  async beforeQueue() {
    await this.composeWith('@sektek/base:gitconfig', this.options, true);
  }

  taskWriting() {
    this.fs.appendTpl(
      this.destinationPath('.gitignore'),
      this.fs.read(this.templatePath('gitignore.ejs')) ?? '',
      {},
    );
  }
}

export default GitConfigGenerator;
