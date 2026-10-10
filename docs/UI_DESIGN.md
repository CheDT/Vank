# Vank UI redesign

Reviewed on 11 October 2026 using the Anti Slop core, UI, mobile, copywriting, and accessibility skills.

## Design read

Vank is a daily money workspace. The user needs to select a bank, review entries, and record income or expenses. Their brief supplies the direction: black and white, a compact desktop rail, a mobile dock, distinct pages, and physical bank cards as the central visual. Their later reference requests smaller geometric cards and smooth page and surface entrances. The guide and repeated explanations distract from these tasks and have been removed from the workspace. The user then approved Google Workspace / Material guidance for spacing, component consistency, loading, saving, and refreshing, applied within this existing design.

ENERGY 1 / RHYTHM 2 / MOTION 2. Quiet surfaces, clear spacing between different tasks, and short transitions for navigation and opening surfaces. Card selection remains animated. Reduced-motion preferences remove both animations and transitions.

## Decisions and purpose

- Overview is the default page; Banks, Ledger, and Planning have separate routes. Reload and browser history retain the selected destination.
- The desktop rail is 64 px wide. Its account button sits at the bottom; tooltips and accessible names identify the icon destinations.
- The phone dock uses 48 px circular inactive buttons. The selected destination expands to reveal its name, and one black indicator slides behind it. More opens the account and secondary actions. Scrolling down hides the dock; scrolling up restores it.
- Text actions use small rectangular buttons; icon-only actions use circles. Different radii distinguish containers, text actions, and icon actions.
- Add controls use centered SVG marks and 8 px icon-to-label spacing. The phone Add control has even 14 px padding in a 48 px circle. Card menus use a 28 px face and 14 px dots with a transparent 48 px tap area, keeping the control compact inside the card.
- Cards use a compact 1.6 aspect ratio, institutional logos, masked numbers, a chip, network mark, holder, and actual balance. The user-supplied geometric reference gives the card pattern its purpose. The fan stays centered, and clicking or keyboard activation cycles cards without rebuilding their elements.
- The workspace palette is black, white, and neutral grays. Existing bank card colors remain selectable as an account preference, separate from the workspace colors.
- Segoe UI matches the user's Windows environment and keeps dense labels readable. The retained card type and monospace numbers serve physical card recognition and alignment of financial values.
- Shadows identify stacked physical cards, the mobile dock, and actual overlays. Ordinary content panels use borders.
- Tab content fades in over 200 ms with 6 px of movement. Forms and menus enter over 160–200 ms. Profile steps use 180 ms. These transitions confirm a navigation or opening action. Progress bars and save spinners animate only while real work is pending; reduced motion makes them static while retaining status text.
- Mobile forms and More fill the screen. Headers and form actions stay visible while fields scroll. Profile setup uses the same spacing and a fixed action bar; selection no longer advances a step automatically.
- Spending by category uses actual transaction totals. The unsupported pseudo-weekly chart and redundant allocation view were removed.
- Search, workspace filters, bank filters, CSV export, budgets, planning, and browser-local offline edits retain their existing behavior.

## Verification

- Production build passed.
- 32 data and backend tests passed, including cached startup, queued saves, offline recovery, and edits overlapping a refresh.
- Final integration verification passed 31 browser tests against an isolated test database: 14 redesign/navigation scenarios, 8 data/routing scenarios, and 9 loading/saving/spacing scenarios. These cover navigation/history, cards and keyboard activation, desktop account placement, mobile dock expansion and indicator alignment, scroll hide/show, full-screen forms, profile completion, focus management, real saving/reloading, filters, downloads, offline storage, pending saves, retries, drafts, and reduced motion. See [REVIEW.md](REVIEW.md) and [CHANGES.md](CHANGES.md) for the earlier integration review.
- All four pages were checked at widths 320, 390, 600, 760, 820, 1024, and 1440 px without horizontal overflow.
- The compact card fan was checked within 2 px of its container center; phone cards were checked at 320 px with reduced motion.
- Actual app screenshots were reviewed for desktop and phone layouts. The read-only capture reported zero page errors. Evidence is in `test-results/ui-preview/`.
- Text contrast: muted text 5.84:1, secondary text 7.03:1, rail marks 9.21:1, card labels against the brightest patterned card surface 5.10:1, and primary button text 19.90:1. Input boundaries against white are 3.54:1.
- `git diff --check` passed.
- After the final label and composite-focus cleanup, the build and four focused browser checks passed again: spacing/touch targets, centered moving cards, fullscreen phone forms, and page/dialog motion with reduced motion.

### Button spacing refinement

- R-03 PASS: the Add and card-menu controls were measured and visually reviewed at 320, 390, and 1440 px; each layout had zero horizontal overflow after resize settled.
- R-26 PASS: Add opens the transaction form; the card menu opens bank management even when clicking its expanded tap area. The existing card-motion and mobile-form browser checks both passed.
- R-32 PASS: the phone Add icon remains centered; card menus have a 48 px tap area and a visible keyboard focus outline despite the smaller face.
- R-35 PASS: the production build passed; the latest read-only actual app capture recorded zero page errors and zero horizontal overflow at 320, 390, and 1440 px. Screenshots are `test-results/ui-preview/live-overview-320.png`, `live-overview-390.png`, and `live-overview-1440.png`.

### Workspace / Material refinement

- Spacing uses shared 4/8/12/16/24/32 px tokens. Desktop content has 24 px side padding and phone content has 16 px, aligning headers, rows, and forms around the same edges.
- Text roles use 24/32 px page titles, 18/24 px section titles, 14/20 px body text, and 12/16 px supporting text. Phone inputs use 16/24 px. Segoe UI and tabular financial figures remain appropriate for the existing Windows workspace.
- Text controls use 8 px corners, content panels use 12 px corners, overlays use 16 px, and icon controls remain circular. This distinguishes actions from content without introducing a new theme.
- Touch controls use 48 px targets; card menus retain their 28 px face. Phone card-color swatches reflow into three columns to accommodate those targets.
- First load displays placeholders shaped for the selected page, plus a labeled, indeterminate header progress bar. Cached balances appear immediately when available. Existing content stays visible while refreshing, so missing data never appears as a fabricated zero.
- Forms keep their save action visible with a spinner and Saving text until the real request finishes. The button keeps its width, and only its duplicate submission is disabled. Sync-only notifications avoid rebuilding content or discarding focused fields.
- Saved means the server accepted the snapshot. Saved on this device means browser storage succeeded while the server failed. Failure of both destinations displays a recoverable error rather than a success message.
- Retry sends the existing snapshot without reloading or duplicating entries. Pending browser edits are marked separately and restored on the next load. A refresh response cannot overwrite edits made while its request was pending.
- Refresh data is available in the desktop account menu and phone More menu. Refresh keeps the page, filters, valid bank selection, and planner drafts.
- Composite search and amount fields use one visible focus outline on their enclosing control. Amount and budget labels follow the supporting-text role and omit the redundant hardcoded currency name.
- These are Vank's CSS measurements, adapted from Material concepts rather than claimed as exact Google Drive pixels. References: [Workspace refresh](https://workspaceupdates.googleblog.com/2023/03/refreshed-ui-google-drive-docs-sheets-slides.html), [spacing](https://m2.material.io/design/layout/spacing-methods.html), [typography](https://developer.android.com/develop/ui/compose/designsystems/material3), [touch targets](https://support.google.com/accessibility/android/answer/7101858), and [motion](https://m3.material.io/styles/motion).

### Interaction evidence for this refinement

- Initial loading -> navigation changes the destination, placeholders match it, writes wait for data, and no zero-valued metrics are shown.
- Cached startup -> balances stay visible until the newer server values arrive.
- Transaction submit -> Saving appears, its button stays disabled and stable in width, a repeated submission adds no duplicate, and the successful response closes the form.
- Offline submit -> Saved on this device appears; Retry persists the same entry while retaining another open form's draft.
- Refresh -> current values remain visible during the fetch; the selected page and unsaved planner fields survive the new response.
- Planner submit -> the pending button stays visible; edits to another planning form survive completion and can be submitted.
- Both storage destinations unavailable -> Couldn’t save appears; Retry recovers the in-memory entry after the server returns.
- Reduced motion -> loading and saving remain announced while their animations are disabled.
- Mobile controls -> Add is 48 px, card menu face is 28 px with a 48 px hit area, inputs are at least 48 px with 16 px text, and the fullscreen form retains reachable footer actions.

## Anti Slop delivery gate

The gate covers the redesigned workspace, its reachable forms, and profile setup. Existing data/API work is preserved. Each PASS below refers to that scope.

### Hard gate

- R-02 PASS: redesigned copy uses plain punctuation; the empty profile avatar uses initials or U.
- R-03 PASS: all four pages passed seven viewport checks; full-screen phone forms passed boundary and footer checks at 320 px.
- R-17 PASS: balances, metrics, and category totals come from application state; planning projections distinguish actual and recurring amounts.
- R-18 PASS: no testimonial or invented person was introduced; profile initials come from the stored name.
- R-23 PASS: navigation, icon buttons, card geometry, and pattern follow the user's explicit instructions and image references; existing bank marks were reused.
- R-24 PASS: Overview, Banks, Ledger, and Planning are real routes and passed reload/history tests.
- R-25 PASS: measured text pairs exceed 4.5:1; the darkest and brightest card cases were included in the palette review.
- R-26 PASS: browser tests exercise navigation, menus, form saves, edit/delete, bank management, profile actions, filters, export, and retry.
- R-27 PASS: fresh/filtered empty states, page-specific loading, cached refresh, Saving, Saved, local-only saves, and recoverable failures are present; nine browser scenarios exercise those states and their recovery paths.
- R-28 PASS: no FAQ is part of the workspace.
- R-32 PASS: Tab, Enter, Space, and Escape have working behaviors; overlays trap focus, restore it, and isolate the background; focus outlines remain visible.
- R-33 PASS: changes were written to source through patches; no external source-rewriting script was used.
- R-34 PASS: the user requested one monochrome workspace theme; no theme toggle is present.
- R-35 PASS: the app was built and run; 31 browser tests and recorded app captures provide interaction and visual evidence, including the action/result list above.
- R-36 PASS: no security, compliance, customer, or performance claim was added.
- R-37 PASS: the user's written brief and three sets of UI/card references supply concrete direction; the design read and dials document it.
- R-38 PASS: live-overview screenshots use existing application records; workspace screenshots and tests use a separate seeded test database; no fictional activity or unsupported trend is added to the product.

### Purpose gate

- R-01 PASS: gradients are limited to selectable physical bank cards and the chip material; workspace surfaces are flat neutrals.
- R-04 PASS: home, card, ledger, planning, search, edit, duplicate, delete, and More marks describe their actual actions; decorative tutorial marks were removed.
- R-06 PASS: system typography supports dense task labels; card typography and aligned numbers have a recorded physical-card purpose.
- R-07 PASS: the geometric pattern is confined to the cards and follows the user's black patterned card reference.
- R-08 PASS: decorative save/next arrows were removed; directional marks remain for income/expense, Back, and download.
- R-09 PASS: compact BIZ/PERS and tax labels represent stored classification; no promotional capsule is added.
- R-10 PASS: redesigned workspace, forms, menus, and setup use opaque surfaces without glass effects.
- R-12 PASS: shadows are restricted to cards, the dock, and actual overlays; content panels use borders.
- R-13 PASS: no glow is added to the redesigned interface.
- R-14 PASS: a centered card fan, a metric stripe, ledger rows, source breakdowns, and planning forms use different compositions for different tasks.
- R-19 PASS: motion follows the explicit user request; page/dialog and reduced-motion behavior passed browser checks.
- R-22 PASS: no unrelated illustration is used; physical card details follow the provided references.

### Liveliness

- Dials PASS: ENERGY 1 / RHYTHM 2 / MOTION 2 are declared and matched by quiet surfaces, varied task layouts, and short interaction transitions.
- Focal points PASS: Overview emphasizes the bank fan; Banks emphasizes selection/management; Ledger emphasizes records; Planning emphasizes editable plans.
- Whitespace PASS: 16–24 px page padding and shared 8/16/24 px gaps separate hierarchy; phone forms align to the 16 px page edge.
- Accent PASS: black marks the selected destination, the main action, and net cash flow within the otherwise neutral workspace.
- Identity PASS: physical cards, masked account numbers, aligned financial amounts, and the card pattern connect the pages to bank tracking.
- Design read PASS: the concrete user brief supplies the design direction and is recorded above, including the later animation request.

### Craftsmanship and consistency

- C-1 PASS: color, typography, radii, spacing, card details, and motion have task or user-reference reasons recorded above.
- C-2 PASS: interaction tests cover the redesigned controls and real persistence; unsupported login entry points were removed from setup.
- C-3 PASS: the guide, duplicate action text, duplicate bank presets, and unsupported chart were removed; remaining sections serve bank tracking or planning.
- C-4 PASS: phone/tablet/desktop, keyboard, filtered/empty, offline, and reduced-motion checks passed.
- C-5 PASS: financial summaries use source state and named projection components rather than invented claims.
- R-05 PASS: each page is organized around its distinct bank, record, or planning task; the original all-sections dashboard flow was split.
- R-11 PASS: circular icons, expanded navigation segments, rectangular text actions, and modest container corners have different roles.
- R-15 PASS: actions name their result, including Add bank, Save transaction, Save budget, Export, and Save plan.
- R-16 PASS: redesigned visible copy uses direct task labels and omits marketing buzzwords.
- R-20 PASS: centered physical bank cards, bank-linked ledger filtering, and financial planning determine the composition.
- R-21 PASS: black and white were explicitly requested; light content and a black rail implement that direction.
- R-29 PASS: workspace neutrals form the core palette; institutional marks and stored optional card colors retain their bank identity purpose.
- R-30 PASS: the requested compact rail borrows the navigation density of the reference; the card-centered financial pages and phone dock are specific to Vank.
- R-31 PASS: every major visual decision has a one-line purpose in the decisions section.
