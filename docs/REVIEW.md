# Integration review and validation

## Status

The completed redesign has been reconciled with the backend/test integration on `codex/final-integration`, based on PR #2 commit `5542b1797e3de239c3ee52869c0929c39609fb97`. Final local verification passed: 27 integration/API tests, 22 Chromium browser tests and the production build. The redesigned source and the earlier integration fixes are included together. No GitHub merge or push has been performed.

See [CHANGES.md](CHANGES.md) for the user-facing change summary and [UI_DESIGN.md](UI_DESIGN.md) for the recorded design decisions. The documentation and reconciliation fixes are also copied to the main Vank project folder.

## Issues addressed

| Finding | Change | Verification |
| --- | --- | --- |
| Vitest collected Playwright files and failed before finishing | Separate Vitest discovery from browser test discovery | `npm test` exits successfully |
| Integration tests launched real API requests and finished before their promises | Mock API boundaries, await initialization and pending saves | No unhandled storage errors |
| Browser sample data could be overridden by a running backend | Dedicated test services and an isolated database; seed the real API | Browser tests read persisted state after writes |
| The Windows shortcut started only the frontend | Start both services and check dependencies | Startup script reviewed; `npm start` smoke-tested |
| The frontend API URL was fixed to localhost:3001 | Same-origin `/api` client and configurable Vite proxy | Real backend browser flows and API client tests |
| Rapid full-state saves could reach the backend out of order | Capture immutable snapshots and serialize writes | Deferred-request ordering regression test |
| Successful backend writes had no current browser backup | Cache every save and loaded backend state | Offline reload and failed-save tests |
| Invalid database JSON was silently treated as an empty workspace | Return an error and preserve the corrupt file; replace valid files via a temporary file | Corrupt-database and invalid-state tests |
| Dependencies, bundles, test results, and sample workspace data were committed | Exclude these paths from Git while retaining local copies | Git tracking check |
| PR verification depended on undocumented manual steps | Add `npm run verify`, GitHub Actions, and run/test documentation | Full local verification command |
| The redesigned pages made old browser selectors target hidden sections | Navigate to the correct page and check desktop/mobile routing and history | Eight real-backend browser scenarios |
| Delayed form focus could steal input and save a card under the wrong name | Focus transaction, card and budget forms immediately when opened | Browser tests check field values and persisted records |
| Fixed phone form footers placed submit buttons outside the form element | Browser selectors target the associated modal submit button | Real transaction and budget writes still pass |
| Immediate dialog focus changed the element seen by the asynchronous focus observer | Remember the last focused background control before opening a dialog | Closing the phone budget form restores focus to More |

## Local validation results

| Check | Result |
| --- | --- |
| Clean locked dependency installation (`npm ci`) | Passed |
| State integration | 11 passed |
| Ledger rendering | 3 passed |
| API client | 3 passed |
| Real API and file persistence | 10 passed |
| Chromium data integration and routing (`tests/ui.spec.js`) | 8 passed |
| Chromium redesign/navigation (`tests/navigation.spec.js`) | 14 passed |
| Production build | Passed |
| Combined `npm run verify` | Passed against the completed redesign and integrated source |
| Complete startup and API proxy smoke check | Passed on separate ports while another session was running |
| Final redesign reconciliation | Completed; form focus fixes retained and final navigation suite included |
| Hosted GitHub Actions | Not run; workflow is prepared locally |

The browser tests validate transaction add/reload/edit/delete, budget spending, card opening deposits, planner persistence, filtering, offline browser persistence, all four pages, and browser history/reload. The redesign suite adds seven viewport widths, centered card cycling, keyboard activation, account placement, dock indicators and scroll behavior, full-screen phone forms, focus restoration, profile setup, reduced motion, a CSV download event and offline retry. Tests use the real local backend except in the explicitly simulated-offline scenarios. Final verification used ports 4337/4338 and an isolated database.

## Remaining checks and limitations

The automated profile test completes five setup steps from an existing test profile; check fresh-workspace onboarding manually. Inspect exported CSV contents and behavior with unusual real data and browsers/devices outside the Chromium fixtures. [TESTING.md](TESTING.md) provides the manual acceptance checklist. Repeat affected checks if code changes after this verification.

The app remains a single-user local workspace. It has no authentication, automatic offline/server reconciliation, or conflict resolution between simultaneous browser sessions. These boundaries are documented in [INTEGRATION.md](INTEGRATION.md); passing tests do not make this a hosted banking service.

## Before merging

1. Review the combined source diff and this validation report.
2. Complete the manual checks relevant to the final changes.
3. Push the reviewed integration and check hosted CI and outstanding PR feedback.
4. If the source changes, rerun its affected checks before merging.
5. Merge the reviewed version. The original open PR #2 does not yet contain these local fixes.

## Documentation checks

- R-02 PASS: the new change summary uses plain punctuation and direct task descriptions.
- R-36 PASS: source files and actual command results support the page, persistence and test claims; hosted CI is explicitly recorded as not run.
- Links PASS: all local Markdown links in the README and documentation resolve to existing files.
