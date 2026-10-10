import React, { useState } from 'react';
import { SystemMetrics, SimulationSettings } from '../types/system';
import {
  Activity,
  AlertTriangle,
  Zap,
  DollarSign,
  TrendingUp,
  ChevronUp,
  ChevronDown,
  ShieldCheck,
} from 'lucide-react';

interface SimulationOverlayProps {
  metrics: SystemMetrics;
  settings: SimulationSettings;
  onSelectNode: (nodeId: string) => void;
}

export const SimulationOverlay: React.FC<SimulationOverlayProps> = ({
  metrics,
  settings,
  onSelectNode,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);

  if (!settings.isPlaying && metrics.totalRequestsProcessed === 0) {
    return (
      <div className="absolute bottom-6 right-6 z-10 bg-white/95 dark:bg-zinc-900/95 backdrop-blur border border-gray-200 dark:border-zinc-800 rounded-xl px-4 py-3 shadow-lg flex items-center gap-3 font-sans text-xs">
        <div className="w-2.5 h-2.5 rounded-full bg-gray-400 dark:bg-zinc-600" />
        <span className="text-gray-600 dark:text-zinc-300 font-medium">
          Simulation Standby. Press{' '}
          <strong className="text-emerald-600 dark:text-emerald-400 font-semibold">
            Simulate (Play)
          </strong>{' '}
          above to test latency & load.
        </span>
      </div>
    );
  }

  const hasCritical = metrics.bottlenecksDetected.some((b) => b.severity === 'critical');

  return (
    <div className="absolute bottom-6 right-6 z-10 w-96 bg-white/95 dark:bg-zinc-900/95 backdrop-blur border border-gray-200 dark:border-zinc-800 rounded-xl shadow-xl overflow-hidden font-sans text-xs select-none animate-in fade-in duration-200 transition-colors">
      {/* Top Telemetry Summary Header */}
      <div
        className="p-3 bg-gray-900 dark:bg-zinc-950 text-white flex items-center justify-between cursor-pointer border-b border-gray-800 dark:border-zinc-850"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
          <div
            className={`w-2.5 h-2.5 rounded-full ${
              hasCritical
                ? 'bg-red-500 animate-ping'
                : metrics.errorRatePercent > 0
                ? 'bg-amber-400'
                : 'bg-emerald-400'
            }`}
          />
          <span className="font-mono font-bold text-xs tracking-tight">
            SYSTEM TELEMETRY
          </span>
          <span className="text-[10px] text-gray-400 dark:text-zinc-500 font-mono">
            ({metrics.currentRps.toLocaleString()} RPS)
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span
            className={`font-mono text-xs px-2 py-0.5 rounded font-bold ${
              metrics.errorRatePercent > 5
                ? 'bg-red-500/20 text-red-400'
                : 'bg-emerald-500/20 text-emerald-400'
            }`}
          >
            {metrics.errorRatePercent}% ERR
          </span>
          {isExpanded ? (
            <ChevronDown className="w-4 h-4 text-gray-400 dark:text-zinc-500" />
          ) : (
            <ChevronUp className="w-4 h-4 text-gray-400 dark:text-zinc-500" />
          )}
        </div>
      </div>

      {/* Expanded Metrics Content */}
      {isExpanded && (
        <div className="p-3 space-y-3">
          {/* Latency Gauges Grid */}
          <div className="grid grid-cols-3 gap-2 text-center font-mono">
            <div className="p-2 rounded-lg bg-gray-50 dark:bg-zinc-850 border border-gray-200 dark:border-zinc-800">
              <span className="text-[10px] text-gray-500 dark:text-zinc-400 block uppercase">
                P50 Median
              </span>
              <span className="text-base font-bold text-gray-900 dark:text-zinc-100">
                {metrics.p50LatencyMs}ms
              </span>
            </div>

            <div className="p-2 rounded-lg bg-gray-50 dark:bg-zinc-850 border border-gray-200 dark:border-zinc-800">
              <span className="text-[10px] text-gray-500 dark:text-zinc-400 block uppercase">
                P95 Tail
              </span>
              <span
                className={`text-base font-bold ${
                  metrics.p95LatencyMs > 250
                    ? 'text-amber-600 dark:text-amber-400'
                    : 'text-gray-900 dark:text-zinc-100'
                }`}
              >
                {metrics.p95LatencyMs}ms
              </span>
            </div>

            <div className="p-2 rounded-lg bg-gray-50 dark:bg-zinc-850 border border-gray-200 dark:border-zinc-800">
              <span className="text-[10px] text-gray-500 dark:text-zinc-400 block uppercase">
                P99 Peak
              </span>
              <span
                className={`text-base font-bold ${
                  metrics.p99LatencyMs > 600
                    ? 'text-red-600 dark:text-red-400'
                    : 'text-gray-900 dark:text-zinc-100'
                }`}
              >
                {metrics.p99LatencyMs}ms
              </span>
            </div>
          </div>

          {/* Cloud Cost Estimation */}
          <div className="flex items-center justify-between px-2.5 py-1.5 bg-indigo-50/60 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/60 rounded-lg text-indigo-900 dark:text-indigo-300 font-mono text-[11px]">
            <div className="flex items-center gap-1.5">
              <DollarSign className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              <span>Est. Cloud Bill:</span>
            </div>
            <span className="font-bold">
              ${metrics.totalMonthlyCostEstimate.toLocaleString()} / mo
            </span>
          </div>

          {/* Weak Points & Bottlenecks Detected */}
          <div>
            <div className="flex items-center justify-between mb-1 text-[10px] font-mono uppercase text-gray-500 dark:text-zinc-400">
              <span>Weak Points & Saturation</span>
              <span>{metrics.bottlenecksDetected.length} detected</span>
            </div>

            {metrics.bottlenecksDetected.length === 0 ? (
              <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span className="text-[11px] leading-tight font-medium">
                  System handling load smoothly with zero node saturation or dropped requests.
                </span>
              </div>
            ) : (
              <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1">
                {metrics.bottlenecksDetected.map((bn, idx) => (
                  <div
                    key={`${bn.nodeId}-${idx}`}
                    onClick={() => onSelectNode(bn.nodeId)}
                    className={`p-2 rounded-lg border text-[11px] cursor-pointer transition-all ${
                      bn.severity === 'critical'
                        ? 'bg-red-50 dark:bg-red-950/50 border-red-200 dark:border-red-900 hover:bg-red-100/70 dark:hover:bg-red-900/50 text-red-900 dark:text-red-200'
                        : 'bg-amber-50 dark:bg-amber-950/50 border-amber-200 dark:border-amber-900 hover:bg-amber-100/70 dark:hover:bg-amber-900/50 text-amber-900 dark:text-amber-200'
                    }`}
                  >
                    <div className="flex items-center justify-between font-bold">
                      <span className="flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3 text-red-600 dark:text-red-400" />
                        {bn.nodeLabel}
                      </span>
                      <span className="text-[10px] underline">Inspect Node</span>
                    </div>
                    <p className="mt-0.5 text-gray-700 dark:text-zinc-300 leading-tight">
                      {bn.reason}
                    </p>
                    <p className="mt-1 font-semibold text-indigo-700 dark:text-indigo-400">
                      💡 Fix: {bn.suggestedFix}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
