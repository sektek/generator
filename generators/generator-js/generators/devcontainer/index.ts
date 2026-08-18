import { BaseConfig } from '../../lib/types/base-config.js';
import { BaseFeatures } from '../../lib/types/base-features.js';
import { BaseGenerator } from '../../lib/base-generator.js';
import { BaseOptions } from '../../lib/types/base-options.js';

const DEFAULT_FEATURES: Partial<BaseFeatures> = {
  unique: true,
};

export class DevcontainerGenerator extends BaseGenerator<
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

  // @sektek/base:devcontainer fully writes .devcontainer/Dockerfile; for the
  // 'default' profile our own taskWriting below overwrites it with the
  // JS/TS-specific image, so base's write must be queued before ours.
  async beforeQueue() {
    await this.composeWith('@sektek/base:devcontainer', this.options, true);
  }

  taskWriting() {
    if (this.options.profile !== 'workspace') {
      this.fs.copyTpl(
        this.templatePath('Dockerfile.ejs'),
        this.destinationPath('.devcontainer/Dockerfile'),
        {},
      );
    }
  }
}

export default DevcontainerGenerator;
