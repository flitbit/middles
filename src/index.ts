import * as assert from 'assert-plus';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { types } from 'util';

const $middleware = Symbol('middleware');

export type Middleware<T> = (it: T) => T | Promise<T>;
export type Final<T, R> = (it: T) => Promise<R>;

export class Pipeline<T> {
  private [$middleware]: Middleware<T>[];

  constructor(pipe?: Middleware<T>[]) {
    this[$middleware] = pipe || [];
  }

  add(middleware: Middleware<T> | Middleware<T>[]): Pipeline<T> {
    middleware = Array.isArray(middleware) ? middleware : [middleware];
    return new Pipeline(this[$middleware].concat(middleware));
  }

  async push<R>(item: T, final?: Final<T, R>): Promise<T | R> {
    assert.optionalFunc(final, 'final');
    const pipe = this[$middleware];
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
    return final ? await final(it as T) : it;
  }
}
