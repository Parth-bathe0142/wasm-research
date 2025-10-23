const express = require("express");
const path = require("path");
const {
  loadResults,
  saveResults,
  averageResults,
  addToResults,
  clearTests,
} = require("./store_results");
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

app.get("/results", async (_, res) => {
  const results = await loadResults();
  const average = averageResults(results);
  res.json({ result: results, average });
});

app.post("/results", async (req, res) => {
  const { body } = req;
  addToResults(body);
  saveResults();

  const average = averageResults(results);
  res.json({ results, average });
});

app.delete("/results", (_, res) => {
  try {
    clearTests();
    saveResults();
  } catch (e) {
    res.status(500).send("Error: " + e)
  }
});

app.delete("/results/{test}", (req, res) => {
  try {
    let test = req.params.id;
    clearTests(test);
    saveResults();
  } catch (e) {
    res.status(500).send("Error: " + e)
  }
});

app.use((_, res) => {
  res.status(404).send("Not found");
});

app.listen(3000, () => console.log("listening at http://localhost:3000"));
