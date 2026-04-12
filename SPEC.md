# SPEC.md

## Working Title
HobbsTab

## Product Summary
A web app for tracking what you spend on general aviation hobby flying and flight training

The app should make it easy to log flights and aviation-related expenses as they happen, then automatically generate monthly and yearly summaries. It should replace a spreadsheet-based workflow that is easy to forget to update and difficult to expand.

## Problem
I currently track flying-related spending in a spreadsheet. The spreadsheet works as a rough monthly summary, but it has several limitations:
- I often forget to update it.
- It mixes multiple kinds of costs into one monthly row.
- It is better at summarizing totals than helping me log events as they happen.
- It is not structured in a way that would easily scale to other users or broader aviation scenarios.
- It is not visually engaging and does not make it easy to see spending volume / month to month variance at a glance

## Goal
Build a web app that lets me:
- Specify what Club(s) I am a member of, and configure properties for each
- log flight-related spending at the event level. 
- view monthly totals and breakdowns automatically
- understand how much flying is costing me over time
- easy to use from modern mobile browser

## Target User
Initial target user:
- one person tracking their own general aviation and flying club expenses

Possible future users:
- renters
- aircraft owners
- shared ownership groups

## Design Philosophy
- Future-expandable data model
- Event-based records instead of manual monthly summaries
- Simple and clear UX over feature breadth

## Core Concepts
The app should model the following concepts:

### Flight Entry
A record of one flight or usage event.

Possible fields:
- id
- date
- purpose (Hobby or Flight Training or Check Flight)
- tach time
- hobbs time
- hourly rate
- instructor cost
- notes

### Expense Entry
A non-flight aviation expense.

Possible fields:
- id
- date
- description
- amount
- note

### Monthly Summary
A derived summary, not a primary input record.

Examples:
- total spend
- fixed vs variable spend
- training vs hobby spend
- hours flown (per hobbs time)
- cost per hour

## Features

### 1. Dashboard
A main screen showing a useful summary of current and recent spending.

Should include:
- current month total
- recent monthly trend
- fixed vs variable breakdown
- hobby vs training breakdown
- hours flown
- recent entries

### 2. Add Entry Flow
A simple way to create records.

Should support:
- adding a flight entry
- adding a non-flight expense entry

When I enter a flight I should be asked to input
- (1) hobbs time 
- (2) Select if part of a Club or None (no club) 
- (3) If part of a club and club bills by tach time then asked to input tach time 
- (4) If not part of a club then ask to enter hobbs hourly rate billed
- (5) Select if flight was for fun or for flight training or if it was a check flight
- (6) If flight training or check flight selected, asked to optionally enter CFI Cost

### 3. Entry History
A view of past records.

Should support:
- viewing entries by date
- editing entries
- deleting entries
- simple filtering
- viewing Club monthly dues in line with entries (they are not manually entered but should still show up)

### 4. Monthly Summaries
A summary view derived from event-level records.

Should support:
- month-by-month totals
- category breakdowns
- flight-cost-related rollups

### 5. Local Persistence
Data should persist locally in the browser

The initial implementation should consider using IndexDB

The architecture should not make later migration to a backend unnecessarily difficult.

### 6. Create / Manage Clubs
A way to do CRUD operations on Clubs.

Club properties should include:
- Name
- Monthly fixed costs (dues)
- Whether time is billed via hobbs or tach time
- Hourly rate

When club properties are changed such as dues or hourly rate, it only affects entries added AFTER the change. Previous entries are unaffected.

## Non-Goals
Should not include:
- authentication
- creating more than one club
- multi-user collaboration
- cloud sync
- public sharing
- subscriptions
- complex permissions
- advanced reporting exports
- external integrations with logbooks or flying club software

## Future Expansion Ideas
These are explicitly out of scope currently, but the architecture should not block them:
- ability to sign in to access the app from multiple devices and for more durable data
- external integrations with logbooks
- support for multiple clubs
- ownership cost tracking
- import/export flows
- checkride and training milestone tracking
- comparison of rental vs club vs ownership cost scenarios

## Success Criteria
successful if:
- I can quickly log flights and aviation expenses.
- I can see monthly totals without manually building them.
- The app is meaningfully more convenient than the spreadsheet.
- The data model is clean enough to support future growth.

## Open Questions
These do not need to be solved before starting, but should be considered during planning:
- What is the best way to model fixed monthly costs?
- How much value is there in being able to add/manage aircraft vs the increased complexity in doing so?