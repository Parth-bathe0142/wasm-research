import { averages, Results, results } from "./results.js";

export function run(fn, ...args) {
  const start = performance.now();
  const _ = fn(...args);
  const end = performance.now();
  return end - start;
}

/**
 *
 * @param {"sum" | "matrix" | "image"} test
 * @param {Results[]} result
 */
export function updateResult(test, result) {
  const average = Results.average(result);

  document.getElementById(`${test}-native`).innerText =
    average.native.toFixed(4);

  document.getElementById(`${test}-single`).innerText =
    average.single.toFixed(4);

  document.getElementById(`${test}-multi`).innerText = average.multi.toFixed(4);
}

let chart = null;

/**
 * Plots the given test dataset with Chart.js
 * @param {string} test - name of the test (e.g. "sum", "matrix", etc.)
 * @param {string} canvasId - id of the canvas element (default "chart")
 */
export function plot(test, canvasId = "Chart") {
  const ctx = document.getElementById(canvasId);
  if (!ctx) {
    console.error(`Canvas with id="${canvasId}" not found`);
    return;
  }

  const data = averages[test];
  if (!data) {
    console.error(`No dataset found for test "${test}"`);
    return;
  }

  // Convert to Chart.js datasets
  const chartData = {
    datasets: [
      {
        label: "Native (JS)",
        data: data.native.sort((a, b) => a.param - b.param),
        borderColor: "red",
        backgroundColor: "rgba(255, 0, 0, 0.2)",
        fill: false,
        tension: 0.2,
      },
      {
        label: "WASM Single-thread",
        data: data.single.sort((a, b) => a.param - b.param),
        borderColor: "blue",
        backgroundColor: "rgba(0, 0, 255, 0.2)",
        fill: false,
        tension: 0.2,
      },
      {
        label: "WASM Multi-thread",
        data: data.multi.sort((a, b) => a.param - b.param),
        borderColor: "green",
        backgroundColor: "rgba(0, 255, 0, 0.2)",
        fill: false,
        tension: 0.2,
      },
    ],
  };

  if (chart) chart.destroy();
  // Create chart
  chart = new Chart(ctx, {
    type: "line",
    data: chartData,
    options: {
      responsive: true,
      interaction: {
        mode: "index",
        intersect: false,
      },
      stacked: false,
      plugins: {
        title: {
          display: true,
          text: `Performance Comparison: ${test}`,
        },
      },
      scales: {
        x: {
          type: "linear",
          title: {
            display: true,
            text: "Input Size",
          },
        },
        y: {
          title: {
            display: true,
            text: "Execution Time (ms)",
          },
        },
      },
    },
  });
}

export function randomMatrices(width) {
  const mat1 = new Float64Array(width * width);
  for (let i = 0; i < mat1.length; i++) {
    mat1[i] = Math.random() * 5;
  }
  const mat2 = new Float64Array(width * width);
  for (let i = 0; i < mat2.length; i++) {
    mat2[i] = Math.random() * 5;
  }

  return [mat1, mat2];
}

/**
 *
 * @param {number} width
 * @param {number} height
 * @returns
 */
export function randomImage(width, height) {
  const image = new Uint8ClampedArray(width * height);

  for (let i = 0; i < image.length; i++) {
    image[i] = Math.floor(Math.random() * 256);
  }

  return image;
}

export const getEmptyResults = () => {
  return {
    sum: {
      native: [],
      single: [],
      multi: [],
    },
    matrix: {
      native: [],
      single: [],
      multi: [],
    },
    image: {
      native: [],
      single: [],
      multi: [],
    },
    grep: {
      native: [],
      single: [],
      multi: [],
    },
    sort: {
      native: [],
      single: [],
      multi: [],
    },
  };
};

export const getEmptyTestData = () => {
  return {
    native: [],
    single: [],
    multi: [],
  };
};
