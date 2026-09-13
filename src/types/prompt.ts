import { PredicateComponent, ProviderComponent } from '@sektek/utility-belt';

import { PromptCapability } from './prompt-capability.js';
import { PromptContext } from './prompt-context.js';

/**
 * A single question a generator wants answered before it runs, resolved by
 * `PromptBuilder` (see `@sektek/generator`'s `prompt-builder.ts`) rather
 * than constructed by hand — every field but `name`/`type`/`message` has a
 * builder-supplied default, so new fields can land later without touching
 * every existing prompt declaration.
 */
export type Prompt = {
  /** Identity used for dedup across generators, e.g. `author`, `js:dependencies`. */
  name: string;
  /** Resolves to an Ink component via gen's own type→component registry. */
  type: string;
  /** The question shown to the user. */
  message: string;
  /** Supplies this prompt's default/derived value. */
  provider: ProviderComponent<unknown, PromptContext>;
  /** Whether this prompt should be asked at all, given answers so far. */
  includePrompt: PredicateComponent<PromptContext>;
  capabilities: PromptCapability[];
};

/**
 * What a generator author actually supplies to `PromptBuilder.create()` —
 * every field but `name`/`type`/`message` is optional, filled in with a
 * default (or, when building `.from(prompt)`, the seed prompt's own value).
 */
export type PromptInit = Partial<Prompt>;
