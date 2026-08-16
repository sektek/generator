# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

`@sektek/workspace-generator` — an npm workspace monorepo that builds a Yeoman-based project
generator (`yo`) for scaffolding new SEKTEK projects. It is currently early-stage: several packages
(e.g. `generators/generator-js`) are stubs with empty `index.ts`. The repo nominally has Nx wired up
but Nx is intentionally not used here (see Workspace layout) — treat it as dead config, not tooling.

## Workspace layout

npm workspaces defined in the root `package.json`: `generators/*`, `libs/*`, `tools/*`. Each package
is an independently versioned, independently built TypeScript module with its own `package.json`,
`tsconfig.json`/`tsconfig.build.json`, `.mocharc.cjs`, and `eslint.config.js` (mirroring the root
configs).

`nx.json` and the root `npm run build` (`nx run-many --target build`) are present but **do not use
Nx** — build and test per package instead (see Commands below). Dependency order when building by
hand: `libs/generator` first (everything else depends on it), then `libs/generator-test`, then
`generators/generator-base` and `generators/generator-js`.

- **`libs/generator`** (`@sektek/generator`) — the foundation. Exports `CoreGenerator`, an abstract
  class extending `yeoman-generator`'s `Generator`. It applies workspace-wide defaults
  (`namespace: 'sektek'`, `taskPrefix: 'task'`, `inheritTasks: true`) and overrides `composeWith` so
  that generator names are namespaced under `this.package` (e.g. calling `composeWith('editorconfig')`
  from a generator with `package = '@sektek/base'` resolves to `@sektek/base:editorconfig`) unless the
  name is already fully qualified.
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
  `CoreGenerator`'s default features set `taskPrefix: 'task'` and `inheritTasks: true`. Register it
  in `app/index.ts`'s `taskInitializing` and add its import at the top of that file (side-effect
  import registering the sub-generator).
- **`generators/generator-js`** (`@sektek/generator-js`) — placeholder for a JS/TS project generator;
  not yet implemented.
- **`tools/`** — vendored/local copies of `@sektek/eslint-plugin` and `@sektek/prettier-config` (each
  its own git repo, published independently). Root `eslint.config.js` and `.prettierrc.js` at every
  package level just import these.
- **`templates/template-ts`** — a template project skeleton (its own package.json/tsconfig/etc.),
  intended as the boilerplate a generator scaffolds out, not a package that's built/tested itself.
- **`third-party/`** — gitignored reference checkouts of `yeoman-generator` and `generator-jhipster`
  source, kept locally for reading how mature Yeoman generators are structured. Not part of the build.

## Generator wiring conventions

- Generator packages export a default class per sub-generator directory, matching Yeoman's
  `generators/<name>/index.js` discovery convention.
- Lifecycle/queue methods are *intended* to be named `task<QueueName>` (`CoreGenerator` sets
  `taskPrefix: 'task'`), but **every existing sub-generator gets this wrong and is currently broken**:
  yeoman-generator's `taskPrefix` matching does `` `${taskPrefix}${queueName}` `` against the raw,
  lowercase priority name (`writing`, `initializing`, …) — it does not capitalize. So it looks for a
  literal `taskwriting`, not the `taskWriting` these generators actually define. The mismatch means
  none of their lifecycle methods are ever discovered, and running them throws `This Generator is
  empty. Add at least one method for it to run.` (see `generators/generator-base/generators/gitconfig/index.spec.ts`
  failures). Until this is fixed, either rename methods to the fully-lowercase form (`taskwriting`) or
  fix the matching. The `QUEUES` constant in `libs/generator/src/core-generator.ts` looks like it was
  meant to register capitalized custom priorities but is unused dead code.
- `composeWith` calls generator names unqualified (e.g. `'editorconfig'`) and relies on the owning
  generator's `package` field for namespacing — don't hardcode the `@sektek/base:` prefix by hand.
- Templates for a sub-generator live in `generators/<name>/templates/*.ejs`, referenced via
  `this.templatePath('<file>.ejs')`.

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
`helper.run(...)`. For generator specs, `helper.run('<sub-generator-name>')` (or the fully-qualified
`'@sektek/base:<name>'`) returns `{ generator, fs }`; assert `fs.exists(...)` for scaffolded files and
`generator` for the class instance. See `generators/generator-base/generators/*/index.spec.ts` for the
pattern.

## Known gaps (don't be surprised)

- No root-level `lint` or `test` script — these are per-workspace only (see `TODO.md`: "Need to figure
  out how to test generators in TypeScript"). The only root script (`build`) shells out to Nx and
  should not be used — see Workspace layout.
- `generators/generator-js` and `generators/generator-base/index.ts` are empty stubs.
- **`generators/generator-base` is currently 7/8 tests failing** (only its own placeholder spec
  passes). Three separate causes, all in the sub-generator specs/sources, not the test runner:
  1. The `task<Xxx>` naming mismatch described above (`gitconfig` fails on this — "This Generator is
     empty").
  2. `readme/index.ts` never `export default`s `ReadmeGenerator`, so instantiating it throws
     `The generator doesn't provides a constructor`.
  3. `editorconfig/index.spec.ts` invokes generators by namespace/bare-name
     (`helper.run('@sektek/base:editorconfig')`, `helper.run('editorconfig')`), but `@sektek/generator-test`'s
     shared `helper` has no generators registered, so neither form resolves. `gitconfig`/`readme`'s specs
     work around this by passing an absolute path to their own `index.js`/`.ts` — follow that pattern for
     new specs until the shared helper gains real registration/lookup support.
- `libs/generator` and `libs/generator-test` have no real test coverage yet — their specs are
  placeholders (`it('should be tested')`).
- `README.md`'s "Changes Required" section is a manual post-scaffold checklist for `.vscode/settings.json`
  (uncomment SQL connection, set name/database to the project name) — relevant when generating a new
  project from this generator, not when working in this repo itself.
