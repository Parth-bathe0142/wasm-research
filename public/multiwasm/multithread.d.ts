/* tslint:disable */
/* eslint-disable */

export function correlation(xi: Float32Array, yi: Float32Array): number;

export function grep_search(query: string, content: string): string[];

export function image_blur(data: Uint8Array, size: number): Uint8Array;

export function init(): void;

export function initThreadPool(num_threads: number): Promise<any>;

export function matrix_multiplication(a: Float64Array, b: Float64Array, n: number): Float64Array;

export function sort_array(array: Float64Array): Float64Array;

export function sum_of_1_000_000_000(): bigint;

export class wbg_rayon_PoolBuilder {
    private constructor();
    free(): void;
    [Symbol.dispose](): void;
    build(): void;
    mainJS(): string;
    numThreads(): number;
    receiver(): number;
}

export function wbg_rayon_start_worker(receiver: number): void;

export type InitInput = RequestInfo | URL | Response | BufferSource | WebAssembly.Module;

export interface InitOutput {
    readonly init: () => void;
    readonly sum_of_1_000_000_000: () => bigint;
    readonly matrix_multiplication: (a: number, b: number, c: number, d: number, e: number) => [number, number];
    readonly image_blur: (a: number, b: number, c: number) => [number, number];
    readonly grep_search: (a: number, b: number, c: number, d: number) => [number, number];
    readonly sort_array: (a: number, b: number) => [number, number];
    readonly correlation: (a: number, b: number, c: number, d: number) => number;
    readonly __wbg_wbg_rayon_poolbuilder_free: (a: number, b: number) => void;
    readonly wbg_rayon_poolbuilder_mainJS: (a: number) => any;
    readonly wbg_rayon_poolbuilder_numThreads: (a: number) => number;
    readonly wbg_rayon_poolbuilder_receiver: (a: number) => number;
    readonly wbg_rayon_poolbuilder_build: (a: number) => void;
    readonly initThreadPool: (a: number) => any;
    readonly wbg_rayon_start_worker: (a: number) => void;
    readonly memory: WebAssembly.Memory;
    readonly __wbindgen_free: (a: number, b: number, c: number) => void;
    readonly __wbindgen_malloc: (a: number, b: number) => number;
    readonly __wbindgen_realloc: (a: number, b: number, c: number, d: number) => number;
    readonly __externref_table_alloc: () => number;
    readonly __wbindgen_externrefs: WebAssembly.Table;
    readonly __externref_drop_slice: (a: number, b: number) => void;
    readonly __wbindgen_thread_destroy: (a?: number, b?: number, c?: number) => void;
    readonly __wbindgen_start: (a: number) => void;
}

export type SyncInitInput = BufferSource | WebAssembly.Module;

/**
 * Instantiates the given `module`, which can either be bytes or
 * a precompiled `WebAssembly.Module`.
 *
 * @param {{ module: SyncInitInput, memory?: WebAssembly.Memory, thread_stack_size?: number }} module - Passing `SyncInitInput` directly is deprecated.
 * @param {WebAssembly.Memory} memory - Deprecated.
 *
 * @returns {InitOutput}
 */
export function initSync(module: { module: SyncInitInput, memory?: WebAssembly.Memory, thread_stack_size?: number } | SyncInitInput, memory?: WebAssembly.Memory): InitOutput;

/**
 * If `module_or_path` is {RequestInfo} or {URL}, makes a request and
 * for everything else, calls `WebAssembly.instantiate` directly.
 *
 * @param {{ module_or_path: InitInput | Promise<InitInput>, memory?: WebAssembly.Memory, thread_stack_size?: number }} module_or_path - Passing `InitInput` directly is deprecated.
 * @param {WebAssembly.Memory} memory - Deprecated.
 *
 * @returns {Promise<InitOutput>}
 */
export default function __wbg_init (module_or_path?: { module_or_path: InitInput | Promise<InitInput>, memory?: WebAssembly.Memory, thread_stack_size?: number } | InitInput | Promise<InitInput>, memory?: WebAssembly.Memory): Promise<InitOutput>;
