import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { motion } from "framer-motion";
import { Camera } from "lucide-react";
import { useOnboardingStore } from "../store/onboardingStore";
import { NavigationButtons } from "../components/NavigationButtons";

interface FormData {
  name: string;
  phone: string;
}

export function Step1Basic() {
  const { name, phone, avatarUrl, setField, goNext } = useOnboardingStore();
  const [preview, setPreview] = useState(avatarUrl);
  const [consented, setConsented] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const { register, handleSubmit, watch, formState: { errors } } = useForm<FormData>({
    defaultValues: { name, phone },
  });

  const watchedName = watch("name", name);

  const onSubmit = (data: FormData) => {
    setField("name", data.name);
    setField("phone", data.phone);
    goNext();
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const url = reader.result as string;
      setPreview(url);
      setField("avatarUrl", url);
    };
    reader.readAsDataURL(file);
  };

  const initials = watchedName
    .split(" ")
    .map((w) => w[0]?.toUpperCase() ?? "")
    .slice(0, 2)
    .join("");

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

      {/* Avatar upload */}
      <div className="flex justify-center mb-6">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="relative w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden group cursor-pointer"
        >
          {preview ? (
            <img src={preview} alt="avatar" className="w-full h-full object-cover" />
          ) : (
            <span className="text-2xl font-bold text-gray-400">{initials || "?"}</span>
          )}
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-full">
            <Camera size={20} className="text-white" />
          </div>
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleAvatarChange}
        />
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

        {/* PD consent */}
        <label className="flex items-start gap-3 px-4 py-3.5 rounded-2xl bg-gray-50 border border-gray-100 cursor-pointer">
          <input
            type="checkbox"
            checked={consented}
            onChange={(e) => setConsented(e.target.checked)}
            className="mt-0.5 accent-black shrink-0"
          />
          <span className="text-xs text-gray-500 leading-relaxed">
            Я согласен(а) на обработку персональных данных в соответствии с{" "}
            <a
              href="/privacy"
              target="_blank"
              rel="noreferrer"
              className="font-medium text-gray-800 underline"
              onClick={(e) => e.stopPropagation()}
            >
              политикой конфиденциальности
            </a>{" "}
            (152-ФЗ)
          </span>
        </label>

        <NavigationButtons onNext={handleSubmit(onSubmit)} nextDisabled={!consented} />
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
