import { Zap } from "lucide-react";
import { Stepper } from "./Stepper";

interface OnboardingLayoutProps {
  step: number;
  children: React.ReactNode;
}

export function OnboardingLayout({ step, children }: OnboardingLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Top bar */}
      <header className="flex items-center gap-2 px-5 py-4 bg-white border-b border-gray-100">
        <div className="w-7 h-7 bg-black rounded-lg flex items-center justify-center">
          <Zap size={13} className="text-white" fill="white" />
        </div>
        <span className="text-base font-bold text-gray-900 tracking-tight">SLOT</span>
        <span className="ml-1 text-sm text-gray-400">для исполнителей</span>
      </header>

      {/* Content */}
      <main className="flex-1 flex items-start justify-center px-4 py-8">
        <div className="w-full max-w-md">
          <Stepper current={step} />
          {children}
        </div>
      </main>
    </div>
  );
}
