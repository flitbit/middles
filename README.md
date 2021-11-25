# middles

Another small middleware pipeline library for Nodejs.

`middles` exposes one type, a `Pipeline` object, with which you can construct a processing pipeline out of synchronous and asynchronous middleware functions. Later, you can push arguments into the pipeline, and those items are processed by each successive middleware. After the pipeline runs, either the result of the final middleware function is returned to the caller, or any processing error is thrown.

## Install

In your shell:

```bash
npm install middles
```

## Import

In your module:

```ts
import { Pipeline } from 'middles';
```

## Use

A pipeline is a sequence of processing steps. Each item subsequently pushed onto the pipe, is processed by each step, in the order in which the steps were added.

```ts
import { Pipeline } from 'middles';

const doubled = (n: number): number => n << 1;
const magnitude = (n: number): number => n * 10;
const half = (n: number): number => n >> 1;

const contrived = new Pipeline()
	.add(doubled)
	.add(magnitude)
	.add(magnitude)
	.add(half)
	.add(doubled);

const res = contrived.push(3);
```
