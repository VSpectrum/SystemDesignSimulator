import React, { useState } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Share2,
  Download,
  FileCode,
  Sparkles,
  Sliders,
  Globe,
  Zap,
  Activity,
  Layers,
  Check,
  Sun,
  Moon,
  MessageSquareQuote,
  Upload,
  Settings,
} from 'lucide-react';
import {
  SimulationSettings,
  RegionId,
  SystemDesignGraph,
} from '../types/system';
import { ARCHITECTURE_TEMPLATES } from '../engine/templates';

interface TopBarProps {
  simulationSettings: SimulationSettings;
  onUpdateSettings: (settings: SimulationSettings) => void;
  onResetSimulation: () => void;
  graph: SystemDesignGraph;
  onLoadTemplate: (templateId: string) => void;
  onOpenDslModal: () => void;
  onOpenImportModal: () => void;
  onOpenAiCritique: () => void;
  onOpenSettings: () => void;
  onExportPng: () => void;
  onShareLink: () => void;
  issueCount: number;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  isDiscussionOpen: boolean;
  onToggleDiscussion: () => void;
  hasApiKey: boolean;
  liveCritiqueEnabled: boolean;
  onToggleLiveCritique: (enabled: boolean) => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  simulationSettings,
  onUpdateSettings,
  onResetSimulation,
  graph,
  onLoadTemplate,
  onOpenDslModal,
  onOpenImportModal,
  onOpenAiCritique,
  onOpenSettings,
  onExportPng,
  onShareLink,
  issueCount,
  theme,
  onToggleTheme,
  isDiscussionOpen,
  onToggleDiscussion,
  hasApiKey,
  liveCritiqueEnabled,
  onToggleLiveCritique,
}) => {
  const [copiedShare, setCopiedShare] = useState(false);
  const categories = Array.from(new Set(ARCHITECTURE_TEMPLATES.map((t) => t.category)));

  const handleShareClick = () => {
    onShareLink();
    setCopiedShare(true);
    setTimeout(() => setCopiedShare(false), 2500);
  };

  return (
    <header className="h-14 border-b border-gray-200 dark:border-zinc-800 bg-white/95 dark:bg-zinc-900/95 backdrop-blur px-4 flex items-center justify-between z-20 select-none shadow-xs transition-colors duration-150">
      {/* Brand & Title */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 dark:bg-indigo-500 flex items-center justify-center text-white shadow-xs font-bold font-mono text-sm">
            SD
          </div>
          <div>
            <h1 className="font-sans font-bold text-base md:text-lg tracking-tight leading-none text-gray-900 dark:text-zinc-100 flex items-center gap-1.5">
              SysDesign Sim
              <span className="text-[10px] font-mono font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 px-1.5 py-0.5 rounded">
                Multisim AI
              </span>
            </h1>
            <p className="text-[11px] text-gray-500 dark:text-zinc-400 font-sans leading-none mt-0.5">
              Interactive load simulation • Verilog HDL • Architecture advisor
            </p>
          </div>
        </div>

        {/* Templates Selector */}
        <div className="hidden md:flex items-center ml-4 pl-3 border-l border-gray-200 dark:border-zinc-800">
          <Layers className="w-3.5 h-3.5 text-gray-400 dark:text-zinc-500 mr-1.5" />
          <select
            className="text-xs bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-md px-2 py-1 text-gray-700 dark:text-zinc-300 outline-none hover:bg-gray-100 dark:hover:bg-zinc-750 transition-colors font-medium max-w-[260px] truncate"
            onChange={(e) => {
              if (e.target.value) onLoadTemplate(e.target.value);
            }}
            value={graph.meta.templateId || ''}
          >
            <option value="new">
              New Architecture
            </option>
            <option value="" disabled>
              Load Interview Architecture (10 Samples)...
            </option>
            {categories.map((cat) => (
              <optgroup key={cat} label={`── ${cat} ──`}>
                {ARCHITECTURE_TEMPLATES.filter((t) => t.category === cat).map((tmpl) => (
                  <option key={tmpl.id} value={tmpl.id}>
                    {tmpl.name}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>
      </div>

      {/* Center: Multisim Simulation Controls */}
      <div className="flex items-center gap-3 bg-gray-50 dark:bg-zinc-800/80 border border-gray-200 dark:border-zinc-750 rounded-xl px-3 py-1 shadow-2xs">
        {/* Play / Pause button */}
        <button
          onClick={() =>
            onUpdateSettings({
              ...simulationSettings,
              isPlaying: !simulationSettings.isPlaying,
            })
          }
          className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold shadow-xs transition-all ${
            simulationSettings.isPlaying
              ? 'bg-amber-500 hover:bg-amber-600 text-white animate-pulse'
              : 'bg-emerald-600 hover:bg-emerald-700 text-white'
          }`}
        >
          {simulationSettings.isPlaying ? (
            <>
              <Pause className="w-3.5 h-3.5 fill-current" /> Pause
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5 fill-current" /> Simulate (Play)
            </>
          )}
        </button>

        {/* Reset */}
        <button
          onClick={onResetSimulation}
          className="p-1.5 text-gray-500 dark:text-zinc-400 hover:text-gray-800 dark:hover:text-zinc-200 hover:bg-gray-200 dark:hover:bg-zinc-700 rounded-md transition-colors"
          title="Reset Metrics"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>

        <div className="w-[1px] h-5 bg-gray-200 dark:bg-zinc-700" />

        {/* Target Load Slider */}
        <div className="flex items-center gap-2 text-xs">
          <Activity className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" />
          <span className="text-gray-500 dark:text-zinc-400 font-mono">Load:</span>
          <input
            type="range"
            min="100"
            max="15000"
            step="100"
            value={simulationSettings.globalTargetRps}
            onChange={(e) =>
              onUpdateSettings({
                ...simulationSettings,
                globalTargetRps: Number(e.target.value),
              })
            }
            className="w-20 md:w-28 accent-indigo-600 dark:accent-indigo-500 cursor-pointer"
          />
          <span className="font-mono font-bold text-gray-800 dark:text-zinc-200 min-w-[55px]">
            {simulationSettings.globalTargetRps.toLocaleString()} RPS
          </span>
        </div>

        <div className="w-[1px] h-5 bg-gray-200 dark:bg-zinc-700 hidden sm:block" />

        {/* Traffic Profile */}
        <select
          className="hidden lg:block text-xs bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-md px-2 py-0.5 text-gray-700 dark:text-zinc-300 outline-none"
          value={simulationSettings.trafficProfile}
          onChange={(e) =>
            onUpdateSettings({
              ...simulationSettings,
              trafficProfile: e.target.value as SimulationSettings['trafficProfile'],
            })
          }
        >
          <option value="steady">Steady Flow</option>
          <option value="spike">Traffic Wave / Spikes</option>
          <option value="chaos_monkey">Chaos Monkey (Failures)</option>
          <option value="ddos">DDoS Influx</option>
        </select>

        {/* Regional Client Origin */}
        <div className="hidden xl:flex items-center gap-1 text-xs">
          <Globe className="w-3.5 h-3.5 text-sky-500 dark:text-sky-400" />
          <select
            className="text-xs bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-md px-1.5 py-0.5 text-gray-700 dark:text-zinc-300 outline-none"
            value={simulationSettings.clientRegion}
            onChange={(e) =>
              onUpdateSettings({
                ...simulationSettings,
                clientRegion: e.target.value as RegionId,
              })
            }
          >
            <option value="global">Client Origin: Global</option>
            <option value="us-east-1">Origin: US-East (N. Virginia)</option>
            <option value="us-west-2">Origin: US-West (Oregon)</option>
            <option value="eu-central-1">Origin: EU (Frankfurt)</option>
            <option value="ap-southeast-1">Origin: Asia (Singapore)</option>
            <option value="sa-east-1">Origin: S. America (São Paulo)</option>
          </select>
        </div>
      </div>

      {/* Right Actions: Theme Toggle, Verilog DSL, AI Critique, Export, Share */}
      <div className="flex items-center gap-2">
        {/* Light / Dark Mode Toggle */}
        <button
          onClick={onToggleTheme}
          className="p-1.5 rounded-lg text-gray-600 dark:text-zinc-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {theme === 'dark' ? (
            <Sun className="w-4 h-4 text-amber-400" />
          ) : (
            <Moon className="w-4 h-4 text-indigo-600" />
          )}
        </button>

        {/* Verilog Netlist DSL */}
        <button
          onClick={onOpenDslModal}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-gray-700 dark:text-zinc-300 hover:text-gray-900 dark:hover:text-white bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-750 transition-colors"
          title="Inspect Verilog / VHDL System Netlist"
        >
          <FileCode className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
          <span className="hidden sm:inline font-mono">HDL Netlist</span>
        </button>

        {/* Import HDL / JSON Architecture */}
        <button
          onClick={onOpenImportModal}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-emerald-700 dark:text-emerald-300 hover:text-emerald-800 dark:hover:text-emerald-200 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 border border-emerald-200 dark:border-emerald-800 transition-colors"
          title="Import architecture from Verilog HDL Netlist (.v) or JSON (.json)"
        >
          <Upload className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          <span className="hidden sm:inline font-mono">Import</span>
        </button>

        {/* Staff Architecture Review & Discussion Toggle */}
        <button
          onClick={onToggleDiscussion}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold shadow-xs transition-all ${
            isDiscussionOpen
              ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-500/20 shadow-sm'
              : 'text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 border border-indigo-200 dark:border-indigo-800'
          }`}
          title="Toggle Staff Architecture Review & Discussion (Pros, Cons, Q&A)"
        >
          <MessageSquareQuote className="w-3.5 h-3.5" />
          <span>Staff Review</span>
          <span className="hidden xl:inline text-[10px] font-mono font-medium opacity-80">
            Pros & Cons
          </span>
        </button>

        {/* Conditional Live Critique Checkbox when API Token is configured */}
        {hasApiKey && (
          <label
            className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer border transition-all ${
              liveCritiqueEnabled
                ? 'bg-purple-100 dark:bg-purple-950/80 border-purple-300 dark:border-purple-700 text-purple-900 dark:text-purple-200 shadow-2xs'
                : 'bg-gray-100 dark:bg-zinc-800 border-gray-200 dark:border-zinc-700 text-gray-500 dark:text-zinc-400 hover:text-gray-700 dark:hover:text-zinc-200'
            }`}
            title="Live LLM critique anytime a connection is created between components"
          >
            <input
              type="checkbox"
              checked={liveCritiqueEnabled}
              onChange={(e) => onToggleLiveCritique(e.target.checked)}
              className="w-3.5 h-3.5 rounded text-purple-600 focus:ring-purple-500 accent-purple-600 cursor-pointer"
            />
            <Sparkles className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
            <span className="font-mono text-[11px]">Live Critique</span>
          </label>
        )}

        {/* AI Critique */}
        <button
          onClick={onOpenAiCritique}
          className="relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/60 hover:bg-purple-100 dark:hover:bg-purple-900/60 border border-purple-200 dark:border-purple-800 shadow-xs transition-colors"
        >
          <Sparkles className="w-3.5 h-3.5 fill-purple-400 dark:fill-purple-300" />
          <span>AI Critique</span>
          {issueCount > 0 && (
            <span className="px-1.5 py-0.2 rounded-full bg-red-500 text-white font-mono text-[10px] font-bold">
              {issueCount}
            </span>
          )}
        </button>

        {/* LLM & Architect Settings */}
        <button
          onClick={onOpenSettings}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-gray-700 dark:text-zinc-300 hover:text-gray-900 dark:hover:text-white bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-750 transition-colors"
          title="Configure API Base URL & API Token"
        >
          <Settings className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
          <span className="hidden md:inline font-mono">LLM Settings</span>
        </button>

        {/* Export Screenshot */}
        <button
          onClick={onExportPng}
          className="p-1.5 rounded-lg text-gray-600 dark:text-zinc-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
          title="Export High-Res PNG Screenshot"
        >
          <Download className="w-4 h-4" />
        </button>

        {/* Share Link */}
        <button
          onClick={handleShareClick}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-gray-900 dark:bg-zinc-100 hover:bg-gray-800 dark:hover:bg-white text-white dark:text-zinc-900 shadow-xs transition-colors"
          title="Generate and copy portable shareable link"
        >
          {copiedShare ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400 dark:text-emerald-600" />
              <span>Copied!</span>
            </>
          ) : (
            <>
              <Share2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Share</span>
            </>
          )}
        </button>
      </div>
    </header>
  );
};
