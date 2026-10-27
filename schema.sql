-- Einstein Board Database Schema
-- SQLite

PRAGMA foreign_keys = ON;

-- ============================================================================
-- SETTINGS (singleton table)
-- ============================================================================
CREATE TABLE settings (
  id                    INTEGER PRIMARY KEY CHECK(id = 1),
  focus_mode            BOOLEAN NOT NULL DEFAULT 0,
  focus_mode_updated_at DATETIME
);

INSERT INTO settings (id, focus_mode) VALUES (1, 0);

-- ============================================================================
-- PROJECTS
-- ============================================================================
CREATE TABLE projects (
  id                   INTEGER PRIMARY KEY AUTOINCREMENT,
  title                TEXT NOT NULL,
  type                 TEXT NOT NULL CHECK(type IN ('standard', 'stable')),
  stage                TEXT CHECK(stage IN ('holding', 'on-deck', 'active', 'graveyard')),
  category             TEXT CHECK(category IN ('professional', 'community', 'personal')),
  focus                BOOLEAN NOT NULL DEFAULT 0,
  pending_tier         TEXT CHECK(pending_tier IN ('daydream', 'white-whale')),
  einstein_exception   BOOLEAN NOT NULL DEFAULT 0,
  sort_order           INTEGER NOT NULL DEFAULT 0,
  description          TEXT,
  created_at           DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  archived_at          DATETIME
);

-- Seed stable projects (these are permanent)
INSERT INTO projects (title, type, stage, category, focus, sort_order) VALUES
  ('Home & Hearth', 'stable', NULL, NULL, 0, 0),
  ('Whirlwind',     'stable', NULL, NULL, 0, 1);

-- ============================================================================
-- TASKS
-- ============================================================================
CREATE TABLE tasks (
  id                INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id        INTEGER NOT NULL REFERENCES projects(id),
  title             TEXT NOT NULL,
  status            TEXT NOT NULL DEFAULT 'todo' CHECK(status IN ('todo', 'in-progress', 'done')),
  notes             TEXT,

  -- Layer 0 / Layer 1 visibility
  due_date          DATE,
  pinned_today      BOOLEAN NOT NULL DEFAULT 0,

  -- Recurrence
  is_recurring      BOOLEAN NOT NULL DEFAULT 0,
  recurrence_type   TEXT CHECK(recurrence_type IN ('fixed', 'rolling')),
  recurrence_rule   TEXT,
  last_completed_at DATETIME,
  next_due_date     DATE,

  sort_order        INTEGER NOT NULL DEFAULT 0,
  created_at        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  completed_at      DATETIME
);

-- Indexes for common queries
CREATE INDEX idx_tasks_project_id ON tasks(project_id);
CREATE INDEX idx_tasks_next_due_date ON tasks(next_due_date);
CREATE INDEX idx_tasks_due_date ON tasks(due_date);
CREATE INDEX idx_projects_focus ON projects(focus);
CREATE INDEX idx_projects_stage ON projects(stage);