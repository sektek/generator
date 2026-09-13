/**
 * The type of a class constructor producing instances of `T`.
 *
 * `any[]`, deliberately, not `unknown[]`: constructor parameters are
 * checked contravariantly, so a `Constructor<T>` typed with `unknown[]`
 * rejects any real constructor with concrete parameter types (`unknown`
 * isn't assignable into a concrete parameter type the way `any` is) —
 * the same reason TypeScript's own constructor/mixin idiom always uses
 * `any[]` here.
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
export type Constructor<T> = new (...args: any[]) => T;
/* eslint-enable @typescript-eslint/no-explicit-any */
