interface SliderControlProps {
  value: number;
  min?: number;
  max?: number;
  onChange: (v: number) => void;
  label?: string;
  unit?: string;
}

export function SliderControl({
  value,
  min = 1,
  max = 30,
  onChange,
  label,
  unit = "км",
}: SliderControlProps) {
  return (
    <div className="flex flex-col gap-4">
      {label && (
        <p className="text-sm text-gray-500">{label}</p>
      )}

      <div className="flex items-center justify-between mb-1">
        <span className="text-4xl font-bold text-gray-900">{value}</span>
        <span className="text-lg font-medium text-gray-400 mt-2">{unit}</span>
      </div>

      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-2 appearance-none rounded-full cursor-pointer accent-black bg-gray-200"
      />

      <div className="flex justify-between text-xs text-gray-400">
        <span>{min} {unit}</span>
        <span>{max} {unit}</span>
      </div>

      {/* Visual markers */}
      <div className="flex gap-2 flex-wrap">
        {[5, 10, 15, 20, 30].map((v) => (
          <button
            key={v}
            onClick={() => onChange(v)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              value === v
                ? "bg-black text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {v} {unit}
          </button>
        ))}
      </div>
    </div>
  );
}
