/**
 * @typedef {{ x: number, y: number }} Point
 * @typedef {{ native: Point[], single: Point[], multi: Point[] }} TestData
 * @type {Record<string, TestData>}
 */
export let results = {
  sum: {
    native: [],
    single: [],
    multi: [],
  },
  matrix: {
    native: [],
    single: [],
    multi: [],
  },
  image: {
    native: [],
    single: [],
    multi: [],
  },
  grep: {
    native: [],
    single: [],
    multi: [],
  },
  sort: {
    native: [],
    single: [],
    multi: [],
  },
};

export let averages = JSON.parse(JSON.stringify(results))

export class Results {
  /**
   * @param {Results[]} results
   */
  static average(results) {
    let accNat = 0;
    let accSingle = 0;
    let accMulti = 0;

    results.forEach((r) => {
      accNat += r.native;
      accSingle += r.single;
      accMulti += r.multi;
    });

    const nat = accNat / results.length;
    const single = accSingle / results.length;
    const multi = accMulti / results.length;

    const newRes = results[0];
    newRes.native = nat;
    newRes.single = single;
    newRes.multi = multi;

    return newRes;
  }

  /**
   * @param {string} test
   * @param {Results} result
   */
  static addToDataset(test, result) {
    const { native, single, multi } = result;
    const param = result.param;

    results[test].native.push({ x: param, y: native });
    results[test].single.push({ x: param, y: single });
    results[test].multi.push({ x: param, y: multi });
  }

  constructor(native, single, multi) {
    this.native = native;
    this.single = single;
    this.multi = multi;
  }
}

export class SumRes extends Results {
  constructor(native, single, multi) {
    super(native, single, multi);
  }
}

export class MatrixRes extends Results {
  constructor(native, single, multi, size) {
    super(native, single, multi);
    this.size = size;
  }

  get param() {
    return this.size;
  }
}

export class ImageRes extends Results {
  constructor(native, single, multi, width, height) {
    super(native, single, multi);
    this.width = width;
    this.height = height;
  }

  get param() {
    return this.width * this.height;
  }
}

export class GrepRes extends Results {
  constructor(native, single, multi, lines, length) {
    super(native, single, multi);
    this.lines = lines;
    this.length = length;
  }

  get param() {
    return this.lines;
  }
}

export class SortRes extends Results {
  constructor(native, single, multi, length) {
    super(native, single, multi);
    this.length = length;
  }

  get param() {
    return this.length;
  }
}
