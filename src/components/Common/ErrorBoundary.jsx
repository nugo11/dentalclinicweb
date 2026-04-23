import React from "react";
import { AlertTriangle, RefreshCcw } from "lucide-react";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[400px] p-8 bg-red-50/30 rounded-[40px] border border-red-100 font-nino">
          <div className="w-16 h-16 bg-red-100 text-red-500 rounded-2xl flex items-center justify-center mb-6">
            <AlertTriangle size={32} />
          </div>
          <h2 className="text-xl font-black text-brand-deep italic tracking-tight mb-2">
            უპს! რაღაც შეცდომა მოხდა
          </h2>
          <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mb-8 text-center max-w-xs leading-relaxed">
            კომპონენტის ჩატვირთვისას დაფიქსირდა ტექნიკური ხარვეზი
          </p>
          <button
            onClick={() => window.location.reload()}
            className="flex items-center gap-3 bg-brand-deep text-white px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl hover:bg-brand-purple transition-all"
          >
            <RefreshCcw size={16} /> გვერდის განახლება
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
