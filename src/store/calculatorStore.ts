import { create } from "zustand";
import type {
  Step,
  Category,
  Service,
  FieldValues,
  ContactInfo,
  ScheduleInfo,
  CartItem,
} from "../types/calculator";
import { calculatePrice } from "../utils/priceCalculator";
import { categories } from "../data/services";
import { usePlatformSettingsStore } from "./platformSettingsStore";
import { trackEvent } from "../lib/analytics";

interface CalculatorState {
  step: Step;
  selectedCategory: Category | null;
  selectedService: Service | null;
  fieldValues: FieldValues;
  schedule: ScheduleInfo;
  contacts: ContactInfo;
  isSubmitting: boolean;
  skipAuth: boolean;

  // Multi-service cart
  cart: CartItem[];
  editingCartItemId: string | null;

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

  // Cart actions
  addToCart: () => void;
  removeFromCart: (id: string) => void;
  startEditCartItem: (id: string) => void;
  clearCurrentService: () => void;
}

const STEPS: Step[] = [
  "category",
  "service",
  "parameters",
  "add-more",
  "datetime",
  "auth",
  "checkout",
  "success",
];

const defaultContacts: ContactInfo = { name: "", email: "", phone: "", address: "", comment: "" };
const defaultSchedule: ScheduleInfo = { date: "", time: "" };

function getDuration(service: Service): string {
  return service.fields.length > 0 ? "~1–2 часа" : "~1 час";
}

export const useCalculatorStore = create<CalculatorState>((set, get) => ({
  step: "category",
  selectedCategory: null,
  selectedService: null,
  fieldValues: {},
  schedule: defaultSchedule,
  contacts: defaultContacts,
  isSubmitting: false,
  skipAuth: false,
  cart: [],
  editingCartItemId: null,

  setStep: (step) => set({ step }),

  goNext: () => {
    const { step, skipAuth } = get();
    const idx = STEPS.indexOf(step);
    let nextIdx = idx + 1;
    if (skipAuth && STEPS[nextIdx] === "auth") nextIdx++;
    if (nextIdx < STEPS.length) set({ step: STEPS[nextIdx] });
  },

  goBack: () => {
    const { step, skipAuth, editingCartItemId } = get();
    // Editing a cart item from parameters → cancel and go back to add-more
    if (step === "parameters" && editingCartItemId) {
      set({
        editingCartItemId: null,
        selectedCategory: null,
        selectedService: null,
        fieldValues: {},
        step: "add-more",
      });
      return;
    }
    const idx = STEPS.indexOf(step);
    let prevIdx = idx - 1;
    if (skipAuth && STEPS[prevIdx] === "auth") prevIdx--;
    if (prevIdx >= 0) set({ step: STEPS[prevIdx] });
  },

  setSkipAuth: (v) => set({ skipAuth: v }),

  selectCategory: (category) => {
    trackEvent("category_selected", { categoryId: category.id, categoryName: category.name });
    set({ selectedCategory: category, selectedService: null, fieldValues: {} });
  },

  selectService: (service) => {
    trackEvent("service_selected", { serviceId: service.id, serviceName: service.name, basePrice: service.basePrice });
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

  addToCart: () => {
    const { selectedCategory, selectedService, fieldValues, editingCartItemId } = get();
    if (!selectedService || !selectedCategory) return;

    const travelCost = usePlatformSettingsStore.getState().settings.travel_base_cost;
    const breakdown = calculatePrice(selectedService, fieldValues, travelCost);
    trackEvent("cart_item_added", {
      serviceId: selectedService.id,
      serviceName: selectedService.name,
      categoryId: selectedCategory.id,
      priceTotal: breakdown.total,
    });
    const cartItem: CartItem = {
      id: editingCartItemId ?? crypto.randomUUID(),
      categoryId: selectedCategory.id,
      categoryName: selectedCategory.name,
      serviceId: selectedService.id,
      serviceName: selectedService.name,
      fieldValues: { ...fieldValues },
      priceBreakdown: breakdown.items,
      priceTotal: breakdown.total,
      duration: getDuration(selectedService),
    };

    set((s) => ({
      cart: editingCartItemId
        ? s.cart.map((item) => (item.id === editingCartItemId ? cartItem : item))
        : [...s.cart, cartItem],
      editingCartItemId: null,
      selectedCategory: null,
      selectedService: null,
      fieldValues: {},
    }));
  },

  removeFromCart: (id) =>
    set((s) => ({ cart: s.cart.filter((item) => item.id !== id) })),

  startEditCartItem: (id) => {
    const item = get().cart.find((c) => c.id === id);
    if (!item) return;
    const category = categories.find((c) => c.id === item.categoryId);
    const service = category?.services.find((s) => s.id === item.serviceId);
    if (!category || !service) return;
    set({
      editingCartItemId: id,
      selectedCategory: category,
      selectedService: service,
      fieldValues: { ...item.fieldValues },
      step: "parameters",
    });
  },

  clearCurrentService: () =>
    set({ selectedCategory: null, selectedService: null, fieldValues: {} }),

  reset: () => {
    const { step } = get();
    if (step !== "success" && step !== "category") {
      trackEvent("flow_abandoned", { abandonedAt: step });
    }
    set({
      step: "category",
      selectedCategory: null,
      selectedService: null,
      fieldValues: {},
      schedule: defaultSchedule,
      contacts: defaultContacts,
      isSubmitting: false,
      skipAuth: false,
      cart: [],
      editingCartItemId: null,
    });
  },
}));
