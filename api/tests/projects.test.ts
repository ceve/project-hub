import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../src/app';
import { pool } from '../src/db';
import { setupTestDb, cleanDb, teardownTestDb } from './setup';

let userToken: string;
let adminToken: string;

beforeAll(async () => { await setupTestDb(); });
afterAll(async () => { await teardownTestDb(); });
beforeEach(async () => {
  await cleanDb();

  // Create and promote admin
  await request(app)
    .post('/api/auth/register')
    .send({ email: 'admin@test.com', password: 'admin123', name: 'Admin' });
  await pool.query("UPDATE users SET role = 'admin' WHERE email = 'admin@test.com'");
  const adminLogin = await request(app)
    .post('/api/auth/login')
    .send({ email: 'admin@test.com', password: 'admin123' });
  adminToken = adminLogin.body.token;

  // Create regular user
  const user = await request(app)
    .post('/api/auth/register')
    .send({ email: 'user@test.com', password: 'user123', name: 'User' });
  userToken = user.body.token;
});

describe('Projects CRUD', () => {
  it('should create a project', async () => {
    const res = await request(app)
      .post('/api/projects')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ name: 'Test Project', description: 'A test project' });
    expect(res.status).toBe(201);
    expect(res.body.name).toBe('Test Project');
  });

  it('should list projects', async () => {
    await request(app)
      .post('/api/projects')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ name: 'Project 1' });
    const res = await request(app)
      .get('/api/projects')
      .set('Authorization', `Bearer ${userToken}`);
    expect(res.status).toBe(200);
    expect(res.body.length).toBe(1);
  });

  it('should get a single project', async () => {
    const created = await request(app)
      .post('/api/projects')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ name: 'Get Me' });
    const res = await request(app)
      .get(`/api/projects/${created.body.id}`)
      .set('Authorization', `Bearer ${userToken}`);
    expect(res.status).toBe(200);
    expect(res.body.name).toBe('Get Me');
  });

  it('should update own project', async () => {
    const created = await request(app)
      .post('/api/projects')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ name: 'Original' });
    const res = await request(app)
      .put(`/api/projects/${created.body.id}`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ name: 'Updated' });
    expect(res.status).toBe(200);
    expect(res.body.name).toBe('Updated');
  });

  it('should not allow non-owner to delete', async () => {
    const created = await request(app)
      .post('/api/projects')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Admin Project' });
    const res = await request(app)
      .delete(`/api/projects/${created.body.id}`)
      .set('Authorization', `Bearer ${userToken}`);
    expect(res.status).toBe(403);
  });

  it('should allow admin to delete any project', async () => {
    const created = await request(app)
      .post('/api/projects')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ name: 'User Project' });
    const res = await request(app)
      .delete(`/api/projects/${created.body.id}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(204);
  });

  it('should reject unauthenticated requests', async () => {
    const res = await request(app).get('/api/projects');
    expect(res.status).toBe(401);
  });
});

describe('RBAC - admin users list', () => {
  it('should let admin list users', async () => {
    const res = await request(app)
      .get('/api/auth/users')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.length).toBe(2);
  });

  it('should forbid regular user from listing users', async () => {
    const res = await request(app)
      .get('/api/auth/users')
      .set('Authorization', `Bearer ${userToken}`);
    expect(res.status).toBe(403);
  });
});
