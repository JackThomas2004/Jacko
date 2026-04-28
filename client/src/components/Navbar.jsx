import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate('/');
  }

  return (
    <nav className="bg-gray-900 border-b border-gray-700 px-6 py-3 flex items-center justify-between">
      <Link to="/home" className="text-2xl font-bold text-white tracking-wide">
        🃏 Jacko
      </Link>
      {user && (
        <div className="flex items-center gap-4">
          <Link to="/friends" className="text-gray-300 hover:text-white text-sm">
            Friends
          </Link>
          <span className="text-gray-400 text-sm">{user.username}</span>
          <button
            onClick={handleLogout}
            className="text-gray-400 hover:text-red-400 text-sm"
          >
            Logout
          </button>
        </div>
      )}
    </nav>
  );
}
