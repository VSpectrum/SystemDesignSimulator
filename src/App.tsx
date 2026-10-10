import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  SystemDesignGraph,
  SystemNode,
  ConnectionEdge,
  SimulationSettings,
  SystemMetrics,
  ComponentType,
  SystemDiscussion,
} from './types/system';
import { SimulationEngine } from './engine/simulation';
import { ARCHITECTURE_TEMPLATES } from './engine/templates';
import { lintArchitecture } from './engine/linter';
import { ComponentDefinition } from './data/componentLibrary';
import {
  serializeGraphToUrl,
  deserializeGraphFromUrl,
} from './utils/sharing';
import { exportCanvasAsPng } from './utils/exportImage';

import { TopBar } from './components/TopBar';
import { Toolbox } from './components/Toolbox';
import { ComponentPalette } from './components/ComponentPalette';
import { Inspector } from './components/Inspector';
import { DiscussionPanel } from './components/DiscussionPanel';
import { SimulationOverlay } from './components/SimulationOverlay';
import { LiveCritiquePanel, LiveCritiqueState } from './components/LiveCritiquePanel';
import { buildConnectionCritiquePrompt, requestOpenAiCritique } from './engine/llmCritique';
import { RoughCanvas } from './canvas/RoughCanvas';
import { Upload, Coffee, ExternalLink } from 'lucide-react';

// Code-split heavy modals to optimize initial bundle size & Core Web Vitals
const CommandPaletteModal = React.lazy(() =>
  import('./components/CommandPaletteModal').then((m) => ({ default: m.CommandPaletteModal }))
);
const DslModal = React.lazy(() =>
  import('./components/DslModal').then((m) => ({ default: m.DslModal }))
);
const AiCritiqueModal = React.lazy(() =>
  import('./components/AiCritiqueModal').then((m) => ({ default: m.AiCritiqueModal }))
);
const SettingsModal = React.lazy(() =>
  import('./components/SettingsModal').then((m) => ({ default: m.SettingsModal }))
);
const ShareModal = React.lazy(() =>
  import('./components/ShareModal').then((m) => ({ default: m.ShareModal }))
);
const ImportModal = React.lazy(() =>
  import('./components/ImportModal').then((m) => ({ default: m.ImportModal }))
);

export const App: React.FC = () => {
  // Theme state: 'light' | 'dark'
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('sysdesign_theme');
    if (saved === 'light' || saved === 'dark') return saved;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  useEffect(() => {
    localStorage.setItem('sysdesign_theme', theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  // Keep page title synchronized with active architecture & SEO terms
  const handleToggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  // Load initial graph from URL hash or fallback to first template (URL Shortener)
  const [graph, setGraph] = useState<SystemDesignGraph>(() => {
    if (window.location.hash) {
      const parsed = deserializeGraphFromUrl(window.location.hash);
      if (parsed) {
        if (!parsed.discussion && parsed.meta.templateId) {
          const tmpl = ARCHITECTURE_TEMPLATES.find((t) => t.id === parsed.meta.templateId);
          if (tmpl) parsed.discussion = tmpl.discussion;
        }
        return parsed;
      }
    }
    const defaultTmpl = ARCHITECTURE_TEMPLATES[0];
    return {
      ...defaultTmpl.graph,
      discussion: defaultTmpl.discussion,
    };
  });

  // Keep page title synchronized with active architecture & SEO terms
  useEffect(() => {
    if (graph.meta.name && graph.meta.name !== 'New Architecture') {
      document.title = `${graph.meta.name} — SysDesign Sim | System Design & Architecture Whiteboard`;
    } else {
      document.title = 'SysDesign Sim — Free System Design Tool, Architecture Diagrams & Excalidraw Whiteboard Simulator';
    }
  }, [graph.meta.name]);

  // Tools & UI states
  const [activeTool, setActiveTool] = useState<
    'select' | 'pan' | 'wire' | 'pencil' | 'sticky' | 'text' | 'eraser'
  >('select');
  const [selectedNodeIds, setSelectedNodeIds] = useState<string[]>([]);
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [lastPlacedNodeId, setLastPlacedNodeId] = useState<string | null>(null);
  const [isDiscussionOpen, setIsDiscussionOpen] = useState(true);
  const [isDslModalOpen, setIsDslModalOpen] = useState(false);
  const [isAiCritiqueOpen, setIsAiCritiqueOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [importInitialContent, setImportInitialContent] = useState('');
  const [importInitialFileName, setImportInitialFileName] = useState('');
  const [isWindowDraggingFile, setIsWindowDraggingFile] = useState(false);

  // Undo / Redo history state
  const historyRef = useRef<{
    past: SystemDesignGraph[];
    future: SystemDesignGraph[];
  }>({ past: [], future: [] });

  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const pendingHistorySnapshotRef = useRef<SystemDesignGraph | null>(null);
  const historyDebounceTimerRef = useRef<number | null>(null);
  const dragStartGraphRef = useRef<SystemDesignGraph | null>(null);

  const updateHistoryState = () => {
    setCanUndo(historyRef.current.past.length > 0);
    setCanRedo(historyRef.current.future.length > 0);
  };

  const CUSTOM_ARCH_STORAGE_KEY = 'sysdesign_custom_architecture';

  // Holds in-progress custom / new architecture so it is preserved when switching to/from other templates
  const customArchitectureRef = useRef<SystemDesignGraph | null>(null);

  // Lazily initialize customArchitectureRef on first render
  if (customArchitectureRef.current === null) {
    if (graph.meta.templateId === 'new') {
      customArchitectureRef.current = graph;
    } else {
      try {
        const stored = localStorage.getItem(CUSTOM_ARCH_STORAGE_KEY);
        if (stored) {
          customArchitectureRef.current = JSON.parse(stored);
        }
      } catch (e) {
        // ignore
      }
    }
  }

  // Continuously sync custom architecture changes to ref and localStorage while on 'new'
  useEffect(() => {
    if (graph.meta.templateId === 'new') {
      customArchitectureRef.current = graph;
      try {
        localStorage.setItem(CUSTOM_ARCH_STORAGE_KEY, JSON.stringify(graph));
      } catch (e) {
        console.warn('Failed to save custom architecture to localStorage', e);
      }
    }
  }, [graph]);

  const pushGraphChange = (
    updater: (prev: SystemDesignGraph) => SystemDesignGraph,
    saveHistory = true
  ) => {
    setGraph((prev) => {
      if (saveHistory) {
        historyRef.current.past.push(JSON.parse(JSON.stringify(prev)));
        if (historyRef.current.past.length > 50) {
          historyRef.current.past.shift();
        }
        historyRef.current.future = [];
        updateHistoryState();
      }
      return updater(prev);
    });
  };

  const handleUndo = () => {
    if (historyDebounceTimerRef.current) {
      window.clearTimeout(historyDebounceTimerRef.current);
      historyDebounceTimerRef.current = null;
    }
    pendingHistorySnapshotRef.current = null;

    if (historyRef.current.past.length === 0) return;
    const previous = historyRef.current.past.pop()!;
    historyRef.current.future.push(JSON.parse(JSON.stringify(graph)));
    updateHistoryState();
    setGraph(previous);
    setSelectedNodeIds((prev) => prev.filter((id) => previous.nodes.some((n) => n.id === id)));
    if (selectedEdgeId && !previous.edges.some((e) => e.id === selectedEdgeId)) {
      setSelectedEdgeId(null);
    }
  };

  const handleRedo = () => {
    if (historyRef.current.future.length === 0) return;
    const next = historyRef.current.future.pop()!;
    historyRef.current.past.push(JSON.parse(JSON.stringify(graph)));
    updateHistoryState();
    setGraph(next);
    setSelectedNodeIds((prev) => prev.filter((id) => next.nodes.some((n) => n.id === id)));
  };

  // Clipboard for Copy / Paste (Ctrl+C / Ctrl+V)
  const clipboardRef = useRef<{
    nodes: SystemNode[];
    edges: ConnectionEdge[];
    pasteCount: number;
  } | null>(null);

  const handleCopy = () => {
    if (selectedNodeIds.length === 0) return;
    const nodesToCopy = graph.nodes.filter((n) => selectedNodeIds.includes(n.id));
    if (nodesToCopy.length === 0) return;

    const selectedSet = new Set(selectedNodeIds);
    // Also copy any edges that connect between the selected nodes
    const edgesToCopy = graph.edges.filter(
      (e) => selectedSet.has(e.fromNodeId) && selectedSet.has(e.toNodeId)
    );

    clipboardRef.current = {
      nodes: JSON.parse(JSON.stringify(nodesToCopy)),
      edges: JSON.parse(JSON.stringify(edgesToCopy)),
      pasteCount: 0,
    };
  };

  const handlePaste = () => {
    if (!clipboardRef.current || clipboardRef.current.nodes.length === 0) return;

    clipboardRef.current.pasteCount += 1;
    const offset = 35 * clipboardRef.current.pasteCount;

    // Map old nodeId -> new nodeId
    const idMap = new Map<string, string>();
    const newNodes: SystemNode[] = clipboardRef.current.nodes.map((node) => {
      const newId = `node_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      idMap.set(node.id, newId);
      return {
        ...node,
        id: newId,
        x: Math.round(node.x + offset),
        y: Math.round(node.y + offset),
        config: {
          ...node.config,
          label: `${node.config.label} (Copy)`,
        },
      };
    });

    // Map internal edges to the new node IDs
    const newEdges: ConnectionEdge[] = clipboardRef.current.edges
      .filter((edge) => idMap.has(edge.fromNodeId) && idMap.has(edge.toNodeId))
      .map((edge) => ({
        ...edge,
        id: `edge_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        fromNodeId: idMap.get(edge.fromNodeId)!,
        toNodeId: idMap.get(edge.toNodeId)!,
      }));

    pushGraphChange((prev) => ({
      ...prev,
      nodes: [...prev.nodes, ...newNodes],
      edges: [...prev.edges, ...newEdges],
    }));

    const newNodeIds = newNodes.map((n) => n.id);
    setSelectedNodeIds(newNodeIds);
    setSelectedEdgeId(null);
    if (newNodeIds.length > 0) {
      setLastPlacedNodeId(newNodeIds[newNodeIds.length - 1]);
    }
  };

  // LLM Settings & Live Critique
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('sysdesign_ai_key') || '');
  const [aiBaseUrl, setAiBaseUrl] = useState(() => {
    const saved = localStorage.getItem('sysdesign_ai_base_url');
    if (saved) return saved;
    const oldEndpoint = localStorage.getItem('sysdesign_ai_endpoint');
    if (oldEndpoint) {
      return oldEndpoint.replace(/\/chat\/completions$/, '');
    }
    return 'https://api.openai.com/v1';
  });
  const [aiModel, setAiModel] = useState(
    () => localStorage.getItem('sysdesign_ai_model') || 'gpt-4o'
  );
  const [liveCritiqueEnabled, setLiveCritiqueEnabled] = useState(() => {
    const saved = localStorage.getItem('sysdesign_ai_live_critique');
    return saved !== null ? saved === 'true' : true;
  });

  // Live Critique Panel State
  const [liveCritiqueState, setLiveCritiqueState] = useState<LiveCritiqueState>({
    isOpen: false,
    isMinimized: false,
    isLoading: false,
    sourceNodeLabel: '',
    sourceNodeType: '',
    targetNodeLabel: '',
    targetNodeType: '',
    protocol: 'HTTP',
    critiqueText: null,
    errorMessage: null,
    timestamp: '',
  });

  // Track last connection for retry
  const lastConnectionCritiqueRef = useRef<{
    graph: SystemDesignGraph;
    newEdge: ConnectionEdge;
    sourceNode: SystemNode;
    targetNode: SystemNode;
  } | null>(null);

  const critiqueAbortControllerRef = useRef<AbortController | null>(null);

  const handleApiKeyChange = (newKey: string) => {
    const trimmed = newKey.trim();
    setApiKey(trimmed);
    localStorage.setItem('sysdesign_ai_key', trimmed);
  };

  const handleBaseUrlChange = (newUrl: string) => {
    const trimmed = newUrl.trim();
    setAiBaseUrl(trimmed);
    localStorage.setItem('sysdesign_ai_base_url', trimmed);
    localStorage.setItem('sysdesign_ai_endpoint', trimmed);
  };

  const handleModelChange = (newModel: string) => {
    const trimmed = newModel.trim();
    setAiModel(trimmed);
    localStorage.setItem('sysdesign_ai_model', trimmed);
  };

  const handleToggleLiveCritique = (enabled: boolean) => {
    setLiveCritiqueEnabled(enabled);
    localStorage.setItem('sysdesign_ai_live_critique', String(enabled));
  };

  const handleConnectionCreated = async (
    newEdge: ConnectionEdge,
    sourceNode: SystemNode,
    targetNode: SystemNode,
    updatedGraph: SystemDesignGraph
  ) => {
    const cleanKey = apiKey.trim();
    if (!cleanKey || !liveCritiqueEnabled) {
      return;
    }

    lastConnectionCritiqueRef.current = {
      graph: updatedGraph,
      newEdge,
      sourceNode,
      targetNode,
    };

    if (critiqueAbortControllerRef.current) {
      critiqueAbortControllerRef.current.abort();
    }
    const controller = new AbortController();
    critiqueAbortControllerRef.current = controller;

    setLiveCritiqueState({
      isOpen: true,
      isMinimized: false,
      isLoading: true,
      sourceNodeLabel: sourceNode.config.label,
      sourceNodeType: sourceNode.type,
      targetNodeLabel: targetNode.config.label,
      targetNodeType: targetNode.type,
      protocol: newEdge.protocol,
      critiqueText: null,
      errorMessage: null,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    });

    try {
      const prompt = buildConnectionCritiquePrompt(
        updatedGraph,
        newEdge,
        sourceNode,
        targetNode,
        simulationMetrics
      );

      const result = await requestOpenAiCritique(
        {
          apiKey: cleanKey,
          baseUrl: aiBaseUrl,
          model: aiModel,
        },
        prompt,
        controller.signal
      );

      setLiveCritiqueState((prev) => ({
        ...prev,
        isLoading: false,
        critiqueText: result,
      }));
    } catch (err: any) {
      if (controller.signal.aborted) {
        return;
      }
      setLiveCritiqueState((prev) => ({
        ...prev,
        isLoading: false,
        errorMessage: err?.message || 'Failed to generate live connection critique.',
      }));
    }
  };

  const handleRetryLiveCritique = () => {
    if (lastConnectionCritiqueRef.current) {
      const { newEdge, sourceNode, targetNode, graph } = lastConnectionCritiqueRef.current;
      handleConnectionCreated(newEdge, sourceNode, targetNode, graph);
    }
  };

  // Simulation settings
  const [simulationSettings, setSimulationSettings] = useState<SimulationSettings>({
    isPlaying: false,
    speedMultiplier: 1,
    globalTargetRps: 1500,
    clientRegion: 'global',
    trafficProfile: 'steady',
    networkJitterEnabled: true,
  });

  const simulationEngine = useMemo(() => new SimulationEngine(), []);

  // Simulation metrics state
  const [simulationMetrics, setSimulationMetrics] = useState<SystemMetrics>(() =>
    simulationEngine.runTick(graph, simulationSettings)
  );

  // Keep URL hash updated with new state on modification
  useEffect(() => {
    const compressed = serializeGraphToUrl(graph);
    if (compressed) {
      window.history.replaceState(null, '', `#data=${compressed}`);
    }
  }, [graph]);

  // Simulation Tick Loop
  useEffect(() => {
    const timer = setInterval(() => {
      setSimulationMetrics((prev) =>
        simulationEngine.runTick(graph, simulationSettings, prev)
      );
    }, 350);

    return () => clearInterval(timer);
  }, [graph, simulationSettings, simulationEngine]);

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMac =
        typeof navigator !== 'undefined' &&
        /Mac|iPod|iPhone|iPad/.test(navigator.platform);

      // 1. Command Palette: Ctrl+Space (or Cmd+Space on Mac)
      const isCtrlSpace = (e.ctrlKey || e.metaKey) && e.code === 'Space';
      if (isCtrlSpace) {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
        return;
      }

      // Check if typing inside input / textarea / select / contenteditable
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement ||
        (e.target as HTMLElement)?.isContentEditable
      ) {
        return;
      }

      // 2. Select All: Ctrl+A (Cmd+A on Mac)
      const isSelectAll =
        (isMac ? e.metaKey : e.ctrlKey) && (e.key === 'a' || e.key === 'A');
      if (isSelectAll) {
        e.preventDefault();
        setSelectedNodeIds(graph.nodes.map((n) => n.id));
        setSelectedEdgeId(null);
        return;
      }

      // 3. Undo: Ctrl+Z (Cmd+Z on Mac)
      const isUndo =
        (isMac ? e.metaKey : e.ctrlKey) && !e.shiftKey && (e.key === 'z' || e.key === 'Z');
      if (isUndo) {
        e.preventDefault();
        handleUndo();
        return;
      }

      // 4. Redo: Ctrl+Y (Cmd+Shift+Z on Mac)
      const isRedo =
        (isMac
          ? e.metaKey && e.shiftKey && (e.key === 'z' || e.key === 'Z')
          : e.ctrlKey && (e.key === 'y' || e.key === 'Y'));
      if (isRedo) {
        e.preventDefault();
        handleRedo();
        return;
      }

      // 5. Copy: Ctrl+C (Cmd+C on Mac)
      const isCopy =
        (isMac ? e.metaKey : e.ctrlKey) && (e.key === 'c' || e.key === 'C');
      if (isCopy) {
        if (selectedNodeIds.length > 0) {
          e.preventDefault();
          handleCopy();
        }
        return;
      }

      // 6. Paste: Ctrl+V (Cmd+V on Mac)
      const isPaste =
        (isMac ? e.metaKey : e.ctrlKey) && (e.key === 'v' || e.key === 'V');
      if (isPaste) {
        if (clipboardRef.current && clipboardRef.current.nodes.length > 0) {
          e.preventDefault();
          handlePaste();
        }
        return;
      }

      // 7. Delete: Delete / Backspace
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedNodeIds.length > 0) {
          e.preventDefault();
          handleDeleteSelectedNodes(selectedNodeIds);
        } else if (selectedEdgeId) {
          e.preventDefault();
          handleDeleteEdge(selectedEdgeId);
        }
        return;
      }

      // 8. Tools shortcuts (only when no modifier keys are held)
      if (!e.ctrlKey && !e.metaKey && !e.altKey) {
        if (e.key === 'v' || e.key === 'V') setActiveTool('select');
        if (e.key === 'h' || e.key === 'H') setActiveTool('pan');
        if (e.key === 'c' || e.key === 'C') setActiveTool('wire');
        if (e.key === 'p' || e.key === 'P') setActiveTool('pencil');
        if (e.key === 's' || e.key === 'S') setActiveTool('sticky');
        if (e.key === 't' || e.key === 'T') setActiveTool('text');
        if (e.key === ' ' && !e.repeat) {
          setActiveTool('pan');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [graph, selectedNodeIds, selectedEdgeId]);

  // Create a brand new blank architecture from scratch (e.g. explicitly starting over)
  const handleCreateFreshBlankArchitecture = () => {
    const blankDiscussion: SystemDiscussion = {
      isPreloaded: false,
      summary: '',
      overviewRecommendation: '',
      pros: [],
      cons: [],
      tradeoffs: [],
      staffQnA: [],
      capacityEstimation: {
        dailyActiveUsers: '',
        readWriteRatio: '',
        peakRps: '',
        storagePerYear: '',
        bandwidthRequirement: '',
      },
    };

    const blankGraph: SystemDesignGraph = {
      nodes: [],
      edges: [],
      annotations: [],
      meta: {
        name: 'New Architecture',
        description: 'Blank system design workspace',
        version: 1,
        updatedAt: new Date().toISOString(),
        templateId: 'new',
      },
      discussion: blankDiscussion,
    };

    customArchitectureRef.current = blankGraph;
    try {
      localStorage.setItem(CUSTOM_ARCH_STORAGE_KEY, JSON.stringify(blankGraph));
    } catch (e) {
      // ignore
    }

    pushGraphChange(() => blankGraph);
    setSelectedNodeIds([]);
    setSelectedEdgeId(null);
    setLastPlacedNodeId(null);
    simulationEngine.reset();
    setSimulationMetrics(simulationEngine.runTick(blankGraph, simulationSettings));
    setIsDiscussionOpen(true);
  };

  // Restore previously in-progress custom architecture or initialize a fresh blank one
  const handleRestoreOrCreateNewArchitecture = () => {
    let savedArch = customArchitectureRef.current;
    if (!savedArch) {
      try {
        const stored = localStorage.getItem(CUSTOM_ARCH_STORAGE_KEY);
        if (stored) {
          savedArch = JSON.parse(stored);
          customArchitectureRef.current = savedArch;
        }
      } catch (e) {
        console.warn('Failed to parse saved custom architecture from localStorage', e);
      }
    }

    if (savedArch) {
      const restoredGraph: SystemDesignGraph = {
        ...savedArch,
        meta: {
          ...savedArch.meta,
          templateId: 'new',
        },
        discussion: savedArch.discussion
          ? {
              ...savedArch.discussion,
              isPreloaded: false,
            }
          : {
              isPreloaded: false,
              summary: '',
              overviewRecommendation: '',
              pros: [],
              cons: [],
              tradeoffs: [],
              staffQnA: [],
              capacityEstimation: {},
            },
      };

      pushGraphChange(() => restoredGraph);
      setSelectedNodeIds([]);
      setSelectedEdgeId(null);
      setLastPlacedNodeId(null);
      simulationEngine.reset();
      setSimulationMetrics(simulationEngine.runTick(restoredGraph, simulationSettings));
      setIsDiscussionOpen(true);
    } else {
      handleCreateFreshBlankArchitecture();
    }
  };

  // Load Template (with automatic preservation of in-progress custom architecture)
  const handleLoadTemplate = (templateId: string) => {
    // 1. If currently on custom architecture ('new'), snapshot it before switching
    if (graph.meta.templateId === 'new') {
      customArchitectureRef.current = graph;
      try {
        localStorage.setItem(CUSTOM_ARCH_STORAGE_KEY, JSON.stringify(graph));
      } catch (e) {
        // ignore
      }
    }

    // 2. If switching to 'new', restore the in-progress architecture!
    if (templateId === 'new' || templateId === 'new-architecture') {
      handleRestoreOrCreateNewArchitecture();
      return;
    }

    // 3. Otherwise, load the requested template (Twitter, Netflix, Uber, etc.)
    const tmpl = ARCHITECTURE_TEMPLATES.find((t) => t.id === templateId);
    if (tmpl) {
      pushGraphChange(() => ({
        ...tmpl.graph,
        meta: {
          ...tmpl.graph.meta,
          templateId: tmpl.id,
        },
        discussion: tmpl.discussion,
      }));
      setSelectedNodeIds([]);
      setSelectedEdgeId(null);
      setLastPlacedNodeId(null);
      simulationEngine.reset();
      setIsDiscussionOpen(true);
    }
  };

  // Import Architecture Graph (from Verilog HDL or JSON file)
  const handleImportGraph = (importedGraph: SystemDesignGraph) => {
    pushGraphChange(() => importedGraph);
    setSelectedNodeIds([]);
    setSelectedEdgeId(null);
    setLastPlacedNodeId(null);
    simulationEngine.reset();
    setSimulationMetrics(simulationEngine.runTick(importedGraph, simulationSettings));
    if (importedGraph.discussion) {
      setIsDiscussionOpen(true);
    }
  };

  // Global Drag & Drop Architecture File Support
  useEffect(() => {
    const handleDragOver = (e: DragEvent) => {
      e.preventDefault();
      if (e.dataTransfer?.types?.includes('Files')) {
        setIsWindowDraggingFile(true);
      }
    };

    const handleDragLeave = (e: DragEvent) => {
      e.preventDefault();
      if (e.relatedTarget === null) {
        setIsWindowDraggingFile(false);
      }
    };

    const handleDrop = (e: DragEvent) => {
      e.preventDefault();
      setIsWindowDraggingFile(false);
      const file = e.dataTransfer?.files?.[0];
      if (file) {
        const name = file.name.toLowerCase();
        if (
          name.endsWith('.v') ||
          name.endsWith('.hdl') ||
          name.endsWith('.sv') ||
          name.endsWith('.json') ||
          name.endsWith('.txt')
        ) {
          const reader = new FileReader();
          reader.onload = (event) => {
            const text = event.target?.result as string;
            if (text) {
              setImportInitialContent(text);
              setImportInitialFileName(file.name);
              setIsImportModalOpen(true);
            }
          };
          reader.readAsText(file);
        }
      }
    };

    window.addEventListener('dragover', handleDragOver);
    window.addEventListener('dragleave', handleDragLeave);
    window.addEventListener('drop', handleDrop);

    return () => {
      window.removeEventListener('dragover', handleDragOver);
      window.removeEventListener('dragleave', handleDragLeave);
      window.removeEventListener('drop', handleDrop);
    };
  }, []);

  // Update Discussion (when customized or forked)
  const handleUpdateDiscussion = (updatedDiscussion: SystemDiscussion) => {
    setGraph((prev) => ({
      ...prev,
      discussion: updatedDiscussion,
    }));
  };

  // Add Component from Palette or Command Palette (placed on the right side of the most recently placed component)
  const handleAddComponent = (item: ComponentDefinition, customLabel?: string) => {
    const type = item.type;
    const label = customLabel || item.label;

    // Find the most recently placed component or fallback to the last node
    let refNode: SystemNode | null = null;
    if (lastPlacedNodeId) {
      refNode = graph.nodes.find((n) => n.id === lastPlacedNodeId) || null;
    }
    if (!refNode && graph.nodes.length > 0) {
      refNode = graph.nodes[graph.nodes.length - 1];
    }

    const nodeWidth =
      item.type === 'generic'
        ? 110
        : item.defaultWidth || (type === 'database' || type === 'vector_db' ? 140 : 150);
    const nodeHeight = item.type === 'generic' ? 110 : item.defaultHeight || 75;

    let newX = 350;
    let newY = 220;

    if (refNode) {
      newX = refNode.x + refNode.width + 45;
      newY = refNode.y;
      if (newX > 1650) {
        newX = 250;
        newY = refNode.y + refNode.height + 60;
      }
    }

    const newNodeId = `node_${Date.now()}`;
    const newNode: SystemNode = {
      id: newNodeId,
      type,
      x: Math.round(newX),
      y: Math.round(newY),
      width: nodeWidth,
      height: nodeHeight,
      config: {
        label,
        type,
        region: 'us-east-1',
        replicas: type === 'client' ? 1 : 2,
        maxConcurrencyPerReplica: type === 'llm_server' ? 32 : 1000,
        baseLatencyMs: type === 'llm_server' ? 200 : 15,
        cacheHitRatio: type === 'cache' || type === 'cdn_edge' ? 0.8 : undefined,
        modelName: type === 'llm_server' ? 'Amazon-Bedrock-Claude-3' : undefined,
        ttftMs: type === 'llm_server' ? 220 : undefined,
        tokensPerSec: type === 'llm_server' ? 45 : undefined,
        ...(item.defaultConfig || {}),
      },
    };

    pushGraphChange((prev) => ({
      ...prev,
      nodes: [...prev.nodes, newNode],
    }));

    setLastPlacedNodeId(newNodeId);
    setSelectedNodeIds([newNodeId]);
    setSelectedEdgeId(null);
    setIsPaletteOpen(false);
  };

  // Delete Selected Nodes
  const handleDeleteSelectedNodes = (nodeIds: string[]) => {
    const idSet = new Set(nodeIds);
    pushGraphChange((prev) => ({
      ...prev,
      nodes: prev.nodes.filter((n) => !idSet.has(n.id)),
      edges: prev.edges.filter(
        (e) => !idSet.has(e.fromNodeId) && !idSet.has(e.toNodeId)
      ),
    }));
    setSelectedNodeIds([]);
    if (lastPlacedNodeId && idSet.has(lastPlacedNodeId)) {
      setLastPlacedNodeId(null);
    }
  };

  // Delete Single Node
  const handleDeleteNode = (nodeId: string) => {
    handleDeleteSelectedNodes([nodeId]);
  };

  // Delete Edge
  const handleDeleteEdge = (edgeId: string) => {
    pushGraphChange((prev) => ({
      ...prev,
      edges: prev.edges.filter((e) => e.id !== edgeId),
    }));
    if (selectedEdgeId === edgeId) setSelectedEdgeId(null);
  };

  // Duplicate Node
  const handleDuplicateNode = (node: SystemNode) => {
    const dupNode: SystemNode = {
      ...node,
      id: `node_${Date.now()}`,
      x: node.x + 30,
      y: node.y + 30,
      config: {
        ...node.config,
        label: `${node.config.label} (Copy)`,
      },
    };
    pushGraphChange((prev) => ({
      ...prev,
      nodes: [...prev.nodes, dupNode],
    }));
    setSelectedNodeIds([dupNode.id]);
    setLastPlacedNodeId(dupNode.id);
  };

  // Update Node with debounced snapshot for undo
  const handleUpdateNode = (updated: SystemNode) => {
    if (!pendingHistorySnapshotRef.current) {
      pendingHistorySnapshotRef.current = JSON.parse(JSON.stringify(graph));
    }
    if (historyDebounceTimerRef.current) {
      window.clearTimeout(historyDebounceTimerRef.current);
    }
    historyDebounceTimerRef.current = window.setTimeout(() => {
      if (pendingHistorySnapshotRef.current) {
        historyRef.current.past.push(pendingHistorySnapshotRef.current);
        if (historyRef.current.past.length > 50) historyRef.current.past.shift();
        historyRef.current.future = [];
        updateHistoryState();
        pendingHistorySnapshotRef.current = null;
      }
    }, 400);

    setGraph((prev) => ({
      ...prev,
      nodes: prev.nodes.map((n) => (n.id === updated.id ? updated : n)),
    }));
  };

  // Update Edge
  const handleUpdateEdge = (updated: ConnectionEdge) => {
    pushGraphChange((prev) => ({
      ...prev,
      edges: prev.edges.map((e) => (e.id === updated.id ? updated : e)),
    }));
  };

  // Export Canvas Screenshot
  const handleExportPng = () => {
    const svgElem = document.querySelector('svg');
    if (svgElem) {
      exportCanvasAsPng(
        svgElem,
        `${graph.meta.name.replace(/\s+/g, '_')}_architecture.png`,
        theme === 'dark'
      );
    }
  };

  const lintIssues = useMemo(() => lintArchitecture(graph), [graph]);
  const selectedNode =
    selectedNodeIds.length === 1
      ? graph.nodes.find((n) => n.id === selectedNodeIds[0]) || null
      : null;
  const selectedNodes = graph.nodes.filter((n) => selectedNodeIds.includes(n.id));
  const selectedEdge = graph.edges.find((e) => e.id === selectedEdgeId) || null;

  return (
    <div className="flex flex-col w-screen h-screen overflow-hidden bg-[#fbfbfa] dark:bg-[#0f0f11] text-gray-900 dark:text-zinc-100 font-sans transition-colors duration-150">
      {/* Top Navbar */}
      <TopBar
        simulationSettings={simulationSettings}
        onUpdateSettings={setSimulationSettings}
        onResetSimulation={() => {
          simulationEngine.reset();
          setSimulationMetrics(simulationEngine.runTick(graph, simulationSettings));
        }}
        graph={graph}
        onLoadTemplate={handleLoadTemplate}
        onOpenDslModal={() => setIsDslModalOpen(true)}
        onOpenImportModal={() => setIsImportModalOpen(true)}
        onOpenAiCritique={() => setIsAiCritiqueOpen(true)}
        onOpenSettings={() => setIsSettingsModalOpen(true)}
        onExportPng={handleExportPng}
        onShareLink={() => setIsShareModalOpen(true)}
        issueCount={lintIssues.length}
        theme={theme}
        onToggleTheme={handleToggleTheme}
        isDiscussionOpen={isDiscussionOpen}
        onToggleDiscussion={() => setIsDiscussionOpen((prev) => !prev)}
        hasApiKey={apiKey.trim().length > 0}
        liveCritiqueEnabled={liveCritiqueEnabled}
        onToggleLiveCritique={handleToggleLiveCritique}
      />

      {/* Main Canvas Area */}
      <main className="relative flex-1 w-full h-full overflow-hidden">
        {/* Floating Toolbox */}
        <Toolbox
          activeTool={activeTool}
          onSelectTool={setActiveTool}
          onTogglePalette={() => setIsPaletteOpen((prev) => !prev)}
          isPaletteOpen={isPaletteOpen}
          onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
          onDeleteSelected={() => {
            if (selectedNodeIds.length > 0) handleDeleteSelectedNodes(selectedNodeIds);
            else if (selectedEdgeId) handleDeleteEdge(selectedEdgeId);
          }}
          canDelete={selectedNodeIds.length > 0 || !!selectedEdgeId}
          selectedCount={selectedNodeIds.length}
          onUndo={handleUndo}
          canUndo={canUndo}
          onRedo={handleRedo}
          canRedo={canRedo}
        />

        {/* Component Library Drawer */}
        <ComponentPalette
          isOpen={isPaletteOpen}
          onClose={() => setIsPaletteOpen(false)}
          onAddComponent={handleAddComponent}
        />

        {/* Node & Wire Inspector Drawer */}
        <Inspector
          selectedNode={selectedNode}
          selectedNodes={selectedNodes}
          selectedEdge={selectedEdge}
          onUpdateNode={handleUpdateNode}
          onUpdateEdge={handleUpdateEdge}
          onDeleteNode={handleDeleteNode}
          onDeleteSelectedNodes={handleDeleteSelectedNodes}
          onDeleteEdge={handleDeleteEdge}
          onDuplicateNode={handleDuplicateNode}
          onCopy={handleCopy}
          onClose={() => {
            setSelectedNodeIds([]);
            setSelectedEdgeId(null);
          }}
          simulationMetrics={simulationMetrics}
          isDiscussionOpen={isDiscussionOpen}
        />

        {/* Staff Architecture Review & Discussion Drawer */}
        <DiscussionPanel
          isOpen={isDiscussionOpen}
          onClose={() => setIsDiscussionOpen(false)}
          discussion={
            graph.discussion ||
            (graph.meta.templateId === 'new'
              ? {
                  isPreloaded: false,
                  summary: '',
                  overviewRecommendation: '',
                  pros: [],
                  cons: [],
                  tradeoffs: [],
                  staffQnA: [],
                  capacityEstimation: {},
                }
              : ARCHITECTURE_TEMPLATES.find((t) => t.id === graph.meta.templateId)?.discussion ||
                ARCHITECTURE_TEMPLATES[0].discussion)
          }
          systemName={graph.meta.name}
          templateId={graph.meta.templateId}
          onUpdateDiscussion={handleUpdateDiscussion}
          onUpdateSystemName={(newName) =>
            setGraph((prev) => ({
              ...prev,
              meta: {
                ...prev.meta,
                name: newName,
              },
            }))
          }
          onResetToTemplate={
            graph.meta.templateId && graph.meta.templateId !== 'new' && graph.meta.templateId !== 'new-architecture'
              ? () => {
                  const tmpl = ARCHITECTURE_TEMPLATES.find((t) => t.id === graph.meta.templateId);
                  if (tmpl) {
                    handleUpdateDiscussion(tmpl.discussion);
                  }
                }
              : () => handleCreateFreshBlankArchitecture()
          }
        />

        {/* Real-time Telemetry Overlay */}
        <SimulationOverlay
          metrics={simulationMetrics}
          settings={simulationSettings}
          onSelectNode={(nodeId) => {
            setSelectedNodeIds([nodeId]);
            setSelectedEdgeId(null);
          }}
        />

        {/* Canvas */}
        <RoughCanvas
          graph={graph}
          onUpdateGraph={setGraph}
          selectedNodeIds={selectedNodeIds}
          selectedNodeId={selectedNodeIds.length === 1 ? selectedNodeIds[0] : null}
          onSelectNodes={(ids) => setSelectedNodeIds(ids)}
          onSelectNode={(nodeId) => setSelectedNodeIds(nodeId ? [nodeId] : [])}
          selectedEdgeId={selectedEdgeId}
          onSelectEdge={setSelectedEdgeId}
          activeTool={activeTool}
          simulationMetrics={simulationMetrics}
          simulationSettings={simulationSettings}
          isDark={theme === 'dark'}
          onConnectionCreated={handleConnectionCreated}
          onDragStart={() => {
            dragStartGraphRef.current = JSON.parse(JSON.stringify(graph));
          }}
          onDragEnd={(didMove) => {
            if (didMove && dragStartGraphRef.current) {
              historyRef.current.past.push(dragStartGraphRef.current);
              if (historyRef.current.past.length > 50) historyRef.current.past.shift();
              historyRef.current.future = [];
              updateHistoryState();
              dragStartGraphRef.current = null;
            }
          }}
        />

        {/* Bottom Ko-fi Donation Link */}
        <div
          className={`absolute bottom-6 z-20 pointer-events-auto transition-all duration-200 -translate-x-1/2 ${
            isDiscussionOpen
              ? 'left-1/2 sm:left-[calc((100%-460px)/2)] md:left-[calc((100%-500px)/2)] lg:left-[calc((100%-520px)/2)]'
              : 'left-1/2'
          }`}
        >
          <a
            href="https://ko-fi.com/veydh"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/95 dark:bg-zinc-900/95 hover:bg-amber-50 dark:hover:bg-amber-950/50 border border-gray-200 dark:border-zinc-800 hover:border-amber-400 dark:hover:border-amber-500 text-gray-700 dark:text-zinc-300 hover:text-amber-700 dark:hover:text-amber-400 shadow-md backdrop-blur text-xs font-medium transition-all group select-none"
            title="Support this project on Ko-fi"
          >
            <Coffee className="w-3.5 h-3.5 text-amber-500 group-hover:scale-110 transition-transform duration-150" />
            <span>Support on Ko-fi</span>
            <ExternalLink className="w-3 h-3 text-gray-400 dark:text-zinc-500 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors" />
          </a>
        </div>
      </main>

      {/* Lazy-loaded Modals */}
      <React.Suspense fallback={null}>
        {isCommandPaletteOpen && (
          <CommandPaletteModal
            isOpen={isCommandPaletteOpen}
            onClose={() => setIsCommandPaletteOpen(false)}
            onSelectComponent={handleAddComponent}
          />
        )}

        {isDslModalOpen && (
          <DslModal
            isOpen={isDslModalOpen}
            onClose={() => setIsDslModalOpen(false)}
            graph={graph}
            onOpenImport={() => setIsImportModalOpen(true)}
          />
        )}

        {isAiCritiqueOpen && (
          <AiCritiqueModal
            isOpen={isAiCritiqueOpen}
            onClose={() => setIsAiCritiqueOpen(false)}
            graph={graph}
            metrics={simulationMetrics}
          />
        )}

        {isSettingsModalOpen && (
          <SettingsModal
            isOpen={isSettingsModalOpen}
            onClose={() => setIsSettingsModalOpen(false)}
            baseUrl={aiBaseUrl}
            onBaseUrlChange={handleBaseUrlChange}
            apiKey={apiKey}
            onApiKeyChange={handleApiKeyChange}
            model={aiModel}
            onModelChange={handleModelChange}
            liveCritiqueEnabled={liveCritiqueEnabled}
            onToggleLiveCritique={handleToggleLiveCritique}
          />
        )}

        {isShareModalOpen && (
          <ShareModal
            isOpen={isShareModalOpen}
            onClose={() => setIsShareModalOpen(false)}
            graph={graph}
            onOpenImport={() => setIsImportModalOpen(true)}
          />
        )}

        {isImportModalOpen && (
          <ImportModal
            isOpen={isImportModalOpen}
            onClose={() => {
              setIsImportModalOpen(false);
              setImportInitialContent('');
              setImportInitialFileName('');
            }}
            onImportGraph={handleImportGraph}
            initialFileContent={importInitialContent}
            initialFileName={importInitialFileName}
          />
        )}
      </React.Suspense>

      <LiveCritiquePanel
        state={liveCritiqueState}
        onClose={() => setLiveCritiqueState((prev) => ({ ...prev, isOpen: false }))}
        onToggleMinimize={() =>
          setLiveCritiqueState((prev) => ({ ...prev, isMinimized: !prev.isMinimized }))
        }
        onOpenFullCritique={() => {
          setLiveCritiqueState((prev) => ({ ...prev, isOpen: false }));
          setIsAiCritiqueOpen(true);
        }}
        onRetry={handleRetryLiveCritique}
      />

      {/* Global Drag & Drop File Indicator */}
      {isWindowDraggingFile && (
        <div className="fixed inset-0 z-50 pointer-events-none bg-indigo-950/80 backdrop-blur-xs border-4 border-dashed border-indigo-400 flex flex-col items-center justify-center animate-in fade-in duration-100">
          <div className="p-4 bg-indigo-600 rounded-2xl text-white shadow-2xl mb-3 animate-bounce">
            <Upload className="w-10 h-10" />
          </div>
          <h2 className="text-xl font-bold text-white font-sans">
            Drop Architecture File Here
          </h2>
          <p className="text-sm text-indigo-200 font-mono mt-1">
            Import Verilog HDL (.v, .hdl) or JSON IR (.json)
          </p>
        </div>
      )}
    </div>
  );
};

export default App;
