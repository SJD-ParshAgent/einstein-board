# Einstein Board — Database Schema

## Philosophy

Tasks are unified records. What layer they appear on is determined by their parent project's type/stage and the current focus mode — not by duplicating data.

---

## Tables

### `settings`

```sql
CREATE TABLE settings (
  id                    INTEGER PRIMARY KEY CHECK(id = 1),
  -- single-row table enforced by CHECK
  focus_mode            BOOLEAN NOT NULL DEFAULT 0,
  focus_mode_updated_at DATETIME
);
```

**Seed data:** one row with `id = 1, focus_mode = 0`.

---

### `projects`

```sql
CREATE TABLE projects (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  title         TEXT NOT NULL,
  type          TEXT NOT NULL CHECK(type IN ('standard', 'stable')),
  stage         TEXT CHECK(stage IN ('holding', 'on-deck', 'active', 'graveyard')),
  -- stage is NULL for stable projects (Home & Hearth, Whirlwind)
  category      TEXT CHECK(category IN ('professional', 'community', 'personal')),
  -- NULL for stable projects
  focus         BOOLEAN NOT NULL DEFAULT 0,
  -- TRUE = starred; when focus_mode ON, only starred projects show in Layer 1/2
  pending_tier  TEXT CHECK(pending_tier IN ('daydream', 'white-whale')),
  -- only meaningful for non-focus projects in holding/on-deck stage
  einstein_exception BOOLEAN NOT NULL DEFAULT 0,
  -- if TRUE, this project's tasks show in Layer 1 during focus mode even if not active
  sort_order    INTEGER NOT NULL DEFAULT 0,
  description   TEXT,
  created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  archived_at   DATETIME
);
```

**Seed data (permanent stable projects):**
- `Home & Hearth` — type: stable, stage: NULL — household chores, recurring events, one-offs
- `Whirlwind` — type: stable, stage: NULL — ad hoc external requests (boss asks, quick jobs)

---

### `tasks`

```sql
CREATE TABLE tasks (
  id                INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id        INTEGER NOT NULL REFERENCES projects(id),
  title             TEXT NOT NULL,
  status            TEXT NOT NULL DEFAULT 'todo' CHECK(status IN ('todo', 'in-progress', 'done')),
  notes             TEXT,

  -- Layer 0 / Layer 1 visibility
  due_date          DATE,
  pinned_today      BOOLEAN NOT NULL DEFAULT 0,

  -- Recurring task fields
  is_recurring      BOOLEAN NOT NULL DEFAULT 0,
  recurrence_type   TEXT CHECK(recurrence_type IN ('fixed', 'rolling')),
  -- fixed: cron expression e.g. "0 0 * * 2" (every Tuesday)
  -- rolling: interval string e.g. "7d", "2w", "1m"
  recurrence_rule   TEXT,
  last_completed_at DATETIME,
  next_due_date     DATE,
  -- next_due_date is computed on completion and stored for fast querying

  sort_order        INTEGER NOT NULL DEFAULT 0,
  created_at        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  completed_at      DATETIME
);
```

---

## Layer Visibility Rules

| Layer | Description | Focus OFF | Focus ON |
|-------|-------------|-----------|----------|
| 0 | Today | All pinned_today + due today | Active projects + H&H + Whirlwind + exceptions |
| 1 | This Week | All tasks due within 7 days | Active projects + H&H + Whirlwind + exceptions |
| 2 | Project List | All projects by stage | Standard active + H&H only |
| 3 | Dashboard | Full strategic view | Full view (Whirlwind visible) |

### Stable Project Visibility in Focus Mode
- **Home & Hearth** — visible on all layers always
- **Whirlwind** — visible on layers 0, 1, 3 only (hidden from Layer 2)

---

## Recurrence Logic

**Fixed schedule** — due on a specific repeating schedule regardless of completion.
- `recurrence_rule` stores a cron expression
- `next_due_date` = next occurrence of cron after today
- Missing a week does not push the date forward

**Rolling** — due N days/weeks/months after last completion.
- `recurrence_rule` stores an interval: `"7d"`, `"2w"`, `"1m"`
- `next_due_date` = `last_completed_at + interval`
- Completion resets the clock from that moment

On task completion, a new task instance is generated (or `next_due_date` is updated) based on `recurrence_type`.
