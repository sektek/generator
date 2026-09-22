/**
 * Argument passed to a `Prompt`'s `provider`/`includePrompt`. Still expected
 * to grow further as the rest of the prompting system gets built.
 */
export type PromptContext = {
  /** Answers collected so far in this run. */
  answers: Record<string, unknown>;
  /** Option values supplied via CLI flags for this run. */
  flagsGiven: Record<string, unknown>;
  /**
   * Values resolved from `gen.config.*` files (`resolveConfigDefaults()`'s
   * output) — manual, explicit overrides a user hand-set. Populated by
   * `tools/gen` at the point it already computes this for the rest of a
   * run's option resolution; not something a `Prompt` computes itself.
   */
  configDefaults: Record<string, unknown>;
  /**
   * The ancestor workspace this run was invoked inside, if any — detected
   * from a `package.json` `workspaces` entry matching the target
   * generator's `destinationMode().subdir` (`tools/gen`'s
   * `findWorkspaceRoot()`). Distinct from `configDefaults`: this is
   * filesystem-detected, not something a user configures directly.
   * `undefined` when no matching workspace was found, or the target
   * generator has no `subdir` to match against.
   */
  workspace?: { root: string; name: string };
};
