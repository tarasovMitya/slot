import { ArrowLeft, ArrowRight } from "lucide-react";

interface NavigationButtonsProps {
  onBack?: () => void;
  onNext: () => void;
  nextLabel?: string;
  nextDisabled?: boolean;
  isLast?: boolean;
}

export function NavigationButtons({
  onBack,
  onNext,
  nextLabel,
  nextDisabled,
  isLast,
}: NavigationButtonsProps) {
  return (
    <div className="flex items-center gap-3 mt-8">
      {onBack && (
        <button
          onClick={onBack}
          className="flex items-center justify-center w-12 h-12 rounded-2xl border-2 border-gray-200 text-gray-500 hover:border-gray-400 hover:text-gray-800 transition-all shrink-0"
        >
          <ArrowLeft size={18} />
        </button>
      )}
      <button
        onClick={onNext}
        disabled={nextDisabled}
        className={`flex-1 flex items-center justify-center gap-2 h-12 rounded-2xl font-semibold text-sm transition-all active:scale-95 ${
          isLast
            ? "bg-[#006AFF] text-white hover:bg-[#004CB8] disabled:opacity-40"
            : "bg-[#006AFF] text-white hover:bg-[#004CB8] disabled:opacity-40"
        }`}
      >
        {nextLabel ?? "Далее"}
        {!isLast && <ArrowRight size={16} />}
      </button>
    </div>
  );
}
