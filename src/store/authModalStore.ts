import { create } from "zustand";

export type AuthModalMode = "login" | "register";
export type AuthModalRole = "client" | "performer" | null;
export type AuthModalStep = "role" | "email" | "register_form" | "otp";

interface AuthModalState {
  isOpen: boolean;
  mode: AuthModalMode;
  role: AuthModalRole;
  step: AuthModalStep;
  pendingName: string;
  pendingPhone: string;
  pendingEmail: string;
  open: (mode: AuthModalMode) => void;
  close: () => void;
  setRole: (role: AuthModalRole) => void;
  setStep: (step: AuthModalStep) => void;
  setPending: (data: { name?: string; phone?: string; email?: string }) => void;
  reset: () => void;
}

export const useAuthModalStore = create<AuthModalState>((set) => ({
  isOpen: false,
  mode: "login",
  role: null,
  step: "role",
  pendingName: "",
  pendingPhone: "",
  pendingEmail: "",

  open: (mode) =>
    set({ isOpen: true, mode, role: null, step: "role", pendingName: "", pendingPhone: "", pendingEmail: "" }),

  close: () => set({ isOpen: false }),

  setRole: (role) => set({ role }),
  setStep: (step) => set({ step }),

  setPending: (data) =>
    set((s) => ({
      pendingName: data.name ?? s.pendingName,
      pendingPhone: data.phone ?? s.pendingPhone,
      pendingEmail: data.email ?? s.pendingEmail,
    })),

  reset: () =>
    set({ isOpen: false, mode: "login", role: null, step: "role", pendingName: "", pendingPhone: "", pendingEmail: "" }),
}));
