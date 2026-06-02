import { categories } from "../../data/services";
import { useCalculatorStore } from "../../store/calculatorStore";

export function CategoryStep() {
  const { selectCategory, goNext } = useCalculatorStore();

  const handleSelect = (catId: string) => {
    const cat = categories.find((c) => c.id === catId);
    if (cat) {
      selectCategory(cat);
      goNext();
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="text-center mb-2">
        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 tracking-tight">
          Что нужно сделать?
        </h2>
        <p className="text-gray-500 mt-2 text-lg">Выберите категорию услуги</p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => handleSelect(cat.id)}
            className="flex flex-col items-center gap-3 p-6 rounded-2xl border-2 border-gray-100 hover:border-[#006AFF] hover:bg-gray-50 transition-all group"
          >
            <span className="text-4xl">{cat.icon}</span>
            <span className="text-base font-semibold text-gray-900 group-hover:text-[#006AFF]">
              {cat.name}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
