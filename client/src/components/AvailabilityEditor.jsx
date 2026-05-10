const DAYS = [
  { label: 'Sunday', value: 0 },
  { label: 'Monday', value: 1 },
  { label: 'Tuesday', value: 2 },
  { label: 'Wednesday', value: 3 },
  { label: 'Thursday', value: 4 },
  { label: 'Friday', value: 5 },
  { label: 'Saturday', value: 6 },
];

const DEFAULT_START = '08:00';
const DEFAULT_END = '20:00';

export default function AvailabilityEditor({ value = [], onChange }) {
  // value: [{ dayOfWeek: 0-6, startTime: "HH:MM", endTime: "HH:MM" }]
  // days not in array are unavailable

  function getDay(dayOfWeek) {
    return value.find((d) => d.dayOfWeek === dayOfWeek) || null;
  }

  function toggleDay(dayOfWeek) {
    const existing = getDay(dayOfWeek);
    if (existing) {
      onChange(value.filter((d) => d.dayOfWeek !== dayOfWeek));
    } else {
      onChange([
        ...value,
        { dayOfWeek, startTime: DEFAULT_START, endTime: DEFAULT_END },
      ]);
    }
  }

  function updateTime(dayOfWeek, field, time) {
    onChange(
      value.map((d) =>
        d.dayOfWeek === dayOfWeek ? { ...d, [field]: time } : d
      )
    );
  }

  return (
    <div className="space-y-2">
      {DAYS.map(({ label, value: dayOfWeek }) => {
        const dayData = getDay(dayOfWeek);
        const enabled = !!dayData;

        return (
          <div
            key={dayOfWeek}
            className={`flex items-center gap-4 rounded-xl px-4 py-3 border transition-colors ${
              enabled
                ? 'bg-white border-[#DDDDDD]'
                : 'bg-[#F7F7F7] border-transparent'
            }`}
          >
            {/* Day name */}
            <span className="w-24 text-sm font-medium text-[#222222] flex-shrink-0">
              {label}
            </span>

            {/* Toggle */}
            <button
              type="button"
              role="switch"
              aria-checked={enabled}
              onClick={() => toggleDay(dayOfWeek)}
              className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-1 ${
                enabled ? 'bg-brand' : 'bg-[#DDDDDD]'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform transition-transform ${
                  enabled ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>

            {/* Times */}
            {enabled ? (
              <div className="flex items-center gap-2 flex-1">
                <input
                  type="time"
                  value={dayData.startTime}
                  onChange={(e) => updateTime(dayOfWeek, 'startTime', e.target.value)}
                  className="border border-[#DDDDDD] rounded-lg px-3 py-1.5 text-sm text-[#222222] focus:border-[#222222] focus:outline-none focus:ring-0 bg-white"
                />
                <span className="text-[#717171] text-sm">to</span>
                <input
                  type="time"
                  value={dayData.endTime}
                  onChange={(e) => updateTime(dayOfWeek, 'endTime', e.target.value)}
                  className="border border-[#DDDDDD] rounded-lg px-3 py-1.5 text-sm text-[#222222] focus:border-[#222222] focus:outline-none focus:ring-0 bg-white"
                />
              </div>
            ) : (
              <span className="text-sm text-[#717171]">Unavailable</span>
            )}
          </div>
        );
      })}
    </div>
  );
}
