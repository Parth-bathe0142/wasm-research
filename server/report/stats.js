/**
 * @param {number[]} sorted
 * @param {number} p
 * @returns {number}
 */
function percentile(sorted, p) {
	const n = sorted.length;
	if (n == 0) return 0;
	if (n == 1) return sorted[0];

	const rank = (p / 100) * (n - 1);
	const lo = Math.floor(rank);
	const hi = Math.ceil(rank);
	const frac = rank - lo;

	return sorted[lo] + frac * (sorted[hi] - sorted[lo]);
}

/**
 * @param {number[]} values
 * @returns {number[]}
 */
function removeOutliers(values) {
	if (values.length < 4) return [...values].sort((a, b) => a - b);

	const sorted = [...values].sort((a, b) => a - b);
	const q1 = percentile(sorted, 25);
	const q3 = percentile(sorted, 75);
	const iqr = q3 - q1;
	const lower = q1 - 1.5 * iqr;
	const upper = q3 + 1.5 * iqr;

	return sorted.filter((x) => x >= lower && x <= upper);
}

/**
 * @param {number[]} sorted
 * @returns {number|null}
 */
function median(sorted) {
	const n = sorted.length;
	if (n == 0) return null;
	if (n % 2 == 1) return sorted[Math.floor(n / 2)];
	return (sorted[n / 2 - 1] + sorted[n / 2]) / 2;
}

/**
 * @param {number[]} values
 * @returns {number|null}
 */
function mean(values) {
	if (values.length == 0) return null;
	return values.reduce((acc, x) => acc + x, 0) / values.length;
}

/**
 * @param {number[]} values
 * @returns {number|null}
 */
function stddev(values) {
	const m = mean(values);
	if (m == null || values.length < 2) return null;
	const variance =
		values.reduce((acc, x) => acc + (x - m) ** 2, 0) / (values.length - 1);
	return Math.sqrt(variance);
}

/**
 * @param {number[]} values
 * @returns {number|null}
 */
function cv(values) {
	const m = mean(values);
	if (m == null || m == 0) return null;
	const s = stddev(values);
	if (s == null) return null;
	return (s / m) * 100;
}

module.exports = {
	median,
	mean,
	stddev,
	cv,
	removeOutliers,
	percentile,
}
