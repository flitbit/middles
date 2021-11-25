import { AssertionError } from 'assert';

const $middleware = Symbol('middleware');
const $prepared = Symbol('prepared');

export type SyncMiddleware<T> = (it: T) => T;
export type AsyncMiddleware<T> = (it: T) => Promise<T>;
export type Middleware<T> = SyncMiddleware<T> | AsyncMiddleware<T>;
export type Final<T, R> = (it: T) => R;
export type AsyncFinal<T, R> = (it: T) => Promise<R>;

type Step<T> = [boolean, Middleware<T>];

function prepareAsyncPipe<T>(middles: Step<T>[]): string {
  let body = `
return (async () => {
  let res = item;
  `;
  let i = -1;
  const len = middles.length;
  while (++i < len) {
    if (middles[i][0]) {
      body += `
  res = await middles[${i}](res);
`;
    } else {
      body += `
  res = middles[${i}](res);
`;
    }
  }
  return (
    body +
    `
  return res;
})();
`
  );
}
function preparePipe<T>(middles: Step<T>[]): string {
  let body = `
let res = item;
  `;
  let i = -1;
  const len = middles.length;
  while (++i < len) {
    body += `
res = middles[${i}](res);
`;
  }
  return (
    body +
    `
return res;
`
  );
}

type Prepared<T> = (item: T, middles: Middleware<T>[]) => T | Promise<T>;

/**
 * Utility class for composing and executing simple middleware pipelines.
 */
export class Pipeline<T> {
  private [$middleware]: Step<T>[];
  private [$prepared]: [Prepared<T>, Middleware<T>[]];
  public isAsync = false;

  /**
   * Prepares a middleware function from the pipeline's steps.
   * @returns An optimized middleware function; primarily from unrolling loops.
   */
  private prepared(): [Prepared<T>, Middleware<T>[]] {
    if (!this[$prepared]) {
      const middles = this[$middleware]
        ? this[$middleware].map((it) => it[1])
        : [];
      this[$prepared] = [
        new Function(
          'item',
          'middles',
          this.isAsync
            ? prepareAsyncPipe<T>(this[$middleware] || [])
            : preparePipe(this[$middleware] || []),
        ) as Prepared<T>,
        middles,
      ];
    }
    return this[$prepared];
  }

  /**
   * Adds a new middleware to the pipeline, returning a new immutable instance.
   * @param middleware one or more middleware
   * @returns an new pipeline that includes the specified middleware(s)
   */
  add(...middleware: SyncMiddleware<T>[]): Pipeline<T> {
    const pipe = this[$middleware] ? this[$middleware].slice() : [];
    for (const m of middleware) {
      pipe.push([false, m]);
    }
    const res = new Pipeline<T>();
    res[$middleware] = pipe;
    res.isAsync = this.isAsync;
    return res;
  }

  /**
   * Adds a new middleware to the pipeline, returning a new immutable instance.
   * @param middleware one or more middleware
   * @returns an new pipeline that includes the specified middleware(s)
   */
  addAsync(...middleware: AsyncMiddleware<T>[]): Pipeline<T> {
    const pipe = this[$middleware] ? this[$middleware].slice() : [];
    for (const m of middleware) {
      pipe.push([true, m]);
    }
    const res = new Pipeline<T>();
    res[$middleware] = pipe;
    res.isAsync = true;
    return res;
  }

  /**
   * Processes the specified item successively using each middleware function in the pipeline
   * @param item the item to be processed by the pipeline
   * @param final optional Final function that may transform the result
   * @returns the result of middleware processing, or if a final function is specified, the transformed result
   * @throws AssertionError if an asynchronous middleware was added to the pipeline
   * @throws AssertionError if final is specified as an invalid type
   * @throws an error if thrown by any middleware during processing
   */
  push<R>(item: T, final?: Final<T, R>): T | R {
    if (this.isAsync)
      throw new AssertionError({
        message:
          '.isAsync must be false, pipeline has async middleware; must use .pushAsync() instead.',
        expected: false,
        actual: true,
      });
    if (final && typeof final !== 'function') {
      throw new AssertionError({
        message:
          'final (function) must be a function with signature like Final<T, R>(item: T) => R',
        expected: 'function',
        actual: typeof final,
      });
    }
    const [pipe, middles] = this.prepared();
    const it = pipe(item, middles) as T;
    return final ? final(it) : it;
  }

  /**
   * Processes the specified item successively using each middleware function in the pipeline
   * @param item the item to be processed by the pipeline
   * @param final optional Final function that may transform the result or rejects if an error is thrown during processing
   * @throws AssertionError if final is specified as an invalid type
   * @throws an error if thrown by any middleware during processing
   */
  async pushAsync<R>(item: T, final?: AsyncFinal<T, R>): Promise<T | R> {
    if (final && typeof final !== 'function') {
      throw new AssertionError({
        message:
          'final (function) must be a function with signature like AsyncFinal<T, R>(item: T) => Promise<R>',
        expected: 'function',
        actual: typeof final,
      });
    }
    const [pipe, middles] = this.prepared();
    const it = (await pipe(item, middles)) as T;
    return final ? await final(it) : it;
  }
}
