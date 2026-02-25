const Database = require("better-sqlite3");
const path = require("path");

/**
 * @typedef {{test: string, param: number, native: number, single: number, multi: number, browser: string}} Result
 */

/** @type {import("better-sqlite3").Database | null} */
let db = null;

/** @type {Record<String, import("better-sqlite3").Statement>}*/
let statements;

/** @type {Record<string, import("better-sqlite3").Transaction>}*/
let transaction;

function init() {
	if (db) return db;

	db = new Database(path.join(__dirname, "../results.db"));
	db.pragma("journal_mode = WAL");

	db.prepare(
		`create table if not exists Results (
			id integer primary key autoincrement,
			browser text,
			test text not null,
			param integer not null,
			native real,
			single real,
			multi real
		)`,
	).run();

	statements = {
		insertResult: db.prepare(`
			insert into Results(test, param, native, single, multi, browser)
			values (:test, :param, :native, :single, :multi, :browser)
		`),

		fetchResults: db.prepare(`
			select param, native, single, multi
			from Results
			where test = ? and browser = ?
			order by param
			`),

		deleteAll: db.prepare(`
			delete from Results
		`),

		deleteTest: db.prepare(`delete from Results where test = ?`),
	};

	transaction = {
		insertAll: db.transaction((/** @type {Result[]} */ rows) => {
			for (const row of rows) {
				statements.insertResult.run(row);
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
		transaction.insertAll(results);
	} catch (e) {
		console.log(e);
	}
}

/**
 * @param {number[]} values
 * @returns {number}
 */
function median(values) {
	values.sort((a, b) => a - b);
	const mid = Math.floor((values.length - 1) / 2); // lower middle only in case of even count
	return values[mid];
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

/** @param {string?} test */
function deleteTests(test) {
	init();
	try {
		if (test) {
			statements.deleteTest.run(test);
		} else {
			statements.deleteAll.run();
		}
	} catch (e) {
		console.log(e);
	}
}

module.exports = {
	addResults,
	getMedianResults,
	deleteTests,
	closeDB,
};
