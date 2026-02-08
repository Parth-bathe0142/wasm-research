import * as multi from "./multiwasm/multithread.js";
import * as native from "./native_impl.js";
import { Results } from "./results.js";
import * as single from "./singlewasm/singlethread.js";
import * as util from "./util.js";

export function testSum(runs) {
	const results = [];
	for (let i = 0; i < runs; i++) {
		const nat = util.run(native.sumOf1000000000);
		const sin = util.run(single.sum_of_1_000_000_000);
		const mul = util.run(multi.sum_of_1_000_000_000);

		results.push(new Results("sum", 1, nat, sin, mul));
		yieldControl();
	}
	return results;
}
export function testMatrixMult(runs, s) {
	const size = parseInt(s);

	const results = [];
	for (let i = 0; i < runs; i++) {
		let [mat1, mat2] = util.randomMatrices(size);

		const nat = util.run(native.matrixMultiplication, mat1, mat2, size);
		const sin = util.run(single.matrix_multiplication, mat1, mat2, size);
		const mul = util.run(multi.matrix_multiplication, mat1, mat2, size);

		results.push(new Results("matrix", size, nat, sin, mul));
		yieldControl();
	}

	return results;
}
export function testImageBlur(runs, s) {
	const size = parseInt(s);

	const results = [];
	for (let i = 0; i < runs; i++) {
		const image = util.randomImage(size, size);

		const nat = util.run(native.imageBlur, image, size);
		const sin = util.run(single.image_blur, image, size);
		const mul = util.run(multi.image_blur, image, size);

		results.push(new Results("image", size, nat, sin, mul));
		yieldControl();
	}

	return results;
}
export function testGrep(runs, li, le) {
	const lines = parseInt(li);
	const length = parseInt(le);
	const query = "test";

	const results = [];
	for (let i = 0; i < runs; i++) {
		const content = single.random_grep_data(lines, length, query) || "";

		const nat = util.run(native.grepSearch, query, content);
		const sin = util.run(single.grep_search, query, content);
		const mul = util.run(multi.grep_search, query, content);

		results.push(new Results("grep", lines, nat, sin, mul));
		yieldControl();
	}

	return results;
}
export function testSortArray(runs, le) {
	const length = parseInt(le);

	const results = [];
	for (let i = 0; i < runs; i++) {
		const array = Array.from(new Array(length), (_) => Math.random());

		const nat = util.run(native.sortArray, array);
		const sin = util.run(single.sort_array, array);
		const mul = util.run(multi.sort_array, array);

		results.push(new Results("sort", length, nat, sin, mul));
		yieldControl();
	}

	return results;
}
