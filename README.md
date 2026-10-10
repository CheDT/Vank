# Vank

Vank is a local finance workspace for transactions, virtual bank cards, budgets, recurring plans, and savings goals. The frontend and local API run together; the API persists data in a JSON file.

The redesigned workspace opens on Overview. Banks contains card selection and management, Ledger contains transactions and budgets, and Planning contains targets, recurring items and goals. A compact desktop rail and phone dock open the same four pages. See [what changed](docs/CHANGES.md) for the redesign and integration summary.

## Run the complete app

Install Node.js 22 or newer with npm. This integration is verified with Node.js 24.

From the Vank folder:

```powershell
npm ci
npm start
```

Open **http://localhost:5173**. Keep the terminal open and press **Ctrl+C** to stop both services. On Windows, double-click `run.bat` or `start.bat`; the launcher checks dependencies and starts both the frontend and backend.

| Service | Address | Purpose |
| --- | --- | --- |
| Frontend | http://localhost:5173 | The app you use in your browser |
| Local API | http://127.0.0.1:3001/api/state | Inspect the saved workspace |

`npm run dev` starts only the frontend. Use `npm start` to test backend integration. The API uses `server/db.json`, which is local data and is excluded from Git. Existing local data is preserved; a new checkout starts with onboarding.

The [hosted demo](https://chedt.github.io/Vank/) is a static frontend. It does not host this Node.js API; use the complete local app to test backend persistence.

## Verify before merging

Install the browser used by the tests once:

```powershell
npx playwright install chromium
npm run verify
```

The verification command runs integration/API tests, browser tests, and the production build. Browser tests start their own frontend and API on ports 4317 and 4318, using a separate database in `test-results/backend/db.json`.

```powershell
npm test                  # Integration and real API tests
npm run test:e2e          # Browser tests with a real backend
npm run test:e2e:headed   # Watch browser tests
npm run build            # Build the static frontend into dist/
```

GitHub Actions runs the same verification for pull requests and pushes to `main` after this integration is committed and pushed. The workflow does not deploy or merge changes.

## Documentation

- [What changed](docs/CHANGES.md): before/after summary, page guide, controls, startup and release status.
- [UI design decisions](docs/UI_DESIGN.md): layout, cards, phone behavior, accessibility and design review evidence.
- [Integration and architecture](docs/INTEGRATION.md): components, data flow, API routes, configuration, storage, and limitations.
- [Testing and pull request workflow](docs/TESTING.md): automated checks, manual checklist, GitHub Desktop steps, and troubleshooting.
- [Integration review](docs/REVIEW.md): issues fixed, validation results, and the remaining release boundaries.

## Project structure

```text
Vank/
├── index.html                  # App shell
├── package.json                # Run, build and verification commands
├── vite.config.js              # Frontend and API proxy
├── vitest.config.js            # Integration/API test discovery
├── playwright.config.js        # Isolated browser test services
├── run.bat / start.bat          # Windows launchers
├── server/
│   ├── index.js                # API and JSON persistence
│   ├── index.test.js           # Real HTTP/database tests
│   └── db.json                 # Local data, generated and ignored
├── src/
│   ├── scripts/                # State, API client, UI controllers and tests
│   └── styles/                 # App styles
├── tests/                      # Browser tests and shared fixtures
├── docs/                       # Integration, testing and review documentation
└── .github/workflows/verify.yml
```

Dependencies (`node_modules/`), builds (`dist/`), test output, and local database files stay on your computer rather than in source control. Use `package-lock.json` and `npm ci` to reproduce dependencies.
