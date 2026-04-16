# wasm-research

A collection of browser-based benchmarks designed to analyze the performance characteristics of **multithreaded WebAssembly** compared to **native JavaScript** and **single-threaded WebAssembly**.

This project quantifies the real-world advantages and limitations of WebAssembly parallelism across a range of workload types, running directly in the browser to ensure fair and accurate comparisons under realistic conditions.

---

## WebAssembly Multithreading Overview

Multithreading in WebAssembly enables true parallel execution by allowing multiple workers to share the same **linear memory buffer**. It relies on the browser supporting **`SharedArrayBuffer`**, **`Web Workers`**, and **cross-origin isolation** (the server must set `Cross-Origin-Opener-Policy` and `Cross-Origin-Embedder-Policy` headers).

### Historical Context
- **2017** — WebAssembly MVP released (single-threaded only)
- **2018–2020** — Threading proposal introduced using `SharedArrayBuffer`
- **2021** — Chrome, Firefox, and Edge implemented multithreading under cross-origin isolation
- **2023+** — Tooling (e.g., `wasm-bindgen-rayon`) matured for practical multithreading in Rust
- **Today** — Threaded WASM runs efficiently on most modern browsers

### How It Works
1. The main thread spawns **Web Workers** and loads the WASM module into each.
2. All workers share the same **linear memory buffer** via `SharedArrayBuffer`.
3. Synchronization is handled using atomics and mutexes.
4. In Rust, the [`rayon`](https://crates.io/crates/rayon) crate abstracts parallel execution, and [`wasm-bindgen-rayon`](https://crates.io/crates/wasm-bindgen-rayon) bridges it to Web Workers.

### Limitations
- Requires cross-origin isolation — the server must set specific security headers.
- JS↔WASM data transfer incurs a copy cost proportional to input size, which can dominate execution time for string-heavy or small workloads.
- String arguments require UTF-16→UTF-8 transcoding, adding overhead for text-processing tasks.
- Thread coordination overhead can outweigh parallelism benefits for small or memory-bandwidth-bound workloads.

---

## Project Structure (high level)

```bash
wasm-research/
├── results.db                   # SQLite database storing all benchmark results
├── package.json
├── README.md
├── public/                      # Frontend assets (HTML, JS, JS benchmark implementations)
│   └── ...
├── server/                      # Express server
│   └── ...
└── rust/                        # Cargo workspace for both rust crates
    ├── Cargo.toml               # Rust workspace configuration
    ├── rust-toolchain.toml      # Specifies the use of Rust nightly compiler
    ├── Makefile.toml            # Cargo-make build automation
    ├── multithread/             # Multithreaded Rust benchmarks (Rayon + wasm-bindgen-rayon)
    │   └── ...
    └── singlethread/            # Single-threaded Rust benchmarks
        └── ...
```

---

## Prerequisites

Before building or running benchmarks, ensure you have:

- [Node.js](https://nodejs.org/) (v18+)
- [Rust](https://www.rust-lang.org/tools/install)
- [wasm-pack](https://crates.io/crates/wasm-pack) - needed for compiling and optimizing rust to wasm and generate the required js glue code
- [cargo-make](https://crates.io/crates/cargo-make) - simplifies build process

---

## Build Instructions

The project uses [`cargo-make`](https://sagiegurari.github.io/cargo-make/) to simplify building multiple crates.

### Build all crates at once

```bash
cd rust
cargo make build
```

This runs all tasks defined in [`Makefile.toml`](rust/makefile.toml), which internally calls:

```bash
cargo make compile-singlethread
cargo make compile-multithread
```

For convinience, prebuilt wasm modules have been added to git for use on devices without rust installed.

---

## Running the Benchmarks

1. **Install dependencies:**

   ```bash
   cd wasm-research
   npm install
   ```

2. **Start the backend server:**

   ```bash
   node .
   ```

3. **Open the browser frontend** (http://localhost:3000)

   The browser loads:
   - JS benchmark implementations
   - Single-threaded WASM module
   - Multithreaded WASM module
   - Spawns Web Workers (via `wasm-bindgen-rayon`)

4. **View results**

   Benchmarks measure **execution time (ms)** using the `performance.now()` API.
   Visualizations are rendered with **Chart.js**.

---

## Benchmarks

| Benchmark | Description | Workload Type | Bottleneck |
|---|---|---|---|
| Sum of first N integers | Demonstrates Rust/LLVM compile-time constant folding — the compiler evaluates the result statically, producing a WASM module that returns a precomputed value with no runtime computation | Compiler optimization | None at runtime — result is constant-folded at compile time |
| Matrix Multiplication | Multiplies two N×N matrices of f64 values | Compute-bound, O(n³) | Arithmetic throughput — highly parallelizable |
| Gaussian Image Blur | Applies a Gaussian blur kernel to an N×N pixel image | Compute-bound, O(n²) | Arithmetic throughput per pixel — good parallelism |
| Grep Search | Searches a multi-line string for lines containing a given substring using `contains` / `includes` | String-processing, O(n) | JS↔WASM boundary: full string copy and UTF-16→UTF-8 transcoding per call |
| Array Sort | Sorts an array of N f64 values using each language's native sort | Memory-bound, O(n log n) | JS↔WASM copy cost (owned Vec); thread coordination overhead exceeds parallelism benefit at tested sizes |
| Pearson Correlation | Computes the Pearson correlation coefficient between two f64 arrays passed as slice references | Compute-bound, O(n) | Arithmetic throughput; zero-copy via `&[f64]` slice references minimizes boundary overhead |

---

## Methodology

Each benchmark is run across a range of input sizes (param), with results stored per browser in a SQLite database for offline analysis.

**Execution per param size:**
- **100 warm-up runs** are discarded before recording begins, allowing JIT compilers and WASM runtimes to reach steady-state execution
- **50 recorded runs** are collected per param size per runtime (Native JS, WASM single-thread, WASM multi-thread)
- Input data is regenerated fresh on every run to avoid sorted-input or cached-input artifacts
- For tests with multiple runtime variants (e.g. sort), each runtime receives an independent copy of the same generated input to ensure comparable conditions

**Param ordering:**
- Input sizes are tested in **randomized order** within each benchmark to reduce systematic bias from JIT warm-up and memory state

**Outlier removal:**
- IQR-based outlier removal (1.5×IQR rule) is applied independently per `(browser, test, param, runtime)` group before computing summary statistics, targeting timing anomalies from GC pauses and OS scheduling events

**Aggregation:**
- Per-param **medians** are computed after outlier removal
- Report statistics (median of medians, CV, overhead ratios) are aggregated across all param sizes per `(browser, test)` group
- **Median** is used as the primary central tendency metric for its robustness to skewed timing distributions
- **Coefficient of Variation (CV)** is reported to characterize execution predictability across param sizes
- **Overhead ratios** are expressed relative to native JS (values below 1.0 indicate WASM outperforms native)
- **Thread speedup** represents the ratio of single-threaded to multi-threaded WASM execution time

**Browsers tested:** Firefox, Chrome, Microsoft Edge

---

## Results

Results are summarized per browser across all six benchmarks. Key findings include:

- Multi-threaded WASM provides the largest speedups for compute-bound, embarrassingly parallel workloads (matrix multiplication ~8×, image blur ~3.5× faster than native JS)
- Single-threaded WASM matches or outperforms native JS for numerical workloads, benefiting from LLVM's ahead-of-time optimization pipeline
- WASM underperforms native JS for string-heavy tasks (grep) due to boundary copy and transcoding costs — a limitation of the JS+WASM hybrid model rather than WASM itself
- Threading provides negligible or negative returns for memory-bandwidth-bound and small-input workloads, where thread coordination overhead exceeds the parallelism benefit
- WASM execution exhibits lower variance than native JS across most workloads, making it preferable in latency-sensitive contexts

---
