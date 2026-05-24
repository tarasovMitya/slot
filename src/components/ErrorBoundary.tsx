import { Component } from "react";
import type { ReactNode, ErrorInfo } from "react";
import { trackError } from "../lib/analytics";

interface Props { children: ReactNode; }
interface State { hasError: boolean; error: Error | null; }

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    const component = info.componentStack?.trim().split("\n")[1]?.trim() ?? "Unknown";
    trackError(error, { component, severity: "critical" });
  }

  render() {
    if (this.state.hasError) {
      const msg = this.state.error?.message ?? "unknown";
      const stack = this.state.error?.stack?.split("\n").slice(0, 4).join(" | ") ?? "";
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center max-w-sm px-4">
            <p className="text-lg font-semibold text-gray-900">Что-то пошло не так</p>
            <p className="text-xs text-red-500 mt-2 text-left break-all bg-red-50 rounded p-2">{msg}</p>
            {stack && <p className="text-[10px] text-gray-400 mt-1 text-left break-all">{stack}</p>}
            <button
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-700 transition-colors"
            >
              Обновить страницу
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
