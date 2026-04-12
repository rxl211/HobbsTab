# HobbsTab V1 Plan

## Goal
Build a local-first single-user web app for tracking flying costs with event-level entries, derived monthly dues, and monthly/yearly summaries.

## Milestones
1. Foundation
   - Vite + React + TypeScript app shell
   - Shared layout and navigation
   - IndexedDB setup with Dexie
2. Domain and storage
   - Explicit domain types
   - Repository helpers
   - Summary and derived-dues calculations
3. Clubs
   - Club CRUD
   - Historical rate periods using `effectiveFrom`
4. Entries
   - Flight entry flow with conditional fields
   - Expense entry flow
   - Edit and delete support
5. Dashboard and history
   - Current month totals
   - Monthly trend
   - Combined history with synthetic dues rows
6. Summaries and polish
   - Monthly summary view
   - Mobile usability improvements
   - Build and tests

## Acceptance Checks
- Flight pricing snapshots do not change when club rates are edited later.
- Synthetic dues update from the correct effective month when a rate period is edited retroactively.
- Dashboard, history, and summaries stay consistent after add/edit/delete actions.
- App builds successfully and domain tests pass.

## Deferred Decisions
- Import/export backups
- Broader expense categorization
- Splitting instruction cost into a separate record type
