import { Router } from 'express';
import { pool } from '../db';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { createCommentSchema, updateCommentSchema } from '../validators/comments';
import { AppError } from '../middleware/errorHandler';

export const commentsRouter = Router();
commentsRouter.use(authenticate);

commentsRouter.get('/', async (req, res, next) => {
  try {
    const { task_id } = req.query;
    let query = `SELECT c.*, u.name as author_name FROM comments c
      JOIN users u ON c.author_id = u.id`;
    const params: unknown[] = [];
    if (task_id) {
      query += ' WHERE c.task_id = $1';
      params.push(task_id);
    }
    query += ' ORDER BY c.created_at ASC';
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
});

commentsRouter.post('/', validate(createCommentSchema), async (req, res, next) => {
  try {
    const { body, task_id } = req.body;
    const task = await pool.query('SELECT id FROM tasks WHERE id = $1', [task_id]);
    if (task.rows.length === 0) throw new AppError(404, 'Task not found');
    const result = await pool.query(
      'INSERT INTO comments (body, task_id, author_id) VALUES ($1, $2, $3) RETURNING *',
      [body, task_id, req.user!.userId]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

commentsRouter.put('/:id', validate(updateCommentSchema), async (req, res, next) => {
  try {
    const existing = await pool.query('SELECT * FROM comments WHERE id = $1', [req.params.id]);
    if (existing.rows.length === 0) throw new AppError(404, 'Comment not found');
    if (existing.rows[0].author_id !== req.user!.userId && req.user!.role !== 'admin') {
      throw new AppError(403, 'Not authorized');
    }
    const result = await pool.query(
      'UPDATE comments SET body = $1 WHERE id = $2 RETURNING *',
      [req.body.body, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

commentsRouter.delete('/:id', async (req, res, next) => {
  try {
    const existing = await pool.query('SELECT * FROM comments WHERE id = $1', [req.params.id]);
    if (existing.rows.length === 0) throw new AppError(404, 'Comment not found');
    if (existing.rows[0].author_id !== req.user!.userId && req.user!.role !== 'admin') {
      throw new AppError(403, 'Not authorized');
    }
    await pool.query('DELETE FROM comments WHERE id = $1', [req.params.id]);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});
