import '../devcontainer/index.js';
import '../editorconfig/index.js';
import '../gitconfig/index.js';
import '../readme/index.js';

import { BaseConfig } from '../../lib/types/base-config.js';
import { BaseFeatures } from '../../lib/types/base-features.js';
import { BaseGenerator } from '../../lib/base-generator.js';
import { BaseOptions } from '../../lib/types/base-options.js';

const VSCODE_TEMPLATES = {
  'settings.json.ejs': '.vscode/settings.json',
  'launch.json.ejs': '.vscode/launch.json',
};

const DEFAULT_FEATURES: Partial<BaseFeatures> = {
  unique: true,
};

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
    super(args, options, {
      ...DEFAULT_FEATURES,
      ...features,
    });
  }

  // readme's taskWriting fully (re)writes README.md; our own taskWriting
  // below appends the "Changes Required" checklist to it, so readme must
  // run before our own taskWriting method is even queued. editorconfig,
  // gitconfig, and devcontainer are composed here too for consistency, even
  // though their ordering relative to our own taskWriting doesn't matter.
  async beforeQueue() {
    await this.composeWith('editorconfig', this.options, true);
    await this.composeWith('gitconfig', this.options, true);
    await this.composeWith('readme', this.options, true);
    await this.composeWith(
      'devcontainer',
      { ...this.options, profile: 'workspace' },
      true,
    );
  }

  taskWriting() {
    const data = { projectName: this.appname };

    Object.entries(VSCODE_TEMPLATES).forEach(([template, destination]) => {
      this.fs.copyTpl(
        this.templatePath(template),
        this.destinationPath(destination),
        data,
      );
    });

    this.fs.appendTpl(
      this.destinationPath('README.md'),
      this.fs.read(this.templatePath('README-checklist.md.ejs')) ?? '',
      {},
    );
  }
}

export default WorkspaceGenerator;
