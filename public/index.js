import * as util from "./util.js";
import { averages, results, Results } from "./results.js";
import singleinit from "./singlewasm/singlethread.js";
import multiinit, { initThreadPool } from "./multiwasm/multithread.js";
import {
  testSum,
  testMatrixMult,
  testImageBlur,
  testGrep,
  testSortArray,
} from "./tests.js";

const cores = navigator.hardwareConcurrency || 4;

async function main() {
  await singleinit();
  await multiinit();

  await initThreadPool(cores);
}
main();

for (let b of document.getElementsByClassName("test-runner")) {
  const getVal = (id) => document.querySelector(`#${id}`)?.value;
  const test = b.id.split("-")[0];

  console.log("added " + test);
  b.addEventListener("click", (_) => {
    console.log("running " + test);

    const runs = getVal(`${test}-runs`);
    const params = getVal(`${test}-params`)?.split(" ");

    let results;
    switch (test) {
      case "sum":
        results = testSum(runs);
        break;
      case "matrix":
        results = testMatrixMult(runs, ...params);
        break;
      case "image":
        results = testImageBlur(runs, ...params);
        break;
      case "grep":
        results = testGrep(runs, ...params);
        break;
      case "sort":
        results = testSortArray(runs, ...params);
    }

    const avg = Results.average(results);
    Results.addToDataset(test, avg);

    util.updateResult(test, results);
  });
}

for (let b of document.getElementsByClassName("test-plotter")) {
  const test = b.id.split("-")[0];
  b.addEventListener("click", (_) => {
    util.plot(test);
  });
}

document.querySelector("button#save").addEventListener("click", async (_) => {
  const res = JSON.stringify(results);

  const response = await fetch("/results", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: res,
  });

  if (!response.ok) {
    alert("Error saving data");
  }
});

document.querySelector("button#load").addEventListener("click", async (_) => {
  const response = await fetch("/results");

  if (!response.ok) {
    return alert("Error loading data");
  }

  const { result, average } = await response.json();

  Object.assign(results, result);
  Object.assign(averages, average);
});

document
  .querySelector("button#clear-local")
  .addEventListener("click", async (_) => {
    Object.entries(results).forEach(([test]) => {
      results[test] = util.getEmptyTestData();
    });
  });

document
  .querySelector("button#clear-saved")
  .addEventListener("click", async (_) => {
    const response = await fetch("/results", {
      method: "DELETE",
    });
  });
