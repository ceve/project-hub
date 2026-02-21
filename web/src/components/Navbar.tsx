import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <Link to="/">Project Hub</Link>
      </div>
      <div className="navbar-links">
        {user && (
          <>
            <Link to="/">Dashboard</Link>
            {user.role === 'admin' && <Link to="/admin">Admin</Link>}
            <span className="navbar-user">{user.name}</span>
            <button onClick={handleLogout} className="btn btn-sm">Logout</button>
          </>
        )}
      </div>
    </nav>
  );
}
