import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../src/app';
import { setupTestDb, cleanDb, teardownTestDb } from './setup';

beforeAll(async () => { await setupTestDb(); });
afterAll(async () => { await teardownTestDb(); });
beforeEach(async () => { await cleanDb(); });

describe('POST /api/auth/register', () => {
  it('should register a new user', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'test@test.com', password: 'password123', name: 'Test' });
    expect(res.status).toBe(201);
    expect(res.body.user.email).toBe('test@test.com');
    expect(res.body.token).toBeDefined();
  });

  it('should reject duplicate email', async () => {
    await request(app)
      .post('/api/auth/register')
      .send({ email: 'dup@test.com', password: 'password123', name: 'Test' });
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'dup@test.com', password: 'password123', name: 'Test2' });
    expect(res.status).toBe(409);
  });

  it('should reject invalid email', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'notanemail', password: 'password123', name: 'Test' });
    expect(res.status).toBe(400);
  });

  it('should reject short password', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'a@b.com', password: '12', name: 'Test' });
    expect(res.status).toBe(400);
  });
});

describe('POST /api/auth/login', () => {
  it('should login with valid credentials', async () => {
    await request(app)
      .post('/api/auth/register')
      .send({ email: 'login@test.com', password: 'password123', name: 'Login' });
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'login@test.com', password: 'password123' });
    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.email).toBe('login@test.com');
  });

  it('should reject invalid password', async () => {
    await request(app)
      .post('/api/auth/register')
      .send({ email: 'bad@test.com', password: 'password123', name: 'Bad' });
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'bad@test.com', password: 'wrong' });
    expect(res.status).toBe(401);
  });

  it('should reject unknown email', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'nobody@test.com', password: 'password123' });
    expect(res.status).toBe(401);
  });
});

describe('GET /api/auth/me', () => {
  it('should return user profile with valid token', async () => {
    const reg = await request(app)
      .post('/api/auth/register')
      .send({ email: 'me@test.com', password: 'password123', name: 'Me' });
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${reg.body.token}`);
    expect(res.status).toBe(200);
    expect(res.body.email).toBe('me@test.com');
  });

  it('should reject without token', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });
});

describe('GET /healthz', () => {
  it('should return ok', async () => {
    const res = await request(app).get('/healthz');
    expect(res.status).toBe(200);
    expect(res.text).toBe('ok');
  });
});
