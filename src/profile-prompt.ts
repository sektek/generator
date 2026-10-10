import { PromptBuilder } from './prompt-builder.js';

/**
 * The shared Profile prompt — import this rather than declaring a fresh
 * `profile` prompt, so every consumer (e.g. `devcontainer`, `workspace`)
 * resolves to the same prompt identity and gets deduped/asked once.
 */
export const profilePrompt = new PromptBuilder().create({
  name: 'profile',
  type: 'text',
  label: 'Profile',
  provider: () => 'default',
});
