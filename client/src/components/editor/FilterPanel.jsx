export default function FilterPanel({ selected, onSelect }) {
  const filters = [
    { id: 'none', name: 'Original', style: {} },
    { id: 'grayscale', name: 'Mono', style: { filter: 'grayscale(100%)' } },
    { id: 'sepia', name: 'Sepia', style: { filter: 'sepia(100%)' } },
    { id: 'vintage', name: 'Vintage', style: { filter: 'sepia(30%) contrast(110%) brightness(95%)' } },
    { id: 'cool', name: 'Cool', style: { filter: 'saturate(90%) hue-rotate(15deg)' } },
    { id: 'warm', name: 'Warm', style: { filter: 'saturate(110%) hue-rotate(-10deg) brightness(105%)' } },
    { id: 'high-contrast', name: 'Contrast', style: { filter: 'contrast(140%)' } },
    { id: 'bright', name: 'Bright', style: { filter: 'brightness(115%)' } },
    { id: 'film', name: 'Film', style: { filter: 'contrast(110%) saturate(80%) brightness(95%)' } },
    { id: 'dramatic', name: 'Drama', style: { filter: 'contrast(130%) saturate(70%) brightness(90%)' } },
  ]

  return (
    <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-2">
      {filters.map((filter) => (
        <button
          key={filter.id}
          onClick={() => onSelect(filter.id)}
          className={`flex-shrink-0 flex flex-col items-center gap-2 transition-all ${
            selected === filter.id ? 'scale-105' : 'hover:scale-102'
          }`}
        >
          <div
            className={`w-14 h-14 md:w-16 md:h-16 rounded-xl overflow-hidden border-2 transition-colors ${
              selected === filter.id
                ? 'border-brand-red'
                : 'border-white/10 hover:border-white/20'
            }`}
            style={{
              background: 'linear-gradient(135deg, #667 0%, #99a 100%)',
              ...filter.style,
            }}
          >
            <div className="w-full h-full bg-gradient-to-br from-gray-500 to-gray-600" />
          </div>
          <span className={`text-xs font-medium ${
            selected === filter.id ? 'text-brand-red' : 'text-gray-500'
          }`}>
            {filter.name}
          </span>
        </button>
      ))}
    </div>
  )
}
