export function sumOf1000000000() {
  let sum = 0;
  for (let i = 0; i < 1000000000; i++) {
    sum += i;
  }
  return sum;
}

/**
 * @param {number[]} a
 * @param {number[]} b
 * @param {number} n
 *
 * @returns {number[]}
 * */
export function matrixMultiplication(a, b, n) {
  let result = new Array(n * n).fill(0);

  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      for (let k = 0; k < n; k++) {
        result[i * n + j] += a[i * n + k] * b[k * n + j];
      }
    }
  }

  return result;
}

/**
 *
 * @param {Uint8ClampedArray} data
 * @param {number} size
 * @param {number} size
 */
export function imageBlur(data, size) {
  let kernel = [1, 2, 1, 2, 4, 2, 1, 2, 1];

  const result = new Uint8ClampedArray(data.length);

  for (let i = 0; i < data.length; i++) {
    const x = i / size;
    const y = i % size;

    let acc = 0;
    let weight = 0;
    for (let j = 0; j < 9; j++) {
      const kx = j / 3 - 1;
      const ky = (j % 3) - 1;

      const dx = kx + x;
      const dy = ky + y;

      if (dx < 0 || dx >= size || dy < 0 || dy >= size) {
        continue;
      }

      acc += data[dx * size + dy] * kernel[j];
      weight += kernel[j];
    }

    result[i] = acc / weight;
  }

  return result;
}

/**
 *
 * @param {string} query
 * @param {string} content
 */
export function grepSearch(query, content) {
  let result = [];
  content.split("\n").forEach((line) => {
    if (line.includes(query)) {
      result.push(line);
    }
  });

  return result;
}

/**
 * 
 * @param {number[]} array 
 */
export function sortArray(array) {
  return array.sort((a, b) => a - b)
}