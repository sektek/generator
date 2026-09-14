import {
  FallbackProvider,
  PredicateComponent,
  ProviderComponent,
  allOf,
} from '@sektek/utility-belt';

import { Prompt } from './types/prompt.js';

/**
 * A function shaped like utility-belt's `allOf`/`anyOf`. `allOf` (the
 * default) narrows; `anyOf` broadens — see `PromptBuilderOptions.includeMode`.
 */
export type IncludePromptCombinator = <T>(
  ...predicates: PredicateComponent<T>[]
) => PredicateComponent<T>;

/**
 * Combines a seed's `provider` with an overriding one. Unlike
 * `IncludePromptCombinator`, order matters: `base` is the seed's, `override`
 * is `init`'s.
 */
export type ProviderCombinator = <R, T>(
  base: ProviderComponent<R, T>,
  override: ProviderComponent<R, T>,
) => ProviderComponent<R, T>;

/**
 * `PromptBuilder`'s default `provideMode`: `override` wins outright, same as
 * every other field's plain-replace-on-override behavior.
 *
 * @param _base - The seed's provider (unused — `override` always wins).
 * @param override - The overriding provider.
 * @returns `override`, unchanged.
 */
export const replaceProvider: ProviderCombinator = (_base, override) =>
  override;

/**
 * A `provideMode` for when `override` is itself an *optional* provider —
 * one that may legitimately have nothing to add (return `undefined`) —
 * and `base` (the seed's provider) should supply the value when it does.
 * Backed by utility-belt's `FallbackProvider`, `override` first.
 *
 * @param base - The seed's provider, used as the fallback.
 * @param override - The optional provider tried first.
 * @returns A `Provider` trying `override`, then falling back to `base`.
 */
export const fallbackProvider: ProviderCombinator = (base, override) =>
  new FallbackProvider({ provider: override, defaultValueProvider: base });

export type PromptBuilderOptions = {
  /** How to combine a seed's `includePrompt` with `init`'s, when both are set. Defaults to `allOf`. */
  includeMode?: IncludePromptCombinator;
  /** How to combine a seed's `provider` with `init`'s, when both are set. Defaults to plain replace. */
  provideMode?: ProviderCombinator;
};

/**
 * Builds `Prompt`s, filling in a default for every field beyond
 * `name`/`type`/`label`.
 */
export class PromptBuilder {
  #includeMode: IncludePromptCombinator;
  #provideMode: ProviderCombinator;
  #seed?: Prompt;

  constructor(options: PromptBuilderOptions = {}, seed?: Prompt) {
    this.#includeMode = options.includeMode ?? allOf;
    this.#provideMode = options.provideMode ?? replaceProvider;
    this.#seed = seed;
  }

  /**
   * Seeds a new builder from an existing prompt, so `create()` can extend
   * it rather than build one from scratch. Carries over this builder's own
   * `includeMode`/`provideMode`.
   *
   * @param prompt - The prompt to seed from.
   * @returns A new builder whose `create()` defaults to `prompt`'s fields.
   */
  from(prompt: Prompt): PromptBuilder {
    return new PromptBuilder(
      { includeMode: this.#includeMode, provideMode: this.#provideMode },
      prompt,
    );
  }

  /**
   * Builds a `Prompt`, filling in a default for any field left unset — the
   * seed prompt's own value (see `from()`), if one exists, otherwise a
   * built-in default. `includePrompt` and `provider` are the two
   * exceptions: when both the seed and `init` supply one, they're combined
   * per this builder's `includeMode`/`provideMode` (defaults: `allOf` and
   * plain-replace, respectively) rather than `init`'s replacing the seed's
   * outright.
   *
   * `name`/`type`/`label` are only actually required when there's no seed
   * (see `PromptInit`); `.from(prompt).create({})` can omit them.
   *
   * @param init - The fields to set; anything omitted falls back to the seed or a built-in default.
   * @returns The resolved prompt.
   */
  create(init: Partial<Prompt> = {}): Prompt {
    const seed = this.#seed;
    const name = init.name ?? seed?.name;
    const type = init.type ?? seed?.type;
    const label = init.label ?? seed?.label;

    if (!name || !type || !label) {
      throw new Error(
        'PromptBuilder.create() requires name, type, and label, either directly or from a seed prompt (see from()).',
      );
    }

    return {
      name,
      type,
      label,
      hint: init.hint ?? seed?.hint,
      provider: this.#resolveProvider(init, seed),
      includePrompt: this.#resolveIncludePrompt(init, seed),
      capabilities: init.capabilities ?? seed?.capabilities ?? [],
    };
  }

  #resolveProvider(init: Partial<Prompt>, seed: Prompt | undefined) {
    if (init.provider && seed?.provider) {
      return this.#provideMode(seed.provider, init.provider);
    }
    return init.provider ?? seed?.provider ?? (() => undefined);
  }

  #resolveIncludePrompt(init: Partial<Prompt>, seed: Prompt | undefined) {
    if (init.includePrompt && seed?.includePrompt) {
      return this.#includeMode(seed.includePrompt, init.includePrompt);
    }
    return init.includePrompt ?? seed?.includePrompt ?? (() => true);
  }
}
