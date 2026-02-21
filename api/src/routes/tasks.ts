import { Router } from 'express';
import { pool } from '../db';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { createTaskSchema, updateTaskSchema } from '../validators/tasks';
import { AppError } from '../middleware/errorHandler';

export const tasksRouter = Router();
tasksRouter.use(authenticate);

tasksRouter.get('/', async (req, res, next) => {
  try {
    const { project_id } = req.query;
    let query = `SELECT t.*, u.name as assignee_name FROM tasks t
      LEFT JOIN users u ON t.assignee_id = u.id`;
    const params: unknown[] = [];
    if (project_id) {
      query += ' WHERE t.project_id = $1';
      params.push(project_id);
    }
    query += ' ORDER BY t.created_at DESC';
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
});

tasksRouter.get('/:id', async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT t.*, u.name as assignee_name FROM tasks t
       LEFT JOIN users u ON t.assignee_id = u.id WHERE t.id = $1`,
      [req.params.id]
    );
    if (result.rows.length === 0) throw new AppError(404, 'Task not found');
    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

tasksRouter.post('/', validate(createTaskSchema), async (req, res, next) => {
  try {
    const { title, description, status, assignee_id, project_id } = req.body;
    const project = await pool.query('SELECT id FROM projects WHERE id = $1', [project_id]);
    if (project.rows.length === 0) throw new AppError(404, 'Project not found');
    const result = await pool.query(
      'INSERT INTO tasks (title, description, status, assignee_id, project_id) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [title, description, status, assignee_id || null, project_id]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

tasksRouter.put('/:id', validate(updateTaskSchema), async (req, res, next) => {
  try {
    const existing = await pool.query('SELECT * FROM tasks WHERE id = $1', [req.params.id]);
    if (existing.rows.length === 0) throw new AppError(404, 'Task not found');
    const { title, description, status, assignee_id } = req.body;
    const result = await pool.query(
      `UPDATE tasks SET title = COALESCE($1, title), description = COALESCE($2, description),
       status = COALESCE($3, status), assignee_id = COALESCE($4, assignee_id),
       updated_at = NOW() WHERE id = $5 RETURNING *`,
      [title, description, status, assignee_id, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

tasksRouter.delete('/:id', async (req, res, next) => {
  try {
    const existing = await pool.query('SELECT * FROM tasks WHERE id = $1', [req.params.id]);
    if (existing.rows.length === 0) throw new AppError(404, 'Task not found');
    await pool.query('DELETE FROM tasks WHERE id = $1', [req.params.id]);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});
