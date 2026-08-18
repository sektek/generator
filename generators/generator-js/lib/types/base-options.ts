import { CoreOptions } from '@sektek/generator';

export type BaseOptions = CoreOptions & {
  language: string;
  packageScope?: string;
  author?: string;
  license?: string;
  private?: boolean;
};
