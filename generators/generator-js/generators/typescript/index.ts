import { BaseConfig } from '../../lib/types/base-config.js';
import { BaseFeatures } from '../../lib/types/base-features.js';
import { BaseGenerator } from '../../lib/base-generator.js';
import { BaseOptions } from '../../lib/types/base-options.js';

const DEFAULT_FEATURES: Partial<BaseFeatures> = {
  unique: true,
};

export const BUILD_SCRIPT = 'npx tsc -p tsconfig.build.json';

const CONFIG_TEMPLATES = {
  'tsconfig.json.ejs': 'tsconfig.json',
  'tsconfig.build.json.ejs': 'tsconfig.build.json',
};

const ENTRYPOINT_TEMPLATES = {
  'index.ts.ejs': 'index.ts',
  'index.spec.ts.ejs': 'index.spec.ts',
};

export class TypescriptGenerator extends BaseGenerator<
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
    await this.addDependency('tslib');
    await this.addDevDependency('typescript');
    await this.addDevDependency('@types/node');
  }

  taskWriting() {
    Object.entries(CONFIG_TEMPLATES).forEach(([template, destination]) => {
      this.fs.copyTpl(
        this.templatePath(template),
        this.destinationPath(destination),
        {},
      );
    });

    Object.entries(ENTRYPOINT_TEMPLATES).forEach(([template, destination]) => {
      this.fs.copyTpl(
        this.templatePath(template),
        this.destinationPath(destination),
        { projectName: this.appname },
      );
    });

    this.fs.extendJSON(this.destinationPath('package.json'), {
      scripts: {
        build: BUILD_SCRIPT,
      },
    });

    this.writeDependencies();
  }
}

export default TypescriptGenerator;
