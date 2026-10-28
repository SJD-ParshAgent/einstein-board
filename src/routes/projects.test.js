import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../index.js';
import { getDb } from '../db/index.js';

describe('Projects API', () => {
  let createdProjectId;

  it('should create a new project', async () => {
    const res = await request(app)
      .post('/api/projects')
      .send({
        title: 'Test Project',
        type: 'standard',
        stage: 'active',
        category: 'professional',
        focus: true,
        description: 'Created by test'
      });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('id');
    expect(res.body.title).toBe('Test Project');
    createdProjectId = res.body.id;
  });

  it('should get all projects', async () => {
    const res = await request(app).get('/api/projects');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body) || (res.body && typeof res.body === 'object')).toBe(true);
  });

  it('should get a single project', async () => {
    const res = await request(app).get(`/api/projects/${createdProjectId}`);
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(createdProjectId);
  });

  it('should update a project', async () => {
    const res = await request(app)
      .patch(`/api/projects/${createdProjectId}`)
      .send({ stage: 'on-deck' });

    expect(res.status).toBe(200);
    expect(res.body.stage).toBe('on-deck');
  });

  it('should delete a project', async () => {
    const res = await request(app).delete(`/api/projects/${createdProjectId}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('should return 404 for deleted project', async () => {
    const res = await request(app).get(`/api/projects/${createdProjectId}`);
    expect(res.status).toBe(404);
  });
});