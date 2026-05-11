export type OnboardingSkill =
  | "Электрика"
  | "Сантехника"
  | "Мелкий ремонт"
  | "Сборка мебели"
  | "Уборка"
  | "Муж на час";

export type ExperienceLevel = "0–1" | "1–3" | "3–5" | "5+";

export type AvailabilitySlot = "Утро" | "День" | "Вечер" | "Выходные";

export interface OnboardingData {
  // Step 1
  name: string;
  phone: string;
  email: string;
  // Step 2
  skills: OnboardingSkill[];
  // Step 3
  experience: ExperienceLevel | "";
  hasCertification: boolean;
  // Step 4
  city: string;
  district: string;
  address: string;
  // Step 5
  radius: number;
  // Step 6
  hasPassport: boolean;
  // Step 7
  availability: AvailabilitySlot[];
}

export interface OnboardingState extends OnboardingData {
  step: number;
  direction: 1 | -1;
  completed: boolean;
}
