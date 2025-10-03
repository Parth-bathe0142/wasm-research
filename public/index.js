import * as native from "./native_impl.js";
import * as util from "./util.js";
import { GrepRes, ImageRes, MatrixRes, SortRes, SumRes } from "./results.js";
import { Results } from "./results.js";

import singleinit, * as single from "./singlewasm/singlethread.js";
import multiinit, * as multi from "./multiwasm/multithread.js";

const cores = navigator.hardwareConcurrency || 4;

async function main() {
  await singleinit();
  await multiinit();

  await multi.initThreadPool(cores);
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

function testSum(runs) {
  const results = [];
  for (let i = 0; i < runs; i++) {
    const nat = util.run(native.sumOf1000000000);
    const sin = util.run(single.sum_of_1_000_000_000);
    const mul = util.run(multi.sum_of_1_000_000_000);

    results.push(new SumRes(nat, sin, mul));
  }
  return results;
}

function testMatrixMult(runs, s) {
  const size = parseInt(s);

  const results = [];
  for (let i = 0; i < runs; i++) {
    let [mat1, mat2] = util.randomMatrices(size);

    const nat = util.run(native.matrixMultiplication, mat1, mat2, size);
    const sin = util.run(single.matrix_multiplication, mat1, mat2, size);
    const mul = util.run(multi.matrix_multiplication, mat1, mat2, size);

    results.push(new MatrixRes(nat, sin, mul, size));
  }
  console.log(results)

  return results;
}

function testImageBlur(runs, w, h) {
  const width = parseInt(w);
  const height = parseInt(h);

  const results = [];
  for (let i = 0; i < runs; i++) {
    const image = util.randomImage(width, height);

    const nat = util.run(native.imageBlur, image, width, height);
    const sin = util.run(single.image_blur, image, width, height);
    const mul = util.run(multi.image_blur, image, width, height);

    results.push(new ImageRes(nat, sin, mul, width, height));
  }
  console.log(results);

  return results;
}

function testGrep(runs, li, le) {
  const lines = parseInt(li);
  const length = parseInt(le);
  const query = "test";

  const results = [];
  for (let i = 0; i < runs; i++) {
    const content = single.random_grep_data(lines, length, query) || "";

    const nat = util.run(native.grepSearch, query, content);
    const sin = util.run(single.grep_search, query, content);
    const mul = util.run(multi.grep_search, query, content);

    results.push(new GrepRes(nat, sin, mul, lines, length));
  }

  return results;
}

function testSortArray(runs, le) {
  const length = parseInt(le);

  const results = [];
  for (let i = 0; i < runs; i++) {
    const array = Array.from(new Array(length), (_) => Math.random());

    const nat = util.run(native.sortArray, array);
    const sin = util.run(single.sort_array, array);
    const mul = util.run(multi.sort_array, array);

    results.push(new SortRes(nat, sin, mul, length));
  }

  return results;
}
