import * as util from "./util.js";
import {
	testSum,
	testMatrixMult,
	testImageBlur,
	testGrep,
	testSortArray,
	testCorrelation,
} from "./tests.js";

/**
 * @type {Record<string, {runs: number, min?: number, max?: number, step?: number}>}
 */
export const defaultConfig = {
	sum: { runs: 50 },
	matrix: { runs: 75, min: 20, max: 400, step: 20 },
	image: { runs: 75, min: 50, max: 600, step: 50 },
	grep: { runs: 75, min: 50, max: 500, step: 50 },
	sort: { runs: 75, min: 50, max: 1000, step: 50 },
	correlation: { runs: 75, min: 100, max: 10000, step: 100 },
};

function range(min, max, step) {
	const arr = [];
	for (let i = min; i <= max; i += step) {
		arr.push(i);
	}
	return arr;
}

function shuffle(arr) {
	return arr.sort(() => Math.random() - 0.5);
}

async function runAndSend(test, results) {
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

	if (!response.ok) {
		console.error(`Failed to save ${test}`);
	}
}

export async function runAutomation(config = defaultConfig) {
	console.log("Starting automated benchmark...");

	// SUM (no params)
	if (config.sum) {
		console.log("Running sum...");
		const results = await testSum(config.sum.runs);
		await runAndSend("sum", results);
	}

	// MATRIX
	if (config.matrix) {
		const { runs, min, max, step } = config.matrix;
		for (const size of shuffle(range(min, max, step))) {
			console.log(`Matrix size ${size}`);

			const _ = await testMatrixMult(100, size);
			await util.yieldControl(100);

			const results = await testMatrixMult(runs, size);
			await runAndSend("matrix", results);

			await util.yieldControl(200);
		}
	}

	// IMAGE
	if (config.image) {
		const { runs, min, max, step } = config.image;
		for (const size of shuffle(range(min, max, step))) {
			console.log(`Image size ${size}`);

			const _ = await testImageBlur(100, size);
			await util.yieldControl(100);

			const results = await testImageBlur(runs, size);
			await runAndSend("image", results);

			await util.yieldControl(200);
		}
	}

	// GREP
	if (config.grep) {
		const { runs, min, max, step } = config.grep;
		for (const lines of shuffle(range(min, max, step))) {
			console.log(`Grep lines ${lines}`);

			const _ = await testGrep(100, lines);
			await util.yieldControl(100);

			const results = await testGrep(runs, lines);
			await runAndSend("grep", results);

			await util.yieldControl(200);
		}
	}

	// SORT
	if (config.sort) {
		const { runs, min, max, step } = config.sort;
		for (const length of shuffle(range(min, max, step))) {
			console.log(`Sort length ${length}`);

			const _ = await testSortArray(100, length);
			await util.yieldControl(100);

			const results = await testSortArray(runs, length);
			await runAndSend("sort", results);

			await util.yieldControl(200);
		}
	}

	// CORRELATION
	if (config.correlation) {
		const { runs, min, max, step } = config.correlation;
		for (const length of shuffle(range(min, max, step))) {
			console.log(`Correlation length ${length}`);

			const _ = await testCorrelation(100, length);
			await util.yieldControl(100);

			const results = await testCorrelation(runs, length);
			await runAndSend("correlation", results);

			await util.yieldControl(200);
		}
	}

	console.log("Benchmark suite complete.");
	alert("Complete");
}
