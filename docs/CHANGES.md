# Vank: redesign and integration changes

This document describes the completed redesign and the local integration of the backend and test work. Start here for a summary; use [TESTING.md](TESTING.md) to run the checks, [INTEGRATION.md](INTEGRATION.md) for the API and storage details, and [UI_DESIGN.md](UI_DESIGN.md) for the design decisions.

## What changed for users

The previous workspace placed cards, transactions, charts and planning tools together. The redesign gives each task its own page, with Overview as the starting point.

| Area | Previous behavior | Current behavior |
| --- | --- | --- |
| Pages | Most tools shared one dashboard | Overview, Banks, Ledger and Planning have separate destinations |
| Desktop navigation | Larger navigation and repeated controls | Compact icon rail, with the account control at the bottom |
| Phone navigation | Several controls competed for space | Bottom dock with an expanded selected label, a moving indicator and a More menu |
| Phone scrolling | Navigation occupied space while browsing records | Dock hides when scrolling down and returns when scrolling up |
| Bank cards | Larger cards within the dashboard | Compact, centered card fan, with click and keyboard cycling |
| Transactions | Ledger appeared alongside the rest of the dashboard | Dedicated Ledger page with search, filters, spending breakdown, budgets and export |
| Planning | Planning tools appeared within the dashboard flow | Dedicated page for monthly settings, recurring items, goals and alerts |
| Forms on phones | Dialogs used the desktop treatment | Forms fill the screen; fields scroll while the header and actions remain visible |
| Profile setup | Different visual treatment and automatic step changes on some selections | Styling matches the workspace; Next advances the selected step |
| Guide | Tutorial and guide entry points occupied workspace space | Guide controls and tutorial module removed |
| Charts | A pseudo-weekly chart implied a trend without matching source data | Category breakdown uses actual expense totals; unsupported chart and redundant allocation view removed |
| Connection feedback | Backend failures mainly fell back to browser data | Visible offline message and Retry control, with cached records retained |

## What each page does

| Page | Main tasks | How to open it directly |
| --- | --- | --- |
| Overview | See cards, net cash flow, income, expenses, deductible totals and recent transactions | `/#overview` or `/` |
| Banks | Select, cycle, add or manage virtual bank cards | `/#banks` |
| Ledger | Add, edit, duplicate or delete transactions; search/filter records; view spending and budgets; export CSV | `/#ledger` |
| Planning | Save monthly targets, recurring bills or income, savings goals and planning settings | `/#planning` |

Desktop rail links and phone dock buttons open the same pages. Reload and browser Back/Forward retain the selected destination. Search opens Ledger when a search term is entered. A selected workspace or card changes the records and summaries being viewed.

## Appearance and interaction

The workspace uses black, white and neutral grays, with a light content area and black desktop rail. Existing bank colors remain available for individual cards. Card details include the bank mark, chip, network mark, masked number, cardholder and calculated balance; these virtual cards do not connect to a bank account.

Text actions use compact rectangular buttons. Icon actions use circular controls with accessible names. The phone Add control and card menus retain larger tap areas around their smaller visible marks.

Short page, menu, form and profile-step transitions show that an action took effect. Card cycling remains animated. The interface honors the operating system's reduced-motion preference.

Keyboard users can activate controls with Enter or Space and dismiss overlays with Escape. Dialogs and the phone More menu trap focus and isolate background controls; closing them restores focus. Loading, empty, filtered-empty and offline states give users feedback when there is no content to display or the API cannot be reached.

The integration retains immediate focus in transaction, card and budget forms. A delayed focus callback previously could move typing into a different field, including saving a card with the wrong name.

## Backend and test integration

| Change | Why it matters |
| --- | --- |
| `npm start` launches both Vite and Express | One command runs the complete local app |
| Windows launchers check dependencies and start both services | Double-clicking the launcher supports backend saving |
| Frontend uses `/api` through the Vite proxy | Browser requests reach the local API without a fixed frontend API hostname |
| App initializes after state loading | Backend state is available before controllers render |
| Saves capture independent snapshots and send them in order | Rapid edits cannot overwrite newer data with an older queued snapshot |
| Browser storage caches loaded data and edits | Records remain available when the API is unavailable |
| Offline feedback follows the connection state | The app explains when it is using browser data and offers reload/retry |
| Database writes use a temporary file before replacement | Valid saves replace the database after writing the new JSON |
| Invalid full-state shapes are rejected and corrupt databases are preserved | A bad request or damaged file does not silently reset the workspace |
| Vitest and Playwright discover separate files | Each test runner executes its own suite |
| Browser tests use dedicated services and a separate database | Tests do not seed or reset the user's normal workspace |
| Git excludes installed packages, builds, local data and test output | Source changes are reviewable and installation uses the lockfile |
| `npm run verify` and a GitHub Actions workflow run the checks | Authors and reviewers can repeat the same verification |

PR #1 introduced the local backend. PR #2 supplied the frontend test foundation. The final integration fixes their test and persistence issues and incorporates the completed redesign. These local changes do not update or merge the GitHub pull request by themselves.

## Run the app

Install Node.js 22 or newer. In the Vank project folder, run:

```powershell
npm ci
npm start
```

Open **http://localhost:5173**. Keep the terminal open. Press **Ctrl+C** to stop the app. On Windows, `run.bat` and `start.bat` are launch shortcuts.

Use `npm start` for the complete application. `npm run dev` starts the frontend alone. See [INTEGRATION.md](INTEGRATION.md) for custom ports, an alternate database and the production frontend preview.

## Verify the changes

Install the test browser once, then run the full check:

```powershell
npx playwright install chromium
npm run verify
```

The command runs integration/API tests, real-backend browser tests and the production build. Detailed results are recorded in [REVIEW.md](REVIEW.md). [TESTING.md](TESTING.md) explains GitHub Desktop checkout, test data isolation, individual commands and troubleshooting.

For a short manual check, run the app and:

1. Open all four pages. Reload Planning and use browser Back to check routing.
2. Add a transaction on Ledger, reload, edit it and confirm its balance changes.
3. Add or manage a bank on Banks and cycle the card stack.
4. Save a budget, recurring item and savings goal; reload and confirm the values remain.
5. Try phone width: use the dock, open More and check the full-screen form actions.
6. Export CSV and inspect its records. Use disposable data for testing.

## Files behind the changes

| File or folder | Responsibility |
| --- | --- |
| `index.html` | Page sections, navigation, menus, forms and profile setup structure |
| `src/scripts/workspace.js` | Routing, card stack, overview, desktop account menu, phone dock and More |
| `src/scripts/app.js` | Startup, controller wiring, render updates, shortcuts and connection feedback |
| `src/scripts/state.js` | Workspace state, calculations, load/save queue and connection status |
| `src/scripts/api.js` | API requests and timeout handling |
| `src/scripts/ledger.js`, `charts.js`, `planner.js` | Ledger, category/budget summaries and planning |
| `src/scripts/modal.js`, `bankModal.js`, `budgetModal.js`, `onboarding.js` | Forms and profile setup |
| `src/styles/` | Workspace, card, ledger, planning, form and responsive styling |
| `server/index.js` | Local HTTP API and JSON database persistence |
| `tests/ui.spec.js` | Transaction, budget, card, planner, offline and page-routing flows |
| `tests/navigation.spec.js` | Responsive navigation, cards, keyboard/focus, phone forms, profile setup and motion |
| `src/**/*.test.js`, `server/**/*.test.js` | State, rendering, API client and real HTTP/database checks |
| `.github/workflows/verify.yml` | Verification on pull requests and pushes to `main` |
| `docs/` | Change summary, design decisions, integration reference, testing and review |

## Scope and release status

Vank remains a single-user local workspace. Virtual bank cards are records in the app. There is no real bank connection, authentication or multi-user conflict resolution. Offline browser edits are not automatically reconciled with server data; when the backend is reachable on a later load, its state takes precedence.

The finished redesign has been incorporated into the local integration. No GitHub push or merge has been performed. Before merging, publish the reviewed changes, check hosted CI and outstanding PR feedback, and complete the relevant manual checks. Local test results apply to the tested files; any later code changes need their affected checks repeated.
