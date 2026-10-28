# Einstein Board — Next Steps

## How to Resume

Tell Parsh: "Let's continue building the Einstein Board. Check the NEXT_STEPS file."

---

## Current State (2026-10-27)

**Schema v2 is live** with the changes from BACKEND_CHANGES.md.

**Work started on implementation** — see "Changes Implemented" section at the top of `docs/BACKEND_CHANGES.md`.

Parsh paused here because Spencer was tired. Next session should continue with the remaining items in BACKEND_CHANGES.md (recurring logic, task routes, settings endpoints, validation, print fixes, etc.).

---

## Where We Left Off (Previous)

Schema is locked in `SCHEMA.md`. Stack is decided. Ready to scaffold.

**Decided:**
- SQLite + Node/Express backend
- Receipt printer integration via `child_process.spawn` to existing Python scripts in `NetumScan80-PersonalPrinter/` (do NOT rewrite those layouts)
- Printer integration stays in its own repo; einstein-board calls out to it

---

## Next Steps (in order)

### 1. Scaffold the project
```
einstein-board/
  src/
    db/         — SQLite setup, migrations, seed data
    routes/     — Express route handlers per layer
    services/   — business logic (layer queries, recurrence, printer calls)
  schema.sql    — raw SQL from SCHEMA.md
  package.json
  .env.example
```

### 2. Initialize the database
- Write `schema.sql` from the SCHEMA.md spec
- Seed the two stable projects: Home & Hearth, Whirlwind
- Write a migration runner

### 3. Build Layer 0 and Layer 1 API endpoints first
- These are the most immediately useful (daily + weekly task views)
- `GET /tasks/today` — Layer 0
- `GET /tasks/week` — Layer 1
- Both need to respect Einstein Focus mode (query param or config)

### 4. Wire up the printer
- `POST /print/today` — prints Layer 0 as a checklist receipt
- `POST /print/week` — prints Layer 1
- Calls Python via subprocess, passes task list as args or stdin

### 5. Build Layer 2 and Layer 3 endpoints
- `GET /projects` — Layer 2 (project list by stage)
- `GET /dashboard` — Layer 3 (strategic view)

### 6. Simple frontend (later)
- Decide: web UI on the Pi, or just API + receipt for now?
- Could be a single HTML file like the work kanban

### 7. Push to GitHub
- New repo under SJD-ParshAgent
- Name TBD (currently called "Einstein Board" as working title)

---

## Key Design Decisions Already Made

- Tasks are unified records — layer visibility is computed, not stored
- `projects.type` = standard | stable (Home & Hearth and Whirlwind are stable, never purged)
- `tasks.recurrence_type` = fixed (cron) | rolling (interval from last completion)
- Einstein Focus mode affects Layer 1 and Layer 2 visibility (see SCHEMA.md for full table)
- Home & Hearth: visible all layers always
- Whirlwind: all layers when focus OFF; layers 0, 1, 3 only when focus ON
- Hard cap of 3 active standard projects (enforcement TBD — system block vs. visual warning)
