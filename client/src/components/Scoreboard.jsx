export default function Scoreboard({ players, cumulativeScores }) {
  const sorted = [...players].sort(
    (a, b) => (cumulativeScores[a.userId] ?? 0) - (cumulativeScores[b.userId] ?? 0)
  );

  return (
    <div className="bg-gray-800 rounded-xl p-3 text-sm w-40">
      <h3 className="font-bold text-gray-300 mb-2 text-center">Scores</h3>
      <div className="space-y-1">
        {sorted.map((p, i) => (
          <div key={p.userId} className="flex justify-between items-center">
            <span className="text-gray-400 truncate max-w-[90px]">
              {i === 0 ? '🥇 ' : i === 1 ? '🥈 ' : i === 2 ? '🥉 ' : `${i + 1}. `}
              {p.username}
            </span>
            <span className={`font-bold ml-1 ${
              (cumulativeScores[p.userId] ?? 0) >= 75 ? 'text-red-400' : 'text-white'
            }`}>
              {cumulativeScores[p.userId] ?? 0}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
