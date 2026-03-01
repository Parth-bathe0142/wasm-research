import * as util from "./util.js";
import singleinit from "./singlewasm/singlethread.js";
import multiinit, { initThreadPool } from "./multiwasm/multithread.js";
import {
	testSum,
	testMatrixMult,
	testImageBlur,
	testGrep,
	testSortArray,
	testCorrelation,
} from "./tests.js";

const cores = 8;

async function main() {
	await singleinit();
	await multiinit();

	await initThreadPool(cores);
	console.log("Ready");
}
main();

for (let b of document.getElementsByClassName("test-warmup")) {
	const getVal = (id) => document.querySelector(`#${id}`)?.value;
	const test = b.id.split("-")[0];

	b.addEventListener("click", async (_) => {
		if (b.classList.contains("running")) {
			return;
		}
		b.classList.toggle("running");

		const runs = 100;
		const params = getVal(`${test}-params`)?.split(" ");

		/** @type {Promise<import("./results.js").Results[]>} */
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
				break;
			case "correlation":
				results = testCorrelation(runs, ...params);
				break;
			default:
				throw new Error("invalid test");
		}
		results = await results;

		b.classList.toggle("running");
		util.updateResult(test, results);
	});
}

for (let b of document.getElementsByClassName("test-runner")) {
	const getVal = (id) => document.querySelector(`#${id}`)?.value;
	const test = b.id.split("-")[0];

	b.addEventListener("click", async (_) => {
		if (b.classList.contains("running")) {
			return;
		}
		b.classList.toggle("running");

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
				break;
			case "correlation":
				results = testCorrelation(runs, ...params);
				break;
			default:
				throw new Error("invalid test");
		}
		results = await results;

		const response = await fetch("/results", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				test,
				results,
				browser: util.detectBrowser(),
			}),
		});

		b.classList.toggle("running");
		if (response.ok) {
			util.updateResult(test, results);
		} else {
			alert("Error Saving Data");
		}
	});
}

for (let b of document.getElementsByClassName("test-plotter")) {
	const test = b.id.split("-")[0];
	b.addEventListener("click", async (_) => {
		const response = await fetch(
			`/results/${test}/${util.detectBrowser()}`,
		);

		if (response.ok) {
			const results = await response.json();
			util.plot(test, results);
		}
	});
}

document
	.querySelector("button#clear-saved")
	.addEventListener("click", async (_) => {
		const response = await fetch("/results", {
			method: "DELETE",
		});

		if (!response.ok) {
			alert("Failed to delete saved data");
		}
	});
