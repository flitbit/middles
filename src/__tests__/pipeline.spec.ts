import { AsyncFinal, Final, Pipeline } from '..';

describe('Pipeline', () => {
  describe('.ctor', () => {
    it('succeeds', () => {
      const pipe = new Pipeline<boolean>();
      expect(pipe).toBeTruthy();
    });
  });

  const click = (v: number): number => {
    return v + 1;
  };
  const clickp = async (v: number): Promise<number> => {
    return v + 1;
  };
  const boom = (v: number): number => {
    throw new Error(`boom ${v}`);
  };
  const boomp = (v: number): Promise<number> => {
    throw new Error(`boom ${v}`);
  };
  const inc = (v: number): number => {
    return v + 1;
  };
  const incp = async (n: number): Promise<number> => {
    return n + 1;
  };

  describe('.push()', () => {
    it('does not throw when no middleware', () => {
      const pipe = new Pipeline<boolean>();
      const res = pipe.push(true);
      expect(res).toBe(true);
    });

    it('calls single middleware (synchronous)', () => {
      const pipe = new Pipeline<number>().use(inc);
      const res = pipe.push(1);
      expect(res).toBe(2);
    });

    it('throws when any async middleware (synchronous)', () => {
      const pipe = new Pipeline<number>().use(inc).useAsync(incp);
      expect(() => {
        const res = pipe.push(1);
        expect(res).toBe(3);
      }).toThrow(
        'isAsync must be false, pipeline has an async processor; must use .pushAsync() instead.',
      );
    });
    it('calls all middleware and the final', () => {
      const pipe = new Pipeline<number>().use(inc, inc, inc);
      const res = pipe.push(0, inc);
      expect(res).toBe(4);
    });
    it('throws when final not a function', () => {
      const pipe = new Pipeline<number>().use(inc, inc, inc);
      expect(() => {
        const res = pipe.push(0, 9 as unknown as Final<number, unknown>);
        expect(res).toBe(4);
      }).toThrow(
        'final (function) must be a function with signature like Final<T, R>(item: T) => R',
      );
    });
  });

  describe('.pushAsync()', () => {
    it('does not throw when no middleware', async () => {
      const pipe = new Pipeline<boolean>();
      const res = await pipe.pushAsync(true);
      expect(res).toBe(true);
    });

    it('calls single middleware (asynchronous)', async () => {
      const pipe = new Pipeline<number>().useAsync(incp);
      const res = await pipe.pushAsync(1);
      expect(res).toBe(2);
    });

    it('calls all middleware and the final', async (): Promise<void> => {
      const pipe = new Pipeline<number>()
        .use(inc)
        .use(inc)
        .use(inc)
        .useAsync(incp)
        .use(inc)
        .use(inc);
      const res = await pipe.pushAsync(0, incp);
      expect(res).toBe(7);
    });
    it('throws when final not a function', async (): Promise<void> => {
      const pipe = new Pipeline<number>().useAsync(incp).use(inc).use(inc);
      await expect(async () => {
        const res = await pipe.pushAsync(
          0,
          9 as unknown as AsyncFinal<number, unknown>,
        );
        expect(res).toBe(4);
      }).rejects.toThrow(
        'final (function) must be a function with signature like AsyncFinal<T, R>(item: T) => Promise<R>',
      );
    });

    it('propagates any error to the caller (2)', async (): Promise<void> => {
      await expect(async () => {
        const pipe = new Pipeline<number>()
          .use(click)
          .use(click)
          .use(boom)
          .use(click)
          .use(click)
          .use(click);
        await pipe.pushAsync(0, incp);
      }).rejects.toThrow('boom 2');
    });
    it('propagates any error to the caller (final)', async (): Promise<void> => {
      await expect(async () => {
        const pipe = new Pipeline<number>()
          .use(click, click, click, click, click)
          .useAsync(clickp);
        await pipe.pushAsync(0, boomp);
      }).rejects.toThrow('boom 6');
    });
  });
});
