import React, { useState } from 'react';
import {
  Sparkles,
  AlertTriangle,
  ShieldAlert,
  Loader2,
  X,
  Minimize2,
  Maximize2,
  Copy,
  Check,
  ExternalLink,
  Bot,
  ArrowRight,
  RefreshCw,
} from 'lucide-react';

export interface LiveCritiqueState {
  isOpen: boolean;
  isMinimized: boolean;
  isLoading: boolean;
  sourceNodeLabel: string;
  sourceNodeType: string;
  targetNodeLabel: string;
  targetNodeType: string;
  protocol: string;
  critiqueText: string | null;
  errorMessage: string | null;
  timestamp: string;
}

interface LiveCritiquePanelProps {
  state: LiveCritiqueState;
  onClose: () => void;
  onToggleMinimize: () => void;
  onOpenFullCritique: () => void;
  onRetry?: () => void;
}

export const LiveCritiquePanel: React.FC<LiveCritiquePanelProps> = ({
  state,
  onClose,
  onToggleMinimize,
  onOpenFullCritique,
  onRetry,
}) => {
  const [copied, setCopied] = useState(false);

  if (!state.isOpen) return null;

  const handleCopy = () => {
    if (state.critiqueText) {
      navigator.clipboard.writeText(state.critiqueText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Minimized Pill view
  if (state.isMinimized) {
    return (
      <div className="fixed bottom-4 right-4 z-40 animate-in fade-in slide-in-from-bottom-2 duration-150">
        <button
          onClick={onToggleMinimize}
          className="flex items-center gap-2 px-3.5 py-2 bg-purple-900/90 hover:bg-purple-800 text-white border border-purple-700/80 rounded-full shadow-xl backdrop-blur-md transition-all text-xs font-semibold group"
        >
          {state.isLoading ? (
            <Loader2 className="w-3.5 h-3.5 text-purple-300 animate-spin" />
          ) : state.errorMessage ? (
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
          ) : (
            <Sparkles className="w-3.5 h-3.5 text-purple-300 group-hover:rotate-12 transition-transform" />
          )}
          <span>Staff Critique:</span>
          <span className="font-mono text-purple-200 truncate max-w-[150px]">
            {state.sourceNodeLabel} → {state.targetNodeLabel}
          </span>
          <Maximize2 className="w-3 h-3 text-purple-300 ml-1" />
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-40 w-[440px] max-w-[calc(100vw-2rem)] bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md rounded-2xl border border-purple-200/80 dark:border-purple-900/60 shadow-2xl overflow-hidden flex flex-col max-h-[75vh] animate-in fade-in slide-in-from-bottom-3 duration-200 transition-colors">
      {/* Header */}
      <div className="p-3 bg-purple-50/90 dark:bg-purple-950/40 border-b border-purple-100 dark:border-purple-900/50 flex items-center justify-between select-none">
        <div className="flex items-center gap-2 min-w-0">
          <div className="p-1.5 bg-purple-600 text-white rounded-lg shrink-0">
            {state.isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Bot className="w-4 h-4" />
            )}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-xs text-gray-900 dark:text-zinc-100 truncate">
                Staff Architect Live Critique
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300 shrink-0 font-semibold">
                Live Interconnect
              </span>
            </div>
            <div className="flex items-center gap-1 text-[11px] text-gray-500 dark:text-zinc-400 truncate font-mono mt-0.5">
              <span className="text-gray-800 dark:text-zinc-200 font-semibold truncate">
                {state.sourceNodeLabel}
              </span>
              <ArrowRight className="w-2.5 h-2.5 shrink-0 text-purple-500" />
              <span className="text-gray-800 dark:text-zinc-200 font-semibold truncate">
                {state.targetNodeLabel}
              </span>
              <span className="text-[10px] opacity-70">({state.protocol})</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0 ml-2">
          <button
            onClick={onToggleMinimize}
            className="p-1 text-gray-400 hover:text-gray-700 dark:hover:text-zinc-200 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-md transition-colors"
            title="Minimize"
          >
            <Minimize2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-700 dark:hover:text-zinc-200 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-md transition-colors"
            title="Close"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-4 font-sans text-xs text-gray-800 dark:text-zinc-200 leading-relaxed space-y-3">
        {state.isLoading && (
          <div className="py-8 text-center space-y-2">
            <Loader2 className="w-6 h-6 text-purple-600 dark:text-purple-400 animate-spin mx-auto" />
            <p className="font-semibold text-gray-900 dark:text-zinc-100">
              Auditing Connection Impact...
            </p>
            <p className="text-[11px] text-gray-500 dark:text-zinc-400 font-mono">
              Analyzing capacity mismatches, cross-region penalties, and edge-case failure modes
            </p>
          </div>
        )}

        {state.errorMessage && !state.isLoading && (
          <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-xl text-red-700 dark:text-red-300 space-y-1">
            <div className="flex items-center gap-1.5 font-bold">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>Critique Generation Failed</span>
            </div>
            <p className="text-[11px] leading-relaxed">{state.errorMessage}</p>
            {onRetry && (
              <button
                onClick={onRetry}
                className="mt-2 flex items-center gap-1 text-[11px] font-semibold text-red-800 dark:text-red-200 underline"
              >
                <RefreshCw className="w-3 h-3" /> Retry Critique
              </button>
            )}
          </div>
        )}

        {state.critiqueText && !state.isLoading && (
          <div className="whitespace-pre-line text-[11.5px] leading-relaxed space-y-2 select-text font-sans">
            {state.critiqueText}
          </div>
        )}
      </div>

      {/* Footer Actions */}
      <div className="p-2.5 bg-gray-50 dark:bg-zinc-850/80 border-t border-gray-200 dark:border-zinc-800 flex items-center justify-between text-xs">
        <span className="text-[10px] text-gray-400 dark:text-zinc-500 font-mono">
          {state.timestamp || 'Live Staff Evaluation'}
        </span>

        <div className="flex items-center gap-2">
          {state.critiqueText && (
            <button
              onClick={handleCopy}
              className="flex items-center gap-1 px-2 py-1 text-[11px] font-semibold rounded-md text-gray-600 dark:text-zinc-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-zinc-700 transition-colors"
            >
              {copied ? (
                <>
                  <Check className="w-3 h-3 text-emerald-500" />
                  <span>Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" />
                  <span>Copy</span>
                </>
              )}
            </button>
          )}

          <button
            onClick={onOpenFullCritique}
            className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold rounded-md bg-purple-600 hover:bg-purple-700 text-white transition-colors shadow-2xs"
          >
            <span>Full System Audit</span>
            <ExternalLink className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
};
