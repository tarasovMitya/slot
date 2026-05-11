import { create } from "zustand";
import type { OnboardingState, OnboardingData, OnboardingSkill, AvailabilitySlot } from "../types";

const INITIAL: OnboardingData = {
  name: "",
  phone: "",
  email: "",
  skills: [],
  experience: "",
  hasCertification: false,
  city: "",
  district: "",
  address: "",
  radius: 10,
  hasPassport: false,
  availability: [],
};

interface OnboardingStore extends OnboardingState {
  goNext: () => void;
  goBack: () => void;
  goToStep: (step: number) => void;
  setField: <K extends keyof OnboardingData>(key: K, value: OnboardingData[K]) => void;
  toggleSkill: (skill: OnboardingSkill) => void;
  toggleAvailability: (slot: AvailabilitySlot) => void;
  complete: () => void;
  reset: () => void;
}

export const useOnboardingStore = create<OnboardingStore>((set) => ({
  ...INITIAL,
  step: 1,
  direction: 1,
  completed: false,

  goNext: () =>
    set((s) => ({ step: Math.min(s.step + 1, 8), direction: 1 })),

  goBack: () =>
    set((s) => ({ step: Math.max(s.step - 1, 1), direction: -1 })),

  goToStep: (step) =>
    set((s) => ({ step, direction: step > s.step ? 1 : -1 })),

  setField: (key, value) =>
    set({ [key]: value } as Partial<OnboardingState>),

  toggleSkill: (skill) =>
    set((s) => ({
      skills: s.skills.includes(skill)
        ? s.skills.filter((sk) => sk !== skill)
        : [...s.skills, skill],
    })),

  toggleAvailability: (slot) =>
    set((s) => ({
      availability: s.availability.includes(slot)
        ? s.availability.filter((a) => a !== slot)
        : [...s.availability, slot],
    })),

  complete: () => set({ completed: true }),

  reset: () => set({ ...INITIAL, step: 1, direction: 1, completed: false }),
}));
