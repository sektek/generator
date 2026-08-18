import { BaseFeatures } from '../../lib/types/base-features.js';
import { BaseGenerator } from '../../lib/base-generator.js';
import { BaseOptions } from '../../lib/types/base-options.js';

const DEFAULT_FEATURES: Partial<BaseFeatures> = {
  unique: true,
};

const ENTRYPOINT_TEMPLATES = {
  'index.js.ejs': 'index.js',
  'index.spec.js.ejs': 'index.spec.js',
};

export class BasePackageGenerator extends BaseGenerator<
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

  taskWriting() {
    const { language, author, license, private: isPrivate } = this.options;

    this.fs.copyTpl(
      this.templatePath('package.json.ejs'),
      this.destinationPath('package.json'),
      {
        packageName: this.packageName,
        projectName: this.appname,
        projectDescription: this.description,
        entryPoint: language === 'typescript' ? 'dist/index.js' : 'index.js',
        license,
        privatePackage: isPrivate,
        author,
      },
    );

    if (language !== 'typescript') {
      Object.entries(ENTRYPOINT_TEMPLATES).forEach(
        ([template, destination]) => {
          this.fs.copyTpl(
            this.templatePath(template),
            this.destinationPath(destination),
            { projectName: this.appname },
          );
        },
      );
    }
  }

  get packageName() {
    const prefix = this.options.packageScope
      ? `@${this.options.packageScope}/`
      : '';
    return `${prefix}${this.appname}`;
  }
}

export default BasePackageGenerator;
