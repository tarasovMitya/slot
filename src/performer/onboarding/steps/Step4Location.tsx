import { useForm } from "react-hook-form";
import { motion } from "framer-motion";
import { Navigation } from "lucide-react";
import { useOnboardingStore } from "../store/onboardingStore";
import { NavigationButtons } from "../components/NavigationButtons";

interface FormData {
  city: string;
  district: string;
  address: string;
}

const MOCK_ADDRESS = {
  city: "Москва",
  district: "Центральный",
  address: "ул. Ленина, 12",
};

export function Step4Location() {
  const { city, district, address, setField, goNext, goBack } = useOnboardingStore();

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<FormData>({
    defaultValues: { city, district, address },
  });

  const onSubmit = (data: FormData) => {
    setField("city", data.city);
    setField("district", data.district);
    setField("address", data.address);
    goNext();
  };

  const handleMockLocation = () => {
    setValue("city", MOCK_ADDRESS.city);
    setValue("district", MOCK_ADDRESS.district);
    setValue("address", MOCK_ADDRESS.address);
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -40 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
    >
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Ваш адрес</h1>
        <p className="text-gray-400 mt-1 text-sm">Откуда вы работаете</p>
      </div>

      {/* Mock geolocation button */}
      <button
        onClick={handleMockLocation}
        className="flex items-center gap-2 w-full px-4 py-3 rounded-2xl border-2 border-dashed border-gray-200 text-sm font-medium text-gray-500 hover:border-gray-400 hover:text-gray-700 transition-all mb-5"
      >
        <Navigation size={15} className="text-gray-400" />
        Использовать текущую геопозицию
      </button>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <Field
          label="Город"
          placeholder="Москва"
          error={errors.city?.message}
          {...register("city", { required: "Введите город" })}
        />
        <Field
          label="Район"
          placeholder="Центральный"
          error={errors.district?.message}
          {...register("district", { required: "Введите район" })}
        />
        <Field
          label="Домашний адрес"
          placeholder="ул. Ленина, 12"
          error={errors.address?.message}
          {...register("address", { required: "Введите адрес" })}
        />

        <NavigationButtons
          onBack={goBack}
          onNext={handleSubmit(onSubmit)}
        />
      </form>
    </motion.div>
  );
}

interface FieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

const Field = ({ label, error, ...props }: FieldProps) => (
  <div>
    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5 block">
      {label}
    </label>
    <input
      {...props}
      className={`w-full px-4 py-3.5 rounded-2xl border-2 text-sm font-medium text-gray-900 bg-white outline-none transition-colors placeholder-gray-300 ${
        error ? "border-red-300 focus:border-red-500" : "border-gray-100 focus:border-gray-400"
      }`}
    />
    {error && <p className="text-xs text-red-500 mt-1.5">{error}</p>}
  </div>
);
