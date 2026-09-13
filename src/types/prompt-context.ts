/**
 * Argument passed to a `Prompt`'s `provider`/`includePrompt`. Deliberately
 * minimal for now — expected to grow (config-file defaults, cwd, namespace)
 * as the rest of the prompting system gets built, not fully speculated
 * upfront.
 */
export type PromptContext = {
  /** Answers collected so far in this run. */
  answers: Record<string, unknown>;
  /** Option values supplied via CLI flags for this run. */
  flagsGiven: Record<string, unknown>;
};
