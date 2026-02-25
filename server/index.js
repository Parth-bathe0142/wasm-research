const express = require("express");
const path = require("path");
const {
	addResults,
	getMedianResults,
	deleteTests,
	closeDB,
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

app.get("/results/:test/:browser", (req, res) => {
	const { test, browser } = req.params;
	const processed = getMedianResults(test, browser);
	res.json(processed);
});

app.post("/results", (req, res) => {
	const { results, test, browser } = req.body;

	addResults(results);

	const processed = getMedianResults(test, browser);
	res.json(processed);
	console.log(processed);
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

process.on('SIGINT', _ => {
	closeDB()
	process.exit(0)
})