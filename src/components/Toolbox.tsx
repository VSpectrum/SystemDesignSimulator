import React from 'react';
import {
  MousePointer2,
  Hand,
  ArrowRight,
  PenTool,
  StickyNote,
  Type,
  PlusCircle,
  Trash2,
  Search,
  Undo2,
  Redo2,
} from 'lucide-react';

interface ToolboxProps {
  activeTool: 'select' | 'pan' | 'wire' | 'pencil' | 'sticky' | 'text' | 'eraser';
  onSelectTool: (
    tool: 'select' | 'pan' | 'wire' | 'pencil' | 'sticky' | 'text' | 'eraser'
  ) => void;
  onTogglePalette: () => void;
  isPaletteOpen: boolean;
  onOpenCommandPalette?: () => void;
  onDeleteSelected: () => void;
  canDelete: boolean;
  selectedCount?: number;
  onUndo?: () => void;
  canUndo?: boolean;
  onRedo?: () => void;
  canRedo?: boolean;
}

export const Toolbox: React.FC<ToolboxProps> = ({
  activeTool,
  onSelectTool,
  onTogglePalette,
  isPaletteOpen,
  onOpenCommandPalette,
  onDeleteSelected,
  canDelete,
  selectedCount = 0,
  onUndo,
  canUndo = false,
  onRedo,
  canRedo = false,
}) => {
  const tools = [
    { id: 'select', label: 'Select (V)', icon: MousePointer2 },
    { id: 'pan', label: 'Pan (H / Middle Click)', icon: Hand },
    { id: 'wire', label: 'Connect Wire (C)', icon: ArrowRight },
    { id: 'pencil', label: 'Draw / Annotate (P)', icon: PenTool },
    { id: 'sticky', label: 'Sticky Note (S)', icon: StickyNote },
    { id: 'text', label: 'Text Note (T)', icon: Type },
  ] as const;

  return (
    <div className="absolute top-16 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1 bg-white/95 dark:bg-zinc-900/95 backdrop-blur border border-gray-200 dark:border-zinc-800 rounded-xl p-1 shadow-md select-none transition-colors">
      {/* Component Drawer Toggle */}
      <button
        onClick={onTogglePalette}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold font-sans transition-all ${
          isPaletteOpen
            ? 'bg-indigo-600 dark:bg-indigo-500 text-white shadow-xs'
            : 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/60'
        }`}
        title="Open Component Library"
      >
        <PlusCircle className="w-4 h-4" />
        <span className="hidden sm:inline">Add Component</span>
      </button>

      {/* Quick Command Palette Button */}
      {onOpenCommandPalette && (
        <button
          onClick={onOpenCommandPalette}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-sans text-gray-700 dark:text-zinc-300 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
          title="Command Palette (Ctrl+Space / Cmd+Space)"
        >
          <Search className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
          <span className="hidden md:inline font-medium">Search AWS</span>
          <kbd className="hidden sm:inline-flex items-center text-[10px] font-mono px-1.5 py-0.2 bg-gray-100 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded text-gray-500 dark:text-zinc-400">
            Ctrl+Space
          </kbd>
        </button>
      )}

      <div className="w-[1px] h-6 bg-gray-200 dark:bg-zinc-800 mx-1" />

      {/* Tools */}
      {tools.map((t) => {
        const Icon = t.icon;
        const isActive = activeTool === t.id;
        return (
          <button
            key={t.id}
            onClick={() => onSelectTool(t.id)}
            className={`p-2 rounded-lg transition-all ${
              isActive
                ? 'bg-gray-900 dark:bg-zinc-100 text-white dark:text-zinc-900 shadow-xs'
                : 'hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-600 dark:text-zinc-400'
            }`}
            title={t.label}
          >
            <Icon className="w-4 h-4" />
          </button>
        );
      })}

      {/* Undo & Redo Controls */}
      {(onUndo || onRedo) && (
        <>
          <div className="w-[1px] h-6 bg-gray-200 dark:bg-zinc-800 mx-1" />
          {onUndo && (
            <button
              onClick={onUndo}
              disabled={!canUndo}
              className={`p-2 rounded-lg transition-colors ${
                canUndo
                  ? 'hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-700 dark:text-zinc-300'
                  : 'text-gray-300 dark:text-zinc-700 cursor-not-allowed'
              }`}
              title="Undo Last Action (Ctrl+Z / Cmd+Z)"
            >
              <Undo2 className="w-4 h-4" />
            </button>
          )}
          {onRedo && (
            <button
              onClick={onRedo}
              disabled={!canRedo}
              className={`p-2 rounded-lg transition-colors ${
                canRedo
                  ? 'hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-700 dark:text-zinc-300'
                  : 'text-gray-300 dark:text-zinc-700 cursor-not-allowed'
              }`}
              title="Redo Action (Ctrl+Y / Cmd+Shift+Z)"
            >
              <Redo2 className="w-4 h-4" />
            </button>
          )}
        </>
      )}

      {/* Delete button */}
      {canDelete && (
        <>
          <div className="w-[1px] h-6 bg-gray-200 dark:bg-zinc-800 mx-1" />
          <button
            onClick={onDeleteSelected}
            className="flex items-center gap-1 p-2 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-950/50 hover:text-red-700 dark:hover:text-red-400 transition-colors"
            title={`Delete Selected (${selectedCount > 1 ? `${selectedCount} items` : 'Item'}) [Del]`}
          >
            <Trash2 className="w-4 h-4" />
            {selectedCount > 1 && (
              <span className="text-[10px] font-mono font-bold">{selectedCount}</span>
            )}
          </button>
        </>
      )}
    </div>
  );
};
