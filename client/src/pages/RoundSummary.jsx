import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useSocket } from '../context/SocketContext';
import PlayerGrid from '../components/PlayerGrid';

export default function RoundSummary() {
  const { gameId } = useParams();
  const { state } = useLocation();
  const { socket } = useSocket();
  const navigate = useNavigate();

  if (!state) {
    navigate('/home');
    return null;
  }

  const { roundNumber, roundScores, cumulativeScores, grids } = state;

  const playerIds = Object.keys(roundScores);
  const sorted = [...playerIds].sort(
    (a, b) => cumulativeScores[a] - cumulativeScores[b]
  );

  function continueGame() {
    // The next round is started server-side automatically after round_ended.
    // For now navigate back and let socket events drive the next game_started.
    navigate(`/game/${gameId}`);
  }

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center p-6">
      <h1 className="text-3xl font-bold text-white mb-2">Round {roundNumber} Complete</h1>
      <p className="text-gray-400 mb-8">Here's how everyone scored this round.</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-4xl mb-8">
        {playerIds.map((uid) => (
          <div key={uid} className="bg-gray-800 rounded-2xl p-4 border border-gray-700 flex flex-col items-center gap-3">
            <div className="font-bold text-white">Player</div>
            <PlayerGrid grid={grids[uid]} small />
            <div className="flex gap-4 text-sm mt-2">
              <div className="text-center">
                <div className="text-gray-400">Round</div>
                <div className="font-bold text-white text-xl">{roundScores[uid]}</div>
              </div>
              <div className="text-center">
                <div className="text-gray-400">Total</div>
                <div className={`font-bold text-xl ${cumulativeScores[uid] >= 75 ? 'text-red-400' : 'text-green-400'}`}>
                  {cumulativeScores[uid]}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Cumulative standings */}
      <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700 w-full max-w-md mb-8">
        <h2 className="text-lg font-bold text-white mb-4 text-center">Standings</h2>
        <div className="space-y-2">
          {sorted.map((uid, i) => (
            <div key={uid} className="flex justify-between items-center">
              <span className="text-gray-300">
                {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`} {uid}
              </span>
              <span className="font-bold text-white">{cumulativeScores[uid]}</span>
            </div>
          ))}
        </div>
        {Object.values(cumulativeScores).some((s) => s >= 75) && (
          <p className="text-orange-400 text-sm text-center mt-3">
            ⚠️ Someone is getting close to 100!
          </p>
        )}
      </div>

      <button
        onClick={continueGame}
        className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-8 py-3 rounded-2xl text-lg transition-colors"
      >
        Continue to Next Round
      </button>
    </div>
  );
}
