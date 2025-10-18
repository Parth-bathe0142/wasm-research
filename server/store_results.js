const fs = require("fs/promises");
const { emptyTest } = require("./util");
let wasm;
(async () => {
  wasm = await import("backend");
})();

/**
 * @typedef {{ x: number, y: number }} Point
 * @typedef {{ native: Point[], single: Point[], multi: Point[] }} TestData
 * @typedef {Record<string, TestData>} TestResult
 */
const results = {
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
/** @type  {TestResult} */
const averages = JSON.parse(JSON.stringify(results));

async function loadResults() {
  try {
    const data = await fs.readFile("D:/wasm-research/results.json", "utf8");
    const [res, avg] = JSON.parse(data);
    Object.assign(results, res);
    Object.assign(averages, avg);
    return results;
  } catch (error) {
    console.error("Failed to load dataset:", error);
  }
}

async function saveResults() {
  await fs.writeFile("results.json", JSON.stringify([results, averages], null, 2));
}

/**
 * @typedef {{ x: number, y: number }} Point
 * @typedef {{ native: Point[], single: Point[], multi: Point[] }} TestData
 * @param {Record<string, TestData>} result
 */
async function addToResults(result) {
  Object.entries(result).forEach(([key, value]) => {
    results[key].native.push(...value.native);
    results[key].single.push(...value.single);
    results[key].multi.push(...value.multi);
  });

  await saveResults();
}

function averageResults() {
  const newResults = wasm.average_results(results);
  return newResults;
}

/** @param {string?} test */
function clearTests(test) {
  if (test) {
    if (test in results) {
      results[test] = emptyTest();
    } else {
      throw new Error("Invalid test " + test);
    }
  } else {
    Object.entries(results).forEach(([key]) => {
      results[key] = emptyTest();
    });
  }
  saveResults();
}

module.exports = {
  loadResults,
  addToResults,
  averageResults,
  clearTests,
};
