function StarIcon({ filled, size }) {
  const dim = size === 'sm' ? 14 : size === 'lg' ? 24 : 18;
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={dim}
      height={dim}
      viewBox="0 0 24 24"
      fill={filled ? '#FF385C' : 'none'}
      stroke={filled ? '#FF385C' : '#DDDDDD'}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
}

export default function StarRating({ value = 0, onChange, size = 'md', readonly = false }) {
  const stars = [1, 2, 3, 4, 5];
  const isInteractive = !readonly && typeof onChange === 'function';

  return (
    <div className="flex items-center gap-0.5">
      {stars.map((n) => (
        <button
          key={n}
          type={isInteractive ? 'button' : undefined}
          onClick={() => isInteractive && onChange(n)}
          className={isInteractive ? 'cursor-pointer hover:scale-110 transition-transform focus:outline-none' : 'cursor-default'}
          aria-label={isInteractive ? `Rate ${n} star${n !== 1 ? 's' : ''}` : undefined}
          tabIndex={isInteractive ? 0 : -1}
        >
          <StarIcon filled={n <= Math.round(value)} size={size} />
        </button>
      ))}
    </div>
  );
}
