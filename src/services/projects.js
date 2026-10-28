import { getDb } from '../db/index.js';

// Allowed values from schema
const ALLOWED_TYPES = ['standard', 'stable'];
const ALLOWED_STAGES = ['holding', 'on-deck', 'active', 'graveyard'];
const ALLOWED_CATEGORIES = ['professional', 'community', 'personal'];
const ALLOWED_PENDING_TIERS = ['daydream', 'white-whale'];

export function getAllProjects() {
  const db = getDb();
  return db.prepare(`
    SELECT * FROM projects 
    ORDER BY sort_order ASC, created_at ASC
  `).all();
}

export function getProjectById(id) {
  const db = getDb();
  return db.prepare('SELECT * FROM projects WHERE id = ?').get(id);
}

export function createProject(data) {
  const db = getDb();

  const {
    title,
    type = 'standard',
    stage = null,
    category = null,
    focus = 0,
    pending_tier = null,
    einstein_exception = 0,
    sort_order = 0,
    description = null
  } = data;

  // Validation
  if (!title) throw new Error('title is required');
  if (!ALLOWED_TYPES.includes(type)) throw new Error(`type must be one of: ${ALLOWED_TYPES.join(', ')}`);
  if (stage && !ALLOWED_STAGES.includes(stage)) throw new Error(`stage must be one of: ${ALLOWED_STAGES.join(', ')}`);
  if (category && !ALLOWED_CATEGORIES.includes(category)) throw new Error(`category must be one of: ${ALLOWED_CATEGORIES.join(', ')}`);
  if (pending_tier && !ALLOWED_PENDING_TIERS.includes(pending_tier)) throw new Error(`pending_tier must be one of: ${ALLOWED_PENDING_TIERS.join(', ')}`);

  const result = db.prepare(`
    INSERT INTO projects (title, type, stage, category, focus, pending_tier, einstein_exception, sort_order, description)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    title,
    type,
    stage,
    category,
    focus ? 1 : 0,
    pending_tier,
    einstein_exception ? 1 : 0,
    sort_order,
    description
  );

  return getProjectById(result.lastInsertRowid);
}

export function updateProject(id, data) {
  const db = getDb();
  const existing = getProjectById(id);
  if (!existing) throw new Error('Project not found');

  const fields = [];
  const values = [];

  const allowed = ['title', 'type', 'stage', 'category', 'focus', 'pending_tier', 'einstein_exception', 'sort_order', 'description'];

  for (const key of allowed) {
    if (data[key] !== undefined) {
      let value = data[key];
      if (['focus', 'einstein_exception'].includes(key)) {
        value = value ? 1 : 0;
      }
      // Basic validation for enum fields
      if (key === 'type' && !ALLOWED_TYPES.includes(value)) {
        throw new Error(`type must be one of: ${ALLOWED_TYPES.join(', ')}`);
      }
      if (key === 'stage' && value && !ALLOWED_STAGES.includes(value)) {
        throw new Error(`stage must be one of: ${ALLOWED_STAGES.join(', ')}`);
      }
      if (key === 'category' && value && !ALLOWED_CATEGORIES.includes(value)) {
        throw new Error(`category must be one of: ${ALLOWED_CATEGORIES.join(', ')}`);
      }

      fields.push(`${key} = ?`);
      values.push(value);
    }
  }

  if (fields.length === 0) throw new Error('No valid fields to update');

  values.push(id);
  db.prepare(`UPDATE projects SET ${fields.join(', ')} WHERE id = ?`).run(...values);

  return getProjectById(id);
}

export function deleteProject(id) {
  const db = getDb();
  const existing = getProjectById(id);
  if (!existing) throw new Error('Project not found');

  // Prevent deleting stable projects (Home & Hearth, Whirlwind)
  if (existing.type === 'stable') {
    throw new Error('Cannot delete stable projects (Home & Hearth or Whirlwind)');
  }

  db.prepare('DELETE FROM projects WHERE id = ?').run(id);
  return { success: true, deletedId: id };
}
