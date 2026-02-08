const express = require("express");
const path = require("path");
const {
	addResults,
	getAveragedResults,
	deleteTests,
} = require("./db_connection");
const app = express();

app.use((_, res, next) => {
	res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
	res.setHeader("Cross-Origin-Embedder-Policy", "require-corp");
	/* res.setHeader(
    "Content-Security-Policy",
    "default-src 'self'; connect-src 'self' http://localhost:3000; script-src 'self' 'unsafe-eval'"
  ); */
	next();
});

app.use("/", express.static(path.join(__dirname, "../public")));
app.use(express.json());

app.get("/results/:test", (req, res) => {
	const test = req.params.test;
	const averaged = getAveragedResults(test);
	res.json(averaged);
});

app.post("/results", (req, res) => {
	const { results, test } = req.body;

	addResults(results);

	const averaged = getAveragedResults(test);
	res.json(averaged);
});

app.delete("/results", (_, res) => {
	try {
		deleteTests();

		res.status(200).send();
	} catch (e) {
		res.status(500).send("Error: " + e);
	}
});

app.delete("/results/:test", (req, res) => {
	try {
		let test = req.params.test;
		deleteTests(test);

		res.status(200).send();
	} catch (e) {
		res.status(500).send("Error: " + e);
	}
});

app.use((_, res) => {
	res.status(404).send("Not found");
});

app.listen(3000, () => console.log("listening at http://localhost:3000"));
