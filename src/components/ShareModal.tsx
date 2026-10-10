import React, { useState } from 'react';
import { generateShareUrl } from '../utils/sharing';
import { generateVerilogHDL, generateTopologyJson } from '../engine/dslGenerator';
import { SystemDesignGraph } from '../types/system';
import { Share2, Copy, Check, X, Download, Upload, FileCode } from 'lucide-react';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  graph: SystemDesignGraph;
  onOpenImport?: () => void;
}

export const ShareModal: React.FC<ShareModalProps> = ({
  isOpen,
  onClose,
  graph,
  onOpenImport,
}) => {
  if (!isOpen) return null;

  const [copied, setCopied] = useState(false);
  const shareUrl = generateShareUrl(graph);

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const downloadFile = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleDownloadHdl = () => {
    const verilog = generateVerilogHDL(graph);
    downloadFile(verilog, `${graph.meta.name.toLowerCase().replace(/[^a-z0-9_]/g, '_')}_netlist.v`);
  };

  const handleDownloadJson = () => {
    const json = generateTopologyJson(graph);
    downloadFile(json, `${graph.meta.name.toLowerCase().replace(/[^a-z0-9_]/g, '_')}_topology.json`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-lg bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-zinc-800 overflow-hidden select-none transition-colors">
        <div className="p-4 border-b border-gray-200 dark:border-zinc-800 flex items-center justify-between bg-gray-50/70 dark:bg-zinc-850/60">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-gray-900 dark:bg-zinc-100 rounded-lg text-white dark:text-zinc-900">
              <Share2 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-sans font-bold text-sm md:text-base text-gray-900 dark:text-zinc-100 leading-tight">
                Share & Export Architecture
              </h2>
              <p className="text-xs text-gray-500 dark:text-zinc-400 font-sans">
                Share via instant URL link or export portable files (.v netlist, .json)
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

        <div className="p-4 space-y-4 font-sans text-xs">
          {/* Method 1: Instant URL Link */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="font-bold text-gray-900 dark:text-zinc-100 flex items-center gap-1.5">
                <span className="w-4 h-4 rounded-full bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 inline-flex items-center justify-center text-[10px] font-bold">1</span>
                URL Link Sharing
              </span>
              <span className="text-[11px] font-mono text-indigo-600 dark:text-indigo-400">
                LZ-Compressed Hash
              </span>
            </div>
            <p className="text-gray-500 dark:text-zinc-400 text-[11px] mb-2 leading-relaxed">
              Every detail is compressed directly into the URL hash. Recipients can open and run the architecture immediately without accounts or servers.
            </p>

            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={shareUrl}
                className="flex-1 px-3 py-2 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg text-gray-700 dark:text-zinc-200 font-mono text-[11px] select-all focus:outline-none"
              />
              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-gray-900 dark:bg-zinc-100 hover:bg-gray-800 dark:hover:bg-white text-white dark:text-zinc-900 rounded-lg font-semibold shrink-0 transition-colors shadow-xs"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400 dark:text-emerald-600" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Link</span>
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="border-t border-gray-200 dark:border-zinc-800 pt-3">
            {/* Method 2: File Sharing */}
            <div className="flex items-center justify-between mb-1.5">
              <span className="font-bold text-gray-900 dark:text-zinc-100 flex items-center gap-1.5">
                <span className="w-4 h-4 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 inline-flex items-center justify-center text-[10px] font-bold">2</span>
                Export Architecture File
              </span>
              <span className="text-[11px] text-gray-400 dark:text-zinc-500">
                Offline & Git-friendly
              </span>
            </div>
            <p className="text-gray-500 dark:text-zinc-400 text-[11px] mb-2.5 leading-relaxed">
              Export standard files to commit to git, email to colleagues, or share via team chats. Teammates can import them back into SysDesign at any time.
            </p>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={handleDownloadHdl}
                className="flex items-center justify-center gap-1.5 px-3 py-2 bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/80 rounded-xl font-semibold transition-colors text-[11px]"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download HDL (.v)</span>
              </button>
              <button
                onClick={handleDownloadJson}
                className="flex items-center justify-center gap-1.5 px-3 py-2 bg-gray-50 dark:bg-zinc-800 hover:bg-gray-100 dark:hover:bg-zinc-750 text-gray-700 dark:text-zinc-200 border border-gray-200 dark:border-zinc-700 rounded-xl font-semibold transition-colors text-[11px]"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download JSON (.json)</span>
              </button>
            </div>
          </div>

          {/* Quick link to import */}
          {onOpenImport && (
            <div className="p-2.5 rounded-xl bg-gray-50 dark:bg-zinc-850/70 border border-gray-200 dark:border-zinc-800 flex items-center justify-between text-[11px]">
              <span className="text-gray-600 dark:text-zinc-300">
                Received a shared <code className="font-mono text-indigo-600 dark:text-indigo-400">.v</code> or <code className="font-mono text-indigo-600 dark:text-indigo-400">.json</code> file?
              </span>
              <button
                onClick={() => {
                  onClose();
                  onOpenImport();
                }}
                className="text-emerald-700 dark:text-emerald-400 hover:underline font-bold flex items-center gap-1 ml-2 shrink-0"
              >
                <Upload className="w-3 h-3" />
                <span>Import File</span>
              </button>
            </div>
          )}
        </div>

        <div className="p-3 bg-gray-50 dark:bg-zinc-850/60 border-t border-gray-200 dark:border-zinc-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 hover:bg-gray-100 dark:hover:bg-zinc-750 rounded-lg text-gray-700 dark:text-zinc-200 font-semibold"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
