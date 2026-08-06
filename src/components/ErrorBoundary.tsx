import React, { Component, ErrorInfo, ReactNode } from "react";
import { RefreshCw, Radio, ShieldAlert } from "lucide-react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("[Antena Interdimensional ErrorBoundary]:", error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    if (typeof window !== "undefined") {
      window.location.reload();
    }
  };

  private handleSoftRecover = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4 font-sans selection:bg-emerald-500 selection:text-slate-950">
          <div className="max-w-xl w-full bg-slate-900/90 border-2 border-amber-500/80 rounded-2xl p-6 sm:p-8 shadow-[0_0_50px_rgba(245,158,11,0.25)] backdrop-blur-xl space-y-6 text-center">
            
            {/* Header Icon */}
            <div className="mx-auto w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/40 flex items-center justify-center text-amber-400 animate-pulse shadow-[0_0_20px_rgba(245,158,11,0.3)]">
              <ShieldAlert className="w-8 h-8" />
            </div>

            {/* Title & Description */}
            <div className="space-y-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded-full font-mono text-[10px] uppercase font-bold tracking-widest">
                <Radio className="w-3 h-3 animate-ping" />
                DESVIACIÓN DE FASE CAPTADA // SISTEMA DE RECOPERACIÓN
              </span>
              <h1 className="text-xl sm:text-2xl font-black font-mono text-white tracking-tight">
                Matriz de Sintonización Reestabilizada
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-sans">
                Se detectó una fluctuación imprevista en el procesador visual durante la sintonización con el plano dimensional. La antena ha aislado el canal para proteger la interfaz.
              </p>
            </div>

            {/* Error detail snippet */}
            {this.state.error && (
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 text-left font-mono text-[11px] text-amber-300/90 overflow-x-auto max-h-32">
                <span className="text-slate-500 block text-[9px] mb-1">DETALLE DE LA DESVIACIÓN DE CANAL:</span>
                <code>{this.state.error.toString()}</code>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={this.handleSoftRecover}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs font-mono uppercase tracking-wider transition-all duration-200 shadow-[0_0_20px_rgba(16,185,129,0.4)] flex items-center justify-center gap-2 cursor-pointer"
              >
                <Radio className="w-4 h-4" />
                REANUDAR SINTONIZACIÓN LOCAL
              </button>

              <button
                type="button"
                onClick={this.handleReset}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs font-mono uppercase tracking-wider transition-all duration-200 border border-slate-700 flex items-center justify-center gap-2 cursor-pointer"
              >
                <RefreshCw className="w-4 h-4 text-slate-400" />
                REINICIAR MATRIZ DE ANTENA
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
