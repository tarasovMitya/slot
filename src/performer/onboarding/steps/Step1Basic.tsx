import { useForm } from "react-hook-form";
import { motion } from "framer-motion";
import { useOnboardingStore } from "../store/onboardingStore";
import { NavigationButtons } from "../components/NavigationButtons";

interface FormData {
  name: string;
  phone: string;
  email: string;
}

export function Step1Basic() {
  const { name, phone, email, setField, goNext } = useOnboardingStore();

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    defaultValues: { name, phone, email },
  });

  const onSubmit = (data: FormData) => {
    setField("name", data.name);
    setField("phone", data.phone);
    setField("email", data.email);
    goNext();
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -40 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
    >
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Расскажите о себе</h1>
        <p className="text-gray-400 mt-1 text-sm">Базовая информация для вашего профиля</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <Field
          label="Имя и фамилия"
          placeholder="Александр Иванов"
          error={errors.name?.message}
          {...register("name", { required: "Введите имя и фамилию" })}
        />
        <Field
          label="Телефон"
          placeholder="+7 999 123-45-67"
          type="tel"
          error={errors.phone?.message}
          {...register("phone", {
            required: "Введите номер телефона",
            pattern: { value: /^\+?[0-9\s\-()]{10,}$/, message: "Некорректный номер" },
          })}
        />
        <Field
          label="Email"
          placeholder="name@example.com"
          type="email"
          error={errors.email?.message}
          {...register("email", {
            required: "Введите email",
            pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: "Некорректный email" },
          })}
        />

        <NavigationButtons onNext={handleSubmit(onSubmit)} />
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
        error
          ? "border-red-300 focus:border-red-500"
          : "border-gray-100 focus:border-gray-400"
      }`}
    />
    {error && <p className="text-xs text-red-500 mt-1.5">{error}</p>}
  </div>
);
