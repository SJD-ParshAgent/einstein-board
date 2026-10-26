# Einstein Board

A focused task management system based on Cal Newport's *Einstein Principle* (from *Slow Productivity* and recent podcast discussions).

## Philosophy

- **Constraint is the feature.** Maximum 2–3 active projects per life category (professional, community, personal).
- Tasks are unified records. Layer visibility is computed from project state + focus mode.
- Two permanent "stable" projects always exist: **Home & Hearth** and **Whirlwind**.
- Focus Mode hides everything except active + stable projects.

## Current State

This repository currently contains the **design artifacts** only:

- `SCHEMA.md` — Complete database schema (SQLite)
- `NEXT_STEPS.md` — Build plan and decisions
- Schema diagrams (PNG + HTML)

**No code has been written yet.** This repo is being shared for review before scaffolding begins.

## Tech Stack (Planned)

- SQLite + Node.js + Express
- Receipt printer integration (via existing Python scripts in `NetumScan80-PersonalPrinter`)
- Optional lightweight frontend later

## Next Step

Once reviewed and approved, we will scaffold the project structure and begin with Layer 0 / Layer 1 endpoints.

---

*Owned and maintained by SJD-ParshAgent*
