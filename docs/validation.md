# Validation of v0

- Eight engine tests: scoring before learning; freeze mapping and router; capacity
  refusal without overwrites; evaluation and composition have no learning side
  effects; equal numeric slot ceiling; deterministic scenarios; invalid scenario.
- UI event smoke test: step, completion, scenario reset, full-bank display and seed
  validation. Uses a minimal DOM boundary in Node; not a layout/rendering test.
- Fixed five-seed benchmark, all four conditions, no parameter tuning after results.
- Independent read-only code review found no material issues in engine, UI logic,
  protocol or engine tests.
- A full browser rendering check was attempted but unavailable because the local
  Playwright installation has no Chromium binary. Desktop/mobile visual QA remains
  outstanding. The page uses no external assets or network dependencies.

Deliberate scope choices: fixed-count protection rather than learned permission;
informative artificial context cues; supplied composition schedule. These reduce
scope and let the experiment expose the actual gap instead of disguising it.
