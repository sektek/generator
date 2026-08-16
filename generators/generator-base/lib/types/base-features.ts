// False positive: eslint-plugin-import doesn't follow the export */export
// type* chain through @sektek/generator's dist/index.d.ts ->
// dist/src/types/index.d.ts -> core-features.d.ts. tsc resolves this fine.
// eslint-disable-next-line import/named
import { CoreFeatures } from '@sektek/generator';

export type BaseFeatures = CoreFeatures & {};
