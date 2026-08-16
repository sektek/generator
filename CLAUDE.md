# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

`@sektek/workspace-generator` — an npm workspace monorepo that builds a Yeoman-based project
generator (`yo`) for scaffolding new SEKTEK projects. It is currently early-stage: several packages
(e.g. `generators/generator-js`) are stubs with empty `index.ts`. The repo nominally has Nx wired up
but Nx is intentionally not used here (see Workspace layout) — treat it as dead config, not tooling.

## Workspace layout

npm workspaces defined in the root `package.json`: `generators/*`, `libs/*`. Each package
is an independently versioned, independently built TypeScript module with its own `package.json`,
`tsconfig.json`/`tsconfig.build.json`, `.mocharc.cjs`, and `eslint.config.js` (mirroring the root
configs).

`nx.json` and the root `npm run build` (`nx run-many --target build`) are present but **do not use
Nx** — build and test per package instead (see Commands below). Dependency order when building by
hand: `libs/generator` first (everything else depends on it), then `libs/generator-test`, then
`generators/generator-base` and `generators/generator-js`.

- **`libs/generator`** (`@sektek/generator`) — the foundation. Exports `CoreGenerator`, an abstract
  class extending `yeoman-generator`'s `Generator`. It applies workspace-wide defaults
  (`namespace: 'sektek'`, `taskPrefix: 'task'`, `inheritTasks: true`), aliases each built-in queue
  (`writing`, `initializing`, …) under a PascalCase `priorityName` via `registerPriorities()` in its
  constructor so `task<QueueName>` methods can be PascalCase instead of all-lowercase (see Generator
  wiring conventions below), and overrides `composeWith` so that generator names are namespaced under
  `this.package` (e.g. calling `composeWith('editorconfig')` from a generator with
  `package = '@sektek/base'` resolves to `@sektek/base:editorconfig`) unless the name is already fully
  qualified.
- **`libs/generator-test`** (`@sektek/generator-test`) — thin wrapper around `yeoman-test`, exporting
  a shared `helper` (a `YeomanTest` instance) and re-exporting `result`. All generator specs run
  through this `helper`, not `yeoman-test` directly.
- **`generators/generator-base`** (`@sektek/generator-base`) — the actual base generator package
  installed as a `yo` generator. `BaseGenerator` (in `lib/base-generator.ts`) extends `CoreGenerator`
  and sets `package = '@sektek/base'`. Sub-generators live under `generators/<name>/index.ts`:
  - `app` — the entrypoint (`taskInitializing` composes `editorconfig`, `gitconfig`, and `readme` in
    sequence via `this.composeWith(name, options, true)`).
  - `editorconfig`, `gitconfig`, `readme` — each a small `taskWriting()` that copies EJS templates
    from its local `templates/` directory via `this.fs.copyTpl(this.templatePath(...), this.destinationPath(...), data)`.

  When adding a new sub-generator here, follow the existing pattern: extend `BaseGenerator<BaseOptions, BaseFeatures>`,
  set `DEFAULT_FEATURES = { unique: true }` merged with incoming features, implement lifecycle
  methods as `task<QueueName>` (e.g. `taskWriting`, `taskInitializing`) — this works because
  `CoreGenerator`'s default features set `taskPrefix: 'task'` and `inheritTasks: true`, and its
  constructor registers a PascalCase alias for each built-in queue (see Generator wiring conventions
  below). Register it in `app/index.ts`'s `taskInitializing` and add its import at the top of that
  file (side-effect import registering the sub-generator).
- **`generators/generator-js`** (`@sektek/generator-js`) — placeholder for a JS/TS project generator;
  not yet implemented.
- **`templates/template-ts`** — a template project skeleton (its own package.json/tsconfig/etc.),
  intended as the boilerplate a generator scaffolds out, not a package that's built/tested itself.
- **`third-party/`** — gitignored reference checkouts of `yeoman-generator` and `generator-jhipster`
  source, kept locally for reading how mature Yeoman generators are structured. Not part of the build.

## Generator wiring conventions

- Generator packages export a default class per sub-generator directory, matching Yeoman's
  `generators/<name>/index.js` discovery convention.
- Lifecycle/queue methods are named `task<QueueName>` — e.g. `taskWriting`, `taskInitializing`.
  yeoman-generator's `taskPrefix` matching is a literal `` `${taskPrefix}${priorityName}` ``
  concatenation with **no capitalization applied**, and the built-in priority names
  (`initializing`, `prompting`, `configuring`, `default`, `writing`, `transform`, `conflicts`,
  `install`, `end`) are all-lowercase — so without help, task methods would have to be named
  e.g. `taskwriting`. `CoreGenerator`'s constructor avoids that by calling `registerPriorities()`
  to alias each built-in queue under a PascalCase `priorityName` pointing at the same `queueName`
  (`PRIORITY_ALIASES` in `libs/generator/src/core-generator.ts`), so `taskWriting` is discovered and
  runs at the same point in the lifecycle a plain `taskwriting` would have — aliasing an
  already-registered `queueName` is a no-op (`Environment#addPriority`), not a second queue. If a
  method's case doesn't exactly match either the alias or the raw priority name, it's silently never
  discovered (no error at define time) and the generator throws `This Generator is empty. Add at
  least one method for it to run.` the moment it runs — that mismatch is easy to reintroduce, so
  double-check casing against `PRIORITY_ALIASES` when adding a new lifecycle method.
- `composeWith` calls generator names unqualified (e.g. `'editorconfig'`) and relies on the owning
  generator's `package` field for namespacing — don't hardcode the `@sektek/base:` prefix by hand.
- Templates for a sub-generator live in `generators/<name>/templates/*.ejs`, referenced via
  `this.templatePath('<file>.ejs')`.

## Code style

Imports are grouped into up to three blocks, separated by a blank line, in this order: Node built-ins
(`path`, `url`, …), then dependencies (npm packages and local workspace packages alike — e.g. `chai`
and `@sektek/generator-test` are the same block), then local relative imports (`./index.js`,
`../lib/foo.js`). Enforced by `import/order` (`groups: ['builtin', ['external', 'internal'],
['parent', 'sibling', 'index']]`, `newlines-between: 'always'`) in every package's `eslint.config.js`;
`sort-imports` (already configured with `allowSeparatedGroups: true`) alphabetizes by first imported
binding name within each block. Run the package's `lint` script (with `--fix` for prettier/import-order
issues) to check and fix.

## Commands

Run from the repo root unless noted. Do not use the root `npm run build` script or any `nx` command
(see note above) — build packages individually.

- **Build a single package:** `npm run build --workspace=<pkg>` (e.g.
  `npm run build --workspace=@sektek/generator`), or `cd` into the package and run `npx tsc -p tsconfig.build.json`
- **Build everything:** run the above for each package in dependency order — `libs/generator`,
  `libs/generator-test`, `generators/generator-base`, `generators/generator-js`.
- **Lint a package:** `cd <package-dir> && npm run lint` (there is no root-level lint script yet)
- **Run all tests:** tests are per-package (each has its own `.mocharc.cjs` and `test` script); run
  `cd <package-dir> && npm test`. Mocha config uses `tsx/esm` as the loader with BDD-style
  (`describe`/`it`) specs matched by `**/*.spec.[jt]s`.
- **Run a single test file:** `cd <package-dir> && npx mocha <path-to-file>.spec.ts`
- **Coverage:** `cd <package-dir> && npm run test:cover` (runs `c8 npm run test`)
- **Try the generator locally:** `bin/gen` (runs `npx yo`) after building, or via Docker: the root
  `Dockerfile` builds the whole workspace and sets `ENTRYPOINT ["gen"]`.

## Test conventions

Specs sit next to source as `*.spec.ts` and use `chai` (`expect`) + `@sektek/generator-test`'s shared
`helper.run(...)`. Invoke the generator under test by absolute path
(`helper.run(join(__dirname, 'index.js'))`), not by namespace or bare name — see Known gaps below for
why. This returns `{ generator, fs }`; assert `fs.exists(...)` for scaffolded files and `generator` for
the class instance. See `generators/generator-base/generators/*/index.spec.ts` for the pattern, and
`generators/generator-base/generators/app/index.spec.ts` for one that also composes sub-generators.

## Known gaps (don't be surprised)

- No root-level `lint` or `test` script — these are per-workspace only (see `TODO.md`: "Need to figure
  out how to test generators in TypeScript"). The only root script (`build`) shells out to Nx and
  should not be used — see Workspace layout.
- `generators/generator-js` and `generators/generator-base/index.ts` are empty stubs.
- `@sektek/generator-test`'s shared `helper` has nothing registered with it by default — a bare
  `helper.run('editorconfig')` or `helper.run('@sektek/base:editorconfig')` won't resolve. Specs invoke
  their own generator by absolute path (`join(__dirname, 'index.js')`); a spec that needs `composeWith`
  to actually resolve sibling namespaces (like `app`'s) must register them explicitly first via
  `.withGenerators([[path, { namespace }], ...])` — see `generators/generator-base/generators/app/index.spec.ts`.
  Registering a sub-generator by class reference instead of file path loses its on-disk location, which
  breaks `templatePath()`/`sourceRoot()` resolution — always register by path.
- **Cross-package changes to `libs/generator` (or any package other packages depend on) don't take
  effect for dependents until you rebuild it.** `generator-base` imports `@sektek/generator` through
  `node_modules/@sektek/generator`, which resolves via that package's `package.json` `exports` to its
  built `dist/`, not its TypeScript source — unlike a package's own `.spec.ts` files, which `tsx/esm`
  transforms live. Editing `libs/generator/src/*.ts` without running its `build` script first will
  silently leave dependents running the old compiled behavior; tests can pass or fail against stale
  logic with no indication anything is out of sync.
- `libs/generator` and `libs/generator-test` have no real test coverage yet — their specs are
  placeholders (`it('should be tested')`).
- `README.md`'s "Changes Required" section is a manual post-scaffold checklist for `.vscode/settings.json`
  (uncomment SQL connection, set name/database to the project name) — relevant when generating a new
  project from this generator, not when working in this repo itself.
- `@sektek/eslint-plugin` and `@sektek/prettier-config` are regular devDependencies (every
  `eslint.config.js`/`.prettierrc.js` in this repo is the same two-line wrapper importing them — see
  Code style), published to GitHub Packages rather than the public npm registry. `npm install` needs
  `@sektek:registry=https://npm.pkg.github.com` plus a `read:packages`-scoped token in `.npmrc`
  (`//npm.pkg.github.com/:_authToken=...`) or it 401s. There's no local vendored fallback for these
  anymore — they used to be checked out under `tools/eslint-plugin`/`tools/prettier-config` as npm
  workspace packages, but that's gone; `tools/` is unused now.
