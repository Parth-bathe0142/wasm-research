const fs = require("fs/promises");
const path = require("path");

const {
  loadResults,
  saveResults,
  clearTests,
  addToResults,
  averageResults,
} = require("../server/store_results");
const util = require("../server/util");

let results = {
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

test("load results", async () => {
  let data = {};
  await loadResults(path.join(__dirname, "/sample1.json"), data);

  expect(data).toStrictEqual(results);
});

test("save results", async () => {
  const r1 = Math.random() * 100;
  const r2 = Math.random() * 100;
  const r3 = Math.random() * 100;
  const point1 = { x: 1, y: r1 };
  const point2 = { x: 1, y: r2 };
  const point3 = { x: 1, y: r3 };

  const newRes = util.emptyTest();
  newRes.native.push(point1);
  newRes.single.push(point2);
  newRes.multi.push(point3);

  const res = {
    sum: newRes,
  };

  await saveResults(path.join(__dirname, "/sample.json"), res);

  let data = {};
  await loadResults(path.join(__dirname, "/sample.json"), data);

  expect(res).toStrictEqual(data);
});


test("add to results", () => {
  const newRes = {
    sum: {
      native: [{ x: 1, y: 1 }],
      single: [{ x: 1, y: 1 }],
      multi: [{ x: 1, y: 1 }],
    }
  }
  
  const dest = {};
  addToResults(newRes, dest);
  expect(dest).toStrictEqual(newRes)
})


test("average results", async () => {
  const res = {
    sum: {
      native: [{ x: 1, y: 1. }, { x: 1, y: 2. }, { x: 2, y: 3. }, { x: 2, y: 4. }],
      single: [{ x: 1, y: 1. }, { x: 1, y: 2. }, { x: 2, y: 3. }, { x: 2, y: 4. }],
      multi: [{ x: 1, y: 1. }, { x: 1, y: 2. }, { x: 2, y: 3. }, { x: 2, y: 4. }]
    }
  };
  
  const avg = averageResults(res);
  
  const expected = {
    sum: {
      native: [{ x: 1, y: 1.5 }, { x: 2, y: 3.5 }],
      single: [{ x: 1, y: 1.5 }, { x: 2, y: 3.5 }],
      multi: [{ x: 1, y: 1.5 }, { x: 2, y: 3.5 }]
    }
  }
  
  expect(avg).toStrictEqual(expected)
})