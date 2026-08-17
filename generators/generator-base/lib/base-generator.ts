import { CoreGenerator } from '@sektek/generator';

import { BaseFeatures } from './types/base-features.js';
import { BaseOptions } from './types/base-options.js';

export class BaseGenerator<
  O extends BaseOptions = BaseOptions,
  F extends BaseFeatures = BaseFeatures,
> extends CoreGenerator<O, F> {
  package = '@sektek/base';

  constructor(args: string | string[], options: O, features?: F) {
    super(args, options, features);
  }
}

export default BaseGenerator;
