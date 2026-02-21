import { useState, useEffect } from 'react';
import { api, User } from '../api/client';

export default function AdminPanel() {
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    api.getUsers().then(setUsers).catch(console.error);
  }, []);

  return (
    <div>
      <h1>Admin Panel</h1>
      <h2>Users</h2>
      <div className="table-wrapper">
        <table className="data-table">
          <thead>
            <tr><th>ID</th><th>Name</th><th>Email</th><th>Role</th><th>Created</th></tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id}>
                <td>{u.id}</td>
                <td>{u.name}</td>
                <td>{u.email}</td>
                <td><span className={`badge badge-${u.role}`}>{u.role}</span></td>
                <td>{new Date(u.created_at).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
