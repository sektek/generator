import { PredicateComponent, ProviderComponent } from '@sektek/utility-belt';

import { PromptCapability } from './prompt-capability.js';
import { PromptContext } from './prompt-context.js';

/**
 * A single question a generator wants answered before it runs, resolved by
 * `PromptBuilder` (see `@sektek/generator`'s `prompt-builder.ts`) rather
 * than constructed by hand — every field but `name`/`type`/`label` has a
 * builder-supplied default, so new fields can land later without touching
 * every existing prompt declaration.
 */
export type Prompt = {
  /** Identity used for dedup across generators, e.g. `author`, `js:dependencies`. */
  name: string;
  /** Resolves to an Ink component via gen's own type→component registry. */
  type: string;
  /** The question shown to the user. */
  label: string;
  /** Shown in the status bar alongside the key-instruction hints; omitted when there's nothing to add. */
  hint?: string;
  /** Supplies this prompt's default/derived value. */
  provider: ProviderComponent<unknown, PromptContext>;
  /** Whether this prompt should be asked at all, given answers so far. */
  includePrompt: PredicateComponent<PromptContext>;
  capabilities: PromptCapability[];
};

/**
 * What a generator author supplies to build a fresh `Prompt` from scratch —
 * `name`/`type`/`label` are the only fields with no sensible default, so
 * they're required here; everything else is optional and gets a
 * builder-supplied default. Not, itself, `PromptBuilder.create()`'s
 * parameter type: `create()` stays `Partial<Prompt>` so `.from(prompt)`
 * can omit `name`/`type`/`label` too, inheriting them from the seed —
 * this type only documents/constrains the no-seed case.
 */
export type PromptInit = {
  name: string;
  type: string;
  label: string;
} & Partial<Prompt>;
