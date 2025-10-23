const fs = require("fs/promises");
const { emptyTest } = require("./util");
const path = require("path");
let wasm;
(async () => {
  wasm = await import("wasm");
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

async function loadResults(file = path.join(__dirname, "../results.json"), dest = results) {
  try {
    const data = await fs.readFile(file, "utf8");
    const res = JSON.parse(data);
    Object.assign(dest, res);
    
    return res;
  } catch (error) {
    console.error("Failed to load dataset:", error);
  }
}

async function saveResults(file = path.join(__dirname, "../results.json"), source = results) {
  await fs.writeFile(
    file,
    JSON.stringify(source, null, 2)
  );
}

/**
 * @typedef {{ x: number, y: number }} Point
 * @typedef {{ native: Point[], single: Point[], multi: Point[] }} TestData
 * @param {Record<string, TestData>} result
 * @param {Record<string, TestData>} dest
 */
async function addToResults(result, dest = results) {
  Object.entries(result).forEach(([key, value]) => {
    if (!Object.hasOwn(dest, key)) {
      dest[key] = emptyTest()
    }
    
    dest[key].native.push(...value.native);
    dest[key].single.push(...value.single);
    dest[key].multi.push(...value.multi);
  });
}

function averageResults(source = results) {
  const newResults = wasm.average_results(source);
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
}

module.exports = {
  loadResults,
  saveResults,
  addToResults,
  averageResults,
  clearTests,
};
