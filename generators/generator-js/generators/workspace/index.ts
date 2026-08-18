import '../eslint/index.js';
import '../gitconfig/index.js';

import { BaseConfig } from '../../lib/types/base-config.js';
import { BaseFeatures } from '../../lib/types/base-features.js';
import { BaseGenerator } from '../../lib/base-generator.js';
import { BaseOptions } from '../../lib/types/base-options.js';

const DEFAULT_FEATURES: Partial<BaseFeatures> = {
  unique: true,
};

const CONFIG_TEMPLATES = {
  'nx.json.ejs': 'nx.json',
  'mocharc.cjs.ejs': '.mocharc.cjs',
  'npmrc.ejs': '.npmrc',
};

const TS_TEMPLATES = {
  'tsconfig.json.ejs': 'tsconfig.json',
  'tsconfig.build.json.ejs': 'tsconfig.build.json',
};

const WORKSPACE_DIRS = ['apps', 'libs', 'tools'];

export const BUILD_SCRIPT = 'nx run-many --target build';

export class WorkspaceGenerator extends BaseGenerator<
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

  // @sektek/base:workspace fully writes .vscode/settings.json; our own
  // taskWriting below extendJSON-merges mocha keys into that same file, so
  // base:workspace's whole chain must be queued before ours.
  async beforeQueue() {
    await this.composeWith('@sektek/base:workspace', this.options, true);
  }

  async taskInitializing() {
    await this.composeWith('gitconfig', this.options, true);
    await this.composeWith('eslint', this.options, true);
  }

  async taskDefault() {
    // eslint/prettier supply their own devDependencies via
    // writeDependencies() — don't duplicate; only add what's specific to
    // the workspace root.
    await this.addDevDependency('c8');
    await this.addDevDependency('mocha');
    await this.addDevDependency('nx');

    if (this.options.language === 'typescript') {
      await this.addDevDependency('typescript');
      await this.addDevDependency('tsx');
    }
  }

  taskWriting() {
    const { language, author, license, private: isPrivate } = this.options;

    // Full package.json write first — queued at our own instantiation,
    // before the composeWith calls above execute, so it always lands before
    // eslint/prettier's later extendJSON merges.
    this.fs.copyTpl(
      this.templatePath('package.json.ejs'),
      this.destinationPath('package.json'),
      {
        projectName: this.appname,
        author,
        license,
        privatePackage: isPrivate,
      },
    );

    Object.entries(CONFIG_TEMPLATES).forEach(([template, destination]) => {
      this.fs.copyTpl(
        this.templatePath(template),
        this.destinationPath(destination),
        {},
      );
    });

    if (language === 'typescript') {
      Object.entries(TS_TEMPLATES).forEach(([template, destination]) => {
        this.fs.copyTpl(
          this.templatePath(template),
          this.destinationPath(destination),
          {},
        );
      });
    }

    WORKSPACE_DIRS.forEach(dir => {
      this.fs.write(this.destinationPath(`${dir}/.gitkeep`), '');
    });

    this.fs.extendJSON(this.destinationPath('package.json'), {
      scripts: {
        build: BUILD_SCRIPT,
      },
    });

    // .vscode/settings.json (written by @sektek/base:workspace) has JSONC
    // comments (a commented-out sample sqltools connection) — valid for VS
    // Code, but extendJSON's strict JSON.parse chokes on them. Insert these
    // keys textually instead, right after the opening brace, rather than
    // merging as JSON.
    const settingsPath = this.destinationPath('.vscode/settings.json');
    const settings = this.fs.read(settingsPath) ?? '';
    this.fs.write(
      settingsPath,
      settings.replace(
        /^\{\n/,
        '{\n' +
          '  "mochaExplorer.esmLoader": true,\n' +
          '  "mochaExplorer.nodeArgv": ["--import=tsx/esm"],\n',
      ),
    );

    this.writeDependencies();
  }
}

export default WorkspaceGenerator;
