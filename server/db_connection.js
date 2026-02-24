// @ts-check

const Database = require("better-sqlite3");
const path = require("path");

/**
 * @type {Database.Database | null}
 */
let db = null;

/**
 * @type {Record<String, Database.Statement>}
 */
let statements;

/**
 * @type {Record<string, Database.Transaction>}
 */
let transaction;

function init() {
	if (db) return db;

	db = new Database(path.join(__dirname, "../results.db"));
	db.pragma("journal_mode = WAL");

	db.prepare(
		`create table if not exists Results (
			id integer primary key autoincrement,
			test text not null,
			param integer not null,
			native real,
			single real,
			multi real
		)`,
	).run();

	statements = {
		insertResult: db.prepare(`
			insert into Results(test, param, native, single, multi)
			values (:test, :param, :native, :single, :multi)
		`),

		averaged: db.prepare(`
			select param, avg(native) as native, avg(single) as single, avg(multi) as multi
			from Results
			where test = ?
			group by param
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

/**
 * @typedef {{test: string, param: number, native: number, single: number, multi: number}} Result
 * @param {Result[]} results
 */
function addResults(results) {
	init();
	try {
		transaction.insertAll(results);
	} catch (e) {
		console.log(e);
	}
}

/**
 * @param {string} test
 * @returns {Result[]}
 */
function getAveragedResults(test) {
	init();
	try {
		const rows = statements.averaged.all(test);

		const results = rows.map((row) => ({
			// @ts-ignore
			test: row.test,
			// @ts-ignore
			param: Number(row.param),
			// @ts-ignore
			native: Number(row.native),
			// @ts-ignore
			single: Number(row.single),
			// @ts-ignore
			multi: Number(row.multi),
		}));

		return results;
	} catch (e) {
		console.log(e);
	}

	return [];
}

/**
 *
 * @param {string?} test
 */
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
	getAveragedResults,
	deleteTests,
};
