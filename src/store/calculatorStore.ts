import { create } from "zustand";
import type {
  Step,
  Category,
  Service,
  FieldValues,
  ContactInfo,
  ScheduleInfo,
} from "../types/calculator";

interface CalculatorState {
  step: Step;
  selectedCategory: Category | null;
  selectedService: Service | null;
  fieldValues: FieldValues;
  schedule: ScheduleInfo;
  contacts: ContactInfo;
  isSubmitting: boolean;
  skipAuth: boolean;

  setStep: (step: Step) => void;
  goNext: () => void;
  goBack: () => void;
  selectCategory: (category: Category) => void;
  selectService: (service: Service) => void;
  setFieldValue: (fieldId: string, value: number | string | boolean) => void;
  setSchedule: (schedule: ScheduleInfo) => void;
  setContacts: (contacts: ContactInfo) => void;
  setIsSubmitting: (v: boolean) => void;
  setSkipAuth: (v: boolean) => void;
  reset: () => void;
}

const STEPS: Step[] = [
  "category",
  "service",
  "parameters",
  "datetime",
  "summary",
  "auth",
  "checkout",
  "success",
];

const defaultContacts: ContactInfo = { name: "", email: "", phone: "", address: "", comment: "" };
const defaultSchedule: ScheduleInfo = { date: "", time: "" };

export const useCalculatorStore = create<CalculatorState>((set, get) => ({
  step: "category",
  selectedCategory: null,
  selectedService: null,
  fieldValues: {},
  schedule: defaultSchedule,
  contacts: defaultContacts,
  isSubmitting: false,
  skipAuth: false,

  setStep: (step) => set({ step }),

  goNext: () => {
    const { step, skipAuth } = get();
    const idx = STEPS.indexOf(step);
    let nextIdx = idx + 1;
    if (skipAuth && STEPS[nextIdx] === "auth") nextIdx++;
    if (nextIdx < STEPS.length) set({ step: STEPS[nextIdx] });
  },

  goBack: () => {
    const { step, skipAuth } = get();
    const idx = STEPS.indexOf(step);
    let prevIdx = idx - 1;
    if (skipAuth && STEPS[prevIdx] === "auth") prevIdx--;
    if (prevIdx >= 0) set({ step: STEPS[prevIdx] });
  },

  setSkipAuth: (v) => set({ skipAuth: v }),

  selectCategory: (category) =>
    set({ selectedCategory: category, selectedService: null, fieldValues: {} }),

  selectService: (service) => {
    const defaults: FieldValues = {};
    for (const field of service.fields) {
      if (field.defaultValue !== undefined) {
        defaults[field.id] = field.defaultValue;
      }
    }
    set({ selectedService: service, fieldValues: defaults });
  },

  setFieldValue: (fieldId, value) =>
    set((s) => ({ fieldValues: { ...s.fieldValues, [fieldId]: value } })),

  setSchedule: (schedule) => set({ schedule }),

  setContacts: (contacts) => set({ contacts }),

  setIsSubmitting: (v) => set({ isSubmitting: v }),

  reset: () =>
    set({
      step: "category",
      selectedCategory: null,
      selectedService: null,
      fieldValues: {},
      schedule: defaultSchedule,
      contacts: defaultContacts,
      isSubmitting: false,
      skipAuth: false,
    }),
}));
