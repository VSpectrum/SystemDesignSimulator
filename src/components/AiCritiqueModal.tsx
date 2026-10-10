import React, { useState, useEffect } from 'react';
import {
  SystemDesignGraph,
  SystemMetrics,
} from '../types/system';
import { lintArchitecture } from '../engine/linter';
import { generateVerilogHDL, generateTopologyJson } from '../engine/dslGenerator';
import { requestOpenAiCritique, buildFullArchitectureCritiquePrompt } from '../engine/llmCritique';
import {
  Sparkles,
  AlertTriangle,
  ShieldAlert,
  Zap,
  TrendingDown,
  DollarSign,
  Key,
  Bot,
  Send,
  Loader2,
  X,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';

interface AiCritiqueModalProps {
  isOpen: boolean;
  onClose: () => void;
  graph: SystemDesignGraph;
  metrics: SystemMetrics;
}

export const AiCritiqueModal: React.FC<AiCritiqueModalProps> = ({
  isOpen,
  onClose,
  graph,
  metrics,
}) => {
  if (!isOpen) return null;

  const [activeTab, setActiveTab] = useState<'audit' | 'llm'>('audit');
  const [provider, setProvider] = useState<'gemini' | 'openai' | 'custom'>('gemini');
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('sysdesign_ai_key') || '');
  const [customEndpoint, setCustomEndpoint] = useState(
    () =>
      localStorage.getItem('sysdesign_ai_base_url') ||
      localStorage.getItem('sysdesign_ai_endpoint') ||
      'http://localhost:11434/v1'
  );
  const [modelName, setModelName] = useState('gemini-1.5-flash');

  const [isLoadingLlm, setIsLoadingLlm] = useState(false);
  const [llmCritiqueResponse, setLlmCritiqueResponse] = useState<string | null>(null);
  const [llmError, setLlmError] = useState<string | null>(null);

  // Run deterministic lint
  const lintIssues = lintArchitecture(graph);

  useEffect(() => {
    if (apiKey) {
      localStorage.setItem('sysdesign_ai_key', apiKey);
    }
    if (customEndpoint) {
      localStorage.setItem('sysdesign_ai_base_url', customEndpoint);
      localStorage.setItem('sysdesign_ai_endpoint', customEndpoint);
    }
  }, [apiKey, customEndpoint]);

  const handleRunAiCritique = async () => {
    setIsLoadingLlm(true);
    setLlmError(null);
    setLlmCritiqueResponse(null);

    const prompt = buildFullArchitectureCritiquePrompt(graph, metrics);

    try {
      if (provider === 'gemini') {
        if (!apiKey) {
          throw new Error('Please enter your Google Gemini API Key.');
        }

        const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.2, maxOutputTokens: 2048 },
          }),
        });

        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData?.error?.message || `Gemini API error (${res.status})`);
        }

        const data = await res.json();
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        setLlmCritiqueResponse(text || 'No response returned from Gemini.');
      } else if (provider === 'openai') {
        const text = await requestOpenAiCritique(
          {
            apiKey,
            baseUrl: 'https://api.openai.com/v1',
            model: modelName || 'gpt-4o',
          },
          prompt
        );
        setLlmCritiqueResponse(text);
      } else {
        const text = await requestOpenAiCritique(
          {
            apiKey,
            baseUrl: customEndpoint,
            model: modelName || 'llama3',
          },
          prompt
        );
        setLlmCritiqueResponse(text);
      }
    } catch (err: any) {
      setLlmError(err?.message || 'Failed to request AI critique.');
    } finally {
      setIsLoadingLlm(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-4xl max-h-[88vh] bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-zinc-800 flex flex-col overflow-hidden transition-colors">
        {/* Modal Header */}
        <div className="p-4 border-b border-gray-200 dark:border-zinc-800 flex items-center justify-between bg-purple-50/70 dark:bg-purple-950/30">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/60 rounded-lg text-purple-700 dark:text-purple-300">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-sans font-bold text-base md:text-lg text-gray-900 dark:text-zinc-100 leading-tight">
                Architectural Critique & System Audit
              </h2>
              <p className="text-xs text-gray-500 dark:text-zinc-400 font-sans">
                Deterministic rule inspection & LLM Staff Architect critique of your interconnect topology
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Tabs */}
            <div className="flex bg-gray-200/80 dark:bg-zinc-800 p-0.5 rounded-lg text-xs font-mono">
              <button
                onClick={() => setActiveTab('audit')}
                className={`px-3 py-1 rounded-md transition-all ${
                  activeTab === 'audit'
                    ? 'bg-white dark:bg-zinc-700 text-gray-900 dark:text-white font-bold shadow-xs'
                    : 'text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                Instant Rules Audit ({lintIssues.length})
              </button>
              <button
                onClick={() => setActiveTab('llm')}
                className={`px-3 py-1 rounded-md transition-all flex items-center gap-1 ${
                  activeTab === 'llm'
                    ? 'bg-purple-600 dark:bg-purple-500 text-white font-bold shadow-xs'
                    : 'text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <Bot className="w-3.5 h-3.5" />
                <span>Plug-in LLM Critique</span>
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 text-gray-400 hover:text-gray-700 dark:hover:text-zinc-200 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tab 1: Instant Deterministic Audit */}
        {activeTab === 'audit' && (
          <div className="flex-1 overflow-y-auto p-4 space-y-3 font-sans text-xs">
            <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-zinc-850 border border-gray-200 dark:border-zinc-800">
              <div>
                <span className="font-sans font-bold text-sm text-gray-900 dark:text-zinc-100 block">
                  Automated Architectural Health Check
                </span>
                <span className="text-gray-500 dark:text-zinc-400">
                  Scanned {graph.nodes.length} components, {graph.edges.length} wires, and cross-region latencies.
                </span>
              </div>
              <div className="text-right font-mono">
                <span
                  className={`text-base font-bold ${
                    lintIssues.length > 0
                      ? 'text-amber-600 dark:text-amber-400'
                      : 'text-emerald-600 dark:text-emerald-400'
                  }`}
                >
                  {lintIssues.length === 0 ? '100% CLEAN' : `${lintIssues.length} ISSUES`}
                </span>
              </div>
            </div>

            {lintIssues.length === 0 ? (
              <div className="p-8 text-center text-gray-500 dark:text-zinc-400">
                <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-2" />
                <h3 className="font-sans font-bold text-base text-gray-800 dark:text-zinc-100">
                  Architecture Passed All Best Practice Checks!
                </h3>
                <p className="max-w-md mx-auto text-xs text-gray-500 dark:text-zinc-400 mt-1">
                  Redundancy is properly configured, no single points of failure detected, and client traffic is properly load balanced.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {lintIssues.map((issue) => (
                  <div
                    key={issue.id}
                    className={`p-3.5 rounded-xl border transition-all ${
                      issue.severity === 'high'
                        ? 'bg-red-50/70 dark:bg-red-950/30 border-red-200 dark:border-red-900'
                        : issue.severity === 'medium'
                        ? 'bg-amber-50/70 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900'
                        : 'bg-blue-50/70 dark:bg-blue-950/30 border-blue-200 dark:border-blue-900'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {issue.severity === 'high' ? (
                          <ShieldAlert className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0" />
                        ) : (
                          <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                        )}
                        <h4 className="font-bold text-xs md:text-sm text-gray-900 dark:text-zinc-100">
                          {issue.title}
                        </h4>
                      </div>
                      <span className="font-mono text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 text-gray-700 dark:text-zinc-300">
                        {issue.category} • {issue.severity}
                      </span>
                    </div>

                    <p className="mt-1 text-gray-700 dark:text-zinc-300 leading-relaxed pl-6">
                      {issue.description}
                    </p>

                    <div className="mt-2 pl-6 pt-2 border-t border-black/5 dark:border-white/5 flex items-start gap-1.5 text-indigo-900 dark:text-indigo-300 font-medium">
                      <span>💡 <strong>Architectural Remedy:</strong> {issue.recommendation}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Plug-in LLM Critique */}
        {activeTab === 'llm' && (
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* LLM Configuration Header */}
            <div className="p-3 bg-gray-50 dark:bg-zinc-850 border-b border-gray-200 dark:border-zinc-800 grid grid-cols-1 md:grid-cols-4 gap-2 text-xs">
              <div>
                <label className="block text-[10px] uppercase font-mono text-gray-500 dark:text-zinc-400 mb-0.5">
                  Provider
                </label>
                <select
                  value={provider}
                  onChange={(e) => {
                    const p = e.target.value as any;
                    setProvider(p);
                    if (p === 'gemini') setModelName('gemini-1.5-flash');
                    if (p === 'openai') setModelName('gpt-4o');
                  }}
                  className="w-full px-2 py-1.5 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg text-gray-800 dark:text-zinc-200"
                >
                  <option value="gemini">Google Gemini</option>
                  <option value="openai">OpenAI</option>
                  <option value="custom">Custom Endpoint (Ollama / vLLM)</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-mono text-gray-500 dark:text-zinc-400 mb-0.5">
                  Model
                </label>
                <input
                  type="text"
                  value={modelName}
                  onChange={(e) => setModelName(e.target.value)}
                  placeholder="e.g. gemini-1.5-flash"
                  className="w-full px-2 py-1.5 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg text-gray-800 dark:text-zinc-200 font-mono"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-[10px] uppercase font-mono text-gray-500 dark:text-zinc-400 mb-0.5">
                  {provider === 'custom' ? 'API Base URL' : 'API Key (Stored locally)'}
                </label>
                <div className="flex gap-2">
                  <input
                    type={provider === 'custom' ? 'text' : 'password'}
                    value={provider === 'custom' ? customEndpoint : apiKey}
                    onChange={(e) =>
                      provider === 'custom'
                        ? setCustomEndpoint(e.target.value.trim())
                        : setApiKey(e.target.value.trim())
                    }
                    placeholder={
                      provider === 'custom'
                        ? 'http://localhost:11434/v1'
                        : 'sk-...'
                    }
                    className="flex-1 px-2.5 py-1.5 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg font-mono text-xs text-gray-800 dark:text-zinc-200"
                  />
                  <button
                    onClick={handleRunAiCritique}
                    disabled={isLoadingLlm}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded-lg font-semibold shrink-0 transition-colors shadow-xs"
                  >
                    {isLoadingLlm ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Analyzing...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Run Critique</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Critique Display Area */}
            <div className="flex-1 overflow-y-auto p-4 bg-gray-50/50 dark:bg-zinc-900/50">
              {llmError && (
                <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300 text-xs mb-3 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <div>
                    <strong>Evaluation Error:</strong> {llmError}
                  </div>
                </div>
              )}

              {isLoadingLlm && (
                <div className="py-16 text-center text-gray-500 dark:text-zinc-400">
                  <Loader2 className="w-8 h-8 text-purple-600 dark:text-purple-400 animate-spin mx-auto mb-2" />
                  <p className="font-sans font-bold text-sm text-gray-800 dark:text-zinc-200">
                    Evaluating System Interconnect Netlist & Latency Profile...
                  </p>
                  <p className="text-xs text-gray-400 dark:text-zinc-500 font-mono mt-1">
                    Analyzing queue saturation, cross-region penalties, and AI GPU throughput
                  </p>
                </div>
              )}

              {!isLoadingLlm && !llmCritiqueResponse && !llmError && (
                <div className="py-16 text-center text-gray-400 dark:text-zinc-500">
                  <Bot className="w-10 h-10 mx-auto mb-2 opacity-50" />
                  <p className="font-sans font-semibold text-sm text-gray-700 dark:text-zinc-300">
                    Plug in your API key above and click <strong>"Run Critique"</strong>
                  </p>
                  <p className="text-xs text-gray-400 dark:text-zinc-500 mt-1 max-w-sm mx-auto">
                    The AI will analyze your architecture's Verilog connector mapping, concurrency limits, and simulation telemetry to deliver a comprehensive design review.
                  </p>
                </div>
              )}

              {!isLoadingLlm && llmCritiqueResponse && (
                <div className="bg-white dark:bg-zinc-850 p-5 rounded-xl border border-gray-200 dark:border-zinc-800 shadow-xs font-sans text-xs text-gray-800 dark:text-zinc-200 leading-relaxed space-y-3 whitespace-pre-line">
                  {llmCritiqueResponse}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Footer info */}
        <div className="p-3 bg-gray-50 dark:bg-zinc-850/60 border-t border-gray-200 dark:border-zinc-800 text-xs text-gray-500 dark:text-zinc-400 font-sans flex items-center justify-between">
          <span>SysDesign AI Engine • Context-Aware Verilog & Telemetry Mapping</span>
          <span className="font-mono text-[11px] text-gray-400 dark:text-zinc-500">
            P50: {metrics.p50LatencyMs}ms | P95: {metrics.p95LatencyMs}ms | Load: {metrics.currentRps} RPS
          </span>
        </div>
      </div>
    </div>
  );
};
