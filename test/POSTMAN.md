# Einstein Board API — Postman Testing Guide

Base URL: `http://localhost:3456`

All routes are prefixed with `/api`.

---

## Quick Start

1. Import this collection into Postman (or just use the examples below)
2. Set environment variable `baseUrl = http://localhost:3456`
3. Run `npm start` in the einstein-board folder first

---

## Projects

### Create Project
**POST** `/api/projects`

```json
{
  "title": "Website Redesign",
  "type": "standard",
  "stage": "active",
  "category": "professional",
  "focus": true,
  "description": "Main marketing site refresh for Q4"
}
```

### Get All Projects
**GET** `/api/projects`

### Get Single Project
**GET** `/api/projects/:id`

### Update Project
**PATCH** `/api/projects/:id`

```json
{
  "stage": "on-deck",
  "focus": false
}
```

### Delete Project
**DELETE** `/api/projects/:id`

> Note: Stable projects (Home & Hearth, Whirlwind) cannot be deleted.

---

## Tasks

### Create Task
**POST** `/api/tasks`

```json
{
  "project_id": 1,
  "title": "Review homepage wireframes",
  "due_date": "2026-10-28",
  "pinned_today": true,
  "notes": "Check with design team first"
}
```

### Update Task
**PATCH** `/api/tasks/:id`

```json
{
  "status": "in-progress",
  "pinned_today": false
}
```

---

## Layers (Main Views)

### Layer 0 — Today
**GET** `/api/tasks/today?focus=0`

Query params:
- `focus=0` → Focus mode OFF
- `focus=1` → Focus mode ON

### Layer 1 — This Week
**GET** `/api/tasks/week?focus=0`

### Layer 2 — Projects by Stage
**GET** `/api/projects/stage?focus=0`

### Layer 3 — Dashboard
**GET** `/api/dashboard?focus=0`

---

## Print Endpoints

### Print Today's Checklist
**POST** `/api/print/today`

Requires `PRINTER_SCRIPT_PATH` env var to be set.

### Print Week View
**POST** `/api/print/week`

---

## Health & Docs

- **Health Check**: `GET /health`
- **Swagger Docs**: `GET /docs`

---

## Recommended Postman Folder Structure

```
Einstein Board
├── Projects
│   ├── Create Project
│   ├── List Projects
│   ├── Get Project
│   ├── Update Project
│   └── Delete Project
├── Tasks
│   ├── Create Task
│   └── Update Task
├── Layers
│   ├── Today (Layer 0)
│   ├── Week (Layer 1)
│   ├── Projects (Layer 2)
│   └── Dashboard (Layer 3)
├── Print
│   ├── Print Today
│   └── Print Week
└── System
    ├── Health
    └── Docs
```

---

## Tips

- Stable projects have `type = "stable"` and `stage = null`
- Use the `focus` query param to test Einstein Focus mode behavior
- Most layer queries respect the `settings.focus_mode` row
- The two permanent stable projects are seeded automatically

Let me know if you want a ready-to-import Postman collection JSON file instead.

---

## Postman Test Script (paste into Tests tab)

Copy and paste this into the **Tests** tab of any request. It will:
- Show you the exact response body
- Highlight common failure reasons
- Validate status codes
- Make debugging much faster

```javascript
// === Einstein Board - Universal Response Debugger ===

pm.test("Response received", () => {
    pm.response.to.be.ok;
});

// Log the full response so you can see exactly what failed
const responseBody = pm.response.json();
console.log("=== RESPONSE ===");
console.log(JSON.stringify(responseBody, null, 2));

// Status code checks
pm.test("Status code is 2xx or expected error", () => {
    const code = pm.response.code;
    pm.expect([200, 201, 204, 400, 404, 500].includes(code)).to.be.true;
});

// Helpful error visualization
if (pm.response.code >= 400) {
    console.warn("!!! REQUEST FAILED !!!");
    console.warn("Status:", pm.response.code);
    console.warn("Error message:", responseBody.error || responseBody.message || "No error field");
    
    if (responseBody.error) {
        pm.test("Error message logged", () => {
            console.log("Error:", responseBody.error);
        });
    }
}

// Quick success indicators
if (pm.response.code === 201) {
    console.log("✅ Resource created successfully");
}
if (pm.response.code === 200) {
    console.log("✅ Request successful");
}

// Show response time
console.log("Response time:", pm.response.responseTime, "ms");
```