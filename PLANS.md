# Active Plans

## Budget Page
- Add a persisted annual budget setting to local storage, migrations, and backup import/export.
- Build derived budget projection logic for fixed dues, cheapest active plane, tach-to-hobbs conversion, projected flights, and current-year progress.
- Add a Budget page plus navigation, tests, and verification checks.

## BudgetViz Page
- Add a separate visual BudgetViz page that reuses the existing budget projection math.
- Present budget and flight progress with a more graphical layout using rings, bars, and callout cards.
- Keep the existing Budget page unchanged so both approaches can be compared side by side.

## BudgetViz2 Page
- Add a bolder alternative budget dashboard with larger visual signals and stronger state styling.
- Reuse the same projection math, but present it as an annual mission board with hero metrics, radial progress, and budget pressure panels.
- Keep Budget and BudgetViz intact so all three variants can be compared side by side.

## FinalBudget Page
- Add a merged comparison page that starts from BudgetViz and promotes projected flights as the main outcome.
- Include an expandable explanation of how projected flights were derived from budget, rate, conversion, and historical duration.
- Consolidate flight progress into one primary progress section and keep the other budget variants unchanged for comparison.

## Cloudflare Pages Deployment
- Add the static hosting support needed for a Vite single-page app that uses browser-based routing.
- Document the exact Cloudflare Pages build settings and deployment steps in the project README.
- Verify the app still builds and passes tests after the deployment changes.
