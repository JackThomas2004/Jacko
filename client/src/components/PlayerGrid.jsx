import Card from './Card';

/**
 * Renders a player's 3×4 card grid.
 * Props:
 *   grid         – 3×4 array of card objects (or null for removed columns)
 *   onCardClick  – (row, col) => void  (optional)
 *   isOwn        – whether this is the local player's grid
 *   activeCols   – Set of column indices that should be highlighted
 *   small        – smaller size for opponents
 */
export default function PlayerGrid({ grid, onCardClick, isOwn, small }) {
  if (!grid) return null;

  return (
    <div className="flex gap-1">
      {/* Render column by column (4 cols, 3 rows) */}
      {[0, 1, 2, 3].map((col) => (
        <div key={col} className="flex flex-col gap-1">
          {[0, 1, 2].map((row) => {
            const card = grid[row]?.[col];
            return (
              <Card
                key={`${row}-${col}`}
                card={card}
                small={small}
                onClick={onCardClick ? () => onCardClick(row, col) : undefined}
                disabled={!onCardClick}
              />
            );
          })}
        </div>
      ))}
    </div>
  );
}
