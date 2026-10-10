import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Search,
  X,
  CornerDownLeft,
  ArrowUpDown,
  Plus,
  Box,
  Layers,
  Sparkles,
} from 'lucide-react';
import {
  COMPONENT_LIBRARY,
  ComponentDefinition,
  filterComponents,
} from '../data/componentLibrary';

interface CommandPaletteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectComponent: (item: ComponentDefinition, customLabel?: string) => void;
}

export const CommandPaletteModal: React.FC<CommandPaletteModalProps> = ({
  isOpen,
  onClose,
  onSelectComponent,
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Filter components
  const filteredItems = useMemo(() => {
    const list = filterComponents(query);
    // If user has typed something that isn't an exact match, make sure the generic custom box is easily accessible
    if (query.trim()) {
      const hasGeneric = list.some((item) => item.type === 'generic');
      if (!hasGeneric) {
        const genericItem = COMPONENT_LIBRARY.find((item) => item.type === 'generic');
        if (genericItem) {
          return [
            ...list,
            {
              ...genericItem,
              label: `Generic Box: "${query.trim()}"`,
              desc: `Create custom square component labeled "${query.trim()}"`,
            },
          ];
        }
      }
    }
    return list;
  }, [query]);

  // When query changes or modal opens, reset selected index to 0 (topmost autohighlighted)
  useEffect(() => {
    setSelectedIndex(0);
  }, [query, isOpen]);

  // Focus input on open
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      }, 30);
    }
  }, [isOpen]);

  // Scroll active item into view
  useEffect(() => {
    if (listRef.current) {
      const activeEl = listRef.current.querySelector(`[data-index="${selectedIndex}"]`) as HTMLElement;
      if (activeEl) {
        activeEl.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [selectedIndex]);

  if (!isOpen) return null;

  const handleConfirmSelect = (item: ComponentDefinition) => {
    const customLabel =
      item.type === 'generic' && query.trim()
        ? query.trim().replace(/^Generic Box:\s*"?|"?$/g, '')
        : undefined;
    onSelectComponent(item, customLabel);
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (filteredItems.length > 0) {
        setSelectedIndex((prev) => (prev + 1) % filteredItems.length);
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (filteredItems.length > 0) {
        setSelectedIndex((prev) => (prev - 1 + filteredItems.length) % filteredItems.length);
      }
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredItems.length > 0 && selectedIndex >= 0 && selectedIndex < filteredItems.length) {
        handleConfirmSelect(filteredItems[selectedIndex]);
      } else if (query.trim()) {
        // Fallback to generic box if enter pressed with custom query
        const genericItem = COMPONENT_LIBRARY.find((i) => i.type === 'generic') || COMPONENT_LIBRARY[0];
        handleConfirmSelect(genericItem);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[75vh] select-none animate-in zoom-in-95 duration-150 transition-colors"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {/* Search Header */}
        <div className="relative p-3.5 border-b border-gray-200 dark:border-zinc-800 flex items-center gap-3 bg-gray-50/70 dark:bg-zinc-850/60">
          <Search className="w-5 h-5 text-gray-400 dark:text-zinc-500 shrink-0 ml-1" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search AWS components (e.g. database, cache, rds, kafka, lambda) or type custom..."
            className="flex-1 bg-transparent border-none outline-none text-sm font-sans font-medium text-gray-900 dark:text-zinc-100 placeholder-gray-400 dark:placeholder-zinc-500"
          />
          {query ? (
            <button
              onClick={() => setQuery('')}
              className="p-1 rounded-md text-gray-400 hover:text-gray-600 dark:hover:text-zinc-300 hover:bg-gray-200 dark:hover:bg-zinc-750 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          ) : (
            <kbd className="hidden sm:inline-flex items-center gap-0.5 px-2 py-0.5 text-[10px] font-mono text-gray-400 dark:text-zinc-500 bg-gray-100 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-md">
              ESC
            </kbd>
          )}
        </div>

        {/* Filtered Components List */}
        <div ref={listRef} className="flex-1 overflow-y-auto p-2 space-y-1">
          {filteredItems.length === 0 ? (
            <div className="py-12 px-4 text-center">
              <Box className="w-10 h-10 text-gray-400 dark:text-zinc-600 mx-auto mb-2" />
              <p className="text-sm font-medium text-gray-700 dark:text-zinc-300">
                No matching AWS components found for &ldquo;{query}&rdquo;
              </p>
              <p className="text-xs text-gray-500 dark:text-zinc-400 mt-1">
                Press <span className="font-mono font-semibold">Enter</span> to place a generic square box with this name.
              </p>
              <button
                onClick={() => {
                  const genericDef = COMPONENT_LIBRARY.find((i) => i.type === 'generic') || COMPONENT_LIBRARY[0];
                  handleConfirmSelect(genericDef);
                }}
                className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-sm transition-colors"
              >
                <Plus className="w-4 h-4" />
                Place Generic Component &ldquo;{query}&rdquo;
              </button>
            </div>
          ) : (
            filteredItems.map((item, index) => {
              const Icon = item.icon;
              const isHighlighted = index === selectedIndex;
              return (
                <div
                  key={`${item.id}_${index}`}
                  data-index={index}
                  onClick={() => handleConfirmSelect(item)}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={`px-3 py-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                    isHighlighted
                      ? 'bg-indigo-50 dark:bg-indigo-950/50 border-indigo-300 dark:border-indigo-600/80 shadow-xs ring-1 ring-indigo-400/30'
                      : 'border-transparent hover:bg-gray-100/70 dark:hover:bg-zinc-800/50'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`p-2 rounded-lg border ${item.color} shrink-0`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span
                          className={`font-sans font-semibold text-xs tracking-tight truncate ${
                            isHighlighted
                              ? 'text-indigo-900 dark:text-indigo-200 font-bold'
                              : 'text-gray-900 dark:text-zinc-100'
                          }`}
                        >
                          {item.label}
                        </span>
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-md bg-gray-100 dark:bg-zinc-800 text-gray-500 dark:text-zinc-400 border border-gray-200 dark:border-zinc-700">
                          {item.category}
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-500 dark:text-zinc-400 truncate mt-0.5 max-w-md">
                        {item.desc}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {/* Tags preview */}
                    <div className="hidden sm:flex items-center gap-1 overflow-hidden">
                      {item.tags.slice(0, 3).map((tag) => (
                        <span
                          key={tag}
                          className="text-[9px] font-mono text-gray-400 dark:text-zinc-500 bg-gray-50 dark:bg-zinc-850 px-1 py-0.5 rounded border border-gray-200/50 dark:border-zinc-800"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>

                    {isHighlighted && (
                      <span className="flex items-center gap-1 text-[11px] font-mono font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-100/70 dark:bg-indigo-900/50 px-2 py-0.5 rounded-md">
                        <CornerDownLeft className="w-3 h-3" />
                        Place
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer shortcuts info */}
        <div className="p-2.5 px-4 border-t border-gray-200 dark:border-zinc-800 bg-gray-50/70 dark:bg-zinc-850/60 flex items-center justify-between text-[11px] font-mono text-gray-500 dark:text-zinc-400">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded shadow-2xs font-semibold">
                ↑
              </kbd>
              <kbd className="px-1.5 py-0.5 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded shadow-2xs font-semibold">
                ↓
              </kbd>
              <span>Navigate</span>
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded shadow-2xs font-semibold">
                ↵ Enter
              </kbd>
              <span>Place to Right</span>
            </span>
          </div>

          <span className="text-[10px] text-gray-400 dark:text-zinc-500 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-indigo-500" />
            Tagged AWS Library
          </span>
        </div>
      </div>
    </div>
  );
};
