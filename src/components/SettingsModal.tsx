import React, { useState } from 'react';
import {
  X,
  Key,
  Globe,
  Sparkles,
  Bot,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Trash2,
  Cpu,
} from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  baseUrl: string;
  onBaseUrlChange: (url: string) => void;
  apiKey: string;
  onApiKeyChange: (key: string) => void;
  model: string;
  onModelChange: (model: string) => void;
  liveCritiqueEnabled: boolean;
  onToggleLiveCritique: (enabled: boolean) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  baseUrl,
  onBaseUrlChange,
  apiKey,
  onApiKeyChange,
  model,
  onModelChange,
  liveCritiqueEnabled,
  onToggleLiveCritique,
}) => {
  const [showToken, setShowToken] = useState(false);

  if (!isOpen) return null;

  const handleBaseUrlChange = (value: string) => {
    onBaseUrlChange(value.trim());
  };

  const handleTokenChange = (value: string) => {
    // Strip leading, trailing, and internal stray whitespace immediately
    onApiKeyChange(value.trim());
  };

  const handleClearToken = () => {
    onApiKeyChange('');
  };

  const hasToken = apiKey.trim().length > 0;

  // Presets for fast 1-click configuration
  const applyPreset = (presetUrl: string, presetModel: string) => {
    onBaseUrlChange(presetUrl.trim());
    onModelChange(presetModel.trim());
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-lg bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-zinc-800 flex flex-col overflow-hidden transition-colors">
        {/* Modal Header */}
        <div className="p-4 border-b border-gray-200 dark:border-zinc-800 flex items-center justify-between bg-purple-50/70 dark:bg-purple-950/40">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300 rounded-lg">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-sans font-bold text-base text-gray-900 dark:text-zinc-100 leading-tight">
                LLM Connection Settings
              </h2>
              <p className="text-xs text-gray-500 dark:text-zinc-400 font-sans">
                Enter your API Base URL and API Token for live architect feedback
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-700 dark:hover:text-zinc-200 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4 font-sans text-xs">
          {/* Textbox 1: API Base URL */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="font-semibold text-gray-800 dark:text-zinc-200 flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                <span>API Base URL</span>
              </label>
              <span className="text-[10px] text-gray-400 dark:text-zinc-500 font-mono">
                OpenAI-compatible
              </span>
            </div>

            <input
              type="text"
              value={baseUrl}
              onChange={(e) => handleBaseUrlChange(e.target.value)}
              onPaste={(e) => {
                e.preventDefault();
                const pasted = e.clipboardData.getData('text');
                handleBaseUrlChange(pasted);
              }}
              placeholder="https://api.openai.com/v1"
              className="w-full px-3 py-2 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl font-mono text-xs text-gray-900 dark:text-zinc-100 placeholder:text-gray-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
            />
            <p className="mt-1 text-[11px] text-gray-500 dark:text-zinc-400">
              Base URL of your LLM provider. Endpoints like <code className="text-[10px] bg-gray-100 dark:bg-zinc-800 px-1 py-0.5 rounded">/chat/completions</code> are resolved automatically.
            </p>

            {/* Quick Provider Presets */}
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              <span className="text-[10px] text-gray-400 dark:text-zinc-500 font-mono">
                Quick Presets:
              </span>
              <button
                type="button"
                onClick={() => applyPreset('https://api.openai.com/v1', 'gpt-4o')}
                className="px-2 py-0.5 rounded bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-750 text-gray-700 dark:text-zinc-300 text-[10px] font-mono transition-colors"
              >
                OpenAI
              </button>
              <button
                type="button"
                onClick={() => applyPreset('http://localhost:11434/v1', 'llama3.3')}
                className="px-2 py-0.5 rounded bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-750 text-gray-700 dark:text-zinc-300 text-[10px] font-mono transition-colors"
              >
                Ollama (Local)
              </button>
              <button
                type="button"
                onClick={() => applyPreset('https://openrouter.ai/api/v1', 'anthropic/claude-3.5-sonnet')}
                className="px-2 py-0.5 rounded bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-750 text-gray-700 dark:text-zinc-300 text-[10px] font-mono transition-colors"
              >
                OpenRouter
              </button>
              <button
                type="button"
                onClick={() => applyPreset('https://api.groq.com/openai/v1', 'llama-3.3-70b-versatile')}
                className="px-2 py-0.5 rounded bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-750 text-gray-700 dark:text-zinc-300 text-[10px] font-mono transition-colors"
              >
                Groq
              </button>
            </div>
          </div>

          {/* Textbox 2: API Token */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="font-semibold text-gray-800 dark:text-zinc-200 flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                <span>API Token / Key</span>
              </label>
              {hasToken ? (
                <span className="flex items-center gap-1 text-[11px] font-mono text-emerald-600 dark:text-emerald-400 font-medium">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>Configured</span>
                </span>
              ) : (
                <span className="text-[11px] text-gray-400 dark:text-zinc-500 font-mono">
                  No token set
                </span>
              )}
            </div>

            <div className="relative flex items-center">
              <input
                type={showToken ? 'text' : 'password'}
                value={apiKey}
                onChange={(e) => handleTokenChange(e.target.value)}
                onPaste={(e) => {
                  e.preventDefault();
                  const pasted = e.clipboardData.getData('text');
                  handleTokenChange(pasted);
                }}
                placeholder="Paste API token (e.g. sk-...)"
                className="w-full pr-20 pl-3 py-2 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl font-mono text-xs text-gray-900 dark:text-zinc-100 placeholder:text-gray-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
              />
              <div className="absolute right-2 flex items-center gap-1">
                {hasToken && (
                  <>
                    <button
                      type="button"
                      onClick={() => setShowToken(!showToken)}
                      className="p-1 text-gray-400 hover:text-gray-700 dark:hover:text-zinc-200 transition-colors"
                      title={showToken ? 'Hide token' : 'Show token'}
                    >
                      {showToken ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                    <button
                      type="button"
                      onClick={handleClearToken}
                      className="p-1 text-red-400 hover:text-red-600 dark:hover:text-red-300 transition-colors"
                      title="Clear token"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </>
                )}
              </div>
            </div>
            <p className="mt-1 text-[11px] text-gray-500 dark:text-zinc-400">
              Paste directly. Spaces are automatically stripped. Token is stored locally in your browser.
            </p>
          </div>

          {/* Conditional Checkbox: Only appears once an API token is pasted */}
          {hasToken && (
            <div className="p-3.5 bg-purple-50/80 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 rounded-xl animate-in fade-in slide-in-from-top-2 duration-200">
              <label className="flex items-start gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={liveCritiqueEnabled}
                  onChange={(e) => onToggleLiveCritique(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded text-purple-600 focus:ring-purple-500 accent-purple-600 cursor-pointer shrink-0"
                />
                <div>
                  <span className="font-bold text-xs text-gray-900 dark:text-zinc-100 flex items-center gap-1.5 leading-snug">
                    <Sparkles className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                    Critique design on component connection
                  </span>
                  <p className="text-[11px] text-gray-600 dark:text-zinc-400 mt-1 leading-relaxed">
                    Trigger live critique from a Principal Engineer anytime a wire or interconnect is drawn between components.
                  </p>
                </div>
              </label>
            </div>
          )}

          {/* Model Identifier */}
          <div className="border-t border-gray-200 dark:border-zinc-800 pt-3">
            <div className="flex items-center justify-between mb-1">
              <label className="font-semibold text-gray-700 dark:text-zinc-300 flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5 text-gray-500" />
                <span>Model Name</span>
              </label>
              <span className="text-[10px] text-gray-400 dark:text-zinc-500 font-mono">
                Default: gpt-4o
              </span>
            </div>
            <input
              type="text"
              value={model}
              onChange={(e) => onModelChange(e.target.value.trim())}
              placeholder="gpt-4o"
              className="w-full px-2.5 py-1.5 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg font-mono text-xs text-gray-800 dark:text-zinc-200"
            />
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-3 bg-gray-50/80 dark:bg-zinc-850/60 border-t border-gray-200 dark:border-zinc-800 flex items-center justify-between text-xs text-gray-500 dark:text-zinc-400">
          <div className="flex items-center gap-1.5 text-[11px]">
            <AlertCircle className="w-3.5 h-3.5 text-gray-400" />
            <span>Settings are auto-saved in local browser storage</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition-colors shadow-2xs"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
