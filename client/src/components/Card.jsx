/**
 * A single Jacko card.
 * Props:
 *   card      – { value, color, faceUp } | null (null = removed column slot)
 *   onClick   – optional click handler
 *   selected  – highlight as selected (drawn card overlay)
 *   disabled  – grey out and no pointer events
 *   small     – smaller size for opponent grids
 */

const COLOR_CLASSES = {
  'dark-blue': 'bg-blue-900 text-white',
  blue:        'bg-blue-500 text-white',
  white:       'bg-gray-100 text-gray-900',
  yellow:      'bg-yellow-400 text-gray-900',
  orange:      'bg-orange-500 text-white',
  red:         'bg-red-500 text-white',
};

export default function Card({ card, onClick, selected, disabled, small }) {
  const sizeClass = small ? 'w-10 h-14 text-sm' : 'w-16 h-24 text-xl';

  if (!card) {
    // Empty slot (removed column)
    return <div className={`${sizeClass} rounded-lg border border-dashed border-gray-600 opacity-30`} />;
  }

  if (!card.faceUp) {
    // Card back
    return (
      <button
        onClick={onClick}
        disabled={disabled}
        className={`
          ${sizeClass} rounded-lg border-2 flex items-center justify-center font-bold
          bg-green-800 border-green-600
          ${selected ? 'ring-4 ring-yellow-300' : ''}
          ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:brightness-110 active:scale-95'}
          transition-all duration-150
        `}
        aria-label="Face-down card"
      >
        <span className="text-green-400 opacity-60">🃏</span>
      </button>
    );
  }

  const colorClass = COLOR_CLASSES[card.color] || 'bg-gray-400 text-white';

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        ${sizeClass} ${colorClass} rounded-lg border-2 border-white/20
        flex items-center justify-center font-bold shadow-md
        ${selected ? 'ring-4 ring-yellow-300 scale-105' : ''}
        ${disabled ? 'cursor-not-allowed' : 'cursor-pointer hover:brightness-110 active:scale-95'}
        transition-all duration-150 select-none
      `}
      aria-label={`Card value ${card.value}`}
    >
      {card.value}
    </button>
  );
}
