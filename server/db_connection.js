const Database = require("better-sqlite3");
const path = require("path");
const { computeReport } = require("./report");
const { median } = require("./report/stats.js");

/**
 * @typedef {Object} Result
 * @property {string}      browser
 * @property {string}      test
 * @property {number}      param
 * @property {number|null} native
 * @property {number|null} single
 * @property {number|null} multi
 */

/**
 * @typedef {Object} Report
 * @property {string}      browser
 * @property {string}      test
 * @property {number|null} native_md
 * @property {number|null} single_md
 * @property {number|null} multi_md
 * @property {number|null} native_cv
 * @property {number|null} single_cv
 * @property {number|null} multi_cv
 * @property {number|null} single_oh
 * @property {number|null} multi_oh
 * @property {number|null} thread_speedup
 * @property {number}      param_min
 * @property {number}      param_max
 */

/** @type {import("better-sqlite3").Database | null} */
let db;

/** @type {Record<String, import("better-sqlite3").Statement>}*/
let statements;

/** @type {Record<string, import("better-sqlite3").Transaction>}*/
let transactions;

function init() {
	if (db) return db;

	db = new Database(path.join(__dirname, "../results.db"));
	db.pragma("journal_mode = WAL");

	db.exec(`
		create table if not exists Results (
			id         integer primary key autoincrement,
			browser    text,
			test       text not null,
			param      integer not null,
			native     real,
			single     real,
			multi      real
		)
	`);

	db.exec(`
    	CREATE TABLE IF NOT EXISTS Report (
    		id                      integer primary key autoincrement,
    		browser                 text not null,
    		test                    text not null,
    		native_median           real,
    		single_median           real,
    		multi_median            real,
    		native_cv               real,
    		single_cv               real,
    		multi_cv                real,
    		single_overhead         real,
    		multi_overhead          real,
    		multi_vs_single_speedup real,
    		param_min               integer not null,
    		param_max               integer not null,
    		UNIQUE(browser, test)
    	)
    `);

	statements = {
		fetchAllResults: db.prepare(`
			select browser, test, param, native, single, multi from Results
		`),

		fetchResults: db.prepare(`
			select param, native, single, multi
			from Results
			where test = ? and browser = ?
			order by param
		`),

		insertResult: db.prepare(`
			insert into Results(test, param, native, single, multi, browser)
			values (:test, :param, :native, :single, :multi, :browser)
		`),

		insertReport: db.prepare(`
		    INSERT INTO Report (
				browser, test,
				native_median, single_median, multi_median,
				native_cv, single_cv, multi_cv,
				single_overhead, multi_overhead, multi_vs_single_speedup,
				param_min, param_max
			)
	      	VALUES (
				:browser, :test,
				:native_md, :single_md, :multi_md,
				:native_cv, :single_cv, :multi_cv,
				:single_oh, :multi_oh, :thread_speedup,
				:param_min, :param_max
			)
	    `),

		deleteAll: db.prepare(`
			delete from Results
		`),

		deleteTest: db.prepare(`
	      	delete from Results where test = ? and browser = ?
	    `),
	};

	transactions = {
		insertAllResults: db.transaction((/** @type {Result[]} */ rows) => {
			for (const row of rows) {
				statements.insertResult.run(row);
			}
		}),

		insertAllReports: db.transaction((/** @type {Report[]} */ rows) => {
			db.exec("DELETE FROM Report;");
			for (const row of rows) {
				statements.insertReport.run(row);
			}
		}),
	};

	return db;
}

function closeDB() {
	if (db) {
		console.log("Closing db");
		db.close();
	}
}

/** @param {Result[]} results */
function addResults(results) {
	init();
	try {
		transactions.insertAllResults(results);
	} catch (e) {
		console.log(e);
	}
}

/**
 * @param {Record<string, string>} row
 * @returns {Result}
 */
function toResult(row) {
	return {
		test: row.test,
		param: Number(row.param),
		native: Number(row.native),
		single: Number(row.single),
		multi: Number(row.multi),
		browser: row.browser,
	};
}

/**
 *
 * @param {Record<string, string>} row
 * @returns {Report}
 */
function toReport(row) {
	return {
		browser: row.browser,
		test: row.test,
		native_median: Number(row.native_median),
		single_median: Number(row.single_median),
		multi_median: Number(row.multi_median),
		native_min: Number(row.native_min),
		single_min: Number(row.single_min),
		multi_min: Number(row.multi_min),
		native_max: Number(row.native_max),
		single_max: Number(row.single_max),
		multi_max: Number(row.multi_max),
		param_min: Number(row.param_min),
		param_max: Number(row.param_max),
	};
}

/**
 * @param {string} test
 * @param {string} browser
 * @returns {Result[]}
 */
function getMedianResults(test, browser) {
	init();
	try {
		const rows = statements.fetchResults.all(test, browser).map(toResult);
		const groups = new Map();

		for (let i = 0; i < rows.length; i++) {
			const row = rows[i];
			if (!groups.has(row.param)) {
				groups.set(row.param, {
					native: [],
					single: [],
					multi: [],
				});
			}

			const g = groups.get(row.param);
			g.native.push(row.native);
			g.single.push(row.single);
			g.multi.push(row.multi);
		}

		const results = [];

		for (const [param, g] of groups) {
			results.push({
				param,
				native: median(g.native),
				single: median(g.single),
				multi: median(g.multi),
			});
		}

		results.sort((a, b) => a.param - b.param);

		return results;
	} catch (e) {
		console.log(e);
	}

	return [];
}

function generateReports() {
	init();
	const results = statements.fetchAllResults.all().map(toResult);

	const reports = computeReport(results);

	transactions.insertAllReports(reports);
	console.log(`${reports.length} report rows generated.`);

	return reports;
}

/** @param {string?} test */
function deleteAll() {
	init();
	try {
		statements.deleteAll.run();
	} catch (e) {
		console.log(e);
	}
}

/** @param {string?} test */
function deleteTestsOnBrowser(test, browser) {
	init();
	try {
		statements.deleteTest.run(test, browser);
	} catch (e) {
		console.log(e);
	}
}

module.exports = {
	addResults,
	generateReports,
	getMedianResults,
	deleteTestsOnBrowser,
	deleteAll,
	closeDB,
};
