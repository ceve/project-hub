import { Router } from 'express';
import { pool } from '../db';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { createProjectSchema, updateProjectSchema } from '../validators/projects';
import { AppError } from '../middleware/errorHandler';

export const projectsRouter = Router();
projectsRouter.use(authenticate);

projectsRouter.get('/', async (_req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT p.*, u.name as owner_name FROM projects p
       JOIN users u ON p.owner_id = u.id ORDER BY p.created_at DESC`
    );
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
});

projectsRouter.get('/:id', async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT p.*, u.name as owner_name FROM projects p
       JOIN users u ON p.owner_id = u.id WHERE p.id = $1`,
      [req.params.id]
    );
    if (result.rows.length === 0) throw new AppError(404, 'Project not found');
    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

projectsRouter.post('/', validate(createProjectSchema), async (req, res, next) => {
  try {
    const { name, description } = req.body;
    const result = await pool.query(
      'INSERT INTO projects (name, description, owner_id) VALUES ($1, $2, $3) RETURNING *',
      [name, description, req.user!.userId]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

projectsRouter.put('/:id', validate(updateProjectSchema), async (req, res, next) => {
  try {
    const project = await pool.query('SELECT * FROM projects WHERE id = $1', [req.params.id]);
    if (project.rows.length === 0) throw new AppError(404, 'Project not found');
    if (project.rows[0].owner_id !== req.user!.userId && req.user!.role !== 'admin') {
      throw new AppError(403, 'Not authorized');
    }
    const { name, description } = req.body;
    const result = await pool.query(
      `UPDATE projects SET name = COALESCE($1, name), description = COALESCE($2, description),
       updated_at = NOW() WHERE id = $3 RETURNING *`,
      [name, description, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

projectsRouter.delete('/:id', async (req, res, next) => {
  try {
    const project = await pool.query('SELECT * FROM projects WHERE id = $1', [req.params.id]);
    if (project.rows.length === 0) throw new AppError(404, 'Project not found');
    if (project.rows[0].owner_id !== req.user!.userId && req.user!.role !== 'admin') {
      throw new AppError(403, 'Not authorized');
    }
    await pool.query('DELETE FROM projects WHERE id = $1', [req.params.id]);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});
