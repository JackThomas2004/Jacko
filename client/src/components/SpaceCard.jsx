import { Link } from 'react-router-dom';

const TYPE_LABELS = {
  garage: 'Garage',
  driveway: 'Driveway',
  parking_lot: 'Parking Lot',
  carport: 'Carport',
};

const TYPE_ICONS = {
  garage: '🏠',
  driveway: '🛤️',
  parking_lot: '🅿️',
  carport: '⛺',
};

function Stars({ rating }) {
  return (
    <span className="text-amber-400">
      {'★'.repeat(Math.round(rating))}{'☆'.repeat(5 - Math.round(rating))}
    </span>
  );
}

export default function SpaceCard({ space }) {
  const price = space.pricePerHour ?? space.pricePerDay;
  const unit = space.pricePerHour ? '/hr' : '/day';

  return (
    <Link
      to={`/spaces/${space.id}`}
      className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 block"
    >
      <div className="bg-gradient-to-br from-blue-50 to-slate-100 h-40 flex items-center justify-center text-6xl">
        {TYPE_ICONS[space.type] || '🅿️'}
      </div>
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-1">
          <h3 className="font-semibold text-slate-800 leading-tight line-clamp-2">{space.title}</h3>
          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full whitespace-nowrap flex-shrink-0">
            {TYPE_LABELS[space.type]}
          </span>
        </div>
        <p className="text-sm text-slate-500 mb-2">
          {space.city}, {space.state}
        </p>
        {space.avgRating && (
          <div className="flex items-center gap-1 text-sm mb-2">
            <Stars rating={space.avgRating} />
            <span className="text-slate-500">({space.reviewCount})</span>
          </div>
        )}
        <div className="flex flex-wrap gap-1 mb-3">
          {(space.amenities || []).slice(0, 3).map((a) => (
            <span key={a} className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
              {a}
            </span>
          ))}
        </div>
        <div className="flex items-center justify-between">
          <span className="font-bold text-blue-600 text-lg">
            ${price?.toFixed(2)}<span className="text-sm font-normal text-slate-500">{unit}</span>
          </span>
          <span className="text-xs text-slate-400">Hosted by {space.owner?.name}</span>
        </div>
      </div>
    </Link>
  );
}
