# Testing Vank before merging

## First-time setup

From the project directory, install Node.js 22 or newer, then run:

```powershell
npm ci
npx playwright install chromium
```

On Linux CI, use `npx playwright install --with-deps chromium`. Browser installation is separate from `npm ci`.

## One command for final verification

```powershell
npm run verify
```

This runs three checks in order and stops at the first failure:

1. `npm test`: state calculations, ledger rendering, API client behavior, and real HTTP/database tests.
2. `npm run test:e2e`: Chromium tests against a real frontend and backend.
3. `npm run build`: production frontend compilation.

A passing assertion count alone is insufficient: each command must finish with exit code 0 and no unhandled errors. Do not silence errors merely to obtain a green result.

## Test coverage and isolation

| Suite | Coverage | Data source |
| --- | --- | --- |
| `src/scripts/state.integration.test.js` | Loading, balances, edit/delete calculations, opening deposits, filters, planner state, browser fallback, blocked storage, ordered snapshots | Mocked API, isolated browser storage |
| `src/scripts/ledger.integration.test.js` | Rows, count, filtered empty state, HTML escaping | Mocked API and DOM |
| `src/scripts/api.test.js` | Same-origin requests, JSON writes, HTTP errors, encoded categories | Stubbed fetch |
| `server/index.test.js` | Full-state persistence across server instances; transaction, card, budget, profile and planner routes; missing IDs; invalid/corrupt state | Real HTTP and temporary JSON database |
| `tests/ui.spec.js` | Overview/form, transaction add/reload/edit/delete, budgets, cards, planner, filtering, phone form, offline persistence, four-page navigation and browser history | Real API plus one explicit simulated-offline scenario |
| `tests/navigation.spec.js` | Page history, card centering/cycling, account placement, keyboard/focus, seven viewport widths, phone dock behavior, full-screen forms, profile setup, reduced motion, search, export download and offline retry | Real API and isolated seeded state |

Vitest discovers only `src/**/*.test.js` and `server/**/*.test.js`. Playwright owns `tests/**/*.spec.js`; the runners do not collect each other's tests.

Browser tests run sequentially because the backend uses one test workspace. Before each test, sample state is written to the test API. The test frontend uses port **4317**, the test API uses **4318**, and the database is **`test-results/backend/db.json`**. Tests refuse to reuse an existing server, so a normal Vank session cannot be mistaken for the test environment. API tests use temporary directories and ephemeral ports.

`test-results/` can contain the test database, traces, screenshots, and last-run metadata. It is excluded from Git. No test uses the normal `server/db.json`.

If another checkout is running its browser tests, use separate ports in this terminal:

```powershell
$env:VANK_TEST_FRONTEND_PORT = '4337'
$env:VANK_TEST_BACKEND_PORT = '4338'
npm run verify
```

To watch the browser suite:

```powershell
npm run test:e2e:headed
```

To inspect a failed trace:

```powershell
npx playwright show-trace 'test-results/<failed-test-folder>/trace.zip'
```

Replace the placeholder with the actual folder reported by Playwright.

## Manual acceptance checklist

Run `npm start` and open http://localhost:5173. Use a disposable workspace or an alternate `VANK_DB_FILE` when creating test records.

| Action | Expected result |
| --- | --- |
| Start with no saved workspace | Onboarding appears; completing it creates the profile and first card |
| Open Overview, Banks, Ledger and Planning | Only the chosen page appears; refresh and browser Back preserve navigation |
| Add an income of 5,000 and expense of 250 to the same card | Income, expenses, ledger and card balance update correctly |
| Refresh after a save completes | The profile, cards and records remain |
| Edit the expense to 300 | Expense totals and card balance change by 50 |
| Duplicate a transaction | A separate record appears and totals recalculate |
| Delete a transaction | Record disappears; totals update and remain correct after refresh |
| Search and filter by type, classification, category and card | Only matching transactions and metrics appear |
| Add a category budget of 5,000 | Limit appears; matching expenses increase its spent amount |
| Add or edit a virtual card | Card details persist; opening deposits are counted once |
| Save planner targets, a recurring bill and a goal | Values and entries remain after refresh |
| Try a phone-sized viewport | Navigation and transaction form remain usable |
| Scroll the phone Ledger page down, then up | Dock hides and returns; hidden dock controls cannot receive keyboard focus |
| Open a phone form from More, then close it with Escape | Header/actions stay visible while fields scroll; focus returns to More |
| Enable reduced motion in the operating system | Pages, dialogs and card selection remain usable without entrance motion |
| Export CSV | Download contains the intended transactions |
| Start frontend only with `npm run dev` | Backend is unavailable; cached data can be used and browser changes survive reload |

The automated responsive checks cover all four pages at widths 320, 390, 600, 760, 820, 1024 and 1440 px. They also cover phone forms, the five-step profile setup flow, a CSV download event/filename and reduced motion. Inspect actual CSV contents, fresh-workspace onboarding, long/unusual real records and browser/device variations manually; these are broader than the automated fixtures.

## Review a PR using GitHub Desktop

1. Select the Vank repository.
2. Open **Current Branch → Pull Requests** and select the requested PR.
3. Confirm that this is the latest PR version. If Desktop reports local changes, preserve or stash your work before switching branches.
4. Open the repository folder in a terminal.
5. Run `npm ci`, then `npm run verify`. Install Playwright's Chromium if this is your first browser run.
6. Run `npm start` and perform the manual checks relevant to that PR.
7. Review the source diff, test results, and outstanding comments on GitHub.
8. Stop the app before switching back to your original branch.
9. If the author pushes another change, update the PR checkout and repeat the affected checks before merging.

Checking out and testing a PR does not merge it. Tests may create ignored files, but dependencies, build output and workspace data should not appear as new source changes in this integrated version.

## Automated checks on GitHub

`.github/workflows/verify.yml` runs `npm ci`, installs Chromium, and executes `npm run verify` for pull requests and pushes to `main`. On failure it uploads test output for inspection. This workflow only takes effect after it is pushed; a successful local run is not a claim that hosted CI has already passed.

Merge after required checks pass, outstanding findings are resolved, and the changed behavior has been reviewed. The green GitHub mergeability indicator only means there are no detected merge conflicts.

## Troubleshooting

| Symptom | Action |
| --- | --- |
| Missing packages or test command not found | Run `npm ci` in the correct PR folder |
| PowerShell blocks `npm.ps1` | Use `npm.cmd` and `npx.cmd` for the same commands |
| Playwright says browser executable is missing | Run `npx playwright install chromium` |
| Ports 4317/4318 are in use | Set separate test ports as shown above, or stop your own earlier test run; tests intentionally refuse to reuse another server |
| Normal port 5173/3001 is occupied | Stop the previous Vank session or configure `PORT` and `VANK_FRONTEND_PORT` as described in INTEGRATION.md |
| `npm run dev` opens the app but backend saving is unavailable | Use `npm start` for the complete app |
| API returns 500 and reports invalid JSON | Preserve the database and restore a known-good backup; do not replace it with test fixtures |
| Static hosted demo has no backend | Test backend persistence locally; GitHub Pages does not run Express |
| Previously cached records appear missing | Check the browser origin; when reachable, backend state takes precedence over cached state |

## References

- [Vitest test discovery](https://vitest.dev/config/include.html)
- [Vitest module mocking](https://vitest.dev/guide/mocking/modules.html)
- [Playwright managed web servers](https://playwright.dev/docs/test-webserver)
- [Vite API proxy](https://vite.dev/config/server-options.html#server-proxy)
- [GitHub Desktop pull request checkout](https://docs.github.com/en/desktop/working-with-your-remote-repository-on-github-or-github-enterprise/viewing-a-pull-request-in-github-desktop)
