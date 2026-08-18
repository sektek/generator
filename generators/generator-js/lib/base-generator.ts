import { CoreGenerator } from '@sektek/generator';
import latestVersion from 'latest-version';

import { BaseFeatures } from './types/base-features.js';
import { BaseOptions } from './types/base-options.js';

const DEFAULT_OPTIONS: Partial<BaseOptions> = {
  packageScope: 'sektek',
  author: 'Edward Kelly <eddie@sektek.net>',
  license: 'UNLICENSED',
  private: true,
};

export class BaseGenerator<
  O extends BaseOptions = BaseOptions,
  F extends BaseFeatures = BaseFeatures,
> extends CoreGenerator<O, F> {
  package = '@sektek/js';
  dependencies: Record<string, string> = {};
  devDependencies: Record<string, string> = {};

  constructor(args: string | string[], options: O, features?: F) {
    super(args, { ...DEFAULT_OPTIONS, ...options }, features);
  }

  async addDependency(name: string, version?: string) {
    this.dependencies[name] = await this.#resolveVersion(name, version);
  }

  async addDevDependency(name: string, version?: string) {
    this.devDependencies[name] = await this.#resolveVersion(name, version);
  }

  async #resolveVersion(name: string, version?: string) {
    if (!version) {
      return await latestVersion(name);
    } else {
      return await latestVersion(name, { version });
    }
  }

  writeDependencies() {
    const { dependencies, devDependencies } = this;

    this.fs.extendJSON(this.destinationPath('package.json'), {
      dependencies,
      devDependencies,
    });
  }
}

export default BaseGenerator;
