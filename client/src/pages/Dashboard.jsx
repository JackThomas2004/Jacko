import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';

export default function Dashboard() {
  const { user } = useAuth();

  const cards = [
    { to: '/browse', icon: '🔍', title: 'Find Parking', desc: 'Browse available garages, driveways, and lots near you.' },
    { to: '/my-bookings', icon: '📋', title: 'My Bookings', desc: 'View and manage spaces you have booked.' },
    { to: '/list-space', icon: '➕', title: 'List a Space', desc: 'Earn money by renting out your parking spot.' },
    { to: '/hosted-bookings', icon: '🏠', title: 'My Listings & Bookings', desc: 'See bookings on spaces you host and manage them.' },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold text-slate-800 mb-2">Welcome back, {user?.name?.split(' ')[0]}!</h1>
        <p className="text-slate-500 mb-10">What would you like to do today?</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {cards.map((card) => (
            <Link
              key={card.to}
              to={card.to}
              className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
            >
              <div className="text-4xl mb-3">{card.icon}</div>
              <h2 className="font-bold text-slate-800 text-lg mb-1">{card.title}</h2>
              <p className="text-slate-500 text-sm">{card.desc}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
