# Einstein Board: backend changes and open questions

Audit of `SJD-ParshAgent/einstein-board` (commit `eb96f31`) against the kanban design in `design/`.
The repo was read and run against a scratch database. Nothing in the repo was changed.

---

## 1. Changes from design decisions

| # | Change | Where it shows up |
|---|--------|-------------------|
| 1 | `projects.stage` becomes `holding \| active \| done`. Migrate `on-deck` to `holding`, `graveyard` to `done`. | `schema.sql`, `SCHEMA.md`, `services/projects.js` (`ALLOWED_STAGES`), `routes/projects.js` (swagger enum), `routes/layer2.js` (sort `CASE`), `projects.test.js`, `test/POSTMAN.md` |
| 2 | `tasks.status` gains `on-deck`: `todo \| on-deck \| in-progress \| done`. "On deck" means tasks you want to do next. | `schema.sql`, `SCHEMA.md`, task routes |
| 3 | Drop `projects.einstein_exception` everywhere. | `schema.sql`, `SCHEMA.md` (column plus the layer visibility table), `layerQueries.js` (two spots), `services/projects.js` (create, update, allowed list), `routes/projects.js` (swagger) |
| 4 | `pending_tier` only applies in Holding. Clear it when a project moves to Active or Done, and validate it on update (it is only validated on create today). | `services/projects.js` |
| 5 | Whirlwind must be hidden from Layer 2 in Focus Mode and Home & Hearth must stay. The code only knows `type = 'stable'`, so it shows both. Add something to tell them apart (a `slug` column or a `hide_in_focus_layer2` flag). | `schema.sql`, `routes/layer2.js` |
| 6 | SQLite cannot edit a CHECK constraint in place, so changes 1 to 3 need the `projects` and `tasks` tables rebuilt. | new migration |
| 7 | `migrate.js` only re-runs `schema.sql`. A second run fails with "table settings already exists". Use versioned, re-runnable migrations (`PRAGMA user_version`). | `src/db/migrate.js` |
| 8 | Decide whether to keep or drop `projects.focus` (the starred flag). The design never uses it and the layer queries ignore it. | `schema.sql`, services |
| 9 | Optional: `projects.completed_at` so Done projects can show when they finished. | `schema.sql` |
| 10 | Add a setting for the 3-project cap behavior (`active_cap_mode`: `block` or `warn`). | `settings` table |

---

## 2. Bugs found by running the code

1. **`GET /api/projects` is shadowed.** `layer2.js` and `projects.js` both define it on `/api`. The Layer 2 router is mounted first, so it wins and returns `{focusMode, projects}` instead of an array. Move Layer 2 to its own path.
2. **"Today" uses UTC.** `date('now')` is UTC. At 9:30 pm Denver it returned Oct 28 while the local date was Oct 27, so Today shows tomorrow's tasks in the evening. This affects `layerQueries.js`, `print.js`, `layer3.js` and the `toISOString()` calls in `recurrence.js`.
3. **Recurring tasks are broken.**
   - A fixed schedule has no cron parser. `completeTask` copies `next_due_date`, which is `null` on creation.
   - A new recurring task gets no `due_date` or `next_due_date`, so it never appears on Today.
   - Completing a fixed task returned `newTaskId: null`, so the series silently ends.
   - Rolling "months" are 30 days.
   - The new instance does not copy `last_completed_at`, but the task detail page shows "Last done".
   - The new instance copies `pinned_today`.
4. **Bad input returns 500.** An unknown `project_id` or a bogus `status` throws a raw SQLite error. These should be 400s.
5. **`POST /tasks` ignores `status`.** Sending `on-deck` saved `todo`.
6. **No cap enforcement.** Four active projects were created with no error or warning.
7. **Stable projects are not protected.** `PATCH /projects/2 {type:"standard"}` turned Whirlwind into a standard project. Stable projects must also keep `stage` and `category` null.
8. **Category is not required.** A standard project can be created with no category. The design requires one.
9. **Deleting a project with tasks fails** with a raw foreign key error. `archived_at` exists but nothing sets it, and no query filters on it.
10. **Layers 0 and 1 report the wrong focus value.** With no `?focus=` param they return `focusMode: 0` even when the stored setting is on.
11. **Nothing writes `settings.focus_mode`.** There is no way to change Focus Mode.
12. **Printing.**
    - `spawn` has no `error` handler, so a missing `python3` would crash the server.
    - The task list is passed as a command-line argument, which has size limits. Use stdin.
    - `print/today` ignores Focus Mode.
    - The script path is hard-coded as `${PRINTER_SCRIPT}/work/print_checklist.py`.
    - `print.js` is missing from the swagger `apis` list.
13. **Tests.** The Layer 0 to 3 tests are placeholders. The project tests only pass after migrating a database.

---

## 3. API to add

**Tasks**
- `GET /tasks` with filters: `project_id`, `status`, `from`, `to`, `include_done`.
- `GET /tasks/:id`, including the other tasks in the same project (task detail page).
- `DELETE /tasks/:id`.
- `PATCH /tasks/:id` should also accept `project_id`, `is_recurring`, `recurrence_type` and `recurrence_rule`, and reject invalid `status` with a 400. Setting `status = done` should run the completion logic. Moving a task out of `done` should clear `completed_at`.
- `POST /tasks` accepts `status`, validates the project exists, and validates the recurrence type and rule. A new recurring task should get its first `due_date`.
- Parse recurrence rules. The design writes cron with weekday lists (for example `0 0 * * 2,4`) for fixed schedules and `7d`, `2w` or `3m` for rolling ones. Use a cron library or a small weekday-only parser.

**Layers**
- Today and This week should be able to include done tasks. The design has a Done column, but `getLayerTasks` filters `status != 'done'`.
- Fix the `focusMode` value in the Layer 0 and Layer 1 responses.
- Define "this week" once (see question 4).

**Projects**
- `GET /projects/:id` returns the project with its tasks and open and done counts.
- The Layer 2 list returns open-task counts per project.
- Enforce the 3-active cap on create and update. Block with a 409 or allow with a warning in the response, per `active_cap_mode`.
- Guard stable projects: no type change, no stage, no category, no delete.
- Require `category` for standard projects, and default `stage` to `holding`.
- Archive via `archived_at`, and filter archived projects out of every query.

**Dashboard (`GET /dashboard`)** only returns four counts. The design needs:
- This-week task counts by status.
- The active projects (up to 3 slots) with their on-deck tasks.
- The always-on projects with open counts and on-deck tasks.
- Holding grouped into white whale, daydream and unsorted.
- The Done projects list.
- Focus Mode narrowing (see question 5).

**Settings**
- `GET /settings` and `PATCH /settings` for `focus_mode` (also set `focus_mode_updated_at`) and `active_cap_mode`.

**Print**
- `POST /print` with `{ scope: "task" | "day" | "week" | "project", id or date or week or project_id, include_done, group_by_project }`.
- `GET /print/preview` with the same parameters, returning the receipt lines.
- The receipt shows a header, the scope title, a checkbox line per task, an optional project sub-heading and a task count.

**Other**
- A seed script with sample data for front-end development.
- Real tests for the layer, task, project, dashboard and print routes.

---

## 4. Questions

1. **Recurring model.** On completion, create a new row each time (today's behavior), or reset the same row to `todo` with a new due date? New rows leave every past instance in the Done column and on the project page. If you keep new rows, add a `series_id` and show only the latest done instance.
2. **Deleting a project.** Archive (my suggestion, since `archived_at` exists) or hard-delete? Archive: do its tasks stay? Hard-delete: do tasks cascade, or does the delete get blocked while tasks exist?
3. **Open tasks of a Done project.** Should they stay visible on Today and This week, or be hidden?
4. **Definition of "week".** Rolling next 7 days (what the API does now) or Monday to Sunday (what the print dialog's day list assumes)? What does "Next week" mean in the print dialog?
5. **Focus Mode.** Should it be one saved setting that every layer reads, with the switch only on the dashboard? On the dashboard, should it narrow the view (the design hides Holding and Done, and counts only active and stable projects), or leave it as a full view as `SCHEMA.md` says?
6. **Timezone.** Use the Pi's local time (`localtime`) or a configured timezone in `.env`?
7. **On-deck cap.** Limit how many tasks can be on deck? If so, how many, and block or warn?
8. **3-project cap.** Block (409) or warn? Should the server enforce it, or only the UI?
9. **`projects.focus` (starred).** Keep or drop?
10. **Print today and Focus Mode.** Should `print/today` follow Focus Mode like Layer 0 does?
11. **Task ordering.** Is `sort_order` within a column needed (drag to reorder), or is ordering by due date enough?

---

## 5. About the design files

- `design/*.dc.html` are the pages. Each file is one page from the Design canvas. They load a `support.js` runtime from the canvas, so they render correctly only inside the canvas. Opened as plain HTML they will not.
- `design/canvas.json` has the page titles and their positions on the canvas.
- All names, tasks, dates and notes in the pages are sample data.
- The pages do not share data. Focus Mode, moves, and saves are local to each page.

| File | What it is |
|------|------------|
| `Layer0-Today.dc.html` | Layer 0: today's tasks (To do, On deck, In progress, Done) |
| `Layer1-Week.dc.html` | Layer 1: the next 7 days |
| `Main.dc.html` | Layer 2: projects in Holding, Active, Done, with the cap gauge |
| `Layer3-Dashboard.dc.html` | Layer 3: dashboard, with the Focus Mode switch |
| `Form-Task.dc.html` | Task form (new or edit), including recurrence |
| `Form-Project.dc.html` | Project form (new or edit), including the cap message |
| `Print-Receipt.dc.html` | Print dialog: task, day, week or project, with a preview |
| `Task-Detail.dc.html` | Task detail with a print button |
| `Project-Detail.dc.html` | Project detail with all its tasks |
