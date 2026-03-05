"use strict";

const { removeOutliers, median, cv } = require("./stats");

/**
 * @param {Result[]} rows
 * @returns {Report[]}
 */
function computeReport(rows) {
  /** @type {Map<string, { native: number[], single: number[], multi: number[] }>} */
  const groups = new Map();

  for (const row of rows) {
    const key = `${row.browser},${row.test},${row.param}`;
    if (!groups.has(key)) {
      groups.set(key, { native: [], single: [], multi: [] });
    }
    const entry = groups.get(key);
    if (row.native != null) entry?.native.push(row.native);
    if (row.single != null) entry?.single.push(row.single);
    if (row.multi  != null) entry?.multi.push(row.multi);
  }

  /**
   * @type {Map<string, {
   *   browser: string,
   *   test: string,
   *   natMedians: number[],
   *   sinMedians: number[],
   *   mulMedians: number[],
   *   params: number[]
   * }>}
   */
  const summary = new Map();

  for (const [key, { native, single, multi }] of groups) {
    const [browser, test, paramStr] = key.split(",");
    const param = Number(paramStr);

    const natClean = removeOutliers(native);
    const sinClean = removeOutliers(single);
    const mulClean = removeOutliers(multi);

    const summaryKey = `${browser},${test}`;
    if (!summary.has(summaryKey)) {
      summary.set(summaryKey, {
        browser,
        test,
        natMedians: [],
        sinMedians: [],
        mulMedians: [],
        params: [],
      });
    }
    const entry = summary.get(summaryKey);

    const mNat = median(natClean);
    const mSin = median(sinClean);
    const mMul = median(mulClean);

    if (mNat != null) entry?.natMedians.push(mNat);
    if (mSin != null) entry?.sinMedians.push(mSin);
    if (mMul != null) entry?.mulMedians.push(mMul);
    entry?.params.push(param);
  }

  /** @type {Report[]} */
  const report = [];

  for (const { browser, test, natMedians, sinMedians, mulMedians, params } of summary.values()) {
    const natSorted = [...natMedians].sort((a, b) => a - b);
    const sinSorted = [...sinMedians].sort((a, b) => a - b);
    const mulSorted = [...mulMedians].sort((a, b) => a - b);

    const native_median = median(natSorted);
    const single_median = median(sinSorted);
    const multi_median  = median(mulSorted);

    const native_cv = cv(natMedians);
    const single_cv = cv(sinMedians);
    const multi_cv  = cv(mulMedians);

    const single_overhead =
      native_median != null && single_median != null
        ? single_median / native_median
        : null;
    const multi_overhead =
      native_median != null && multi_median != null
        ? multi_median / native_median
        : null;
    const multi_vs_single_speedup =
      single_median != null && multi_median != null
        ? single_median / multi_median
        : null;

    const param_min = Math.min(...params);
    const param_max = Math.max(...params);

    report.push({
      browser,
      test,
      native_median,
      single_median,
      multi_median,
      native_cv,
      single_cv,
      multi_cv,
      single_overhead,
      multi_overhead,
      multi_vs_single_speedup,
      param_min,
      param_max,
    });
  }

  return report;
}

module.exports = { computeReport };