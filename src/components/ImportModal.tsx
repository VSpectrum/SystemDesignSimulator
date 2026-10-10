import React, { useState, useRef, useEffect } from 'react';
import {
  Upload,
  FileCode,
  CheckCircle2,
  AlertCircle,
  FileText,
  X,
  Cpu,
  Layers,
  ArrowRight,
  Sparkles,
  Clipboard,
  RefreshCw,
} from 'lucide-react';
import { SystemDesignGraph } from '../types/system';
import { parseArchitectureFile } from '../engine/dslParser';
import { ARCHITECTURE_TEMPLATES } from '../engine/templates';
import { generateVerilogHDL } from '../engine/dslGenerator';

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportGraph: (graph: SystemDesignGraph) => void;
  initialFileContent?: string;
  initialFileName?: string;
}

export const ImportModal: React.FC<ImportModalProps> = ({
  isOpen,
  onClose,
  onImportGraph,
  initialFileContent = '',
  initialFileName = '',
}) => {
  if (!isOpen) return null;

  const [activeTab, setActiveTab] = useState<'upload' | 'paste'>('upload');
  const [fileContent, setFileContent] = useState<string>(initialFileContent);
  const [fileName, setFileName] = useState<string>(initialFileName);
  const [isDragging, setIsDragging] = useState(false);
  const [parsedResult, setParsedResult] = useState<{
    graph: SystemDesignGraph;
    format: 'verilog' | 'topology_json' | 'full_graph';
    warnings: string[];
  } | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Parse whenever file content or name changes
  useEffect(() => {
    if (!fileContent.trim()) {
      setParsedResult(null);
      setErrorMsg(null);
      return;
    }

    try {
      const res = parseArchitectureFile(fileContent, fileName);
      setParsedResult(res);
      setErrorMsg(null);
    } catch (err: any) {
      setParsedResult(null);
      setErrorMsg(err.message || 'Failed to parse file content.');
    }
  }, [fileContent, fileName]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setFileContent(text || '');
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      setFileName(file.name);
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        setFileContent(text || '');
      };
      reader.readAsText(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleLoadSample = () => {
    const sampleTmpl = ARCHITECTURE_TEMPLATES[0];
    const sampleVerilog = generateVerilogHDL(sampleTmpl.graph);
    setFileName('url_shortener_netlist.v');
    setFileContent(sampleVerilog);
    setActiveTab('paste');
  };

  const handleConfirmImport = () => {
    if (parsedResult?.graph) {
      onImportGraph(parsedResult.graph);
      onClose();
    }
  };

  const formatBadgeName = (format: 'verilog' | 'topology_json' | 'full_graph') => {
    switch (format) {
      case 'verilog':
        return 'Verilog HDL Netlist (.v)';
      case 'topology_json':
        return 'JSON Topology IR (.json)';
      case 'full_graph':
        return 'Full Graph Snapshot (.json)';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-2xl max-h-[90vh] bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-zinc-800 flex flex-col overflow-hidden transition-colors">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 dark:border-zinc-800 flex items-center justify-between bg-gray-50/70 dark:bg-zinc-850/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-100 dark:bg-emerald-950/80 rounded-lg text-emerald-700 dark:text-emerald-400">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-sans font-bold text-base md:text-lg text-gray-900 dark:text-zinc-100 leading-tight">
                Import Architecture File
              </h2>
              <p className="text-xs text-gray-500 dark:text-zinc-400 font-sans">
                Load from exported Verilog HDL Netlist (.v, .hdl) or Topology IR (.json)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex bg-gray-200/80 dark:bg-zinc-800 p-0.5 rounded-lg text-xs font-sans">
              <button
                onClick={() => setActiveTab('upload')}
                className={`px-3 py-1 rounded-md transition-all font-medium ${
                  activeTab === 'upload'
                    ? 'bg-white dark:bg-zinc-700 text-gray-900 dark:text-white shadow-xs'
                    : 'text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                Upload File
              </button>
              <button
                onClick={() => setActiveTab('paste')}
                className={`px-3 py-1 rounded-md transition-all font-medium ${
                  activeTab === 'paste'
                    ? 'bg-white dark:bg-zinc-700 text-gray-900 dark:text-white shadow-xs'
                    : 'text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                Paste Code
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

        {/* Modal Body */}
        <div className="p-4 overflow-y-auto space-y-4 max-h-[60vh]">
          {activeTab === 'upload' ? (
            <div>
              {/* Drag & Drop Zone */}
              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200 ${
                  isDragging
                    ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/30 scale-[0.99]'
                    : 'border-gray-300 dark:border-zinc-700 hover:border-indigo-400 hover:bg-gray-50/70 dark:hover:bg-zinc-850/50'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".v,.sv,.hdl,.json,.txt"
                  className="hidden"
                  onChange={handleFileChange}
                />
                <div className="flex flex-col items-center justify-center gap-2">
                  <div className="p-3 bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-300 rounded-full">
                    <FileCode className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-800 dark:text-zinc-200">
                      Drag & drop your architecture file here, or{' '}
                      <span className="text-indigo-600 dark:text-indigo-400 underline">browse</span>
                    </p>
                    <p className="text-xs text-gray-500 dark:text-zinc-400 mt-1 font-mono">
                      Accepts Verilog HDL (.v, .hdl) or JSON IR (.json)
                    </p>
                  </div>
                </div>
              </div>

              {/* Sample preloader shortcut */}
              <div className="mt-3 flex items-center justify-between text-xs text-gray-500 dark:text-zinc-400">
                <span>Want to test an import right now?</span>
                <button
                  type="button"
                  onClick={handleLoadSample}
                  className="flex items-center gap-1 text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Load Sample Verilog Netlist</span>
                </button>
              </div>
            </div>
          ) : (
            <div>
              <div className="flex items-center justify-between mb-1.5 text-xs">
                <label className="font-mono text-gray-600 dark:text-zinc-300 font-semibold">
                  Paste Verilog HDL Netlist or JSON IR:
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleLoadSample}
                    className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 font-medium"
                  >
                    <Sparkles className="w-3 h-3" /> Load Sample
                  </button>
                  {fileContent && (
                    <button
                      type="button"
                      onClick={() => {
                        setFileContent('');
                        setFileName('');
                      }}
                      className="text-xs text-red-600 dark:text-red-400 hover:underline"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>
              <textarea
                rows={9}
                value={fileContent}
                onChange={(e) => setFileContent(e.target.value)}
                placeholder="module system_architecture ( ... ) // or paste JSON IR { ... }"
                className="w-full p-3 font-mono text-xs bg-gray-950 text-gray-200 dark:bg-[#09090b] rounded-xl border border-gray-800 focus:outline-none focus:border-indigo-500 transition-colors resize-y leading-relaxed"
              />
            </div>
          )}

          {/* Validation & Live Preview Card */}
          {parsedResult && (
            <div className="p-4 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 text-xs transition-all animate-in fade-in">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-semibold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>Valid Architecture Recognized</span>
                </div>
                <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-emerald-200/60 dark:bg-emerald-900/60 text-emerald-900 dark:text-emerald-200 font-bold">
                  {formatBadgeName(parsedResult.format)}
                </span>
              </div>

              <div className="space-y-1.5 pl-6">
                <div>
                  <span className="font-semibold text-gray-900 dark:text-zinc-100">
                    {parsedResult.graph.meta.name}
                  </span>
                  {parsedResult.graph.meta.description && (
                    <p className="text-gray-600 dark:text-zinc-400 text-[11px] line-clamp-2 mt-0.5">
                      {parsedResult.graph.meta.description}
                    </p>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-emerald-200/50 dark:border-emerald-900/40 text-[11px]">
                  <span className="px-2 py-0.5 rounded bg-white dark:bg-zinc-800 border border-emerald-200 dark:border-zinc-700 font-medium text-gray-700 dark:text-zinc-300 flex items-center gap-1">
                    <Cpu className="w-3 h-3 text-indigo-500" />
                    <strong>{parsedResult.graph.nodes.length}</strong> Components
                  </span>
                  <span className="px-2 py-0.5 rounded bg-white dark:bg-zinc-800 border border-emerald-200 dark:border-zinc-700 font-medium text-gray-700 dark:text-zinc-300 flex items-center gap-1">
                    <Layers className="w-3 h-3 text-emerald-500" />
                    <strong>{parsedResult.graph.edges.length}</strong> Wires / Connections
                  </span>
                  {fileName && (
                    <span className="font-mono text-gray-500 dark:text-zinc-400 text-[10px] ml-auto truncate max-w-[200px]">
                      Source: {fileName}
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Error Banner */}
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-red-800 dark:text-red-300 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <span className="font-semibold">Unable to parse file</span>
                <p className="text-[11px] text-red-700 dark:text-red-300/90 leading-relaxed">
                  {errorMsg}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-3 bg-gray-50 dark:bg-zinc-850/60 border-t border-gray-200 dark:border-zinc-800 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 text-xs text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-white rounded-lg transition-colors font-medium"
          >
            Cancel
          </button>

          <button
            disabled={!parsedResult}
            onClick={handleConfirmImport}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold shadow-xs transition-all ${
              parsedResult
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20 shadow-md cursor-pointer'
                : 'bg-gray-200 dark:bg-zinc-800 text-gray-400 dark:text-zinc-600 cursor-not-allowed'
            }`}
          >
            <span>Import & Load Canvas</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
