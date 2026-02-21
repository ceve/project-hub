import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api, Project } from '../api/client';

export default function Dashboard() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [showForm, setShowForm] = useState(false);

  useEffect(() => { loadProjects(); }, []);

  const loadProjects = async () => {
    try {
      setProjects(await api.getProjects());
    } catch { /* handled by empty state */ }
  };

  const createProject = async () => {
    if (!name.trim()) return;
    await api.createProject({ name, description: desc });
    setName('');
    setDesc('');
    setShowForm(false);
    loadProjects();
  };

  return (
    <div>
      <div className="page-header">
        <h1>Projects</h1>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : '+ New Project'}
        </button>
      </div>
      {showForm && (
        <div className="card form-card">
          <input placeholder="Project name" value={name} onChange={e => setName(e.target.value)} />
          <textarea placeholder="Description (optional)" value={desc} onChange={e => setDesc(e.target.value)} />
          <button className="btn btn-primary" onClick={createProject}>Create</button>
        </div>
      )}
      <div className="grid">
        {projects.map(p => (
          <Link to={`/projects/${p.id}`} key={p.id} className="card project-card">
            <h3>{p.name}</h3>
            <p>{p.description || 'No description'}</p>
            <small>by {p.owner_name}</small>
          </Link>
        ))}
        {projects.length === 0 && <p className="empty">No projects yet. Create one!</p>}
      </div>
    </div>
  );
}
