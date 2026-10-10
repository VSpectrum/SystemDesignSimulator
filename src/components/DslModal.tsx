import React, { useState } from 'react';
import { SystemDesignGraph } from '../types/system';
import { generateVerilogHDL, generateTopologyJson } from '../engine/dslGenerator';
import { FileCode, Copy, Check, Download, X, Cpu, Upload } from 'lucide-react';

interface DslModalProps {
  isOpen: boolean;
  onClose: () => void;
  graph: SystemDesignGraph;
  onOpenImport?: () => void;
}

export const DslModal: React.FC<DslModalProps> = ({ isOpen, onClose, graph, onOpenImport }) => {
  if (!isOpen) return null;

  const [activeTab, setActiveTab] = useState<'verilog' | 'json'>('verilog');
  const [copied, setCopied] = useState(false);

  const verilogCode = generateVerilogHDL(graph);
  const jsonCode = generateTopologyJson(graph);
  const currentContent = activeTab === 'verilog' ? verilogCode : jsonCode;

  const handleCopy = () => {
    navigator.clipboard.writeText(currentContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const filename =
      activeTab === 'verilog' ? 'system_architecture.v' : 'system_topology.json';
    const blob = new Blob([currentContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-4xl max-h-[85vh] bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-zinc-800 flex flex-col overflow-hidden transition-colors">
        {/* Modal Header */}
        <div className="p-4 border-b border-gray-200 dark:border-zinc-800 flex items-center justify-between bg-gray-50/70 dark:bg-zinc-850/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-100 dark:bg-indigo-950/80 rounded-lg text-indigo-700 dark:text-indigo-400">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-sans font-bold text-base md:text-lg text-gray-900 dark:text-zinc-100 leading-tight">
                System Topology & HDL Netlist
              </h2>
              <p className="text-xs text-gray-500 dark:text-zinc-400 font-sans">
                Verilog/VHDL connector specification describing system interconnects & parameters
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Tab switch */}
            <div className="flex bg-gray-200/80 dark:bg-zinc-800 p-0.5 rounded-lg text-xs font-mono">
              <button
                onClick={() => setActiveTab('verilog')}
                className={`px-3 py-1 rounded-md transition-all ${
                  activeTab === 'verilog'
                    ? 'bg-white dark:bg-zinc-700 text-gray-900 dark:text-white font-bold shadow-xs'
                    : 'text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                Verilog HDL (.v)
              </button>
              <button
                onClick={() => setActiveTab('json')}
                className={`px-3 py-1 rounded-md transition-all ${
                  activeTab === 'json'
                    ? 'bg-white dark:bg-zinc-700 text-gray-900 dark:text-white font-bold shadow-xs'
                    : 'text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                JSON IR (.json)
              </button>
            </div>

            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-750 text-gray-700 dark:text-zinc-200 rounded-lg transition-colors font-sans"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy</span>
                </>
              )}
            </button>

            {onOpenImport && (
              <button
                onClick={() => {
                  onClose();
                  onOpenImport();
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded-lg transition-colors font-sans"
                title="Import an exported or edited architecture file (.v or .json)"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Import File</span>
              </button>
            )}

            <button
              onClick={handleDownload}
              className="p-1.5 text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
              title="Download File"
            >
              <Download className="w-4 h-4" />
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-gray-400 hover:text-gray-700 dark:hover:text-zinc-200 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Code Content Editor / Viewer */}
        <div className="flex-1 overflow-auto p-4 bg-gray-950 dark:bg-[#09090b] font-mono text-xs text-gray-200">
          <pre className="selection:bg-indigo-600 selection:text-white leading-relaxed">
            {currentContent}
          </pre>
        </div>

        {/* Footer info */}
        <div className="p-3 bg-gray-50 dark:bg-zinc-850/60 border-t border-gray-200 dark:border-zinc-800 text-xs text-gray-500 dark:text-zinc-400 font-sans flex items-center justify-between">
          <span>
            {graph.nodes.length} Components • {graph.edges.length} Wires • Verilog-2005 compatible
          </span>
          <div className="flex items-center gap-3">
            {onOpenImport && (
              <button
                onClick={() => {
                  onClose();
                  onOpenImport();
                }}
                className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 font-medium"
              >
                <Upload className="w-3 h-3" />
                <span>Have a netlist? Import it here</span>
              </button>
            )}
            <span className="font-mono text-[11px] text-gray-400 dark:text-zinc-500 hidden sm:inline">
              Exported directly from SysDesign Simulator Graph Engine
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
