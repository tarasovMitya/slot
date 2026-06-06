import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { OnboardingState, OnboardingData, OnboardingSkill, AvailabilitySlot } from "../types";

const INITIAL: OnboardingData = {
  name: "",
  phone: "",
  avatarUrl: "",
  skills: [],
  experience: "",
  hasCertification: false,
  city: "",
  district: "",
  address: "",
  lat: 0,
  lng: 0,
  radius: 10,
  inn: "",
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

export const useOnboardingStore = create<OnboardingStore>()(
  persist(
    (set) => ({
      ...INITIAL,
      step: 1,
      direction: 1 as const,
      completed: false,

      goNext: () =>
        set((s) => ({ step: Math.min(s.step + 1, 8), direction: 1 as const })),

      goBack: () =>
        set((s) => ({ step: Math.max(s.step - 1, 1), direction: -1 as const })),

      goToStep: (step) =>
        set((s) => ({ step, direction: (step > s.step ? 1 : -1) as 1 | -1 })),

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

      reset: () => set({ ...INITIAL, step: 1, direction: 1 as const, completed: false }),
    }),
    {
      name: "performer-onboarding",
      partialize: (state) => ({
        name: state.name,
        phone: state.phone,
        avatarUrl: state.avatarUrl,
        skills: state.skills,
        experience: state.experience,
        hasCertification: state.hasCertification,
        city: state.city,
        district: state.district,
        address: state.address,
        lat: state.lat,
        lng: state.lng,
        radius: state.radius,
        inn: state.inn,
        availability: state.availability,
        step: state.step,
        direction: state.direction,
        completed: state.completed,
      }),
    }
  )
);
