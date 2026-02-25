import * as util from "./util.js";

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

	constructor(test, param, native, single, multi) {
		this.test = test;
		this.param = param;
		this.native = native;
		this.single = single;
		this.multi = multi;
		this.browser = util.detectBrowser();
	}
}
