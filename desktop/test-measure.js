// Valida a medição fora do Electron: node test-measure.js https://example.com
"use strict";

const { runTest } = require("./src/run-test");

runTest(process.argv[2] || "https://example.com")
  .then((r) => {
    console.log(JSON.stringify(
      { url: r.finalUrl, grade: r.grade, score: r.score, loadMs: r.loadMs, pageBytes: r.pageBytes, requestCount: r.requestCount },
      null, 2,
    ));
    process.exit(0);
  })
  .catch((e) => {
    console.error("ERRO:", e.code || e.message);
    process.exit(1);
  });
