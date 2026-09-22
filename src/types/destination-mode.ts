/**
 * Where a generator scaffolds into, decided once by `tools/gen` before
 * `Environment.run()` — never re-decided per composed sub-generator (see
 * `CoreGenerator.destinationMode()`'s own doc comment).
 */
export type DestinationMode =
  | { kind: 'inPlace' }
  | {
      kind: 'newProjectDir';
      /**
       * Preferred subdirectory to nest a freshly generated project under —
       * e.g. `'libs'`. Not unconditional: whether it actually applies is
       * decided centrally by `tools/gen`, based on whether the run is
       * inside a matching workspace. Absent (or no match found) falls back
       * to a bare `newProjectDir` with no subdirectory.
       */
      subdir?: string;
    };
