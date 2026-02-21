import express from 'express';
import cors from 'cors';
import { authRouter } from './routes/auth';
import { projectsRouter } from './routes/projects';
import { tasksRouter } from './routes/tasks';
import { commentsRouter } from './routes/comments';
import { errorHandler } from './middleware/errorHandler';

export const app = express();

app.use(cors());
app.use(express.json());

app.get('/healthz', (_req, res) => res.status(200).send('ok'));

app.use('/api/auth', authRouter);
app.use('/api/projects', projectsRouter);
app.use('/api/tasks', tasksRouter);
app.use('/api/comments', commentsRouter);

app.use(errorHandler);
