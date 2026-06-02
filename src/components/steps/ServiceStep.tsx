import { useCalculatorStore } from "../../store/calculatorStore";
import { formatPrice } from "../../utils/priceCalculator";

export function ServiceStep() {
  const { selectedCategory, selectService, goNext } = useCalculatorStore();

  if (!selectedCategory) return null;

  const handleSelect = (serviceId: string) => {
    const service = selectedCategory.services.find((s) => s.id === serviceId);
    if (service) {
      selectService(service);
      goNext();
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="text-center mb-2">
        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 tracking-tight">
          {selectedCategory.name}
        </h2>
        <p className="text-gray-500 mt-2 text-lg">Выберите услугу</p>
      </div>
      <div className="flex flex-col gap-3">
        {selectedCategory.services.map((service) => (
          <button
            key={service.id}
            onClick={() => handleSelect(service.id)}
            className="w-full px-6 py-5 rounded-2xl border-2 border-gray-100 hover:border-[#006AFF] hover:bg-gray-50 text-left flex items-center justify-between transition-all group"
          >
            <div>
              <p className="text-lg font-semibold text-gray-900 group-hover:text-[#006AFF]">
                {service.name}
              </p>
              {service.description && (
                <p className="text-sm text-gray-500 mt-0.5">{service.description}</p>
              )}
            </div>
            <span className="text-base font-medium text-gray-400 shrink-0 ml-4">
              от {formatPrice(service.basePrice)}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
