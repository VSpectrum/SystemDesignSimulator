import React, { useState, useMemo, useEffect } from 'react';
import {
  SystemDiscussion,
  DiscussionPoint,
  StaffQnA,
} from '../types/system';
import {
  MessageSquareQuote,
  ShieldCheck,
  Lock,
  Unlock,
  CheckCircle2,
  Scale,
  HelpCircle,
  Calculator,
  Search,
  Plus,
  Trash2,
  Copy,
  Check,
  X,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Layers,
  ArrowRight,
  BookOpen,
  FileText,
  Pencil,
  Coffee,
} from 'lucide-react';

interface DiscussionPanelProps {
  isOpen: boolean;
  onClose: () => void;
  discussion?: SystemDiscussion;
  systemName: string;
  templateId?: string;
  onUpdateDiscussion?: (updated: SystemDiscussion) => void;
  onResetToTemplate?: () => void;
  onUpdateSystemName?: (newName: string) => void;
}

export const DiscussionPanel: React.FC<DiscussionPanelProps> = ({
  isOpen,
  onClose,
  discussion,
  systemName,
  templateId,
  onUpdateDiscussion,
  onResetToTemplate,
  onUpdateSystemName,
}) => {
  if (!isOpen) return null;

  const [activeTab, setActiveTab] = useState<'all' | 'notes' | 'pros_cons' | 'qna' | 'tradeoffs' | 'capacity'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [expandedQnaIds, setExpandedQnaIds] = useState<Record<string, boolean>>({});

  const isPreloaded = discussion?.isPreloaded ?? false;

  // System name editing
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(systemName);

  useEffect(() => {
    setNameInput(systemName);
  }, [systemName]);

  const handleSaveName = () => {
    if (nameInput.trim() && onUpdateSystemName) {
      onUpdateSystemName(nameInput.trim());
    }
    setIsEditingName(false);
  };

  // Architecture & Design Notes state
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [notesText, setNotesText] = useState(
    discussion?.overviewRecommendation || discussion?.summary || ''
  );

  useEffect(() => {
    setNotesText(discussion?.overviewRecommendation || discussion?.summary || '');
    setIsEditingNotes(false);
    setIsAddingPro(false);
    setIsAddingCon(false);
    setIsAddingQna(false);
    setIsAddingTradeoff(false);
    setIsEditingCapacity(false);
    setEditingProId(null);
    setEditingConId(null);
    setEditingQnaId(null);
    setEditingTradeoffIdx(null);
  }, [discussion]);

  const handleSaveNotes = () => {
    if (!onUpdateDiscussion) return;
    const current = discussion || {
      isPreloaded: false,
      summary: '',
      overviewRecommendation: '',
      pros: [],
      cons: [],
      tradeoffs: [],
      staffQnA: [],
    };
    onUpdateDiscussion({
      ...current,
      overviewRecommendation: notesText.trim(),
      summary: notesText.trim().slice(0, 120),
    });
    setIsEditingNotes(false);
  };

  // Pros state
  const [isAddingPro, setIsAddingPro] = useState(false);
  const [newProTitle, setNewProTitle] = useState('');
  const [newProContent, setNewProContent] = useState('');
  const [newProImpact, setNewProImpact] = useState<'high' | 'medium' | 'low'>('high');
  const [editingProId, setEditingProId] = useState<string | null>(null);
  const [editProTitle, setEditProTitle] = useState('');
  const [editProContent, setEditProContent] = useState('');
  const [editProImpact, setEditProImpact] = useState<'high' | 'medium' | 'low'>('high');

  // Cons state
  const [isAddingCon, setIsAddingCon] = useState(false);
  const [newConTitle, setNewConTitle] = useState('');
  const [newConContent, setNewConContent] = useState('');
  const [newConMitigation, setNewConMitigation] = useState('');
  const [newConSeverity, setNewConSeverity] = useState<'critical' | 'high' | 'medium' | 'info'>('medium');
  const [editingConId, setEditingConId] = useState<string | null>(null);
  const [editConTitle, setEditConTitle] = useState('');
  const [editConContent, setEditConContent] = useState('');
  const [editConMitigation, setEditConMitigation] = useState('');
  const [editConSeverity, setEditConSeverity] = useState<'critical' | 'high' | 'medium' | 'info'>('medium');

  // Q&A state
  const [isAddingQna, setIsAddingQna] = useState(false);
  const [newQuestion, setNewQuestion] = useState('');
  const [newAnswer, setNewAnswer] = useState('');
  const [newKeyTakeaway, setNewKeyTakeaway] = useState('');
  const [editingQnaId, setEditingQnaId] = useState<string | null>(null);
  const [editQuestion, setEditQuestion] = useState('');
  const [editAnswer, setEditAnswer] = useState('');
  const [editKeyTakeaway, setEditKeyTakeaway] = useState('');

  // Trade-offs state
  const [isAddingTradeoff, setIsAddingTradeoff] = useState(false);
  const [newDimension, setNewDimension] = useState('');
  const [newChosenStrategy, setNewChosenStrategy] = useState('');
  const [newReasoning, setNewReasoning] = useState('');
  const [editingTradeoffIdx, setEditingTradeoffIdx] = useState<number | null>(null);
  const [editDimension, setEditDimension] = useState('');
  const [editChosenStrategy, setEditChosenStrategy] = useState('');
  const [editReasoning, setEditReasoning] = useState('');

  // Capacity Math state
  const [isEditingCapacity, setIsEditingCapacity] = useState(false);
  const [capDau, setCapDau] = useState(discussion?.capacityEstimation?.dailyActiveUsers || '');
  const [capRw, setCapRw] = useState(discussion?.capacityEstimation?.readWriteRatio || '');
  const [capPeakRps, setCapPeakRps] = useState(discussion?.capacityEstimation?.peakRps || '');
  const [capStorage, setCapStorage] = useState(discussion?.capacityEstimation?.storagePerYear || '');
  const [capBandwidth, setCapBandwidth] = useState(discussion?.capacityEstimation?.bandwidthRequirement || '');

  useEffect(() => {
    setCapDau(discussion?.capacityEstimation?.dailyActiveUsers || '');
    setCapRw(discussion?.capacityEstimation?.readWriteRatio || '');
    setCapPeakRps(discussion?.capacityEstimation?.peakRps || '');
    setCapStorage(discussion?.capacityEstimation?.storagePerYear || '');
    setCapBandwidth(discussion?.capacityEstimation?.bandwidthRequirement || '');
  }, [discussion?.capacityEstimation]);

  const handleCopyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const toggleQnaExpand = (id: string) => {
    setExpandedQnaIds((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  // Filter items based on search query
  const filteredPros = useMemo(() => {
    if (!discussion?.pros) return [];
    if (!searchQuery.trim()) return discussion.pros;
    const q = searchQuery.toLowerCase();
    return discussion.pros.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.content.toLowerCase().includes(q) ||
        p.tags?.some((t) => t.toLowerCase().includes(q))
    );
  }, [discussion?.pros, searchQuery]);

  const filteredCons = useMemo(() => {
    if (!discussion?.cons) return [];
    if (!searchQuery.trim()) return discussion.cons;
    const q = searchQuery.toLowerCase();
    return discussion.cons.filter(
      (c) =>
        c.title.toLowerCase().includes(q) ||
        c.content.toLowerCase().includes(q) ||
        c.mitigationOrAlternative?.toLowerCase().includes(q) ||
        c.tags?.some((t) => t.toLowerCase().includes(q))
    );
  }, [discussion?.cons, searchQuery]);

  const filteredQna = useMemo(() => {
    if (!discussion?.staffQnA) return [];
    if (!searchQuery.trim()) return discussion.staffQnA;
    const q = searchQuery.toLowerCase();
    return discussion.staffQnA.filter(
      (item) =>
        item.question.toLowerCase().includes(q) ||
        item.answer.toLowerCase().includes(q) ||
        item.keyTakeaway.toLowerCase().includes(q)
    );
  }, [discussion?.staffQnA, searchQuery]);

  const filteredTradeoffs = useMemo(() => {
    if (!discussion?.tradeoffs) return [];
    if (!searchQuery.trim()) return discussion.tradeoffs;
    const q = searchQuery.toLowerCase();
    return discussion.tradeoffs.filter(
      (t) =>
        t.dimension.toLowerCase().includes(q) ||
        t.chosenStrategy.toLowerCase().includes(q) ||
        t.reasoning.toLowerCase().includes(q)
    );
  }, [discussion?.tradeoffs, searchQuery]);

  // Edit actions for non-preloaded or forked discussions
  const handleForkDiscussion = () => {
    if (!discussion || !onUpdateDiscussion) return;
    onUpdateDiscussion({
      ...discussion,
      isPreloaded: false,
    });
  };

  const handleAddPro = () => {
    if (!onUpdateDiscussion || !newProTitle.trim()) return;
    const current = discussion || {
      isPreloaded: false,
      summary: '',
      overviewRecommendation: '',
      pros: [],
      cons: [],
      tradeoffs: [],
      staffQnA: [],
    };
    const newPro: DiscussionPoint = {
      id: `pro_${Date.now()}`,
      category: 'pro',
      title: newProTitle.trim(),
      content: newProContent.trim(),
      impact: newProImpact,
      authorRole: 'System Designer',
      tags: ['Custom'],
    };
    onUpdateDiscussion({
      ...current,
      pros: [...(current.pros || []), newPro],
    });
    setNewProTitle('');
    setNewProContent('');
    setIsAddingPro(false);
  };

  const handleSaveEditPro = (id: string) => {
    if (!discussion || !onUpdateDiscussion || !editProTitle.trim()) return;
    onUpdateDiscussion({
      ...discussion,
      pros: discussion.pros.map((p) =>
        p.id === id
          ? {
              ...p,
              title: editProTitle.trim(),
              content: editProContent.trim(),
              impact: editProImpact,
            }
          : p
      ),
    });
    setEditingProId(null);
  };

  const handleDeletePro = (id: string) => {
    if (!discussion || !onUpdateDiscussion) return;
    onUpdateDiscussion({
      ...discussion,
      pros: discussion.pros.filter((p) => p.id !== id),
    });
  };

  const handleAddCon = () => {
    if (!onUpdateDiscussion || !newConTitle.trim()) return;
    const current = discussion || {
      isPreloaded: false,
      summary: '',
      overviewRecommendation: '',
      pros: [],
      cons: [],
      tradeoffs: [],
      staffQnA: [],
    };
    const newCon: DiscussionPoint = {
      id: `con_${Date.now()}`,
      category: 'con',
      title: newConTitle.trim(),
      content: newConContent.trim(),
      mitigationOrAlternative: newConMitigation.trim() || undefined,
      severity: newConSeverity,
      authorRole: 'System Designer',
      tags: ['Custom'],
    };
    onUpdateDiscussion({
      ...current,
      cons: [...(current.cons || []), newCon],
    });
    setNewConTitle('');
    setNewConContent('');
    setNewConMitigation('');
    setIsAddingCon(false);
  };

  const handleSaveEditCon = (id: string) => {
    if (!discussion || !onUpdateDiscussion || !editConTitle.trim()) return;
    onUpdateDiscussion({
      ...discussion,
      cons: discussion.cons.map((c) =>
        c.id === id
          ? {
              ...c,
              title: editConTitle.trim(),
              content: editConContent.trim(),
              mitigationOrAlternative: editConMitigation.trim() || undefined,
              severity: editConSeverity,
            }
          : c
      ),
    });
    setEditingConId(null);
  };

  const handleDeleteCon = (id: string) => {
    if (!discussion || !onUpdateDiscussion) return;
    onUpdateDiscussion({
      ...discussion,
      cons: discussion.cons.filter((c) => c.id !== id),
    });
  };

  const handleAddQna = () => {
    if (!onUpdateDiscussion || !newQuestion.trim()) return;
    const current = discussion || {
      isPreloaded: false,
      summary: '',
      overviewRecommendation: '',
      pros: [],
      cons: [],
      tradeoffs: [],
      staffQnA: [],
    };
    const newQ: StaffQnA = {
      id: `qna_${Date.now()}`,
      question: newQuestion.trim(),
      answer: newAnswer.trim(),
      authorRole: 'System Designer',
      keyTakeaway: newKeyTakeaway.trim() || newAnswer.trim().slice(0, 80),
    };
    onUpdateDiscussion({
      ...current,
      staffQnA: [...(current.staffQnA || []), newQ],
    });
    setNewQuestion('');
    setNewAnswer('');
    setNewKeyTakeaway('');
    setIsAddingQna(false);
  };

  const handleSaveEditQna = (id: string) => {
    if (!discussion || !onUpdateDiscussion || !editQuestion.trim()) return;
    onUpdateDiscussion({
      ...discussion,
      staffQnA: discussion.staffQnA.map((q) =>
        q.id === id
          ? {
              ...q,
              question: editQuestion.trim(),
              answer: editAnswer.trim(),
              keyTakeaway: editKeyTakeaway.trim(),
            }
          : q
      ),
    });
    setEditingQnaId(null);
  };

  const handleDeleteQna = (id: string) => {
    if (!discussion || !onUpdateDiscussion) return;
    onUpdateDiscussion({
      ...discussion,
      staffQnA: discussion.staffQnA.filter((q) => q.id !== id),
    });
  };

  const handleAddTradeoff = () => {
    if (!onUpdateDiscussion || !newDimension.trim() || !newChosenStrategy.trim()) return;
    const current = discussion || {
      isPreloaded: false,
      summary: '',
      overviewRecommendation: '',
      pros: [],
      cons: [],
      tradeoffs: [],
      staffQnA: [],
    };
    const newTradeoff = {
      dimension: newDimension.trim(),
      chosenStrategy: newChosenStrategy.trim(),
      reasoning: newReasoning.trim(),
    };
    onUpdateDiscussion({
      ...current,
      tradeoffs: [...(current.tradeoffs || []), newTradeoff],
    });
    setNewDimension('');
    setNewChosenStrategy('');
    setNewReasoning('');
    setIsAddingTradeoff(false);
  };

  const handleSaveEditTradeoff = (index: number) => {
    if (!discussion || !onUpdateDiscussion || !editDimension.trim()) return;
    const updated = [...(discussion.tradeoffs || [])];
    updated[index] = {
      dimension: editDimension.trim(),
      chosenStrategy: editChosenStrategy.trim(),
      reasoning: editReasoning.trim(),
    };
    onUpdateDiscussion({
      ...discussion,
      tradeoffs: updated,
    });
    setEditingTradeoffIdx(null);
  };

  const handleDeleteTradeoff = (index: number) => {
    if (!discussion || !onUpdateDiscussion) return;
    onUpdateDiscussion({
      ...discussion,
      tradeoffs: (discussion.tradeoffs || []).filter((_, idx) => idx !== index),
    });
  };

  const handleSaveCapacity = () => {
    if (!onUpdateDiscussion) return;
    const current = discussion || {
      isPreloaded: false,
      summary: '',
      overviewRecommendation: '',
      pros: [],
      cons: [],
      tradeoffs: [],
      staffQnA: [],
    };
    onUpdateDiscussion({
      ...current,
      capacityEstimation: {
        dailyActiveUsers: capDau.trim() || undefined,
        readWriteRatio: capRw.trim() || undefined,
        peakRps: capPeakRps.trim() || undefined,
        storagePerYear: capStorage.trim() || undefined,
        bandwidthRequirement: capBandwidth.trim() || undefined,
      },
    });
    setIsEditingCapacity(false);
  };

  const totalProsCons = (discussion?.pros?.length || 0) + (discussion?.cons?.length || 0);

  return (
    <aside className="absolute top-14 right-0 bottom-0 w-full sm:w-[460px] md:w-[500px] lg:w-[520px] bg-white dark:bg-zinc-900 border-l border-gray-200 dark:border-zinc-800 shadow-2xl z-30 flex flex-col overflow-hidden animate-in fade-in slide-in-from-right duration-200 transition-colors">
      {/* Top Header */}
      <div className="p-4 border-b border-gray-200 dark:border-zinc-800 bg-gray-50/80 dark:bg-zinc-850/60 flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-indigo-600/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <MessageSquareQuote className="w-4 h-4" />
            </div>
            <h2 className="font-sans font-bold text-sm md:text-base text-gray-900 dark:text-zinc-100 tracking-tight truncate">
              Architecture Notes & Review
            </h2>
          </div>

          {/* System Name / Renaming */}
          {isEditingName ? (
            <div className="flex items-center gap-1.5 mt-1.5">
              <input
                type="text"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                placeholder="Architecture Name..."
                className="text-xs px-2 py-0.5 rounded border border-indigo-400 dark:border-indigo-600 bg-white dark:bg-zinc-800 text-gray-900 dark:text-zinc-100 outline-none w-48"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSaveName();
                  if (e.key === 'Escape') setIsEditingName(false);
                }}
              />
              <button
                onClick={handleSaveName}
                className="p-1 rounded bg-indigo-600 text-white hover:bg-indigo-700"
                title="Save Name"
              >
                <Check className="w-3 h-3" />
              </button>
              <button
                onClick={() => setIsEditingName(false)}
                className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-zinc-300"
                title="Cancel"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 mt-0.5 group">
              <p className="text-xs text-gray-500 dark:text-zinc-400 font-sans truncate">
                {systemName}
              </p>
              {!isPreloaded && onUpdateSystemName && (
                <button
                  onClick={() => {
                    setNameInput(systemName);
                    setIsEditingName(true);
                  }}
                  className="p-0.5 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 opacity-60 group-hover:opacity-100 transition-opacity"
                  title="Rename architecture"
                >
                  <Pencil className="w-3 h-3" />
                </button>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-zinc-200 hover:bg-gray-200 dark:hover:bg-zinc-800 transition-colors"
            title="Close Panel"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Lock Status Banner */}
      <div className="px-4 py-2 bg-indigo-50/70 dark:bg-indigo-950/40 border-b border-indigo-100 dark:border-indigo-900/60 flex items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2 min-w-0">
          {isPreloaded ? (
            <div className="flex items-center gap-1 text-indigo-700 dark:text-indigo-300 font-semibold shrink-0">
              <Lock className="w-3.5 h-3.5" />
              <span>Preloaded Staff Solution (Read-Only)</span>
            </div>
          ) : (
            <div className="flex items-center gap-1 text-emerald-700 dark:text-emerald-400 font-semibold shrink-0">
              <Unlock className="w-3.5 h-3.5" />
              <span>Interactive Notes (Editable)</span>
            </div>
          )}
        </div>

        {isPreloaded ? (
          <button
            onClick={handleForkDiscussion}
            className="text-[11px] font-medium text-indigo-700 dark:text-indigo-300 hover:underline bg-white dark:bg-zinc-800 px-2 py-0.5 rounded border border-indigo-200 dark:border-indigo-800 shrink-0"
            title="Create an editable clone to add your own notes or customized answers"
          >
            Fork to Edit
          </button>
        ) : onResetToTemplate ? (
          <button
            onClick={onResetToTemplate}
            className="text-[11px] font-medium text-gray-500 dark:text-zinc-400 hover:text-gray-800 dark:hover:text-zinc-200 hover:underline shrink-0"
            title={templateId === 'new' ? 'Clear canvas and notes to start a fresh blank design' : 'Reset back to canonical preloaded staff solution'}
          >
            {templateId === 'new' ? 'Clear to Blank' : 'Reset'}
          </button>
        ) : null}
      </div>

      {/* Search and Navigation Tabs */}
      <div className="p-3 border-b border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 space-y-2.5">
        {/* Search Bar */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-gray-400 dark:text-zinc-500" />
          <input
            type="text"
            placeholder="Search notes, pros, cons, Q&A, or tradeoffs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-gray-50 dark:bg-zinc-800/80 border border-gray-200 dark:border-zinc-700 rounded-lg text-gray-900 dark:text-zinc-100 placeholder-gray-400 dark:placeholder-zinc-500 outline-none focus:border-indigo-500 transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-2 text-gray-400 hover:text-gray-600 dark:hover:text-zinc-300"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Tab Pills */}
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar text-xs">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-2.5 py-1 rounded-md font-medium whitespace-nowrap transition-colors ${
              activeTab === 'all'
                ? 'bg-indigo-600 text-white'
                : 'text-gray-600 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-800'
            }`}
          >
            All Insights
          </button>
          <button
            onClick={() => setActiveTab('notes')}
            className={`px-2.5 py-1 rounded-md font-medium whitespace-nowrap flex items-center gap-1 transition-colors ${
              activeTab === 'notes'
                ? 'bg-indigo-600 text-white'
                : 'text-gray-600 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-800'
            }`}
          >
            <FileText className="w-3 h-3 text-indigo-500" />
            Notes
          </button>
          <button
            onClick={() => setActiveTab('pros_cons')}
            className={`px-2.5 py-1 rounded-md font-medium whitespace-nowrap flex items-center gap-1 transition-colors ${
              activeTab === 'pros_cons'
                ? 'bg-indigo-600 text-white'
                : 'text-gray-600 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-800'
            }`}
          >
            <CheckCircle2 className="w-3 h-3 text-emerald-500" />
            Pros & Cons ({totalProsCons})
          </button>
          <button
            onClick={() => setActiveTab('qna')}
            className={`px-2.5 py-1 rounded-md font-medium whitespace-nowrap flex items-center gap-1 transition-colors ${
              activeTab === 'qna'
                ? 'bg-indigo-600 text-white'
                : 'text-gray-600 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-800'
            }`}
          >
            <HelpCircle className="w-3 h-3 text-amber-500" />
            Staff Q&A ({discussion?.staffQnA?.length || 0})
          </button>
          <button
            onClick={() => setActiveTab('tradeoffs')}
            className={`px-2.5 py-1 rounded-md font-medium whitespace-nowrap flex items-center gap-1 transition-colors ${
              activeTab === 'tradeoffs'
                ? 'bg-indigo-600 text-white'
                : 'text-gray-600 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-800'
            }`}
          >
            <Scale className="w-3 h-3 text-purple-500" />
            Trade-offs ({discussion?.tradeoffs?.length || 0})
          </button>
          <button
            onClick={() => setActiveTab('capacity')}
            className={`px-2.5 py-1 rounded-md font-medium whitespace-nowrap flex items-center gap-1 transition-colors ${
              activeTab === 'capacity'
                ? 'bg-indigo-600 text-white'
                : 'text-gray-600 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-800'
            }`}
          >
            <Calculator className="w-3 h-3 text-sky-500" />
            Capacity Math
          </button>
        </div>
      </div>

      {/* Main Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6 font-sans text-xs">
        {/* ARCHITECTURE & DESIGN NOTES SECTION */}
        {(activeTab === 'all' || activeTab === 'notes' || activeTab === 'tradeoffs') && (
          <div className="p-3.5 rounded-xl border border-indigo-200 dark:border-indigo-900/60 bg-gradient-to-br from-indigo-50/50 to-white dark:from-indigo-950/30 dark:to-zinc-900 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-indigo-700 dark:text-indigo-400 font-bold">
                <Sparkles className="w-4 h-4" />
                <span>Architecture & Design Notes</span>
              </div>
              {!isPreloaded && (
                <button
                  onClick={() => {
                    if (isEditingNotes) {
                      handleSaveNotes();
                    } else {
                      setIsEditingNotes(true);
                    }
                  }}
                  className="flex items-center gap-1 text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
                >
                  {isEditingNotes ? (
                    <>
                      <Check className="w-3.5 h-3.5" /> Save
                    </>
                  ) : (
                    <>
                      <Pencil className="w-3 h-3" /> Edit Notes
                    </>
                  )}
                </button>
              )}
            </div>

            {isEditingNotes && !isPreloaded ? (
              <div className="space-y-2 pt-1 animate-in fade-in">
                <textarea
                  rows={4}
                  placeholder="Document your architecture requirements, design decisions, key assumptions, or notes as you build..."
                  value={notesText}
                  onChange={(e) => setNotesText(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-lg border border-indigo-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-900 dark:text-zinc-100 placeholder-gray-400 dark:placeholder-zinc-500 outline-none focus:border-indigo-500 transition-colors leading-relaxed resize-y min-h-[90px]"
                />
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => {
                      setNotesText(discussion?.overviewRecommendation || discussion?.summary || '');
                      setIsEditingNotes(false);
                    }}
                    className="px-2.5 py-1 text-[11px] text-gray-500 hover:text-gray-700 dark:hover:text-zinc-300"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveNotes}
                    className="flex items-center gap-1 px-3 py-1 text-[11px] bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 shadow-xs"
                  >
                    <Check className="w-3.5 h-3.5" /> Save Notes
                  </button>
                </div>
              </div>
            ) : notesText.trim() ? (
              <p className="text-gray-700 dark:text-zinc-300 leading-relaxed font-sans whitespace-pre-line text-xs pt-0.5">
                {notesText}
              </p>
            ) : !isPreloaded ? (
              <div className="p-3 border border-dashed border-indigo-200 dark:border-indigo-900/60 rounded-lg text-center space-y-1.5">
                <p className="text-gray-500 dark:text-zinc-400 text-[11px]">
                  No design notes added yet. Document system requirements, assumptions, and architecture decisions here.
                </p>
                <button
                  onClick={() => setIsEditingNotes(true)}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
                >
                  <Plus className="w-3.5 h-3.5" /> Write Architecture Notes
                </button>
              </div>
            ) : null}
          </div>
        )}

        {/* PROS SECTION */}
        {(activeTab === 'all' || activeTab === 'pros_cons') && (
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-md bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                  ✓
                </div>
                <h3 className="font-bold text-gray-900 dark:text-zinc-100 text-xs uppercase tracking-wider">
                  Architectural Pros & Strengths ({filteredPros.length})
                </h3>
              </div>
              {!isPreloaded && (
                <button
                  onClick={() => setIsAddingPro((prev) => !prev)}
                  className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Pro
                </button>
              )}
            </div>

            {/* Add Pro Form for editable mode */}
            {isAddingPro && !isPreloaded && (
              <div className="p-3 rounded-lg border border-emerald-300 dark:border-emerald-800 bg-emerald-50/40 dark:bg-emerald-950/20 space-y-2 animate-in fade-in">
                <input
                  type="text"
                  placeholder="Pro Title (e.g. 'Sub-5ms Read Latency via Redis LRU')"
                  value={newProTitle}
                  onChange={(e) => setNewProTitle(e.target.value)}
                  className="w-full text-xs p-1.5 rounded border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-900 dark:text-zinc-100 outline-none"
                />
                <textarea
                  placeholder="Senior engineer rationale and technical impact..."
                  value={newProContent}
                  onChange={(e) => setNewProContent(e.target.value)}
                  rows={2}
                  className="w-full text-xs p-1.5 rounded border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-900 dark:text-zinc-100 outline-none"
                />
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1 text-[11px]">
                    <span className="text-gray-500">Impact:</span>
                    <select
                      value={newProImpact}
                      onChange={(e) => setNewProImpact(e.target.value as any)}
                      className="text-xs p-1 rounded border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800"
                    >
                      <option value="high">High</option>
                      <option value="medium">Medium</option>
                      <option value="low">Low</option>
                    </select>
                  </div>
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => setIsAddingPro(false)}
                      className="px-2 py-1 text-[11px] text-gray-500 hover:text-gray-700 dark:hover:text-zinc-300"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleAddPro}
                      className="px-2.5 py-1 text-[11px] bg-emerald-600 text-white rounded font-medium hover:bg-emerald-700"
                    >
                      Save Pro
                    </button>
                  </div>
                </div>
              </div>
            )}

            {filteredPros.length === 0 && !isPreloaded && !isAddingPro ? (
              <div className="p-3 border border-dashed border-emerald-200 dark:border-emerald-900/40 rounded-lg text-center space-y-1">
                <p className="text-gray-500 dark:text-zinc-400 text-[11px]">
                  No strengths recorded yet. Note positive attributes like low latency, high throughput, or fault tolerance.
                </p>
                <button
                  onClick={() => setIsAddingPro(true)}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
                >
                  <Plus className="w-3.5 h-3.5" /> Add First Pro
                </button>
              </div>
            ) : null}

            <div className="space-y-2.5">
              {filteredPros.map((pro) => (
                <div
                  key={pro.id}
                  className="p-3 rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-850/50 hover:border-emerald-300 dark:hover:border-emerald-800/80 transition-colors shadow-2xs group"
                >
                  {editingProId === pro.id ? (
                    <div className="space-y-2">
                      <input
                        type="text"
                        value={editProTitle}
                        onChange={(e) => setEditProTitle(e.target.value)}
                        className="w-full text-xs p-1.5 rounded border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800"
                      />
                      <textarea
                        value={editProContent}
                        onChange={(e) => setEditProContent(e.target.value)}
                        rows={2}
                        className="w-full text-xs p-1.5 rounded border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800"
                      />
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => setEditingProId(null)}
                          className="px-2 py-0.5 text-[11px] text-gray-500"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleSaveEditPro(pro.id)}
                          className="px-2.5 py-0.5 text-[11px] bg-emerald-600 text-white rounded font-medium"
                        >
                          Save
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-bold text-gray-900 dark:text-zinc-100 text-xs">
                            {pro.title}
                          </span>
                          {pro.impact && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-medium bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                              {pro.impact.toUpperCase()} IMPACT
                            </span>
                          )}
                        </div>
                        {!isPreloaded && (
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => {
                                setEditingProId(pro.id);
                                setEditProTitle(pro.title);
                                setEditProContent(pro.content);
                                setEditProImpact(pro.impact || 'high');
                              }}
                              className="text-gray-400 hover:text-indigo-600 p-0.5"
                              title="Edit item"
                            >
                              <Pencil className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => handleDeletePro(pro.id)}
                              className="text-gray-400 hover:text-red-500 p-0.5"
                              title="Delete item"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>

                      <p className="mt-1.5 text-gray-600 dark:text-zinc-300 leading-relaxed text-[11.5px]">
                        {pro.content}
                      </p>

                      <div className="mt-2 pt-2 border-t border-gray-100 dark:border-zinc-800 flex items-center justify-between text-[10px] text-gray-400 dark:text-zinc-500">
                        <span>{pro.authorRole || 'Staff Systems Engineer'}</span>
                        <div className="flex items-center gap-1">
                          {pro.tags?.map((tag) => (
                            <span
                              key={tag}
                              className="px-1.5 py-0.5 rounded bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-400 font-mono"
                            >
                              #{tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* CONS SECTION */}
        {(activeTab === 'all' || activeTab === 'pros_cons') && (
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-md bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
                  !
                </div>
                <h3 className="font-bold text-gray-900 dark:text-zinc-100 text-xs uppercase tracking-wider">
                  Cons, Bottlenecks & Vulnerabilities ({filteredCons.length})
                </h3>
              </div>
              {!isPreloaded && (
                <button
                  onClick={() => setIsAddingCon((prev) => !prev)}
                  className="flex items-center gap-1 text-[11px] font-semibold text-amber-600 dark:text-amber-400 hover:underline"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Con
                </button>
              )}
            </div>

            {/* Add Con Form */}
            {isAddingCon && !isPreloaded && (
              <div className="p-3 rounded-lg border border-amber-300 dark:border-amber-800 bg-amber-50/40 dark:bg-amber-950/20 space-y-2 animate-in fade-in">
                <input
                  type="text"
                  placeholder="Con Title (e.g. 'Celebrity Hot-Key Write Storms')"
                  value={newConTitle}
                  onChange={(e) => setNewConTitle(e.target.value)}
                  className="w-full text-xs p-1.5 rounded border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-900 dark:text-zinc-100 outline-none"
                />
                <textarea
                  placeholder="Architectural vulnerability or operational overhead..."
                  value={newConContent}
                  onChange={(e) => setNewConContent(e.target.value)}
                  rows={2}
                  className="w-full text-xs p-1.5 rounded border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-900 dark:text-zinc-100 outline-none"
                />
                <textarea
                  placeholder="Staff Mitigation / Architectural Fix..."
                  value={newConMitigation}
                  onChange={(e) => setNewConMitigation(e.target.value)}
                  rows={2}
                  className="w-full text-xs p-1.5 rounded border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-900 dark:text-zinc-100 outline-none"
                />
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1 text-[11px]">
                    <span className="text-gray-500">Severity:</span>
                    <select
                      value={newConSeverity}
                      onChange={(e) => setNewConSeverity(e.target.value as any)}
                      className="text-xs p-1 rounded border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800"
                    >
                      <option value="critical">Critical</option>
                      <option value="high">High</option>
                      <option value="medium">Medium</option>
                    </select>
                  </div>
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => setIsAddingCon(false)}
                      className="px-2 py-1 text-[11px] text-gray-500 hover:text-gray-700 dark:hover:text-zinc-300"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleAddCon}
                      className="px-2.5 py-1 text-[11px] bg-amber-600 text-white rounded font-medium hover:bg-amber-700"
                    >
                      Save Con
                    </button>
                  </div>
                </div>
              </div>
            )}

            {filteredCons.length === 0 && !isPreloaded && !isAddingCon ? (
              <div className="p-3 border border-dashed border-amber-200 dark:border-amber-900/40 rounded-lg text-center space-y-1">
                <p className="text-gray-500 dark:text-zinc-400 text-[11px]">
                  No bottlenecks or failure modes recorded yet. Note potential SPOFs, hot keys, or throughput limits.
                </p>
                <button
                  onClick={() => setIsAddingCon(true)}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-600 dark:text-amber-400 hover:underline"
                >
                  <Plus className="w-3.5 h-3.5" /> Add First Con
                </button>
              </div>
            ) : null}

            <div className="space-y-2.5">
              {filteredCons.map((con) => (
                <div
                  key={con.id}
                  className="p-3 rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-850/50 hover:border-amber-300 dark:hover:border-amber-800/80 transition-colors shadow-2xs group"
                >
                  {editingConId === con.id ? (
                    <div className="space-y-2">
                      <input
                        type="text"
                        value={editConTitle}
                        onChange={(e) => setEditConTitle(e.target.value)}
                        className="w-full text-xs p-1.5 rounded border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800"
                      />
                      <textarea
                        value={editConContent}
                        onChange={(e) => setEditConContent(e.target.value)}
                        rows={2}
                        className="w-full text-xs p-1.5 rounded border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800"
                      />
                      <textarea
                        value={editConMitigation}
                        onChange={(e) => setEditConMitigation(e.target.value)}
                        rows={2}
                        placeholder="Mitigation or fix..."
                        className="w-full text-xs p-1.5 rounded border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800"
                      />
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => setEditingConId(null)}
                          className="px-2 py-0.5 text-[11px] text-gray-500"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleSaveEditCon(con.id)}
                          className="px-2.5 py-0.5 text-[11px] bg-amber-600 text-white rounded font-medium"
                        >
                          Save
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-bold text-gray-900 dark:text-zinc-100 text-xs">
                            {con.title}
                          </span>
                          {con.severity && (
                            <span
                              className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-medium border ${
                                con.severity === 'critical'
                                  ? 'bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800'
                                  : 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800'
                              }`}
                            >
                              {con.severity.toUpperCase()}
                            </span>
                          )}
                        </div>
                        {!isPreloaded && (
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => {
                                setEditingConId(con.id);
                                setEditConTitle(con.title);
                                setEditConContent(con.content);
                                setEditConMitigation(con.mitigationOrAlternative || '');
                                setEditConSeverity(con.severity || 'medium');
                              }}
                              className="text-gray-400 hover:text-indigo-600 p-0.5"
                              title="Edit item"
                            >
                              <Pencil className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => handleDeleteCon(con.id)}
                              className="text-gray-400 hover:text-red-500 p-0.5"
                              title="Delete item"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>

                      <p className="mt-1.5 text-gray-600 dark:text-zinc-300 leading-relaxed text-[11.5px]">
                        {con.content}
                      </p>

                      {/* Mitigation Box */}
                      {con.mitigationOrAlternative && (
                        <div className="mt-2.5 p-2 rounded-lg bg-gray-50 dark:bg-zinc-800/70 border border-gray-200/80 dark:border-zinc-750 text-[11px] space-y-1">
                          <div className="flex items-center gap-1.5 font-semibold text-gray-700 dark:text-zinc-300">
                            <ShieldCheck className="w-3.5 h-3.5 text-indigo-500" />
                            <span>Staff Mitigation & Fix:</span>
                          </div>
                          <p className="text-gray-600 dark:text-zinc-400 leading-normal pl-5">
                            {con.mitigationOrAlternative}
                          </p>
                        </div>
                      )}

                      <div className="mt-2 pt-2 border-t border-gray-100 dark:border-zinc-800 flex items-center justify-between text-[10px] text-gray-400 dark:text-zinc-500">
                        <span>{con.authorRole || 'Principal Architect'}</span>
                        <div className="flex items-center gap-1">
                          {con.tags?.map((tag) => (
                            <span
                              key={tag}
                              className="px-1.5 py-0.5 rounded bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-zinc-400 font-mono"
                            >
                              #{tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* STAFF Q&A / DEEP-DIVE INTERVIEW THREADS */}
        {(activeTab === 'all' || activeTab === 'qna') && (
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-md bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold">
                  Q
                </div>
                <h3 className="font-bold text-gray-900 dark:text-zinc-100 text-xs uppercase tracking-wider">
                  Senior / Staff Interview Deep-Dives ({filteredQna.length})
                </h3>
              </div>
              {!isPreloaded && (
                <button
                  onClick={() => setIsAddingQna((prev) => !prev)}
                  className="flex items-center gap-1 text-[11px] font-semibold text-purple-600 dark:text-purple-400 hover:underline"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Q&A
                </button>
              )}
            </div>

            {/* Add Q&A Form */}
            {isAddingQna && !isPreloaded && (
              <div className="p-3 rounded-lg border border-purple-300 dark:border-purple-800 bg-purple-50/40 dark:bg-purple-950/20 space-y-2 animate-in fade-in">
                <input
                  type="text"
                  placeholder="Interview Question (e.g. 'How do you prevent cache stampedes under viral load?')"
                  value={newQuestion}
                  onChange={(e) => setNewQuestion(e.target.value)}
                  className="w-full text-xs p-1.5 rounded border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-900 dark:text-zinc-100 outline-none"
                />
                <textarea
                  placeholder="Senior/Staff engineer comprehensive answer..."
                  value={newAnswer}
                  onChange={(e) => setNewAnswer(e.target.value)}
                  rows={3}
                  className="w-full text-xs p-1.5 rounded border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-900 dark:text-zinc-100 outline-none"
                />
                <input
                  type="text"
                  placeholder="Key Architectural Takeaway (1 sentence)..."
                  value={newKeyTakeaway}
                  onChange={(e) => setNewKeyTakeaway(e.target.value)}
                  className="w-full text-xs p-1.5 rounded border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-900 dark:text-zinc-100 outline-none"
                />
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => setIsAddingQna(false)}
                    className="px-2 py-1 text-[11px] text-gray-500 hover:text-gray-700 dark:hover:text-zinc-300"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddQna}
                    className="px-2.5 py-1 text-[11px] bg-purple-600 text-white rounded font-medium hover:bg-purple-700"
                  >
                    Save Q&A
                  </button>
                </div>
              </div>
            )}

            {filteredQna.length === 0 && !isPreloaded && !isAddingQna ? (
              <div className="p-3 border border-dashed border-purple-200 dark:border-purple-900/40 rounded-lg text-center space-y-1">
                <p className="text-gray-500 dark:text-zinc-400 text-[11px]">
                  No deep-dive Q&As recorded yet. Document questions you or an interviewer might explore.
                </p>
                <button
                  onClick={() => setIsAddingQna(true)}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-purple-600 dark:text-purple-400 hover:underline"
                >
                  <Plus className="w-3.5 h-3.5" /> Add First Q&A
                </button>
              </div>
            ) : null}

            <div className="space-y-3">
              {filteredQna.map((item) => {
                const isExpanded = expandedQnaIds[item.id] !== false;
                return (
                  <div
                    key={item.id}
                    className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-850/50 overflow-hidden shadow-2xs group"
                  >
                    {editingQnaId === item.id ? (
                      <div className="p-3 space-y-2">
                        <input
                          type="text"
                          value={editQuestion}
                          onChange={(e) => setEditQuestion(e.target.value)}
                          className="w-full text-xs p-1.5 rounded border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800"
                        />
                        <textarea
                          value={editAnswer}
                          onChange={(e) => setEditAnswer(e.target.value)}
                          rows={3}
                          className="w-full text-xs p-1.5 rounded border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800"
                        />
                        <input
                          type="text"
                          value={editKeyTakeaway}
                          onChange={(e) => setEditKeyTakeaway(e.target.value)}
                          className="w-full text-xs p-1.5 rounded border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800"
                        />
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => setEditingQnaId(null)}
                            className="px-2 py-0.5 text-[11px] text-gray-500"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => handleSaveEditQna(item.id)}
                            className="px-2.5 py-0.5 text-[11px] bg-purple-600 text-white rounded font-medium"
                          >
                            Save
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        {/* Question Header */}
                        <button
                          onClick={() => toggleQnaExpand(item.id)}
                          className="w-full text-left p-3 flex items-start justify-between gap-2 hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition-colors"
                        >
                          <div className="flex items-start gap-2 min-w-0">
                            <span className="font-bold text-purple-600 dark:text-purple-400 font-mono text-xs">
                              Q:
                            </span>
                            <span className="font-bold text-gray-900 dark:text-zinc-100 text-xs leading-snug">
                              {item.question}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0 text-gray-400">
                            {isExpanded ? (
                              <ChevronUp className="w-4 h-4" />
                            ) : (
                              <ChevronDown className="w-4 h-4" />
                            )}
                          </div>
                        </button>

                        {/* Expanded Answer */}
                        {isExpanded && (
                          <div className="px-3 pb-3 pt-1 border-t border-gray-100 dark:border-zinc-800/80 space-y-2.5 text-[11.5px]">
                            <div className="flex items-start gap-2 text-gray-700 dark:text-zinc-300 leading-relaxed font-sans">
                              <span className="font-bold text-indigo-600 dark:text-indigo-400 font-mono text-xs">
                                A:
                              </span>
                              <div className="space-y-1.5 flex-1">
                                <p className="whitespace-pre-line">{item.answer}</p>
                              </div>
                            </div>

                            {/* Key Takeaway Callout */}
                            {item.keyTakeaway && (
                              <div className="p-2 rounded-lg bg-indigo-50/60 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/60 flex items-start gap-2">
                                <BookOpen className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
                                <div className="text-[11px] text-indigo-900 dark:text-indigo-200">
                                  <span className="font-bold">Staff Takeaway: </span>
                                  {item.keyTakeaway}
                                </div>
                              </div>
                            )}

                            <div className="pt-2 flex items-center justify-between text-[10px] text-gray-400 dark:text-zinc-500">
                              <span>{item.authorRole}</span>
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() =>
                                    handleCopyText(
                                      `Q: ${item.question}\n\nA: ${item.answer}\n\nKey Takeaway: ${item.keyTakeaway}`,
                                      item.id
                                    )
                                  }
                                  className="flex items-center gap-1 hover:text-gray-700 dark:hover:text-zinc-300"
                                  title="Copy Q&A"
                                >
                                  {copiedId === item.id ? (
                                    <>
                                      <Check className="w-3 h-3 text-emerald-500" />
                                      <span className="text-emerald-500 font-medium">Copied!</span>
                                    </>
                                  ) : (
                                    <>
                                      <Copy className="w-3 h-3" />
                                      <span>Copy</span>
                                    </>
                                  )}
                                </button>
                                {!isPreloaded && (
                                  <>
                                    <button
                                      onClick={() => {
                                        setEditingQnaId(item.id);
                                        setEditQuestion(item.question);
                                        setEditAnswer(item.answer);
                                        setEditKeyTakeaway(item.keyTakeaway);
                                      }}
                                      className="text-gray-400 hover:text-indigo-600 p-0.5"
                                      title="Edit Q&A"
                                    >
                                      <Pencil className="w-3 h-3" />
                                    </button>
                                    <button
                                      onClick={() => handleDeleteQna(item.id)}
                                      className="text-gray-400 hover:text-red-500"
                                      title="Delete"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </button>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* ARCHITECTURAL TRADEOFFS MATRIX */}
        {(activeTab === 'all' || activeTab === 'tradeoffs') && (
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-md bg-sky-100 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 flex items-center justify-center font-bold">
                  ⚖
                </div>
                <h3 className="font-bold text-gray-900 dark:text-zinc-100 text-xs uppercase tracking-wider">
                  Core Architectural Trade-offs ({filteredTradeoffs.length})
                </h3>
              </div>
              {!isPreloaded && (
                <button
                  onClick={() => setIsAddingTradeoff((prev) => !prev)}
                  className="flex items-center gap-1 text-[11px] font-semibold text-purple-600 dark:text-purple-400 hover:underline"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Trade-off
                </button>
              )}
            </div>

            {/* Add Trade-off Form */}
            {isAddingTradeoff && !isPreloaded && (
              <div className="p-3 rounded-lg border border-purple-300 dark:border-purple-800 bg-purple-50/40 dark:bg-purple-950/20 space-y-2 animate-in fade-in">
                <input
                  type="text"
                  placeholder="Trade-off Dimension (e.g. 'Latency vs Consistency')"
                  value={newDimension}
                  onChange={(e) => setNewDimension(e.target.value)}
                  className="w-full text-xs p-1.5 rounded border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-900 dark:text-zinc-100 outline-none"
                />
                <input
                  type="text"
                  placeholder="Chosen Strategy (e.g. 'Eventual Consistency via CRDTs')"
                  value={newChosenStrategy}
                  onChange={(e) => setNewChosenStrategy(e.target.value)}
                  className="w-full text-xs p-1.5 rounded border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-900 dark:text-zinc-100 outline-none"
                />
                <textarea
                  placeholder="Reasoning and engineering rationale..."
                  value={newReasoning}
                  onChange={(e) => setNewReasoning(e.target.value)}
                  rows={2}
                  className="w-full text-xs p-1.5 rounded border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-900 dark:text-zinc-100 outline-none"
                />
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => setIsAddingTradeoff(false)}
                    className="px-2 py-1 text-[11px] text-gray-500 hover:text-gray-700 dark:hover:text-zinc-300"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddTradeoff}
                    className="px-2.5 py-1 text-[11px] bg-purple-600 text-white rounded font-medium hover:bg-purple-700"
                  >
                    Save Trade-off
                  </button>
                </div>
              </div>
            )}

            {filteredTradeoffs.length === 0 && !isPreloaded && !isAddingTradeoff ? (
              <div className="p-3 border border-dashed border-sky-200 dark:border-sky-900/40 rounded-lg text-center space-y-1">
                <p className="text-gray-500 dark:text-zinc-400 text-[11px]">
                  No trade-offs recorded yet. Track key decisions like Push vs Pull, SQL vs NoSQL, or Latency vs Durability.
                </p>
                <button
                  onClick={() => setIsAddingTradeoff(true)}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-sky-600 dark:text-sky-400 hover:underline"
                >
                  <Plus className="w-3.5 h-3.5" /> Add First Trade-off
                </button>
              </div>
            ) : null}

            <div className="space-y-2.5">
              {filteredTradeoffs.map((tradeoff, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-850/50 shadow-2xs space-y-1.5 group"
                >
                  {editingTradeoffIdx === idx ? (
                    <div className="space-y-2">
                      <input
                        type="text"
                        value={editDimension}
                        onChange={(e) => setEditDimension(e.target.value)}
                        className="w-full text-xs p-1.5 rounded border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800"
                      />
                      <input
                        type="text"
                        value={editChosenStrategy}
                        onChange={(e) => setEditChosenStrategy(e.target.value)}
                        className="w-full text-xs p-1.5 rounded border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800"
                      />
                      <textarea
                        value={editReasoning}
                        onChange={(e) => setEditReasoning(e.target.value)}
                        rows={2}
                        className="w-full text-xs p-1.5 rounded border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800"
                      />
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => setEditingTradeoffIdx(null)}
                          className="px-2 py-0.5 text-[11px] text-gray-500"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleSaveEditTradeoff(idx)}
                          className="px-2.5 py-0.5 text-[11px] bg-purple-600 text-white rounded font-medium"
                        >
                          Save
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-start justify-between gap-2">
                        <div className="font-bold text-gray-900 dark:text-zinc-100 text-xs">
                          {tradeoff.dimension}
                        </div>
                        {!isPreloaded && (
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => {
                                setEditingTradeoffIdx(idx);
                                setEditDimension(tradeoff.dimension);
                                setEditChosenStrategy(tradeoff.chosenStrategy);
                                setEditReasoning(tradeoff.reasoning);
                              }}
                              className="text-gray-400 hover:text-indigo-600 p-0.5"
                              title="Edit trade-off"
                            >
                              <Pencil className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => handleDeleteTradeoff(idx)}
                              className="text-gray-400 hover:text-red-500 p-0.5"
                              title="Delete trade-off"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 text-[11px] text-indigo-600 dark:text-indigo-400 font-semibold">
                        <ArrowRight className="w-3 h-3" />
                        <span>Chosen Strategy: {tradeoff.chosenStrategy}</span>
                      </div>
                      <p className="text-gray-600 dark:text-zinc-300 leading-relaxed text-[11.5px]">
                        {tradeoff.reasoning}
                      </p>
                    </>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* CAPACITY MATH & ESTIMATION */}
        {(activeTab === 'all' || activeTab === 'capacity') && (
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-md bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
                  #
                </div>
                <h3 className="font-bold text-gray-900 dark:text-zinc-100 text-xs uppercase tracking-wider">
                  Capacity Estimation (Back-of-the-Envelope)
                </h3>
              </div>
              {!isPreloaded && (
                <button
                  onClick={() => {
                    if (isEditingCapacity) {
                      handleSaveCapacity();
                    } else {
                      setIsEditingCapacity(true);
                    }
                  }}
                  className="flex items-center gap-1 text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
                >
                  {isEditingCapacity ? (
                    <>
                      <Check className="w-3.5 h-3.5" /> Save Estimates
                    </>
                  ) : (
                    <>
                      <Pencil className="w-3 h-3" /> Edit Estimates
                    </>
                  )}
                </button>
              )}
            </div>

            {isEditingCapacity && !isPreloaded ? (
              <div className="p-3 rounded-xl border border-indigo-200 dark:border-zinc-700 bg-white dark:bg-zinc-850/50 space-y-2.5 animate-in fade-in">
                <div>
                  <label className="text-[10px] text-gray-500 font-mono uppercase block mb-0.5">
                    Daily Scale / Audience
                  </label>
                  <input
                    type="text"
                    value={capDau}
                    onChange={(e) => setCapDau(e.target.value)}
                    placeholder="e.g. 100M Daily Active Users"
                    className="w-full text-xs p-1.5 rounded border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-gray-500 font-mono uppercase block mb-0.5">
                    Read / Write Ratio
                  </label>
                  <input
                    type="text"
                    value={capRw}
                    onChange={(e) => setCapRw(e.target.value)}
                    placeholder="e.g. 100:1 (Read-heavy)"
                    className="w-full text-xs p-1.5 rounded border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-gray-500 font-mono uppercase block mb-0.5">
                    Peak Load & Throughput
                  </label>
                  <input
                    type="text"
                    value={capPeakRps}
                    onChange={(e) => setCapPeakRps(e.target.value)}
                    placeholder="e.g. 15,000 RPS"
                    className="w-full text-xs p-1.5 rounded border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-gray-500 font-mono uppercase block mb-0.5">
                    Storage Growth / Year
                  </label>
                  <input
                    type="text"
                    value={capStorage}
                    onChange={(e) => setCapStorage(e.target.value)}
                    placeholder="e.g. 50 TB new data / year"
                    className="w-full text-xs p-1.5 rounded border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-gray-500 font-mono uppercase block mb-0.5">
                    Bandwidth Requirements
                  </label>
                  <input
                    type="text"
                    value={capBandwidth}
                    onChange={(e) => setCapBandwidth(e.target.value)}
                    placeholder="e.g. ~2.5 Gbps ingress, 25 Gbps egress"
                    className="w-full text-xs p-1.5 rounded border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-1">
                  <button
                    onClick={() => setIsEditingCapacity(false)}
                    className="px-2.5 py-1 text-[11px] text-gray-500 hover:text-gray-700"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveCapacity}
                    className="px-3 py-1 text-[11px] bg-indigo-600 text-white rounded font-medium hover:bg-indigo-700"
                  >
                    Save Estimates
                  </button>
                </div>
              </div>
            ) : discussion?.capacityEstimation &&
              (discussion.capacityEstimation.dailyActiveUsers ||
                discussion.capacityEstimation.readWriteRatio ||
                discussion.capacityEstimation.peakRps ||
                discussion.capacityEstimation.storagePerYear ||
                discussion.capacityEstimation.bandwidthRequirement) ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {discussion.capacityEstimation.dailyActiveUsers && (
                  <div className="p-2.5 rounded-lg border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-850/50">
                    <span className="text-[10px] text-gray-400 dark:text-zinc-500 font-mono uppercase block">
                      Daily Scale / Audience
                    </span>
                    <span className="font-bold text-gray-800 dark:text-zinc-200 text-xs">
                      {discussion.capacityEstimation.dailyActiveUsers}
                    </span>
                  </div>
                )}

                {discussion.capacityEstimation.readWriteRatio && (
                  <div className="p-2.5 rounded-lg border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-850/50">
                    <span className="text-[10px] text-gray-400 dark:text-zinc-500 font-mono uppercase block">
                      Read / Write Ratio
                    </span>
                    <span className="font-bold text-gray-800 dark:text-zinc-200 text-xs">
                      {discussion.capacityEstimation.readWriteRatio}
                    </span>
                  </div>
                )}

                {discussion.capacityEstimation.peakRps && (
                  <div className="p-2.5 rounded-lg border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-850/50">
                    <span className="text-[10px] text-gray-400 dark:text-zinc-500 font-mono uppercase block">
                      Peak Load & Throughput
                    </span>
                    <span className="font-bold text-indigo-600 dark:text-indigo-400 text-xs font-mono">
                      {discussion.capacityEstimation.peakRps}
                    </span>
                  </div>
                )}

                {discussion.capacityEstimation.storagePerYear && (
                  <div className="p-2.5 rounded-lg border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-850/50">
                    <span className="text-[10px] text-gray-400 dark:text-zinc-500 font-mono uppercase block">
                      Storage Growth / Year
                    </span>
                    <span className="font-bold text-gray-800 dark:text-zinc-200 text-xs">
                      {discussion.capacityEstimation.storagePerYear}
                    </span>
                  </div>
                )}

                {discussion.capacityEstimation.bandwidthRequirement && (
                  <div className="p-2.5 rounded-lg border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-850/50 sm:col-span-2">
                    <span className="text-[10px] text-gray-400 dark:text-zinc-500 font-mono uppercase block">
                      Bandwidth Requirements
                    </span>
                    <span className="font-bold text-gray-800 dark:text-zinc-200 text-xs">
                      {discussion.capacityEstimation.bandwidthRequirement}
                    </span>
                  </div>
                )}
              </div>
            ) : !isPreloaded ? (
              <div className="p-3 border border-dashed border-amber-200 dark:border-amber-900/40 rounded-lg text-center space-y-1">
                <p className="text-gray-500 dark:text-zinc-400 text-[11px]">
                  No capacity math estimated yet. Calculate back-of-the-envelope RPS, storage, and bandwidth.
                </p>
                <button
                  onClick={() => setIsEditingCapacity(true)}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-600 dark:text-amber-400 hover:underline"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Capacity Estimates
                </button>
              </div>
            ) : null}
          </section>
        )}
      </div>

      {/* Footer Info */}
      <div className="p-3 border-t border-gray-200 dark:border-zinc-800 bg-gray-50/80 dark:bg-zinc-850/60 flex items-center justify-between text-[11px] text-gray-500 dark:text-zinc-400 select-none">
        <div className="flex items-center gap-1.5">
          <Layers className="w-3.5 h-3.5 text-indigo-500" />
          <span>SysDesign Architecture Suite</span>
        </div>
        <div className="flex items-center gap-3">
          <a
            href="https://ko-fi.com/veydh"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 transition-colors font-medium hover:underline"
            title="Support on Ko-fi"
          >
            <Coffee className="w-3.5 h-3.5" />
            <span>Support on Ko-fi</span>
          </a>
          <span className="font-mono text-[10px]">
            {isPreloaded ? 'Preloaded Reference' : 'Custom Workspace'}
          </span>
        </div>
      </div>
    </aside>
  );
};
