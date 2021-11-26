import { AssertionError } from 'assert';

const $processor = Symbol('processor');
const $prepared = Symbol('prepared');

/**
 * A function that processes items of type T, and return a result of type T.
 */
export type Processor<T> = (it: T) => T;
/**
 * A function that asynchronously processes items of type T, and return a result of type Promise<T>.
 */
export type AsyncProcessor<T> = (it: T) => Promise<T>;
export type ProcessorLike<T> = Processor<T> | AsyncProcessor<T>;

export type Final<T, R> = (it: T) => R;
export type AsyncFinal<T, R> = (it: T) => Promise<R>;

/**
 * @ignore
 */
type Step<T> = [boolean, ProcessorLike<T>];

function prepareAsyncPipe<T>(processors: Step<T>[]): string {
  let body = `
return (async () => {
  let res = item;
  `;
  let i = -1;
  const len = processors.length;
  while (++i < len) {
    if (processors[i][0]) {
      body += `
  res = await processors[${i}](res);
`;
    } else {
      body += `
  res = processors[${i}](res);
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
function preparePipe<T>(processors: Step<T>[]): string {
  let body = `
let res = item;
  `;
  let i = -1;
  const len = processors.length;
  while (++i < len) {
    body += `
res = processors[${i}](res);
`;
  }
  return (
    body +
    `
return res;
`
  );
}

/**
 * @ignore
 */
type Prepared<T> = (item: T, processors: ProcessorLike<T>[]) => T | Promise<T>;

/**
 * Utility class for composing and executing simple processing pipelines.
 */
export class Pipeline<T> {
  /**
   * @hidden
   */
  private [$processor]: Step<T>[];
  /**
   * @hidden
   */
  private [$prepared]: [Prepared<T>, ProcessorLike<T>[]];
  /**
   * Indicates whether the pipeline includes asynchronous processing.
   *
   * If `true`, items can only be pushed into the pipeline using the {@link pushAsync | .pushAsync() method}, otherwise, the pipeline is more efficiently invoked by the {@link push | .push() method}.
   */
  public isAsync = false;

  /**
   * Prepares an optimized processing function from the pipeline's processors.
   * @returns An processing function optimized by unrolling loops.
   */
  private prepared(): [Prepared<T>, ProcessorLike<T>[]] {
    if (!this[$prepared]) {
      const processors = this[$processor]
        ? this[$processor].map((it) => it[1])
        : [];
      this[$prepared] = [
        new Function(
          'item',
          'processors',
          this.isAsync
            ? prepareAsyncPipe<T>(this[$processor] || [])
            : preparePipe(this[$processor] || []),
        ) as Prepared<T>,
        processors,
      ];
    }
    return this[$prepared];
  }

  /**
   * Adds new synchronous processor to the pipeline, returning a new immutable instance.
   * @param processor one or more {@link Processor}
   * @returns an new pipeline that includes the specified processor(s)
   */
  use(...processor: Processor<T>[]): Pipeline<T> {
    const pipe = this[$processor] ? this[$processor].slice() : [];
    for (const m of processor) {
      pipe.push([false, m]);
    }
    const res = new Pipeline<T>();
    res[$processor] = pipe;
    res.isAsync = this.isAsync;
    return res;
  }

  /**
   * Adds a new processor to the pipeline, returning a new immutable instance.
   * @param processor one or more processor
   * @returns an new pipeline that includes the specified processor(s)
   */
  useAsync(...processor: AsyncProcessor<T>[]): Pipeline<T> {
    const pipe = this[$processor] ? this[$processor].slice() : [];
    for (const m of processor) {
      pipe.push([true, m]);
    }
    const res = new Pipeline<T>();
    res[$processor] = pipe;
    res.isAsync = true;
    return res;
  }

  /**
   * Processes the specified item successively using each processor function in the pipeline
   * @param item the item to be processed by the pipeline
   * @param final optional Final function that may transform the result
   * @returns the result of processor processing, or if a final function is specified, the transformed result
   * @throws AssertionError if an asynchronous processor was added to the pipeline
   * @throws AssertionError if final is specified as an invalid type
   * @throws an error if thrown by any processor during processing
   */
  push<R>(item: T, final?: Final<T, R>): T | R {
    if (this.isAsync)
      throw new AssertionError({
        message:
          '.isAsync must be false, pipeline has an async processor; must use .pushAsync() instead.',
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
    const [pipe, processors] = this.prepared();
    const it = pipe(item, processors) as T;
    return final ? final(it) : it;
  }

  /**
   * Processes the specified item successively using each processor function in the pipeline
   * @param item the item to be processed by the pipeline
   * @param final optional Final function that may transform the result or rejects if an error is thrown during processing
   * @throws AssertionError if final is specified as an invalid type
   * @throws an error if thrown by any processor during processing
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
    const [pipe, processors] = this.prepared();
    const it = (await pipe(item, processors)) as T;
    return final ? await final(it) : it;
  }
}
