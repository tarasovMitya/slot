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
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center max-w-sm px-4">
            <p className="text-lg font-semibold text-gray-900">Что-то пошло не так</p>
            <p className="text-sm text-gray-400 mt-1">Ошибка зафиксирована. Попробуйте обновить страницу.</p>
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
