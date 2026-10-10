import { PromptBuilder } from './prompt-builder.js';

/**
 * The shared Description prompt — import this rather than declaring a fresh
 * `description` prompt, so every consumer (e.g. `readme`, `base-package`)
 * resolves to the same prompt identity and gets deduped/asked once.
 */
export const descriptionPrompt = new PromptBuilder().create({
  name: 'description',
  type: 'text',
  label: 'Project description',
  provider: () => undefined,
});
