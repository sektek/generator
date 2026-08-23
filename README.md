# @sektek/generator

Abstract base Yeoman generator with SEKTEK workspace-wide defaults.

Exports `CoreGenerator`, an abstract class extending `yeoman-generator`'s `Generator`. It applies
workspace-wide defaults (`namespace: 'sektek'`, `taskPrefix: 'task'`, `inheritTasks: true`), aliases
each built-in priority queue (`writing`, `initializing`, …) under a PascalCase `priorityName` so
lifecycle methods can be named `task<QueueName>` (e.g. `taskWriting`) instead of all-lowercase, and
overrides `composeWith` so generator names are namespaced under the calling generator's `package`
field unless already fully qualified.

## Installation

```sh
npm install @sektek/generator
```
