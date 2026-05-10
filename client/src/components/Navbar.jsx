import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AuthModal from './AuthModal';

function PersonIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
      <path fillRule="evenodd" d="M7.5 6a4.5 4.5 0 1 1 9 0 4.5 4.5 0 0 1-9 0ZM3.751 20.105a8.25 8.25 0 0 1 16.498 0 .75.75 0 0 1-.437.695A18.683 18.683 0 0 1 12 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 0 1-.437-.695Z" clipRule="evenodd" />
    </svg>
  );
}

function MenuIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  );
}

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [authOpen, setAuthOpen] = useState(false);
  const [authTab, setAuthTab] = useState('login');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [searchCity, setSearchCity] = useState('');
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  async function handleLogout() {
    setDropdownOpen(false);
    await logout();
    navigate('/');
  }

  function openAuth(tab) {
    setAuthTab(tab);
    setAuthOpen(true);
  }

  function handleSearch(e) {
    e.preventDefault();
    navigate(`/browse${searchCity ? `?city=${encodeURIComponent(searchCity)}` : ''}`);
  }

  return (
    <>
      <nav className="bg-white border-b border-[#DDDDDD] sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          {/* Logo */}
          <Link to="/" className="font-bold text-xl text-brand flex-shrink-0 tracking-tight">
            ParkSpot
          </Link>

          {/* Center search — desktop only */}
          <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-sm mx-4">
            <div className="flex w-full border border-[#DDDDDD] rounded-full overflow-hidden shadow-sm hover:shadow-md transition-shadow">
              <input
                type="text"
                value={searchCity}
                onChange={(e) => setSearchCity(e.target.value)}
                placeholder="Search by city"
                className="flex-1 px-4 py-2 text-sm text-[#222222] placeholder-[#717171] focus:outline-none bg-white"
              />
              <button
                type="submit"
                className="bg-brand text-white px-4 py-2 text-sm font-semibold hover:bg-brand-dark transition-colors flex-shrink-0"
              >
                Search
              </button>
            </div>
          </form>

          {/* Right side */}
          <div className="flex items-center gap-2">
            <Link
              to="/list-space"
              className="hidden sm:block text-sm font-medium text-[#222222] hover:bg-[#F7F7F7] px-3 py-2 rounded-full transition-colors"
            >
              Become a Host
            </Link>

            {user ? (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setDropdownOpen((v) => !v)}
                  className="flex items-center gap-2 border border-[#DDDDDD] rounded-full px-3 py-2 hover:shadow-md transition-shadow bg-white"
                >
                  <MenuIcon />
                  <span className="w-7 h-7 bg-[#717171] text-white rounded-full flex items-center justify-center">
                    <PersonIcon />
                  </span>
                </button>

                {dropdownOpen && (
                  <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-xl shadow-lg border border-[#DDDDDD] overflow-hidden z-50">
                    <div className="px-4 py-3 border-b border-[#DDDDDD]">
                      <p className="text-sm font-semibold text-[#222222] truncate">{user.name}</p>
                      <p className="text-xs text-[#717171] truncate">{user.email}</p>
                    </div>
                    <div className="py-1">
                      <Link
                        to="/dashboard"
                        onClick={() => setDropdownOpen(false)}
                        className="block px-4 py-2.5 text-sm text-[#222222] hover:bg-[#F7F7F7] transition-colors"
                      >
                        Dashboard
                      </Link>
                      <Link
                        to="/my-bookings"
                        onClick={() => setDropdownOpen(false)}
                        className="block px-4 py-2.5 text-sm text-[#222222] hover:bg-[#F7F7F7] transition-colors"
                      >
                        My Bookings
                      </Link>
                      <Link
                        to="/hosted-bookings"
                        onClick={() => setDropdownOpen(false)}
                        className="block px-4 py-2.5 text-sm text-[#222222] hover:bg-[#F7F7F7] transition-colors"
                      >
                        Hosting
                      </Link>
                      <div className="border-t border-[#DDDDDD] my-1" />
                      <button
                        onClick={handleLogout}
                        className="block w-full text-left px-4 py-2.5 text-sm text-[#222222] hover:bg-[#F7F7F7] transition-colors"
                      >
                        Log out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => openAuth('login')}
                  className="text-sm font-medium text-[#222222] hover:bg-[#F7F7F7] px-3 py-2 rounded-full transition-colors"
                >
                  Log in
                </button>
                <button
                  onClick={() => openAuth('register')}
                  className="text-sm font-semibold bg-[#222222] text-white px-4 py-2 rounded-full hover:bg-[#444444] transition-colors"
                >
                  Sign up
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>

      {authOpen && (
        <AuthModal
          onClose={() => setAuthOpen(false)}
          defaultTab={authTab}
        />
      )}
    </>
  );
}
