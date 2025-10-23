# 🧪 wasm-research

A collection of browser-based benchmarks designed to analyze the performance boost provided by **multithreaded WebAssembly** compared to **native JavaScript** and **single-threaded WebAssembly**.

This project aims to quantify the real-world advantages of parallelism in WebAssembly, focusing on computationally intensive tasks like matrix operations, sorting, and image operations. The benchmarks are run directly in the browser to ensure fair and accurate comparisons under realistic conditions.

---

## 🧠 WebAssembly Multithreading Overview

Multithreading in WebAssembly enables true parallel execution by allowing access to **shared linear memory** between threads. It relies on the browser supporting **`SharedArrayBuffer`**, **`Web Workers`**, and **cross-origin isolation**.

### Historical Context
- **2017** — WebAssembly MVP released (single-threaded only)  
- **2018–2020** — Threading proposal introduced using `SharedArrayBuffer`  
- **2021** — Chrome, Firefox, and Edge implemented multithreading under cross-origin isolation  
- **2023+** — Tooling (e.g., `wasm-bindgen-rayon`) matured for practical multithreading in Rust  
- **Today** — Threaded Wasm runs efficiently on most modern browsers

### How It Works
1. The main thread spawns **Web Workers**.
2. Each worker executes a clone of the same Wasm module.
3. All workers share the same **linear memory buffer**.
4. Synchronization primitives (mutexes, atomics) are used to coordinate work.
5. In Rust, the [`rayon`](https://crates.io/crates/rayon) crate abstracts parallel execution, and [`wasm-bindgen-rayon`](https://crates.io/crates/wasm-bindgen-rayon) bridges it with Web Worker threads.

### Limitations
- Requires `SharedArrayBuffer` and secure context (`crossOriginIsolated`).
- Increased memory footprint due to worker duplication.
- Overhead of thread initialization for small workloads.

### Future Scope
- **SIMD + Threads:** Combining data-level and task-level parallelism.
- **Streaming Compilation:** Faster load times for large modules.
- **Better Scheduling APIs:** Fine-grained control of worker pools.

---

## 📁 Project Structure (high level)

```bash
wasm-research/
├── results.json                 # Benchmark results written by Node backend
├── package.json
├── README.md
├── public/                      # Frontend assets (HTML, JS, also contains javascript implementations for testing)
|   └── ...
├── server/                      # Express server
|   └── ...
└── rust/                        # Cargo workspace for all Rust crates
    ├── Cargo.toml               # Rust workspace configuration
    ├── rust-toolchain.toml      # Specifies the use of rust nightly compiler
    ├── makefile.toml            # Cargo-make build automation
    ├── .cargo/                  # Enables features necessory for Multithreading and randomness in wasm
    ├── backend/                 # Node-targeted Rust computations (wasm-bindgen)
    |   └── ...
    ├── multithread/             # Multithreaded Rust benchmarks (Rayon + wasm-bindgen-rayon)
    |   └── ...
    └── singlethread/            # Single-threaded Rust benchmarks
        └── ...
```

---

## ⚙️ Prerequisites

Before building or running benchmarks, ensure you have:

- [Node.js](https://nodejs.org/) (v18+)
- [Rust](https://www.rust-lang.org/tools/install)
- [wasm-pack](https://crates.io/crates/wasm-pack)
- [cargo-make](https://crates.io/crates/cargo-make)

---

## 🧱 Build Instructions

The project uses [`cargo-make`](https://sagiegurari.github.io/cargo-make/) to simplify building multiple crates.

### 🔨 Build all crates at once

```bash
cd rust
cargo make build
```

This runs all tasks defined in [`makefile.toml`](rust/makefile.toml), which internally calls:

```bash
cargo make compile-singlethread
cargo make compile-multithread
cargo make compile-backend
```

---

## 🚀 Running the Benchmarks

1. **Start the backend server:**

   ```bash
   cd wasm-research
   node .
   ```

2. **Open the browser frontend** (e.g. http://localhost:3000)

   The browser loads:
   - JS benchmarks
   - Single-threaded WASM modules
   - Multithreaded WASM modules
   - Spawns web workers (via `wasm-bindgen-rayon`)

3. **View results**

   Benchmarks measure **execution time (ms)** using the `performance.now()` API.
   Visualizations are rendered with **Chart.js**.

---

## 🧮 Benchmarks (Subject to change)

| Benchmark | Description |
|------------|--------------|
| Sum of first 1 million integers | A simple test, showing how rust's compiler optimisations can also affect execution time |
| Array Sorting | Sorting large arrays of f64s using language native implementations |
| Matrix Multiplication | Multiplication of large matrices of f64 |
| Gausian Image Blur | Represents one possible use case of wasm on the web |
| Grep Search | Globally search a Regular Expression and Print, demonstrating computations with large amount of string data |

---

## 📊 Example Results (WIP)

---

## 🔭 Future Work

- Add benchmarks for memory and cache usage
- Adapt to changes in the ecosystem and refresh results
- Put multithreaded Javascript to the test

---

## 📜 License

This project is licensed under the **MIT License**.  
See [LICENSE](./LICENSE) for details.

---

## 📚 References

- [WebAssembly Threads Proposal](https://github.com/WebAssembly/threads)
- [wasm-bindgen](https://rustwasm.github.io/docs/wasm-bindgen/)
- [wasm-bindgen-rayon](https://github.com/GoogleChromeLabs/wasm-bindgen-rayon)
- [Rayon](https://crates.io/crates/rayon)
- [MDN: SharedArrayBuffer](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/SharedArrayBuffer)
- [MDN: performance.now()](https://developer.mozilla.org/docs/Web/API/Performance/now)
