# SSU Bangladesh Repository Replacement and GitHub Pages Design

## Objective

Replace the entire published state and history of `tnibir/SSU-Bangladesh` with the contents of the current local folder, then publish the static website in `NSIS-Current State & Projection` at `https://tnibir.github.io/SSU-Bangladesh/` without losing its styling or interactive behavior.

## Scope

The new repository will contain the current local PDFs, Word documents, ZIP archives, LaTeX project, website source, deployment workflow, verification tooling, and project documentation. The transient Microsoft Office lock file whose name starts with `~$` and macOS `.DS_Store` metadata will not be committed.

The previous remote files and commits will not be retained on `main`. The replacement will use a new unrelated Git history and a force push, as explicitly requested by the repository owner.

## Repository and Publication Architecture

The local workspace becomes a new Git repository with `main` as its default branch and `https://github.com/tnibir/SSU-Bangladesh.git` as `origin`. The new history contains only the replacement project.

The website remains in `NSIS-Current State & Projection`; it is not copied or moved. A workflow at `.github/workflows/pages.yml` checks out `main`, verifies the site, uploads that directory as the Pages artifact, and deploys it to the `github-pages` environment. This makes the folder's `index.html` available directly at the project Pages URL while keeping non-site documents out of the public Pages artifact.

The workflow uses the current GitHub-supported action majors documented for static Pages deployments:

- `actions/checkout@v6`
- `actions/configure-pages@v5`
- `actions/upload-pages-artifact@v4`
- `actions/deploy-pages@v4`

It grants only `contents: read`, `pages: write`, and `id-token: write`. Deployment concurrency cancels superseded runs but does not interrupt an active production deployment.

## Static-Site Compatibility

All internal navigation, stylesheets, scripts, and data files use relative URLs. No path begins at `/`, so the project path `/SSU-Bangladesh/` does not break asset resolution. Query-string cache keys may remain because GitHub Pages serves the underlying relative files normally.

The lifecycle chart currently loads D3 from an unpinned public CDN. The replacement will vendor a fixed D3 7 distribution and its license under the website directory, then load it through a relative script path. This removes a third-party runtime availability dependency and keeps chart behavior intact.

The chart retains both data forms:

- `data/lifecycle-data.json` is the normal HTTP-loaded dataset.
- `data/lifecycle-data.js` remains the synchronous fallback when JSON loading fails.

A `.nojekyll` file is included in the deployed site so GitHub Pages serves the directory as authored without Jekyll processing.

## Universal Font Strategy

The undeclared `Inter` preference will be removed. A shared CSS custom property will define a cross-platform system sans-serif stack using `system-ui`, Apple and Windows UI fonts, Android's Roboto, common Helvetica/Arial fallbacks, `Noto Sans`, and the generic `sans-serif` family.

This design deliberately avoids remote font services and device-specific font requirements. Every browser can select an installed UI or generic sans-serif font, so text remains readable even when a named font is unavailable. Downloaded SVG output will continue to embed an Arial/generic sans-serif declaration for portability in image viewers.

## Functional Behavior

The following existing behavior must remain unchanged:

- Knowledge Hub tabs, anchors, calculator inputs, calculations, summaries, policy results, and yearly projections.
- Shared theme selection and persistence across both pages.
- Desktop dropdown navigation and mobile menu expansion/collapse.
- Lifecycle chart rendering, filters, search, ring-width and label-size controls, reset behavior, detail panels, funding display, and SVG/PNG download controls.
- External source links opening independently with safe `noopener` behavior.
- Responsive layouts without horizontal page overflow; intentionally wide data tables remain scrollable inside their containers.

## Error Handling

If the JSON dataset fails to load, the lifecycle page uses the JavaScript fallback. If neither dataset is available, the existing visible data-load error is preserved. If D3 itself is unavailable because the vendored asset is missing, the chart area displays its existing dependency error instead of failing silently.

Theme initialization will tolerate browsers where stored preferences are unavailable by applying the page's default theme. Storage access must not prevent the remaining menu or theme controls from initializing.

## Verification Strategy

Verification has three layers:

1. Static repository checks validate required files, relative local asset references, matching lifecycle JSON/JavaScript data, absence of remote font dependencies, use of the shared universal stack, and absence of excluded Office lock and macOS metadata files.
2. Syntax and functional browser smoke tests validate both pages, JavaScript execution, calculator updates, tab switching, theme persistence, mobile navigation, lifecycle SVG rendering, filtering, search, detail selection, and download-button wiring.
3. Deployment checks confirm the Pages workflow succeeds and the live project URL serves both HTML pages, the vendored D3 asset, styles, scripts, and data with successful HTTP responses. The live DOM is then smoke-tested against the deployed URL.

Tests run locally before commit, again in the Pages workflow before artifact upload, and once more against the live deployment where practical.

## GitHub Operations

Before changing the remote, the GitHub CLI must be reauthenticated as `tnibir` because the stored token is expired. Authentication must provide repository administration, Pages, Actions, contents, and workflow access sufficient to force-push the replacement branch and update Pages settings.

After local verification:

1. Add the GitHub remote and confirm it resolves to `tnibir/SSU-Bangladesh`.
2. Force-push the unrelated replacement `main` branch, replacing the old history.
3. Update the repository's Pages `build_type` to `workflow` through the GitHub API.
4. Monitor the Pages workflow through completion.
5. Verify the repository tree, branch head, Pages configuration, deployment status, and public site.

The force push is intentionally destructive and satisfies the approved requirement not to preserve old Git history.

## Success Criteria

- The remote `main` tree matches the intended local repository contents and contains none of the former site files unless they also exist locally.
- The old commit history is no longer an ancestor of remote `main`.
- `https://tnibir.github.io/SSU-Bangladesh/` serves the new Knowledge Hub.
- `https://tnibir.github.io/SSU-Bangladesh/lifecycle-chart.html` serves a functional lifecycle chart.
- All local site assets load from the Pages project path without 404 responses.
- No runtime font download is required, and readable sans-serif fallbacks exist on all devices.
- Automated checks and live deployment smoke tests pass without JavaScript errors.
