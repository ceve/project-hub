const API_BASE = '/api';

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  if (res.status === 204) return null as T;
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

export interface User {
  id: number;
  email: string;
  name: string;
  role: 'admin' | 'user';
  created_at: string;
}

export interface Project {
  id: number;
  name: string;
  description: string;
  owner_id: number;
  owner_name: string;
  created_at: string;
  updated_at: string;
}

export interface Task {
  id: number;
  title: string;
  description: string;
  status: 'todo' | 'in_progress' | 'done';
  project_id: number;
  assignee_id: number | null;
  assignee_name: string | null;
  created_at: string;
  updated_at: string;
}

export interface Comment {
  id: number;
  body: string;
  task_id: number;
  author_id: number;
  author_name: string;
  created_at: string;
}

export const api = {
  register: (body: { email: string; password: string; name: string }) =>
    request<{ user: User; token: string }>('/auth/register', { method: 'POST', body: JSON.stringify(body) }),
  login: (body: { email: string; password: string }) =>
    request<{ user: User; token: string }>('/auth/login', { method: 'POST', body: JSON.stringify(body) }),
  getMe: () => request<User>('/auth/me'),
  getUsers: () => request<User[]>('/auth/users'),

  getProjects: () => request<Project[]>('/projects'),
  getProject: (id: number) => request<Project>(`/projects/${id}`),
  createProject: (body: { name: string; description?: string }) =>
    request<Project>('/projects', { method: 'POST', body: JSON.stringify(body) }),
  updateProject: (id: number, body: { name?: string; description?: string }) =>
    request<Project>(`/projects/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteProject: (id: number) =>
    request<void>(`/projects/${id}`, { method: 'DELETE' }),

  getTasks: (projectId?: number) =>
    request<Task[]>(`/tasks${projectId ? `?project_id=${projectId}` : ''}`),
  createTask: (body: { title: string; description?: string; project_id: number; assignee_id?: number }) =>
    request<Task>('/tasks', { method: 'POST', body: JSON.stringify(body) }),
  updateTask: (id: number, body: { title?: string; description?: string; status?: string; assignee_id?: number }) =>
    request<Task>(`/tasks/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteTask: (id: number) =>
    request<void>(`/tasks/${id}`, { method: 'DELETE' }),

  getComments: (taskId?: number) =>
    request<Comment[]>(`/comments${taskId ? `?task_id=${taskId}` : ''}`),
  createComment: (body: { body: string; task_id: number }) =>
    request<Comment>('/comments', { method: 'POST', body: JSON.stringify(body) }),
  deleteComment: (id: number) =>
    request<void>(`/comments/${id}`, { method: 'DELETE' }),
};
