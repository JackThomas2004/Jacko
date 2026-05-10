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
    <nav className="bg-white border-b border-slate-200 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 font-bold text-xl text-blue-600">
          <span className="text-2xl">🅿</span> ParkSpot
        </Link>

        <div className="flex items-center gap-4">
          <Link to="/browse" className="text-slate-600 hover:text-blue-600 font-medium transition-colors">
            Find Parking
          </Link>

          {user ? (
            <>
              <Link to="/dashboard" className="text-slate-600 hover:text-blue-600 font-medium transition-colors">
                Dashboard
              </Link>
              <Link
                to="/list-space"
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                List a Space
              </Link>
              <button
                onClick={handleLogout}
                className="text-slate-500 hover:text-slate-700 text-sm"
              >
                Log out
              </button>
            </>
          ) : (
            <Link
              to="/"
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              Sign In
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
