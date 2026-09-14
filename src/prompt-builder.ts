import { PredicateComponent, allOf } from '@sektek/utility-belt';

import { Prompt } from './types/prompt.js';

/**
 * A function shaped like utility-belt's `allOf`/`anyOf`: combines several
 * predicates into one. `PromptBuilder`'s default (`allOf`) is right for a
 * generator layering its own extra condition onto a prompt it composes
 * with (narrowing — both must pass); `anyOf` is right when unifying two
 * already-built prompts that share a `name` (broadening — either consumer
 * wanting it is enough to ask).
 */
export type IncludePromptCombinator = <T>(
  ...predicates: PredicateComponent<T>[]
) => PredicateComponent<T>;

export type PromptBuilderOptions = {
  /** How to combine a seed's `includePrompt` with `init`'s, when both are set. */
  includeMode: IncludePromptCombinator;
};

/**
 * Builds `Prompt`s, filling in a default for every field beyond
 * `name`/`type`/`label`. Not backed by utility-belt's `ObjectBuilder` the
 * way synaptik's `EventBuilder` is: `ObjectBuilder`'s default-filling
 * treats a Function override as something to invoke immediately, but
 * `provider`/`includePrompt` need to be stored as real functions and
 * invoked later, by the wizard — reusing that merge behavior would
 * silently break every prompt that sets one of these fields.
 */
export class PromptBuilder {
  #includeMode: IncludePromptCombinator;
  #seed?: Prompt;

  constructor(
    options: PromptBuilderOptions = { includeMode: allOf },
    seed?: Prompt,
  ) {
    this.#includeMode = options.includeMode;
    this.#seed = seed;
  }

  /**
   * Seeds a new builder from an existing prompt, so `create()` can extend
   * it rather than build one from scratch. Carries over this builder's own
   * `includeMode`.
   *
   * @param prompt - The prompt to seed from.
   * @returns A new builder whose `create()` defaults to `prompt`'s fields.
   */
  from(prompt: Prompt): PromptBuilder {
    return new PromptBuilder({ includeMode: this.#includeMode }, prompt);
  }

  /**
   * Builds a `Prompt`, filling in a default for any field left unset — the
   * seed prompt's own value (see `from()`), if one exists, otherwise a
   * built-in default. `includePrompt` is the one exception: when both the
   * seed and `init` supply one, the result requires both by default (an
   * `AllPredicate`) — construct this builder with `{ includeMode: anyOf }`
   * to broaden instead — rather than `init`'s replacing the seed's.
   *
   * `name`/`type`/`label` are only actually required when there's no
   * seed — enforced at runtime, not in `init`'s type, since a stricter
   * type here would also reject `.from(prompt).create({})` omitting them
   * to inherit from the seed. See `PromptInit` for the no-seed-required
   * shape.
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
      provider: init.provider ?? seed?.provider ?? (() => undefined),
      includePrompt: this.#resolveIncludePrompt(init, seed),
      capabilities: init.capabilities ?? seed?.capabilities ?? [],
    };
  }

  #resolveIncludePrompt(init: Partial<Prompt>, seed: Prompt | undefined) {
    if (init.includePrompt && seed?.includePrompt) {
      return this.#includeMode(seed.includePrompt, init.includePrompt);
    }
    return init.includePrompt ?? seed?.includePrompt ?? (() => true);
  }
}
