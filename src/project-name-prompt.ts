import { PromptBuilder } from './prompt-builder.js';
import { randomProjectName } from './project-name/index.js';

// randomProjectName's own (optional, non-PromptContext-shaped) `random`
// parameter isn't structurally compatible with ProviderComponent's call
// signature, so it's wrapped rather than passed directly. The same
// reference is reused for both `provider` and the `reloadable` capability
// below, so a ctrl+R reload draws from the exact same generator this
// prompt's own default does.
const generateProjectName = (): string => randomProjectName();

/**
 * The shared project-name prompt — a random `adjective-noun` default,
 * reloadable (ctrl+R) via the same generator.
 */
export const projectNamePrompt = new PromptBuilder().create({
  name: 'projectName',
  type: 'text',
  message: 'Project name',
  provider: generateProjectName,
  capabilities: [{ type: 'reloadable', provider: generateProjectName }],
});
