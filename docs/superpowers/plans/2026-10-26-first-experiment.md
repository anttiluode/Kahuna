# Kahuna first experiment implementation plan

Goal: a local browser microscope and reproducible CPU benchmark of record protection.
Architecture: one dependency-free JS engine shared by browser and Node.
Spec: docs/protocol.md. User authorized execution; keep this pass small.

- [x] Engine: core.js, tests/core.test.cjs. Test prequential scoring, immutable
  evaluation, protected writes, bounded capacity, and repeatable seeded runs.
  Implement RecordBank.predict/learn, Shared.predict/learn and Experiment.step/report.
- [x] Browser: index.html, app.js, style.css. Show record grooves, selected route,
  predictions, frozen status and retention curve. Controls run/pause/step/reset,
  scenario, seed and JSON export. Use the same engine, no duplicated learning code.
- [x] Evidence: bench.cjs generates results/benchmark.json across fixed five seeds;
  README documents commands, numeric-state accounting, results and limitations.
  Run node --test and benchmark; inspect browser if a runtime is available.

Review focus: test reads must not learn; capacity refusal must not overwrite;
prediction precedes allocation; identical cues must not secretly access task IDs;
changed rules must expose freezing's failure; composition schedule must be disclosed.
