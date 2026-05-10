import { Link } from 'react-router-dom';
import StarRating from './StarRating';

const TYPE_LABELS = {
  garage: 'Garage',
  driveway: 'Driveway',
  parking_lot: 'Parking Lot',
  carport: 'Carport',
};

function ParkingIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-16 h-16 text-[#DDDDDD]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1">
      <rect x="2" y="3" width="20" height="18" rx="2" />
      <path strokeLinecap="round" d="M8 17V7h5a3 3 0 010 6H8" />
    </svg>
  );
}

export default function SpaceCard({ space, highlighted }) {
  const price = space.pricePerHour ?? space.pricePerDay;
  const unit = space.pricePerHour ? '/hr' : '/day';
  const coverImage = space.images?.[0];

  return (
    <Link
      to={`/spaces/${space.id}`}
      className={`block group rounded-xl overflow-hidden transition-all duration-200 ${
        highlighted ? 'ring-2 ring-brand shadow-md' : ''
      }`}
    >
      {/* Image */}
      <div className="relative aspect-[4/3] bg-[#F7F7F7] overflow-hidden rounded-xl">
        {coverImage ? (
          <img
            src={coverImage}
            alt={space.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-[#F7F7F7]">
            <ParkingIcon />
          </div>
        )}

        {/* Type badge overlay */}
        <span className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm text-[#222222] text-xs font-semibold px-2.5 py-1 rounded-full shadow-sm">
          {TYPE_LABELS[space.type] || 'Parking'}
        </span>

        {space.instantBook && (
          <span className="absolute top-3 left-3 bg-[#222222]/80 text-white text-xs font-medium px-2 py-0.5 rounded-full">
            Instant Book
          </span>
        )}
      </div>

      {/* Card body */}
      <div className="pt-3 pb-1">
        <div className="flex items-start justify-between gap-2 mb-0.5">
          <h3 className="font-semibold text-[#222222] text-sm leading-tight truncate flex-1">
            {space.title}
          </h3>
          {space.avgRating != null && (
            <div className="flex items-center gap-1 flex-shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 text-[#222222]" fill="currentColor" viewBox="0 0 24 24">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
              <span className="text-xs font-medium text-[#222222]">
                {Number(space.avgRating).toFixed(1)}
              </span>
            </div>
          )}
        </div>

        <p className="text-sm text-[#717171] truncate">
          {space.city}, {space.state}
        </p>

        {space.reviewCount > 0 && (
          <p className="text-xs text-[#717171] mt-0.5">
            {space.reviewCount} review{space.reviewCount !== 1 ? 's' : ''}
          </p>
        )}

        <p className="mt-2 text-sm text-[#222222]">
          <span className="font-semibold">${Number(price).toFixed(2)}</span>
          <span className="text-[#717171] font-normal">{unit}</span>
        </p>
      </div>
    </Link>
  );
}
