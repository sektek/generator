import { ProviderComponent } from '@sektek/utility-belt';

import { PromptContext } from './prompt-context.js';

/**
 * A self-contained, opt-in behavior a `Prompt` can declare, independent of
 * its `type`/rendered component. Each variant carries whatever config it
 * needs — `reloadable`'s `provider` is necessarily per-prompt, `clearable`'s
 * `value` defaults to `undefined` and is only overridden when a prompt
 * needs a different cleared value. Generic over `T`, the prompt's own value
 * type, so a capability can be typed to match (e.g. `PromptCapability<string>`
 * for a text prompt). `reloadable`'s `provider` is hardcoded to
 * `PromptContext`, mirroring `Prompt.provider` itself (also hardcoded, not
 * generic over context) — a ctrl+R reload needs the same context-aware
 * inputs (config defaults, workspace detection, ...) the prompt's own
 * default provider does.
 */
export type PromptCapability<T = unknown> =
  | { type: 'clearable'; value?: T }
  | { type: 'reloadable'; provider: ProviderComponent<T, PromptContext> };

/**
 * Shared `clearable` capability for the common case (clears to `undefined`,
 * no per-prompt config needed) — reference this rather than constructing a
 * fresh `{ type: 'clearable' }` each time. A prompt needing a different
 * cleared value builds its own instead of reusing this one.
 */
export const clearable = Object.freeze({
  type: 'clearable',
}) satisfies PromptCapability;
