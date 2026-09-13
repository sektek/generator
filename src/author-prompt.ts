import { PromptBuilder } from './prompt-builder.js';

/**
 * The shared Author prompt — import this rather than declaring a fresh
 * `author` prompt, so every consumer (e.g. `base-package`, `license`)
 * resolves to the same prompt identity and gets deduped/asked once.
 */
export const authorPrompt = new PromptBuilder().create({
  name: 'author',
  type: 'text',
  message: 'Author',
});
