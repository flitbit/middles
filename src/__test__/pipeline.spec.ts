import { expect } from 'chai';
import { Pipeline } from '..';

describe('Pipeline', () => {
  const final = async (v: boolean): Promise<boolean> => {
    return !v;
  };

  describe('.ctor', () => {
    it('throws when not final undefined', () => {
      expect(() => {
        new Pipeline<boolean, boolean>(undefined);
      }).to.throw('final (Final) is required');
    });

    it('throws when not final null', () => {
      expect(() => {
        new Pipeline<boolean, boolean>(null);
      }).to.throw('final (Final) is required');
    });

    it('succeeds when final specified', () => {
      const pipe = new Pipeline<boolean, boolean>(final);
      expect(pipe).to.be.ok;
    });
  });

  describe('.push()', () => {
    const click = (v: number): number => {
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
    it('does not throw', async () => {
      const pipe = new Pipeline<boolean, boolean>(final);
      const res = await pipe.push(true);
      expect(res).to.be.false;
    });
    it('calls all middleware and the final', async () => {
      const pipe = new Pipeline<number, number>(incp)
        .add(inc)
        .add(inc)
        .add(inc)
        .add(incp)
        .add(inc)
        .add(inc);
      const res = await pipe.push(0);
      expect(res).to.eql(7);
    });
    it('propagates any error to the caller (2)', async () => {
      try {
        const pipe = new Pipeline<number, number>(incp)
          .add(click)
          .add(click)
          .add(boom)
          .add(click)
          .add(click)
          .add(click);
        return await pipe.push(0);
      } catch (e) {
        expect(e.message).to.eql('boom 2');
      }
    });
    it('propagates any error to the caller (final)', async () => {
      try {
        const pipe = new Pipeline<number, number>(boomp).add([click, click, click, click, click]).add(click);
        return await pipe.push(0);
      } catch (e) {
        expect(e.message).to.eql('boom 6');
      }
    });
  });
});
