# HobbsTab

HobbsTab is a local-first web app for tracking what you spend on general aviation flying.

It is built for the common case of one person tracking club dues, flight costs, instruction costs, and related aviation expenses without having to maintain a spreadsheet by hand.

It does not have user accounts and stores all data locally, with easy database export/import via UI.

## Current Features

- Add flight entries with club-aware pricing snapshots
- Add non-flight expense entries
- Track clubs and historical rate periods
- Derive monthly dues from club rate history
- View recent history with edit and delete support
- See dashboard summaries and monthly trends
- Set an annual budget and track flying vs instruction budget progress
- View club dues and rate changes over time
- Export and import local JSON backups

## Tech Stack

- React
- TypeScript
- Vite
- Dexie / IndexedDB

## Local Development

From the project root:

```powershell
npm install
npm run dev
```

Then open the local URL shown by Vite, usually `http://localhost:5173`.

## Other Scripts

```powershell
npm test
npm run build
npm run preview
```

## Deploy To Cloudflare Pages

This app can be deployed to Cloudflare Pages as a static site.

Recommended Pages settings:

- Framework preset: `React (Vite)`
- Build command: `npm run build`
- Build output directory: `dist`
- Root directory: leave blank
- Node.js version: `22` if Cloudflare asks

Routing note:

- HobbsTab uses React Router's browser history mode.
- Cloudflare Pages already supports single-page app routing by default when there is no top-level `404.html`, so no custom redirect file is needed for routes like `/history` or `/clubs`.

Typical deploy flow:

1. Push this repo to GitHub.
2. In Cloudflare, go to Workers & Pages and create a new Pages project.
3. Connect the GitHub repo.
4. Enter the build settings above.
5. Save and deploy.

After deployment:

- open the generated `.pages.dev` URL
- verify you can refresh on routes such as `/history` and `/clubs`
- remember app data is stored in the browser with IndexedDB, so each browser/profile keeps its own local data

## Data Storage

HobbsTab stores data locally in the browser using IndexedDB.

That means:

- data persists in your browser on that machine
- there is no backend or account system yet
- clearing browser storage will remove local app data unless you exported a backup first

## Product Direction

The app is intentionally simple today, but the data model is designed to support future growth such as:

- multiple clubs
- more durable backup/sync options
- broader aviation expense tracking
- eventual backend migration if needed

## Notes

- Club rate changes affect future flights by design because flight entries snapshot the pricing used at entry time.
- Club dues are derived from club rate history so retroactive dues changes can update historical monthly dues rows.
