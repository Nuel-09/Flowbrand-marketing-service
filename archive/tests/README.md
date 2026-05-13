# Archived tests (2026-05)

Unit specs and e2e were moved here so day-to-day work focuses on product code. Paths below are relative to this folder.

**Restore:** move files back under `src/**/*.spec.ts` and `test/`, fix imports to `./` / `../src`, reinstate `package.json` `jest` block and `test` / `test:e2e` scripts from git history.

**Run archived e2e (manual):** from repo root, with Postgres + `.env` set:

`npx jest --config ./archive/tests/e2e/jest-e2e.json`
