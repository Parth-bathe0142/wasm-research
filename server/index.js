const express = require("express")
const path = require("path")

const app = express()

app.use((req, res, next) => {
  res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
  res.setHeader("Cross-Origin-Embedder-Policy", "require-corp");
  /* res.setHeader(
    "Content-Security-Policy",
    "default-src 'self'; connect-src 'self' http://localhost:3000; script-src 'self' 'unsafe-eval'"
  ); */
  next();
})

app.use("/", express.static(path.join(__dirname, "../public")))

app.use((req, res) => {
  res.status(404).send("Not found");
});

app.listen(3000, () => console.log("listening at http://localhost:3000"))
