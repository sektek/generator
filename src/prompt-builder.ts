import { allOf } from '@sektek/utility-belt';

import { Prompt, PromptInit } from './types/prompt.js';

/**
 * Builds `Prompt`s, filling in a default for every field beyond
 * `name`/`type`/`message`. Not backed by utility-belt's `ObjectBuilder` the
 * way synaptik's `EventBuilder` is: `ObjectBuilder`'s default-filling
 * treats a Function override as something to invoke immediately, but
 * `provider`/`includePrompt` need to be stored as real functions and
 * invoked later, by the wizard — reusing that merge behavior would
 * silently break every prompt that sets one of these fields.
 */
export class PromptBuilder {
  #seed?: Prompt;

  constructor(seed?: Prompt) {
    this.#seed = seed;
  }

  /**
   * Seeds a new builder from an existing prompt, so `create()` can extend
   * it rather than build one from scratch.
   *
   * @param prompt - The prompt to seed from.
   * @returns A new builder whose `create()` defaults to `prompt`'s fields.
   */
  from(prompt: Prompt): PromptBuilder {
    return new PromptBuilder(prompt);
  }

  /**
   * Builds a `Prompt`, filling in a default for any field left unset — the
   * seed prompt's own value (see `from()`), if one exists, otherwise a
   * built-in default. `includePrompt` is the one exception: when both the
   * seed and `init` supply one, the result requires both (an
   * `AllPredicate`) rather than `init`'s replacing the seed's.
   *
   * @param init - The fields to set; anything omitted falls back to the seed or a built-in default.
   * @returns The resolved prompt.
   */
  create(init: PromptInit = {}): Prompt {
    const seed = this.#seed;
    const name = init.name ?? seed?.name;
    const type = init.type ?? seed?.type;
    const message = init.message ?? seed?.message;

    if (!name || !type || !message) {
      throw new Error(
        'PromptBuilder.create() requires name, type, and message, either directly or from a seed prompt (see from()).',
      );
    }

    return {
      name,
      type,
      message,
      provider: init.provider ?? seed?.provider ?? (() => undefined),
      includePrompt: this.#resolveIncludePrompt(init, seed),
      capabilities: init.capabilities ?? seed?.capabilities ?? [],
    };
  }

  #resolveIncludePrompt(init: PromptInit, seed?: Prompt) {
    if (init.includePrompt && seed?.includePrompt) {
      return allOf(seed.includePrompt, init.includePrompt);
    }
    return init.includePrompt ?? seed?.includePrompt ?? (() => true);
  }
}
