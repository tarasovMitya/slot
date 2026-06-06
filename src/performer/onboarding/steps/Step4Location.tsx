import { useState } from "react";
import { useForm } from "react-hook-form";
import { motion } from "framer-motion";
import { Navigation, Loader2 } from "lucide-react";
import { useOnboardingStore } from "../store/onboardingStore";
import { NavigationButtons } from "../components/NavigationButtons";
import { AddressSuggest } from "../../../components/ui/AddressSuggest";

interface FormData {
  city: string;
  district: string;
  address: string;
}

export function Step4Location() {
  const { city, district, address, setField, goNext, goBack } = useOnboardingStore();
  const [locating, setLocating] = useState(false);

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<FormData>({
    defaultValues: { city, district, address },
  });
  const addressValue = watch("address");

  const onSubmit = (data: FormData) => {
    setField("city", data.city);
    setField("district", data.district);
    setField("address", data.address);
    goNext();
  };

  const handleGetLocation = () => {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        setField("lat", latitude);
        setField("lng", longitude);
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&accept-language=ru`,
            { headers: { "Accept-Language": "ru" } }
          );
          const data = await res.json();
          const addr = data.address ?? {};
          const detectedCity = addr.city || addr.town || addr.village || "";
          const detectedDistrict = addr.suburb || addr.city_district || "";
          const street = addr.road || "";
          const house = addr.house_number || "";
          setValue("city", detectedCity);
          setValue("district", detectedDistrict);
          setValue("address", house ? `${street}, ${house}` : street);
        } catch {
          // leave fields as-is if reverse geocode fails
        }
        setLocating(false);
      },
      () => setLocating(false),
      { timeout: 8000 }
    );
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

      <button
        type="button"
        onClick={handleGetLocation}
        disabled={locating}
        className="flex items-center gap-2 w-full px-4 py-3 rounded-2xl border-2 border-dashed border-gray-200 text-sm font-medium text-gray-500 hover:border-gray-400 hover:text-gray-700 disabled:opacity-50 transition-all mb-5"
      >
        {locating ? (
          <Loader2 size={15} className="text-gray-400 animate-spin" />
        ) : (
          <Navigation size={15} className="text-gray-400" />
        )}
        {locating ? "Определяем местоположение..." : "Использовать текущую геопозицию"}
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
        <div>
          <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5 block">
            Адрес базирования
          </label>
          <AddressSuggest
            value={addressValue}
            onChange={(val) => setValue("address", val, { shouldValidate: true })}
            placeholder="ул. Ленина, 12"
            error={!!errors.address}
          />
          {errors.address && <p className="text-xs text-red-500 mt-1.5">{errors.address.message}</p>}
        </div>

        <NavigationButtons onBack={goBack} onNext={handleSubmit(onSubmit)} />
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
