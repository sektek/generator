import { ProviderComponent } from '@sektek/utility-belt';

/**
 * A self-contained, opt-in behavior a `Prompt` can declare, independent of
 * its `type`/rendered component. Each variant carries whatever config it
 * needs — `reloadable`'s `provider` is necessarily per-prompt, `clearable`'s
 * `value` defaults to `undefined` and is only overridden when a prompt
 * needs a different cleared value.
 */
export type PromptCapability =
  | { type: 'clearable'; value?: unknown }
  | { type: 'reloadable'; provider: ProviderComponent<unknown> };

/**
 * Shared `clearable` capability for the common case (clears to `undefined`,
 * no per-prompt config needed) — reference this rather than constructing a
 * fresh `{ type: 'clearable' }` each time. A prompt needing a different
 * cleared value builds its own instead of reusing this one.
 */
export const clearable: PromptCapability = { type: 'clearable' };
