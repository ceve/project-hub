import { pool } from './db';
import bcrypt from 'bcryptjs';

async function seed() {
  const adminHash = await bcrypt.hash('admin123', 10);
  const userHash = await bcrypt.hash('user123', 10);

  await pool.query(
    `INSERT INTO users (email, password_hash, name, role) VALUES
       ($1, $2, 'Admin User', 'admin'),
       ($3, $4, 'Regular User', 'user')
     ON CONFLICT (email) DO NOTHING`,
    ['admin@example.com', adminHash, 'user@example.com', userHash]
  );

  const projectResult = await pool.query(
    `INSERT INTO projects (name, description, owner_id)
     SELECT 'Demo Project', 'A sample project to get started', id
     FROM users WHERE email = 'admin@example.com'
     ON CONFLICT DO NOTHING
     RETURNING id`
  );

  if (projectResult.rows.length > 0) {
    const projectId = projectResult.rows[0].id;
    await pool.query(
      `INSERT INTO tasks (title, description, status, project_id, assignee_id)
       SELECT 'Setup CI/CD', 'Configure continuous integration', 'todo', $1, id
       FROM users WHERE email = 'user@example.com'`,
      [projectId]
    );
    await pool.query(
      `INSERT INTO tasks (title, description, status, project_id)
       VALUES ('Write docs', 'Document the API endpoints', 'in_progress', $1)`,
      [projectId]
    );
  }

  console.log('Seed complete');
  await pool.end();
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
