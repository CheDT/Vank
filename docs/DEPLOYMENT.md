# GitHub Pages deployment

Vank supports two builds. `npm start` runs the local frontend and Express API, saving to `server/db.json`. The GitHub Pages build saves directly in the browser and makes no API requests. GitHub Pages hosts static files and cannot run the Express server.

## What changed

- `.env.pages` selects browser storage for `npm run build:pages`. The normal local build keeps backend integration.
- `StateManager` loads and saves the existing browser storage key without contacting `/api` in Pages mode. Existing data at the same browser origin remains available.
- Successful Pages saves show “Saved on this device”. They do not show a server warning or ask the visitor to retry a successful save. Blocked browser storage still reports a save failure.
- The deployment workflow uploads only the built `dist/` directory. Built CSS and JavaScript have content hashes in their filenames, so a new deployment loads new assets rather than relying on cached source files.
- The workflow sets the repository base path (`/Vank/`) and tests that built version before publishing.

## Publish using GitHub Desktop

1. Review and commit the deployment changes in GitHub Desktop, then push using an account with write access to **CheDT/Vank**.
2. Merge the changes into `main` after the verification checks pass.
3. As a repository administrator, open **Settings → Pages → Build and deployment → Source** and select **GitHub Actions**. The old “Deploy from a branch / main / root” setting publishes source files rather than this tested build.
4. Open **Actions → Deploy Vank to GitHub Pages**. A push to `main` starts it automatically. If the source setting was changed after the push, use **Run workflow** on `main`.
5. Wait for both the build and deploy jobs to succeed, then open https://chedt.github.io/Vank/. Refresh once if the previous page was already open.

The deployment workflow verifies the local app, builds and tests the Pages version, then publishes the same tested artifact. `verify.yml` remains the pull request verification workflow.

## Test the Pages build locally

After `npm ci` and `npx playwright install chromium`, run:

```powershell
npm run test:pages
```

This builds production assets under `/Vank/`, starts a preview on port 4347, and checks:

1. Hashed assets, the compact navigation rail, and all four phone routes load without API requests or resource errors.
2. A transaction saves in browser storage and remains after reload.
3. A first-time visitor completes onboarding and retains the profile after reload.

For a manual preview:

```powershell
$env:VANK_BASE_PATH = '/Vank/'
npm run build:pages
npm run preview -- --port 4347 --strictPort
```

Open http://127.0.0.1:4347/Vank/. Stop the preview with Ctrl+C. This build needs no running backend. Run `npm start` to test the local backend version; run `npm run verify` to check its automated suite.

## Data and configuration

Pages data is stored in this browser on this device. Different devices, browser profiles, and origins have separate data; localhost data does not automatically appear on GitHub Pages. Clearing site storage removes it. CSV export backs up transaction records, not the entire workspace. No workspace data is uploaded by the deployment workflow.

| Setting | Purpose |
| --- | --- |
| `VITE_STORAGE_MODE=browser` | Build-time switch that disables API loading and saving; set by the committed, non-secret `.env.pages` file |
| `VANK_BASE_PATH=/Vank/` | Build and preview path for this repository; set automatically by the workflow |
| `VANK_PAGES_TEST_PORT=4347` | Optional alternative port for the Pages tests |

## Validation and release status

On October 11, 2026, all 35 unit/integration/API tests, 31 local backend browser tests, and 3 production Pages browser tests passed locally. Both production builds succeeded. The Pages tests verified zero API calls and successful persistence after reload. These results do not confirm that the hosted deployment has run.

At preparation time, Pages still used `main` at `/` with the legacy branch deployment. The available GitHub account had read access but no push or administration permission; its browser could not open the repository's Pages settings. Publishing requires the write/admin account to push the changes and select GitHub Actions as described above.

## References

- [GitHub Pages custom workflows](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages)
- [Vite deployment to GitHub Pages](https://vite.dev/guide/static-deploy.html#github-pages)
