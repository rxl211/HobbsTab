# AGENTS.md

## Project Goal
Build a single-user web app for tracking what the end user spends on their general aviation flying.

## Product Direction
- For now, it supports single user (i.e. no auth).
- The architecture should remain extensible enough to support multiple users later.
- Prefer event-level records with derived summaries rather than manually entered monthly summary rows.

## Tech Preferences
- Prefer React + TypeScript + Vite for the frontend unless a strong reason is found to use something else.
- Prefer local-first persistence
- Avoid introducing a backend unless it is clearly necessary
- Keep dependencies minimal.

## Engineering Principles
- Keep business logic separate from UI components.
- Keep the data model explicit and easy to understand.
- Favor readability and maintainability over clever abstractions.
- Avoid premature optimization and premature generalization.
- Design the data model so future migration to a backend is possible.
- Follow all engineering best practices

## Domain Expectations
The app should be able to model:
- Clubs (monthly dues, hourly rate, instruction cost)
- Flight entries
- Derived monthly and yearly summaries

The app should support common aviation cost concepts such as:
- fixed monthly costs
- variable flight costs
- tach and/or hobbs time
- instructor cost
- training vs hobby use
- notes and categorization

## Workflow
- For any non-trivial task, propose a short plan before coding.
- For larger multi-step work, write or update `PLANS.md`.
- Before considering a task complete, verify the app builds and passes configured checks.
- Do not make unrelated refactors unless they are necessary to complete the task.

## UX Priorities
- Data entry should be fast and simple.
- The dashboard should make monthly cost trends easy to understand.
- The app should feel useful even with a small amount of data.