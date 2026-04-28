import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function GameOver() {
  const { state } = useLocation();
  const { user } = useAuth();
  const navigate = useNavigate();

  if (!state) {
    navigate('/home');
    return null;
  }

  const { finalScores, winnerId } = state;

  const sorted = Object.entries(finalScores).sort(([, a], [, b]) => a - b);
  const medals = ['🥇', '🥈', '🥉'];

  const iWon = winnerId === user?.id;

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center p-6 text-center">
      <div className="text-6xl mb-4">{iWon ? '🏆' : '🎮'}</div>
      <h1 className="text-4xl font-bold text-white mb-2">
        {iWon ? 'You Won!' : 'Game Over'}
      </h1>
      <p className="text-gray-400 mb-10">
        {iWon ? 'Incredible — the lowest score wins!' : 'Better luck next round!'}
      </p>

      {/* Podium */}
      <div className="flex items-end justify-center gap-4 mb-10">
        {sorted.slice(0, 3).map(([uid, score], i) => {
          const podiumHeights = ['h-32', 'h-24', 'h-20'];
          return (
            <div key={uid} className="flex flex-col items-center">
              <div className="text-2xl mb-1">{medals[i]}</div>
              <div className="text-white text-sm font-semibold mb-1 max-w-[80px] truncate">{uid}</div>
              <div className={`w-24 ${podiumHeights[i]} ${
                i === 0 ? 'bg-yellow-500' : i === 1 ? 'bg-gray-400' : 'bg-orange-700'
              } rounded-t-xl flex items-end justify-center pb-2`}>
                <span className="text-white font-bold text-lg">{score}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Full scores table */}
      <div className="bg-gray-800 rounded-2xl border border-gray-700 w-full max-w-sm overflow-hidden mb-8">
        <div className="px-4 py-3 border-b border-gray-700 text-gray-400 text-sm font-semibold text-left">
          Final Scores
        </div>
        {sorted.map(([uid, score], i) => (
          <div key={uid} className="flex justify-between px-4 py-3 border-b border-gray-700 last:border-0">
            <span className="text-gray-300">
              {medals[i] ?? `${i + 1}.`} {uid}
              {uid === user?.id && ' (You)'}
            </span>
            <span className={`font-bold ${i === 0 ? 'text-yellow-400' : 'text-white'}`}>{score}</span>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="flex gap-4">
        <button
          onClick={() => navigate('/home')}
          className="bg-gray-700 hover:bg-gray-600 text-white font-bold px-6 py-3 rounded-2xl transition-colors"
        >
          Home
        </button>
      </div>
    </div>
  );
}
