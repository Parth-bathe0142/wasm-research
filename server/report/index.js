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
		if (row.multi != null) entry?.multi.push(row.multi);
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

	for (const {
		browser,
		test,
		natMedians,
		sinMedians,
		mulMedians,
		params,
	} of summary.values()) {
		const natSorted = [...natMedians].sort((a, b) => a - b);
		const sinSorted = [...sinMedians].sort((a, b) => a - b);
		const mulSorted = [...mulMedians].sort((a, b) => a - b);

		const native_md = median(natSorted);
		const single_md = median(sinSorted);
		const multi_md = median(mulSorted);

		const native_cv = cv(natMedians);
		const single_cv = cv(sinMedians);
		const multi_cv = cv(mulMedians);

		const single_oh =
			native_md != null && single_md != null
				? single_md / native_md
				: null;
		const multi_oh =
			native_md != null && multi_md != null
				? multi_md / native_md
				: null;
		const thread_speedup =
			single_md != null && multi_md != null
				? single_md / multi_md
				: null;

		const param_min = Math.min(...params);
		const param_max = Math.max(...params);

		report.push({
			browser,
			test,
			native_md,
			single_md,
			multi_md,
			native_cv,
			single_cv,
			multi_cv,
			single_oh,
			multi_oh,
			thread_speedup,
			param_min,
			param_max,
		});
	}

	return report;
}

/**
 * @param {Report[]} reports
 */
function createTable(reports) {
	let table = "<tr>";

	const report = reports[0];
	for (const [key, _] of Object.entries(report)) {
		table += `<th>${key.replace('_', ' ')}</th>`;
	}
	table += "</tr>";

	for (const report of reports) {
		table += "<tr>";
		for (const [_, val] of Object.entries(report)) {
			let value;

			if (typeof val == "number") {
				value = parseFloat(val.toFixed(4));
			} else if(typeof val == "string") {
				value = val.replace("Microsoft ", "");
			}

			table += `<td>${value}</td>`;
		}
		table += "</tr>";
	}

	return `<table id="report-table" border="1">${table}</table>`;
}

module.exports = { computeReport, createTable };
