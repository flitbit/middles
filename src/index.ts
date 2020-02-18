import * as assert from 'assert-plus';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { types } from 'util';

const $middleware = Symbol('middleware');
const $final = Symbol('final');

export type Middleware<T> = (it: T) => T | Promise<T>;
export type Final<T, R> = (it: T) => Promise<R>;

export class Pipeline<T, R> {
  private [$final]: Final<T, R>;
  private [$middleware]: Middleware<T>[];

  constructor(final: Final<T, R>, pipe?: Middleware<T>[]) {
    assert.ok(typeof final === 'function', 'final (Final) is required');
    this[$final] = final;
    this[$middleware] = pipe || [];
  }

  add(middleware: Middleware<T> | Middleware<T>[]): Pipeline<T, R> {
    middleware = Array.isArray(middleware) ? middleware : [middleware];
    return new Pipeline(this[$final], this[$middleware].concat(middleware));
  }

  async push(item: T): Promise<R> {
    const pipe = this[$middleware];
    const final = this[$final];
    let it: T | Promise<T> = item;
    if (pipe && pipe.length) {
      const len = pipe.length;
      let i = -1;
      while (++i < len) {
        try {
          it = pipe[i](it as T);
          if (types.isPromise(it)) {
            it = await it;
          }
        } catch (e) {
          return Promise.reject(e);
        }
      }
    }
    return await final(it as T);
  }
}
