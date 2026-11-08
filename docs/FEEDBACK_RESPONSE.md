# External testing feedback and workbook answers

Reviewed on November 8, 2026. Both supplied links point to the same workbook and tab:

[Functional Testing Workbook](https://docs.google.com/spreadsheets/d/1l7f3hfkSReWWe8j2CM_-_n6iVbKupTOe-tFkSoFEFj8/edit?gid=1634033696#gid=1634033696)

The connected personal Drive accounts could not access this school-domain workbook. It was reviewed and updated through the existing signed-in school browser. Completed responses were entered in Project Information C12, Internal Testing B9:H16 and D21:H24, and Revision and Improvement Summary B8:D11 and C21:D24. The external tester's results and team contribution entries were preserved.

## What the external tester actually reported

The `External Testing Results` tab contains two completed cases:

- TC-01 passed: moving from Ledger to Overview displayed cards, summaries and recent transactions, with `#overview` in the URL.
- TC-02 passed: searching for `Office lunch` with All accounts selected and no restrictive filters displayed one matching expense of ₱250. The tester did not reproduce the earlier search failure.

The recommendations in D24 are to test no-match search, capitalization, combined filters, and navigation on desktop and mobile. These are coverage recommendations, not four reported application failures.

At the initial review, the internal test tab had sample Home/search rows, including a search Fail. The revision tab said `Search logic corrected` and `Review submission not saved`. Those sample entries have been replaced with the verified scenarios and findings below; the review-submission feature is not part of Vank's current workflow.

## Changes made

Expanding the tests revealed a separate reproducible search defect: a saved transaction whose memo is null or missing caused `toLowerCase()` to throw. This was reproduced in two failing integration tests before the fix. Search now treats absent text fields as empty strings and preserves case-insensitive matching, whitespace trimming and existing filters. This does not prove that missing memos caused the tester's earlier search report.

The new browser cases use four disposable transactions, including an `Office lunch` expense of ₱250 with a null memo, plus a second card. They run at 1440 × 900 and 390 × 844 against both the real local API and the built browser-only Pages version. They check matching results and amounts, mixed capitalization, surrounding whitespace, empty results, clearing search, combined filters, clearing the card filter, navigation and reload. Pages cases also assert that no API requests occur. All cases check for browser JavaScript errors.

The fix and tests were committed as `4b181af`, fast-forward merged into `main`, and pushed using the CheDT account. GitHub verification and the Pages deployment both succeeded for that commit. Work used an isolated checkout based on `origin/main` at `cef2be1`. The original checkout remains on `pr/2`; its existing generated-file changes were not altered.

## What your team needs to fill in (sagutan)

### Project Information

| Cell | Suggested response or action |
| --- | --- |
| C11 | Paste the real recorded validation walkthrough link after recording it. This is currently blank. |
| C12 | Vank Expense Planner helps users organize income, expenses, virtual bank cards, category budgets and financial plans. It includes Overview, Banks, Ledger and Planning pages. The GitHub Pages version saves workspace data in the current browser on the device. Running the complete app locally uses an Express.js API with JSON file storage. |
| C13:D14 | Confirm each member's actual name and spelling. The workbook uses different spellings for Ana Marie/Anna Marrie; confirm the correct version. Leave unused member slots blank. |

### Functional Test Cases and Internal Testing

The sample rows in B9:H16 were replaced with the eight regression scenarios below, explicitly labeled as automated Chromium execution on November 8, 2026, commit `4b181af`. These are not a claim that every team member manually performed them. If manual execution is required for the assessment, run the steps yourselves and record your own results and evidence.

Precondition: use the test fixture from `searchFeedbackState()` in an isolated test workspace. It contains `Office lunch` (expense, Maya, General, ₱250), `Office lunch personal` (expense, GCash, General, ₱150), `Office lunch refund` (income, Maya, General, ₱100), and `Office supplies` (expense, Maya, Equipment & Office, ₱75). Start on Overview with All accounts and no active filters. Do not replace a personal workspace with test data.

| Test ID | Feature | Scenario / steps | Expected and verified result |
| --- | --- | --- | --- |
| TC-01 | Desktop search | At 1440px, search `Office lunch`, `OFFICE LUNCH`, `oFfIcE LuNcH`, then `  office lunch  `. | Each query opens Ledger and displays three matching rows, including the ₱250 expense; no JavaScript errors. |
| TC-02 | Desktop no-match search | Search `no-such-transaction`, clear it, then reload. | No matching transactions and zero rows, then all four rows return and remain after reload. |
| TC-03 | Desktop combined filters | Search `office`; choose Expenses, General category, then GCash card. Choose Income, clear the card filter, then clear category and choose All. | Row counts are 3, 2, 1, 0, 1, then 4. The final income match before reset is Office lunch refund. |
| TC-04 | Desktop navigation | Search from Overview, then use the rail to return to Overview and reload. | Ledger opens on search; Overview appears after navigation and reload, with one workspace page visible. |
| TC-05 | Phone search | Repeat TC-01 at 390px. | Same three matches and ₱250 expense; no JavaScript errors. |
| TC-06 | Phone no-match search | Repeat TC-02 at 390px. | Same empty-state and four-row recovery behavior. |
| TC-07 | Phone combined filters | Repeat TC-03 at 390px. | Same row counts and filter recovery behavior. |
| TC-08 | Phone navigation | At 390px, search from Overview, then return through the bottom navigation and reload. | Overview appears after navigation and reload, with one workspace page visible. |

Use separate Expected and Actual columns in the workbook. The result descriptions above can be used for Actual only after the automated run has passed, or after your own manual run confirms them. Set the status to Pass only for the execution being recorded. In Notes, identify automated Chromium execution, the branch/commit, viewport, date, and whether the run used the local API or Pages preview.

Suggested internal summary responses after the successful verification:

| Row | Response |
| --- | --- |
| 21: Number executed | 8 browser scenarios executed against the local API and repeated against the built Pages preview, for 16 browser executions. Record the separate unit/API and broader browser suite totals as additional evidence, not as manual workbook cases. |
| 22: Features validated | Matching and case-insensitive search, whitespace handling, no-match feedback, restoring rows after clearing search, combined type/category/card filters, and Ledger-to-Overview navigation on desktop and phone. |
| 23: Issues identified | Additional internal regression testing found that searching a saved transaction with a null or missing memo caused an error. The external tester's earlier search failure was not reproduced in their two-case run. |
| 24: Improvements | Handle absent transaction text safely and retain automated desktop, phone and production Pages regression tests. Ask the external tester to rerun the expanded cases after the changes are deployed. |

### External Testing Results

Keep the tester's two Pass results and their observations. Do not replace the external tester's Actual or Status cells with this development run. The assigned tester should add any retest observations themselves. The heading `Internal Testing Summary` appears inside this external tab; ask the workbook owner whether to rename it to `External Testing Summary`.

F10 has an extra `transaction.` prefix in its observed-result sentence. Ask the tester to correct that typo if needed; it does not change the Pass result.

### Revision and Improvement Summary

The unsupported sample entries were replaced with the four items below in B8:D11. The original external search report remains traceable as not reproduced; it is not described as definitively fixed by the missing-memo change.

| Issue / recommendation | Source | Action taken |
| --- | --- | --- |
| Earlier search returned no results | Earlier internal sample; external TC-02 retest | External tester did not reproduce the failure. Retained the external Pass and added focused search regression coverage. |
| Search errors when a saved memo is absent | Additional internal regression testing | Reproduced null and missing memo failures, handled absent text safely, and added regression tests. |
| Expand no-match, capitalization and combined-filter coverage | External Testing Results, D24 | Added shared browser scenarios for both local API and production Pages storage. Verified empty-result recovery and explicit filter clearing. |
| Check navigation on desktop and mobile | External Testing Results, D24 | Added Ledger-to-Overview checks at 1440px and 390px, including reload. |

Suggested summary for C21:C24, using the four tracked entries above:

| Cell | Response |
| --- | --- |
| C21 | 4 tracked items: 1 earlier report not reproduced, 1 new internal defect, and 2 recommendations. |
| C22 | 1 defect fixed and 2 recommendations implemented; the earlier report was reviewed and not reproduced by the external tester. |
| C23 | 0 implementation items deferred in this review. Independent external retesting remains pending. The team must add the recorded validation walkthrough and complete personal contribution/rating fields. |
| C24 | Safer search for saved records with absent memos; expanded search/filter coverage; desktop and phone navigation checks; production Pages regression coverage and workbook guidance. |

### Team Contributions Table

Each member must supply their own actual contributions, evidence and self-rating. Teammates supply peer ratings using the workbook's scale. Do not invent ratings, assign this code work to someone who did not do it, or list only coordination as proof of development/testing work. Ana Marie's existing entry says she answered the External Testing Results; confirm whether she was the assigned tester before changing it.

You still need the recorded walkthrough link, confirmed member names, factual individual contributions and ratings, plus any mentor-required manual retest evidence. The original external-test sheet should retain the tester's independent results.

## Verification

Verified locally on November 8, 2026:

| Check | Result |
| --- | --- |
| Unit, integration and real API tests | 37 passed |
| Browser tests with the local API | 39 passed |
| Production Pages browser tests | 11 passed |
| Standard and Pages production builds | Both succeeded |

Total: 87 passing automated tests. The new coverage adds 2 integration cases and 16 browser cases to the previous suite. The same eight browser scenarios run once in each storage mode.

Run from this checkout:

```powershell
npm ci
npx playwright install chromium
npm run verify
npm run test:pages
```

`npm run verify` checks integration/API tests, the local browser suite and the standard production build. `npm run test:pages` builds and tests `/Vank/` without a backend. These local checks do not establish an independent external retest. Separately, [GitHub verification](https://github.com/CheDT/Vank/actions/runs/42478401506) and [Pages deployment](https://github.com/CheDT/Vank/actions/runs/42478401569) succeeded for `4b181af` after it was pushed to `main`.
