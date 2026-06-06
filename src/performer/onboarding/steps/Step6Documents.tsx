import { useForm } from "react-hook-form";
import { motion } from "framer-motion";
import { Lock } from "lucide-react";
import { useOnboardingStore } from "../store/onboardingStore";
import { NavigationButtons } from "../components/NavigationButtons";

interface FormData {
  inn: string;
}

export function Step6Documents() {
  const { inn, setField, goNext, goBack } = useOnboardingStore();

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    defaultValues: { inn },
  });

  const onSubmit = (data: FormData) => {
    setField("inn", data.inn);
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
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">ИНН</h1>
        <p className="text-gray-400 mt-1 text-sm">Необходим для официальных выплат</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <div>
          <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5 block">
            ИНН физического лица
          </label>
          <input
            {...register("inn", {
              required: "Введите ИНН",
              pattern: { value: /^\d{12}$/, message: "ИНН должен содержать 12 цифр" },
            })}
            type="text"
            inputMode="numeric"
            maxLength={12}
            placeholder="123456789012"
            className={`w-full px-4 py-3.5 rounded-2xl border-2 text-sm font-medium text-gray-900 bg-white outline-none transition-colors placeholder-gray-300 ${
              errors.inn ? "border-red-300 focus:border-red-500" : "border-gray-100 focus:border-gray-400"
            }`}
          />
          {errors.inn && <p className="text-xs text-red-500 mt-1.5">{errors.inn.message}</p>}
        </div>

        <div className="rounded-2xl bg-gray-50 border border-gray-100 px-4 py-3.5 flex items-start gap-3">
          <Lock size={14} className="text-gray-400 mt-0.5 shrink-0" />
          <p className="text-xs text-gray-500 leading-relaxed">
            ИНН хранится в зашифрованном виде и передаётся только в платёжную систему для оформления выплат.
            Доступ к данным имеет только служба выплат.{" "}
            <a href="/privacy" target="_blank" rel="noreferrer" className="font-medium text-gray-800 underline">
              Политика конфиденциальности
            </a>
          </p>
        </div>

        <NavigationButtons onBack={goBack} onNext={handleSubmit(onSubmit)} nextLabel="Продолжить" />
      </form>
    </motion.div>
  );
}
