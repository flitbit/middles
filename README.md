# middles

[![CircleCI](https://circleci.com/gh/flitbit/middles/tree/master.svg?style=svg)](https://circleci.com/gh/flitbit/middles/tree/master) [![codecov](https://codecov.io/gh/flitbit/middles/branch/master/graph/badge.svg)](https://codecov.io/gh/flitbit/middles)

Another small processing pipeline library for Nodejs.

`middles` enables you to compose a processing pipeline out of synchronous and asynchronous processing functions. Later, you can push arguments into the pipeline, and those items are processed by each successive processor. After the pipeline runs, either the result of the final processor is returned, or an error is thrown.

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

A pipeline is a sequence of processing steps. Each item pushed onto the pipe, is processed by each step, in the order in which the steps were added.

```ts
import { Pipeline } from 'middles';

const doubled = (n: number): number => n << 1;
const magnitude = (n: number): number => n * 10;
const half = (n: number): number => n >> 1;

const contrived = new Pipeline()
	.use(doubled)
	.use(magnitude)
	.use(magnitude)
	.use(half)
	.use(doubled);

const res = contrived.push(3);
```

### Good Practice

Well written, highly composable processors should exhibit these characteristics:

- distrusts inputs
- only proceeds if it can succeed (fail-fast)
- seldom preserves state (prefer stateless behaviors)
- performs a single responsibility
- strive for deterministic behavior
