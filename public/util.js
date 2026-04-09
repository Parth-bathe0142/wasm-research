import { Results } from "./results.js";

export function run(fn, ...args) {
	const start = performance.now();
	const _ = fn(...args);
	const end = performance.now();
	return end - start;
}

export function yieldControl(timeout = 10) {
	return new Promise((res) => {
		setTimeout(res, timeout);
	});
}

/**
 *
 * @param {"sum" | "matrix" | "image"} test
 * @param {Results[]} result
 */
export function updateResult(test, result) {
	const average = Results.average(result);

	document.getElementById(`${test}-native`).innerText =
		average.native.toFixed(4);

	document.getElementById(`${test}-single`).innerText =
		average.single.toFixed(4);

	document.getElementById(`${test}-multi`).innerText =
		average.multi.toFixed(4);
}

let chart = null;

const whiteBackgroundPlugin = {
	id: "whiteBackground",
	beforeDraw: (chart) => {
		const ctx = chart.ctx;
		ctx.save();
		ctx.globalCompositeOperation = "destination-over";
		ctx.fillStyle = "#ffffff";
		ctx.fillRect(0, 0, chart.width, chart.height);
		ctx.restore();
	},
};

/**
 * Plots the given test dataset with Chart.js
 * @param {string} test - name of the test (e.g. "sum", "matrix", etc.)
 * @param {Results[]} results
 * @param {string} canvasId - id of the canvas element (default "chart")
 */
export function plot(test, results, canvasId = "Chart") {
	const ctx = document.getElementById(canvasId);
	if (!ctx) {
		console.error(`Canvas with id="${canvasId}" not found`);
		return;
	}

	if (!results) {
		console.error(`No dataset found for test "${test}"`);
		return;
	}

	// Convert to Chart.js datasets
	const chartData = {
		datasets: [
			{
				label: "Native (JS)",
				data: results.map((row) => ({ x: row.param, y: row.native })),
				borderColor: "red",
				backgroundColor: "rgba(255, 0, 0, 0.2)",
				fill: false,
				tension: 0.2,
			},
			{
				label: "WASM Single-thread",
				data: results.map((row) => ({ x: row.param, y: row.single })),
				borderColor: "blue",
				backgroundColor: "rgba(0, 0, 255, 0.2)",
				fill: false,
				tension: 0.2,
			},
			{
				label: "WASM Multi-thread",
				data: results.map((row) => ({ x: row.param, y: row.multi })),
				borderColor: "green",
				backgroundColor: "rgba(0, 255, 0, 0.2)",
				fill: false,
				tension: 0.2,
			},
		],
	};

	if (chart) chart.destroy();
	// Create chart
	chart = new Chart(ctx, {
		type: "line",
		data: chartData,
		options: {
			responsive: true,
			interaction: {
				mode: "index",
				intersect: false,
			},
			stacked: false,
			plugins: [whiteBackgroundPlugin],
			scales: {
				x: {
					type: "linear",
					title: {
						display: true,
						text: "Input Size",
					},
				},
				y: {
					title: {
						display: true,
						text: "Execution Time (ms)",
					},
				},
			},
		},
	});
}

let browser = null;

export function detectBrowser() {
	if (browser) return browser;

	const ua = navigator.userAgent;

	if (ua.includes("Edg/")) {
		browser = "Microsoft Edge";
	} else if (ua.includes("Firefox/")) {
		browser = "Firefox";
	} else if (ua.includes("Chrome/") && !ua.includes("Edg/")) {
		browser = "Chrome";
	} else if (ua.includes("Safari/") && !ua.includes("Chrome/")) {
		browser = "Safari";
	} else {
		browser = "Other";
	}

	document.getElementById("browser-name").textContent = browser;
	return browser;
}

export function randomMatrices(width) {
	const mat1 = new Float64Array(width * width);
	for (let i = 0; i < mat1.length; i++) {
		mat1[i] = Math.random() * 5;
	}
	const mat2 = new Float64Array(width * width);
	for (let i = 0; i < mat2.length; i++) {
		mat2[i] = Math.random() * 5;
	}

	return [mat1, mat2];
}

/**
 *
 * @param {number} width
 * @param {number} height
 * @returns
 */
export function randomImage(width, height) {
	const image = new Uint8ClampedArray(width * height);

	for (let i = 0; i < image.length; i++) {
		image[i] = Math.floor(Math.random() * 256);
	}

	return image;
}

export function randomGrepData(lines, length, query) {
	let content = "";

	for (let i = 0; i < lines; i++) {
		let str = Array.from({ length }, () =>
			String.fromCharCode(
				"a".charCodeAt(0) + Math.floor(Math.random() * 26),
			),
		).join("");

		if (Math.random() < 0.3) {
			const pos = Math.floor(Math.random() * length);
			str = str.slice(0, pos) + query + str.slice(pos);
		}

		content += str + "\n";
	}

	return content;
}
