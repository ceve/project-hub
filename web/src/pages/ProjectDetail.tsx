import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api, Project, Task, Comment } from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [title, setTitle] = useState('');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentBody, setCommentBody] = useState('');

  const load = useCallback(async () => {
    const [p, t] = await Promise.all([
      api.getProject(Number(id)),
      api.getTasks(Number(id)),
    ]);
    setProject(p);
    setTasks(t);
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const addTask = async () => {
    if (!title.trim()) return;
    await api.createTask({ title, project_id: Number(id) });
    setTitle('');
    load();
  };

  const updateStatus = async (taskId: number, status: string) => {
    await api.updateTask(taskId, { status });
    load();
  };

  const deleteProject = async () => {
    if (!confirm('Delete this project and all its tasks?')) return;
    await api.deleteProject(Number(id));
    navigate('/');
  };

  const selectTask = async (task: Task) => {
    setSelectedTask(task);
    setComments(await api.getComments(task.id));
  };

  const addComment = async () => {
    if (!commentBody.trim() || !selectedTask) return;
    await api.createComment({ body: commentBody, task_id: selectedTask.id });
    setCommentBody('');
    setComments(await api.getComments(selectedTask.id));
  };

  const deleteTask = async (taskId: number) => {
    await api.deleteTask(taskId);
    if (selectedTask?.id === taskId) {
      setSelectedTask(null);
      setComments([]);
    }
    load();
  };

  if (!project) return <p>Loading...</p>;

  const isOwnerOrAdmin = project.owner_id === user?.id || user?.role === 'admin';

  return (
    <div className="project-detail">
      <div className="page-header">
        <div>
          <h1>{project.name}</h1>
          <p>{project.description}</p>
        </div>
        {isOwnerOrAdmin && (
          <button className="btn btn-danger" onClick={deleteProject}>Delete Project</button>
        )}
      </div>
      <div className="project-columns">
        <div className="tasks-panel">
          <h2>Tasks</h2>
          <div className="add-task">
            <input placeholder="New task title" value={title} onChange={e => setTitle(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addTask()} />
            <button className="btn btn-primary" onClick={addTask}>Add</button>
          </div>
          {(['todo', 'in_progress', 'done'] as const).map(status => (
            <div key={status} className="task-group">
              <h3 className={`status-${status}`}>{status.replace(/_/g, ' ').toUpperCase()}</h3>
              {tasks.filter(t => t.status === status).map(t => (
                <div key={t.id} className={`task-item ${selectedTask?.id === t.id ? 'active' : ''}`}
                  onClick={() => selectTask(t)}>
                  <span>{t.title}</span>
                  <div className="task-actions">
                    <select value={t.status} onClick={e => e.stopPropagation()}
                      onChange={e => updateStatus(t.id, e.target.value)}>
                      <option value="todo">Todo</option>
                      <option value="in_progress">In Progress</option>
                      <option value="done">Done</option>
                    </select>
                    <button className="btn btn-sm btn-danger"
                      onClick={e => { e.stopPropagation(); deleteTask(t.id); }}>x</button>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
        {selectedTask && (
          <div className="comments-panel">
            <h2>Comments: {selectedTask.title}</h2>
            <div className="comments-list">
              {comments.map(c => (
                <div key={c.id} className="comment">
                  <strong>{c.author_name}</strong>
                  <p>{c.body}</p>
                  <small>{new Date(c.created_at).toLocaleString()}</small>
                </div>
              ))}
              {comments.length === 0 && <p className="empty">No comments yet.</p>}
            </div>
            <div className="add-comment">
              <textarea placeholder="Add a comment..." value={commentBody}
                onChange={e => setCommentBody(e.target.value)} />
              <button className="btn btn-primary" onClick={addComment}>Post</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
