import React, { useState, useMemo } from 'react';
import {
  X,
  Plus,
  Layers,
  Search,
  Sparkles,
} from 'lucide-react';
import {
  COMPONENT_LIBRARY,
  COMPONENT_CATEGORIES,
  ComponentDefinition,
  filterComponents,
} from '../data/componentLibrary';

interface ComponentPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onAddComponent: (item: ComponentDefinition, customLabel?: string) => void;
}

export const ComponentPalette: React.FC<ComponentPaletteProps> = ({
  isOpen,
  onClose,
  onAddComponent,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  const filteredItems = useMemo(() => {
    let list = filterComponents(searchQuery);
    if (selectedCategory !== 'All') {
      list = list.filter((item) => item.category === selectedCategory);
    }
    return list;
  }, [searchQuery, selectedCategory]);

  // Group by categories
  const groupedCategories = useMemo(() => {
    const map = new Map<string, ComponentDefinition[]>();
    filteredItems.forEach((item) => {
      const cat = item.category;
      if (!map.has(cat)) map.set(cat, []);
      map.get(cat)!.push(item);
    });
    return Array.from(map.entries());
  }, [filteredItems]);

  if (!isOpen) return null;

  return (
    <aside className="absolute top-16 left-4 bottom-4 w-88 bg-white/95 dark:bg-zinc-900/95 backdrop-blur border border-gray-200 dark:border-zinc-800 rounded-xl shadow-xl z-20 flex flex-col overflow-hidden select-none animate-in fade-in slide-in-from-left-4 duration-200 transition-colors">
      {/* Drawer Header */}
      <div className="p-3 border-b border-gray-200 dark:border-zinc-800 flex items-center justify-between bg-gray-50/70 dark:bg-zinc-850/50">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          <h2 className="font-sans font-bold text-sm tracking-tight text-gray-900 dark:text-zinc-100">
            AWS Component Library
          </h2>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-md text-gray-400 hover:text-gray-700 dark:hover:text-zinc-200 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Search Input */}
      <div className="p-2.5 border-b border-gray-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/50">
        <div className="relative flex items-center">
          <Search className="w-3.5 h-3.5 text-gray-400 dark:text-zinc-500 absolute left-2.5 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter components (e.g. database, cache)..."
            className="w-full pl-8 pr-7 py-1.5 bg-gray-100 dark:bg-zinc-800/80 border border-transparent focus:border-indigo-500 focus:bg-white dark:focus:bg-zinc-800 rounded-lg text-xs font-sans text-gray-900 dark:text-zinc-100 placeholder-gray-400 dark:placeholder-zinc-500 outline-none transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2 text-gray-400 hover:text-gray-600 dark:hover:text-zinc-300"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Quick Category Pill Filters */}
        <div className="flex items-center gap-1 overflow-x-auto pt-2 pb-0.5 no-scrollbar text-[10px]">
          <button
            onClick={() => setSelectedCategory('All')}
            className={`px-2 py-0.5 rounded-full whitespace-nowrap transition-colors ${
              selectedCategory === 'All'
                ? 'bg-indigo-600 text-white font-semibold'
                : 'bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-400 hover:bg-gray-200 dark:hover:bg-zinc-700'
            }`}
          >
            All
          </button>
          {COMPONENT_CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-2 py-0.5 rounded-full whitespace-nowrap transition-colors ${
                selectedCategory === cat
                  ? 'bg-indigo-600 text-white font-semibold'
                  : 'bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-400 hover:bg-gray-200 dark:hover:bg-zinc-700'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Component List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-4 font-sans text-xs">
        {groupedCategories.length === 0 ? (
          <div className="py-8 text-center text-gray-400 dark:text-zinc-500">
            <p className="text-xs">No matching components found.</p>
          </div>
        ) : (
          groupedCategories.map(([categoryTitle, items]) => (
            <div key={categoryTitle}>
              <div className="flex items-center justify-between mb-1.5">
                <h3 className="text-[10px] font-mono uppercase tracking-wider font-semibold text-gray-400 dark:text-zinc-500">
                  {categoryTitle}
                </h3>
                <span className="text-[9px] font-mono text-gray-400 dark:text-zinc-500">
                  {items.length}
                </span>
              </div>
              <div className="space-y-1.5">
                {items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      onClick={() => onAddComponent(item)}
                      className="w-full text-left p-2.5 rounded-lg border border-gray-200 dark:border-zinc-800 hover:border-indigo-400 dark:hover:border-indigo-500 hover:bg-indigo-50/40 dark:hover:bg-zinc-800/60 transition-all flex items-start gap-2.5 group"
                    >
                      <div className={`p-1.5 rounded-md border ${item.color} shrink-0`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="font-sans font-semibold text-xs tracking-tight text-gray-900 dark:text-zinc-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 truncate">
                            {item.label}
                          </span>
                          <Plus className="w-3.5 h-3.5 text-gray-400 dark:text-zinc-500 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-1" />
                        </div>
                        <p className="text-[11px] text-gray-500 dark:text-zinc-400 leading-snug line-clamp-2 mt-0.5">
                          {item.desc}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Drawer Footer Info */}
      <div className="p-2.5 border-t border-gray-200 dark:border-zinc-800 bg-gray-50/70 dark:bg-zinc-850/50 flex items-center justify-between text-[10px] font-mono text-gray-500 dark:text-zinc-400">
        <span className="flex items-center gap-1">
          <kbd className="px-1 py-0.2 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded font-semibold">
            Ctrl+Space
          </kbd>
          <span>Quick Palette</span>
        </span>
        <span className="flex items-center gap-1 text-indigo-600 dark:text-indigo-400 font-semibold">
          <Sparkles className="w-3 h-3" />
          {COMPONENT_LIBRARY.length} items
        </span>
      </div>
    </aside>
  );
};
