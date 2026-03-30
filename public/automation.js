import * as util from "./util.js";
import {
  testSum,
  testMatrixMult,
  testImageBlur,
  testGrep,
  testSortArray,
  testCorrelation,
} from "./tests.js";

/**
 * @typedef Config {{runs: number, min?: number, max?: number, step?: number, test?: (number, number) => Promise<Results[]>}}
 * @type {Config[]}
 */
export const defaultConfig = [
  { name: "sum", runs: 50 },
  {
    name: "matrix",
    runs: 50,
    min: 20,
    max: 400,
    step: 20,
    test: testMatrixMult,
  },
  { name: "image", runs: 50, min: 50, max: 600, step: 50, test: testImageBlur },
  { name: "grep", runs: 50, min: 100, max: 1000, step: 50, test: testGrep },
  {
    name: "sort",
    runs: 50,
    min: 100,
    max: 3000,
    step: 100,
    test: testSortArray,
  },
  {
    name: "correlation",
    runs: 50,
    min: 200,
    max: 30000,
    step: 200,
    test: testCorrelation,
  },
];

const warmups = 100;
const warmupDelay = 200;
const testDelay = 500;

function range(min, max, step) {
  const arr = [];
  for (let i = min; i <= max; i += step) {
    arr.push(i);
  }
  return arr;
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

async function runAndSend(test, results) {
  const response = await fetch("/results", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      test,
      results,
      browser: util.detectBrowser(),
    }),
  });

  if (!response.ok) {
    console.error(`Failed to save ${test}`);
  }
}

export async function runAutomation(configs = defaultConfig) {
  for (const config of configs) {
    if (config.name === "sum") {
      console.log("Running sum...");
      const results = await testSum(config.runs);
      await runAndSend("sum", results);
    } else {
      await automate(config);
    }
  }
  alert("Complete");
}

async function automate(config) {
  const { name, runs, min, max, step, test } = config;
  for (const size of shuffle(range(min, max, step))) {
    console.log(`${name} size ${size}`);

    await test(warmups, size);
    await util.yieldControl(warmupDelay);

    const results = await test(runs, size);
    await runAndSend(name, results);

    await util.yieldControl(testDelay);
  }
}
