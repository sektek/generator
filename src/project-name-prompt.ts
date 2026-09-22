import { PromptBuilder } from './prompt-builder.js';
import { PromptContext } from './types/prompt-context.js';
import { randomProjectName } from './project-name/index.js';

/**
 * The prefix source for a fresh generated name, in priority order:
 * `configDefaults.projectName` (an explicit, hand-set `gen.config.*`
 * override) first, then `workspace?.name` (the ancestor workspace's
 * `package.json` name, filesystem-detected by `tools/gen`'s
 * `findWorkspaceRoot()`). `undefined` when neither applies — a plain
 * generated name with no prefix.
 *
 * @param context - This run's `PromptContext`.
 * @returns The prefix to prepend, if any.
 */
function prefixFor(context: PromptContext): string | undefined {
  const { projectName } = context.configDefaults;
  if (typeof projectName === 'string' && projectName !== '') {
    return projectName;
  }
  return context.workspace?.name;
}

// The same reference is reused for both `provider` and the `reloadable`
// capability below, so a ctrl+R reload draws from the exact same generator
// this prompt's own default does.
const generateProjectName = (context: PromptContext): string => {
  const prefix = prefixFor(context);
  return prefix ? `${prefix}-${randomProjectName()}` : randomProjectName();
};

/**
 * The shared project-name prompt — a random `adjective-noun` default,
 * reloadable (ctrl+R) via the same generator.
 */
export const projectNamePrompt = new PromptBuilder().create({
  name: 'projectName',
  type: 'text',
  label: 'Project name',
  provider: generateProjectName,
  capabilities: [{ type: 'reloadable', provider: generateProjectName }],
});
