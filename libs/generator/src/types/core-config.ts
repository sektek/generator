/**
 * yeoman-generator's Generator class constrains its config generic to
 * `Record<any, any>` — its own persisted-config Storage, backed by
 * .yo-rc.json — with no named base type exported for it, unlike
 * BaseOptions/BaseFeatures. This is our own floor type for that slot.
 */
export type CoreConfig = Record<string, unknown>;
