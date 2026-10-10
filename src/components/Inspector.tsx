import React from 'react';
import {
  SystemNode,
  ConnectionEdge,
  RegionId,
  SystemMetrics,
} from '../types/system';
import {
  Sliders,
  X,
  Trash2,
  Copy,
  Skull,
  AlertTriangle,
  Server,
  Zap,
  Globe,
  Bot,
} from 'lucide-react';

interface InspectorProps {
  selectedNode: SystemNode | null;
  selectedNodes?: SystemNode[];
  selectedEdge: ConnectionEdge | null;
  onUpdateNode: (updatedNode: SystemNode) => void;
  onUpdateEdge: (updatedEdge: ConnectionEdge) => void;
  onDeleteNode: (nodeId: string) => void;
  onDeleteEdge: (edgeId: string) => void;
  onDeleteSelectedNodes?: (nodeIds: string[]) => void;
  onDuplicateNode: (node: SystemNode) => void;
  onCopy?: () => void;
  onClose: () => void;
  simulationMetrics: SystemMetrics;
  isDiscussionOpen?: boolean;
}

export const Inspector: React.FC<InspectorProps> = ({
  selectedNode,
  selectedNodes = [],
  selectedEdge,
  onUpdateNode,
  onUpdateEdge,
  onDeleteNode,
  onDeleteEdge,
  onDeleteSelectedNodes,
  onDuplicateNode,
  onCopy,
  onClose,
  simulationMetrics,
  isDiscussionOpen,
}) => {
  const isMultiNode = selectedNodes.length > 1;
  if (!selectedNode && !selectedEdge && !isMultiNode) return null;

  return (
    <aside
      className={`absolute top-16 bottom-4 w-84 bg-white/95 dark:bg-zinc-900/95 backdrop-blur border border-gray-200 dark:border-zinc-800 rounded-xl shadow-xl z-20 flex flex-col overflow-hidden select-none animate-in fade-in slide-in-from-right-4 duration-200 transition-colors ${
        isDiscussionOpen ? 'right-4 xl:right-[530px]' : 'right-4'
      }`}
    >
      {/* Header with clean sans-serif typography */}
      <div className="p-3 border-b border-gray-200 dark:border-zinc-800 flex items-center justify-between bg-gray-50/70 dark:bg-zinc-800/50">
        <div className="flex items-center gap-2">
          <Sliders className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          <h2 className="font-sans font-bold text-sm tracking-tight text-gray-900 dark:text-zinc-100">
            {isMultiNode
              ? `${selectedNodes.length} Components Selected`
              : selectedNode
              ? 'Component Specs'
              : 'Wire Specs'}
          </h2>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-md text-gray-400 hover:text-gray-700 dark:hover:text-zinc-200 hover:bg-gray-100 dark:hover:bg-zinc-800"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs font-sans text-gray-800 dark:text-zinc-200">
        {/* Multi-Node Selected Overview */}
        {isMultiNode && (
          <div className="space-y-4">
            <div className="p-3 bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800/80 rounded-xl">
              <div className="flex items-center justify-between">
                <span className="font-sans font-bold text-sm text-indigo-950 dark:text-indigo-200">
                  {selectedNodes.length} Components Selected
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-200/60 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-300">
                  Multi-Select
                </span>
              </div>
              <p className="text-[11px] text-indigo-700 dark:text-indigo-300 mt-1 leading-snug">
                Press <kbd className="font-mono font-bold bg-white dark:bg-zinc-800 px-1 py-0.2 rounded border border-indigo-300 dark:border-indigo-700">Del</kbd> to delete all selected components.
              </p>
            </div>

            {/* Batch Actions */}
            <div className="flex items-center gap-2">
              {onCopy && (
                <button
                  onClick={onCopy}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:bg-gray-100 dark:hover:bg-zinc-750 text-gray-700 dark:text-zinc-200 font-medium text-xs transition-colors"
                  title="Copy Selected Components (Ctrl+C / Cmd+C)"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy (Ctrl+C)</span>
                </button>
              )}
              {onDeleteSelectedNodes && (
                <button
                  onClick={() => onDeleteSelectedNodes(selectedNodes.map((n) => n.id))}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-red-600 hover:bg-red-700 text-white font-semibold text-xs transition-colors shadow-xs"
                  title="Delete All Selected (Del)"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Delete ({selectedNodes.length})</span>
                </button>
              )}
            </div>

            {/* Selected Components List */}
            <div>
              <h3 className="text-[11px] font-mono uppercase tracking-wider text-gray-400 dark:text-zinc-500 mb-2">
                Selected Nodes ({selectedNodes.length})
              </h3>
              <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
                {selectedNodes.map((node) => (
                  <div
                    key={node.id}
                    className="flex items-center justify-between p-2 rounded-lg bg-gray-50 dark:bg-zinc-800/60 border border-gray-200 dark:border-zinc-750 text-xs"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="font-semibold text-gray-900 dark:text-zinc-100 truncate">
                        {node.config.label}
                      </span>
                      <span className="text-[10px] font-mono text-gray-500 dark:text-zinc-400">
                        x{node.config.replicas || 1}
                      </span>
                    </div>
                    <button
                      onClick={() => onDeleteNode(node.id)}
                      className="p-1 rounded text-gray-400 hover:text-red-500 transition-colors"
                      title="Delete this component"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Node Properties */}
        {!isMultiNode && selectedNode && (() => {
          const cfg = selectedNode.config;
          const nodeMetric = simulationMetrics.nodeMetrics[selectedNode.id];

          return (
            <>
              {/* Telemetry Status Banner */}
              {nodeMetric && (
                <div
                  className={`p-2.5 rounded-lg border font-mono ${
                    nodeMetric.status === 'dead'
                      ? 'bg-red-50 dark:bg-red-950/60 border-red-200 dark:border-red-900 text-red-800 dark:text-red-300'
                      : nodeMetric.status === 'critical'
                      ? 'bg-amber-50 dark:bg-amber-950/60 border-amber-200 dark:border-amber-900 text-amber-800 dark:text-amber-300'
                      : 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-900 text-emerald-800 dark:text-emerald-300'
                  }`}
                >
                  <div className="flex items-center justify-between font-bold">
                    <span>STATUS: {nodeMetric.status.toUpperCase()}</span>
                    <span>{nodeMetric.utilizationPercent}% LOAD</span>
                  </div>
                  <div className="mt-1 flex items-center justify-between text-[11px]">
                    <span>In: {nodeMetric.inRps} RPS</span>
                    <span>Latency: {nodeMetric.avgLatencyMs}ms</span>
                  </div>
                  {nodeMetric.droppedRequests > 0 && (
                    <div className="mt-1 text-red-600 dark:text-red-400 font-bold">
                      ⚠️ Dropping {nodeMetric.droppedRequests} RPS (Bottleneck)
                    </div>
                  )}
                </div>
              )}

              {/* Label */}
              <div>
                <label className="block text-[11px] font-mono uppercase text-gray-500 dark:text-zinc-400 mb-1">
                  Component Label
                </label>
                <input
                  type="text"
                  value={cfg.label}
                  onChange={(e) =>
                    onUpdateNode({
                      ...selectedNode,
                      config: { ...cfg, label: e.target.value },
                    })
                  }
                  className="w-full px-2.5 py-1.5 border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 rounded-lg font-sans text-sm font-semibold text-gray-900 dark:text-zinc-100 focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Region */}
              <div>
                <label className="block text-[11px] font-mono uppercase text-gray-500 dark:text-zinc-400 mb-1">
                  AWS Region / Placement
                </label>
                <select
                  value={cfg.region || 'us-east-1'}
                  onChange={(e) =>
                    onUpdateNode({
                      ...selectedNode,
                      config: { ...cfg, region: e.target.value as RegionId },
                    })
                  }
                  className="w-full px-2.5 py-1.5 border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 rounded-lg text-gray-800 dark:text-zinc-200 focus:outline-none focus:border-indigo-500"
                >
                  <option value="global">Global (Edge / CDN)</option>
                  <option value="us-east-1">us-east-1 (N. Virginia)</option>
                  <option value="us-west-2">us-west-2 (Oregon)</option>
                  <option value="eu-central-1">eu-central-1 (Frankfurt)</option>
                  <option value="ap-southeast-1">ap-southeast-1 (Singapore)</option>
                  <option value="sa-east-1">sa-east-1 (São Paulo)</option>
                </select>
              </div>

              {/* Replicas */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-mono uppercase text-gray-500 dark:text-zinc-400">
                    Active Replicas / Pods
                  </label>
                  <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">
                    x{cfg.replicas || 1}
                  </span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="16"
                  step="1"
                  value={cfg.replicas || 1}
                  onChange={(e) =>
                    onUpdateNode({
                      ...selectedNode,
                      config: { ...cfg, replicas: Number(e.target.value) },
                    })
                  }
                  className="w-full accent-indigo-600 dark:accent-indigo-500 cursor-pointer"
                />
                <p className="text-[11px] text-gray-400 dark:text-zinc-500 mt-0.5">
                  Increase replicas to eliminate single points of failure.
                </p>
              </div>

              {/* Max Concurrency per Replica */}
              <div>
                <label className="block text-[11px] font-mono uppercase text-gray-500 dark:text-zinc-400 mb-1">
                  Max Concurrency / Capacity (per node)
                </label>
                <input
                  type="number"
                  min="10"
                  max="50000"
                  step="50"
                  value={cfg.maxConcurrencyPerReplica || 50}
                  onChange={(e) =>
                    onUpdateNode({
                      ...selectedNode,
                      config: {
                        ...cfg,
                        maxConcurrencyPerReplica: Number(e.target.value),
                      },
                    })
                  }
                  className="w-full px-2.5 py-1.5 border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 rounded-lg text-gray-800 dark:text-zinc-200 focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>

              {/* Base Latency */}
              <div>
                <label className="block text-[11px] font-mono uppercase text-gray-500 dark:text-zinc-400 mb-1">
                  Base Compute Latency (ms)
                </label>
                <input
                  type="number"
                  min="1"
                  max="5000"
                  step="5"
                  value={cfg.baseLatencyMs || 10}
                  onChange={(e) =>
                    onUpdateNode({
                      ...selectedNode,
                      config: {
                        ...cfg,
                        baseLatencyMs: Number(e.target.value),
                      },
                    })
                  }
                  className="w-full px-2.5 py-1.5 border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 rounded-lg text-gray-800 dark:text-zinc-200 focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>

              {/* Cache Hit Ratio (if Cache or CDN) */}
              {(selectedNode.type === 'cache' ||
                selectedNode.type === 'cdn_edge') && (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-mono uppercase text-gray-500 dark:text-zinc-400">
                      Cache Hit Ratio
                    </label>
                    <span className="font-mono font-bold text-red-600 dark:text-red-400">
                      {Math.round((cfg.cacheHitRatio || 0.8) * 100)}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={cfg.cacheHitRatio || 0.8}
                    onChange={(e) =>
                      onUpdateNode({
                        ...selectedNode,
                        config: {
                          ...cfg,
                          cacheHitRatio: Number(e.target.value),
                        },
                      })
                    }
                    className="w-full accent-red-600 dark:accent-red-500 cursor-pointer"
                  />
                  <p className="text-[11px] text-gray-400 dark:text-zinc-500 mt-0.5">
                    Requests hitting cache return in ~2ms without reaching downstream DB.
                  </p>
                </div>
              )}

              {/* AI & LLM Specific Specs */}
              {selectedNode.type === 'llm_server' && (
                <div className="p-2.5 rounded-lg bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 space-y-2">
                  <div className="flex items-center gap-1.5 text-purple-700 dark:text-purple-300 font-semibold font-mono text-[11px]">
                    <Bot className="w-3.5 h-3.5" />
                    <span>LLM INFERENCE SPEC</span>
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase text-purple-800 dark:text-purple-300 mb-0.5">
                      Model Architecture
                    </label>
                    <input
                      type="text"
                      value={cfg.modelName || 'Llama-3-70B'}
                      onChange={(e) =>
                        onUpdateNode({
                          ...selectedNode,
                          config: { ...cfg, modelName: e.target.value },
                        })
                      }
                      className="w-full px-2 py-1 bg-white dark:bg-zinc-800 border border-purple-200 dark:border-purple-700 rounded text-gray-900 dark:text-zinc-100"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] uppercase text-purple-800 dark:text-purple-300 mb-0.5">
                        TTFT (ms)
                      </label>
                      <input
                        type="number"
                        value={cfg.ttftMs || 220}
                        onChange={(e) =>
                          onUpdateNode({
                            ...selectedNode,
                            config: { ...cfg, ttftMs: Number(e.target.value) },
                          })
                        }
                        className="w-full px-2 py-1 bg-white dark:bg-zinc-800 border border-purple-200 dark:border-purple-700 rounded text-gray-900 dark:text-zinc-100 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase text-purple-800 dark:text-purple-300 mb-0.5">
                        Tokens / Sec
                      </label>
                      <input
                        type="number"
                        value={cfg.tokensPerSec || 45}
                        onChange={(e) =>
                          onUpdateNode({
                            ...selectedNode,
                            config: {
                              ...cfg,
                              tokensPerSec: Number(e.target.value),
                            },
                          })
                        }
                        className="w-full px-2 py-1 bg-white dark:bg-zinc-800 border border-purple-200 dark:border-purple-700 rounded text-gray-900 dark:text-zinc-100 font-mono"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Chaos Engineering Injectors */}
              <div className="pt-2 border-t border-gray-200 dark:border-zinc-800">
                <span className="block text-[11px] font-mono uppercase text-gray-500 dark:text-zinc-400 mb-2">
                  Chaos Engineering Fault Injection
                </span>
                <button
                  onClick={() =>
                    onUpdateNode({
                      ...selectedNode,
                      config: { ...cfg, isKilled: !cfg.isKilled },
                    })
                  }
                  className={`w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg font-semibold transition-all ${
                    cfg.isKilled
                      ? 'bg-red-600 text-white shadow-xs'
                      : 'bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/60 border border-red-200 dark:border-red-800'
                  }`}
                >
                  <Skull className="w-4 h-4" />
                  <span>{cfg.isKilled ? 'Revive Node' : 'Simulate Crash (Kill)'}</span>
                </button>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex items-center gap-2">
                {onCopy && (
                  <button
                    onClick={onCopy}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-750 text-gray-700 dark:text-zinc-200 font-medium"
                    title="Copy Component (Ctrl+C / Cmd+C)"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy</span>
                  </button>
                )}
                <button
                  onClick={() => onDuplicateNode(selectedNode)}
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-750 text-gray-700 dark:text-zinc-200 font-medium"
                  title="Duplicate Component"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Duplicate</span>
                </button>
                <button
                  onClick={() => onDeleteNode(selectedNode.id)}
                  className="flex items-center justify-center gap-1 px-3 py-1.5 border border-red-200 dark:border-red-900 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/50 text-red-600 dark:text-red-400 font-medium"
                  title="Delete Node"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </>
          );
        })()}

        {/* Edge Properties */}
        {selectedEdge && (
          <>
            <div>
              <label className="block text-[11px] font-mono uppercase text-gray-500 dark:text-zinc-400 mb-1">
                Protocol / Wire Bus
              </label>
              <select
                value={selectedEdge.protocol}
                onChange={(e) =>
                  onUpdateEdge({
                    ...selectedEdge,
                    protocol: e.target.value as ConnectionEdge['protocol'],
                  })
                }
                className="w-full px-2.5 py-1.5 border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 rounded-lg text-gray-800 dark:text-zinc-200 focus:outline-none focus:border-indigo-500"
              >
                <option value="HTTP">HTTP/REST (Synchronous)</option>
                <option value="gRPC">gRPC / Protobuf (High Performance)</option>
                <option value="TCP">TCP / Direct Socket</option>
                <option value="ASYNC">Async Event / Queue Bus</option>
                <option value="MCP_IPC">MCP Tool IPC Protocol</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-mono uppercase text-gray-500 dark:text-zinc-400 mb-1">
                Base Network RTT Latency (ms)
              </label>
              <input
                type="number"
                min="0"
                max="500"
                value={selectedEdge.baseNetworkLatencyMs || 5}
                onChange={(e) =>
                  onUpdateEdge({
                    ...selectedEdge,
                    baseNetworkLatencyMs: Number(e.target.value),
                  })
                }
                className="w-full px-2.5 py-1.5 border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 rounded-lg text-gray-800 dark:text-zinc-200 focus:outline-none focus:border-indigo-500 font-mono"
              />
            </div>

            <div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={!!selectedEdge.isRedundant}
                  onChange={(e) =>
                    onUpdateEdge({
                      ...selectedEdge,
                      isRedundant: e.target.checked,
                    })
                  }
                  className="rounded text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-gray-800 dark:text-zinc-200 font-medium">
                  Redundant Standby Route (Failover)
                </span>
              </label>
              <p className="text-[11px] text-gray-400 dark:text-zinc-500 mt-0.5 ml-5">
                Takes over traffic automatically if primary route fails.
              </p>
            </div>

            <div className="pt-2">
              <button
                onClick={() => onDeleteEdge(selectedEdge.id)}
                className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 border border-red-200 dark:border-red-900 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/50 text-red-600 dark:text-red-400 font-medium"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Connection Wire</span>
              </button>
            </div>
          </>
        )}
      </div>
    </aside>
  );
};
