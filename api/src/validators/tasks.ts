import { z } from 'zod';

export const createTaskSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional().default(''),
  status: z.enum(['todo', 'in_progress', 'done']).optional().default('todo'),
  assignee_id: z.number().int().positive().optional().nullable(),
  project_id: z.number().int().positive(),
});

export const updateTaskSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).optional(),
  status: z.enum(['todo', 'in_progress', 'done']).optional(),
  assignee_id: z.number().int().positive().optional().nullable(),
});
