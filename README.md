# HobbsTab

HobbsTab is a local-first web app for tracking what you spend on general aviation flying.

It is built for the common case of one person tracking club dues, flight costs, instruction costs, and related aviation expenses without having to maintain a spreadsheet by hand.

## Current Features

- Add flight entries with club-aware pricing snapshots
- Add non-flight expense entries
- Track clubs and historical rate periods
- Derive monthly dues from club rate history
- View recent history with edit and delete support
- See dashboard summaries and monthly trends
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
