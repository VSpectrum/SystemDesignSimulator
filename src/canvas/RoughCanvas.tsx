import React, { useRef, useEffect, useState, useMemo } from 'react';
import rough from 'roughjs';
import {
  SystemDesignGraph,
  SystemNode,
  ConnectionEdge,
  FreehandAnnotation,
  SystemMetrics,
  SimulationSettings,
  ComponentType,
} from '../types/system';
import {
  renderSketchyNode,
  renderSketchyArrow,
  renderSketchySticky,
} from './roughRenderer';
import {
  Cpu,
  Database,
  Cloud,
  Globe,
  HardDrive,
  Layers,
  Server,
  Zap,
  Radio,
  FileCode,
  Shield,
  Bot,
  Skull,
  AlertTriangle,
  Box,
} from 'lucide-react';

interface RoughCanvasProps {
  graph: SystemDesignGraph;
  onUpdateGraph: (newGraph: SystemDesignGraph) => void;
  selectedNodeIds?: string[];
  selectedNodeId?: string | null;
  onSelectNodes?: (nodeIds: string[]) => void;
  onSelectNode?: (nodeId: string | null) => void;
  selectedEdgeId: string | null;
  onSelectEdge: (edgeId: string | null) => void;
  activeTool: 'select' | 'pan' | 'wire' | 'pencil' | 'sticky' | 'text' | 'eraser';
  simulationMetrics: SystemMetrics;
  simulationSettings: SimulationSettings;
  isDark: boolean;
  onConnectionCreated?: (
    newEdge: ConnectionEdge,
    sourceNode: SystemNode,
    targetNode: SystemNode,
    updatedGraph: SystemDesignGraph
  ) => void;
  onDragStart?: () => void;
  onDragEnd?: (didMove: boolean) => void;
}

export const RoughCanvas: React.FC<RoughCanvasProps> = ({
  graph,
  onUpdateGraph,
  selectedNodeIds,
  selectedNodeId,
  onSelectNodes,
  onSelectNode,
  selectedEdgeId,
  onSelectEdge,
  activeTool,
  simulationMetrics,
  simulationSettings,
  isDark,
  onConnectionCreated,
  onDragStart,
  onDragEnd,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const sketchyBgRef = useRef<SVGGElement>(null);

  // Viewport Pan & Zoom
  const [pan, setPan] = useState({ x: 40, y: 30 });
  const [zoom, setZoom] = useState(1);
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });

  // Multi-Selection Helper
  const activeSelectedNodeIds = useMemo(() => {
    if (selectedNodeIds !== undefined) return selectedNodeIds;
    return selectedNodeId ? [selectedNodeId] : [];
  }, [selectedNodeIds, selectedNodeId]);

  const dragStartPosRef = useRef<{ x: number; y: number } | null>(null);

  const handleSelectNodeInternal = (nodeId: string | null, isMulti = false) => {
    if (nodeId === null) {
      if (onSelectNodes) onSelectNodes([]);
      if (onSelectNode) onSelectNode(null);
      return;
    }
    if (isMulti) {
      const exists = activeSelectedNodeIds.includes(nodeId);
      const updated = exists
        ? activeSelectedNodeIds.filter((id: string) => id !== nodeId)
        : [...activeSelectedNodeIds, nodeId];
      if (onSelectNodes) onSelectNodes(updated);
      if (onSelectNode) onSelectNode(updated.length === 1 ? updated[0] : null);
    } else {
      if (onSelectNodes) onSelectNodes([nodeId]);
      if (onSelectNode) onSelectNode(nodeId);
    }
  };

  // Dragging Nodes
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  // Connecting Wires
  const [wireSourceId, setWireSourceId] = useState<string | null>(null);
  const [wireTempEnd, setWireTempEnd] = useState<{ x: number; y: number } | null>(null);

  // Pencil Freehand drawing
  const [currentPencilPoints, setCurrentPencilPoints] = useState<Array<{ x: number; y: number }>>([]);
  const [isDrawingPencil, setIsDrawingPencil] = useState(false);

  // Packet Animation tick
  const [animTime, setAnimTime] = useState(0);

  useEffect(() => {
    let animId: number;
    const loop = (timestamp: number) => {
      setAnimTime(timestamp);
      animId = requestAnimationFrame(loop);
    };
    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, []);

  // Convert screen coords to canvas coords
  const screenToCanvas = (clientX: number, clientY: number) => {
    if (!containerRef.current) return { x: 0, y: 0 };
    const rect = containerRef.current.getBoundingClientRect();
    const x = (clientX - rect.left - pan.x) / zoom;
    const y = (clientY - rect.top - pan.y) / zoom;
    return { x, y };
  };

  // Re-render Rough.js static vector shapes whenever graph geometry or theme changes
  useEffect(() => {
    if (!svgRef.current || !sketchyBgRef.current) return;
    const rc = rough.svg(svgRef.current);
    const bgGroup = sketchyBgRef.current;

    while (bgGroup.firstChild) {
      bgGroup.removeChild(bgGroup.firstChild);
    }

    // 1. Draw Sticky notes and annotations background
    graph.annotations.forEach((ann) => {
      if (ann.type === 'sticky') {
        const stickyElem = renderSketchySticky(
          rc,
          ann.x,
          ann.y,
          ann.width || 140,
          ann.height || 90,
          ann.color || '#fef08a',
          isDark
        );
        bgGroup.appendChild(stickyElem);
      }
    });

    // 2. Draw Connection Wires
    graph.edges.forEach((edge) => {
      const fromNode = graph.nodes.find((n) => n.id === edge.fromNodeId);
      const toNode = graph.nodes.find((n) => n.id === edge.toNodeId);
      if (!fromNode || !toNode) return;

      const x1 = fromNode.x + fromNode.width;
      const y1 = fromNode.y + fromNode.height / 2;
      const x2 = toNode.x;
      const y2 = toNode.y + toNode.height / 2;

      const isHot =
        simulationMetrics.edgeMetrics[edge.id]?.latencyMs > 80 ||
        simulationMetrics.nodeMetrics[toNode.id]?.status === 'critical';

      const arrowElem = renderSketchyArrow(
        rc,
        x1,
        y1,
        x2,
        y2,
        isHot,
        edge.isRedundant,
        isDark
      );
      arrowElem.setAttribute('data-edge-id', edge.id);
      bgGroup.appendChild(arrowElem);
    });

    // 3. Draw Nodes (rough geometry)
    graph.nodes.forEach((node) => {
      const isSelected = activeSelectedNodeIds.includes(node.id);
      const status = simulationMetrics.nodeMetrics[node.id]?.status || 'healthy';
      const nodeElem = renderSketchyNode(rc, node, isSelected, status, isDark);
      nodeElem.setAttribute('data-node-id', node.id);
      bgGroup.appendChild(nodeElem);
    });
  }, [graph, activeSelectedNodeIds, simulationMetrics, isDark]);

  // Handle Wheel Zoom
  const handleWheel = (e: React.WheelEvent) => {
    // Check if the wheel event originated from or is over a component, annotation, or interactive overlay
    const target = e.target as HTMLElement | null;
    const isOverComponent = Boolean(
      target?.closest(
        '[data-component], [data-node-id], [data-annotation-id], textarea, input, select, button, .pointer-events-auto'
      )
    );

    // Zoom out/in should only happen when NOT hovering over a component (unless holding Ctrl/Cmd for intentional pinch-to-zoom)
    if (isOverComponent && !e.ctrlKey && !e.metaKey) {
      return;
    }

    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.08 : 0.92;
    const newZoom = Math.min(2.5, Math.max(0.3, zoom * zoomFactor));

    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    setPan({
      x: mouseX - (mouseX - pan.x) * (newZoom / zoom),
      y: mouseY - (mouseY - pan.y) * (newZoom / zoom),
    });
    setZoom(newZoom);
  };

  // Canvas Mouse Down
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 1 || activeTool === 'pan' || e.altKey) {
      setIsPanning(true);
      setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
      return;
    }

    const { x, y } = screenToCanvas(e.clientX, e.clientY);

    if (activeTool === 'pencil') {
      setIsDrawingPencil(true);
      setCurrentPencilPoints([{ x, y }]);
      return;
    }

    if (activeTool === 'sticky') {
      const newSticky: FreehandAnnotation = {
        id: `sticky_${Date.now()}`,
        type: 'sticky',
        x: Math.round(x - 60),
        y: Math.round(y - 40),
        width: 140,
        height: 90,
        text: 'Architecture note...',
        color: isDark ? '#27272a' : '#fef08a',
      };
      onUpdateGraph({
        ...graph,
        annotations: [...graph.annotations, newSticky],
      });
      return;
    }

    if (activeTool === 'text') {
      const newText: FreehandAnnotation = {
        id: `text_${Date.now()}`,
        type: 'text',
        x: Math.round(x),
        y: Math.round(y),
        text: 'Architecture Label',
        fontSize: 16,
      };
      onUpdateGraph({
        ...graph,
        annotations: [...graph.annotations, newText],
      });
      return;
    }

    // Check if clicked on a node
    const clickedNode = [...graph.nodes].reverse().find(
      (n) => x >= n.x && x <= n.x + n.width && y >= n.y && y <= n.y + n.height
    );

    if (clickedNode) {
      if (activeTool === 'wire') {
        setWireSourceId(clickedNode.id);
        setWireTempEnd({ x, y });
      } else {
        const isMultiKey = e.shiftKey || e.ctrlKey || e.metaKey;
        handleSelectNodeInternal(clickedNode.id, isMultiKey);
        onSelectEdge(null);
        setDraggingNodeId(clickedNode.id);
        dragStartPosRef.current = { x: clickedNode.x, y: clickedNode.y };
        setDragOffset({ x: x - clickedNode.x, y: y - clickedNode.y });
        onDragStart?.();
      }
      return;
    }

    handleSelectNodeInternal(null);
    onSelectEdge(null);

    setIsPanning(true);
    setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning) {
      setPan({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y,
      });
      return;
    }

    const { x, y } = screenToCanvas(e.clientX, e.clientY);

    if (isDrawingPencil) {
      setCurrentPencilPoints((prev) => [...prev, { x, y }]);
      return;
    }

    if (draggingNodeId) {
      const updatedNodes = graph.nodes.map((n) => {
        if (n.id === draggingNodeId) {
          return {
            ...n,
            x: Math.round(x - dragOffset.x),
            y: Math.round(y - dragOffset.y),
          };
        }
        return n;
      });
      onUpdateGraph({
        ...graph,
        nodes: updatedNodes,
      });
      return;
    }

    if (wireSourceId) {
      setWireTempEnd({ x, y });
    }
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    if (isPanning) {
      setIsPanning(false);
    }

    if (isDrawingPencil && currentPencilPoints.length > 1) {
      setIsDrawingPencil(false);
      const newPencil: FreehandAnnotation = {
        id: `pencil_${Date.now()}`,
        type: 'pencil',
        x: currentPencilPoints[0].x,
        y: currentPencilPoints[0].y,
        points: currentPencilPoints,
        color: isDark ? '#e2e8f0' : '#374151',
      };
      onUpdateGraph({
        ...graph,
        annotations: [...graph.annotations, newPencil],
      });
      setCurrentPencilPoints([]);
    }

    if (draggingNodeId) {
      const movedNode = graph.nodes.find((n) => n.id === draggingNodeId);
      const didMove =
        movedNode &&
        dragStartPosRef.current &&
        (movedNode.x !== dragStartPosRef.current.x || movedNode.y !== dragStartPosRef.current.y);
      if (didMove && onDragEnd) {
        onDragEnd(true);
      }
      setDraggingNodeId(null);
      dragStartPosRef.current = null;
    }

    if (wireSourceId) {
      const { x, y } = screenToCanvas(e.clientX, e.clientY);
      const targetNode = graph.nodes.find(
        (n) =>
          n.id !== wireSourceId &&
          x >= n.x &&
          x <= n.x + n.width &&
          y >= n.y &&
          y <= n.y + n.height
      );

      if (targetNode) {
        const sourceNode = graph.nodes.find((n) => n.id === wireSourceId);
        const newEdge: ConnectionEdge = {
          id: `edge_${Date.now()}`,
          fromNodeId: wireSourceId,
          toNodeId: targetNode.id,
          protocol: 'HTTP',
          baseNetworkLatencyMs: 5,
          weight: 100,
        };
        const updatedGraph: SystemDesignGraph = {
          ...graph,
          edges: [...graph.edges, newEdge],
        };
        onUpdateGraph(updatedGraph);
        if (onConnectionCreated && sourceNode) {
          onConnectionCreated(newEdge, sourceNode, targetNode, updatedGraph);
        }
      }

      setWireSourceId(null);
      setWireTempEnd(null);
    }
  };

  // Node Icon Helper
  const getNodeIcon = (type: ComponentType) => {
    switch (type) {
      case 'generic':
        return <Box className="w-4 h-4 text-slate-600 dark:text-zinc-400" />;
      case 'llm_server':
        return <Bot className="w-4 h-4 text-purple-500 dark:text-purple-400" />;
      case 'rag_pipeline':
        return <Zap className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />;
      case 'mcp_server':
        return <FileCode className="w-4 h-4 text-pink-500 dark:text-pink-400" />;
      case 'vector_db':
        return <HardDrive className="w-4 h-4 text-blue-500 dark:text-blue-400" />;
      case 'database':
        return <Database className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />;
      case 'cache':
        return <Zap className="w-4 h-4 text-red-500 dark:text-red-400" />;
      case 'cdn_edge':
        return <Cloud className="w-4 h-4 text-purple-400" />;
      case 'api_gateway':
        return <Shield className="w-4 h-4 text-amber-500 dark:text-amber-400" />;
      case 'load_balancer':
        return <Radio className="w-4 h-4 text-orange-500 dark:text-orange-400" />;
      case 'client':
        return <Globe className="w-4 h-4 text-sky-500 dark:text-sky-400" />;
      default:
        return <Server className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />;
    }
  };

  // Chaos kill toggle
  const handleToggleKill = (e: React.MouseEvent, node: SystemNode) => {
    e.stopPropagation();
    const updated = graph.nodes.map((n) => {
      if (n.id === node.id) {
        return {
          ...n,
          config: {
            ...n.config,
            isKilled: !n.config.isKilled,
          },
        };
      }
      return n;
    });
    onUpdateGraph({ ...graph, nodes: updated });
  };

  const gridDotColor = isDark ? '#27272a' : '#e5e7eb';
  const bgColor = isDark ? '#0f0f11' : '#fbfbfa';

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full overflow-hidden select-none cursor-crosshair transition-colors duration-150"
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      style={{
        backgroundColor: bgColor,
        backgroundImage: `radial-gradient(${gridDotColor} 1.5px, transparent 1.5px)`,
        backgroundSize: `${24 * zoom}px ${24 * zoom}px`,
        backgroundPosition: `${pan.x}px ${pan.y}px`,
      }}
    >
      <svg
        ref={svgRef}
        className="w-full h-full pointer-events-none"
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transformOrigin: '0 0',
        }}
      >
        <g ref={sketchyBgRef} />

        {/* Temporary Wire */}
        {wireSourceId && wireTempEnd && (() => {
          const fromNode = graph.nodes.find((n) => n.id === wireSourceId);
          if (!fromNode) return null;
          return (
            <line
              x1={fromNode.x + fromNode.width}
              y1={fromNode.y + fromNode.height / 2}
              x2={wireTempEnd.x}
              y2={wireTempEnd.y}
              stroke={isDark ? '#60a5fa' : '#3b82f6'}
              strokeWidth="2.5"
              strokeDasharray="6 4"
            />
          );
        })()}

        {/* Freehand Pencil Active Stroke */}
        {isDrawingPencil && currentPencilPoints.length > 1 && (
          <path
            d={`M ${currentPencilPoints.map((p) => `${p.x} ${p.y}`).join(' L ')}`}
            fill="none"
            stroke={isDark ? '#f1f5f9' : '#1f2937'}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}

        {/* Saved Freehand Pencil Annotations */}
        {graph.annotations
          .filter((a) => a.type === 'pencil' && a.points)
          .map((a) => (
            <path
              key={a.id}
              d={`M ${a.points!.map((p) => `${p.x} ${p.y}`).join(' L ')}`}
              fill="none"
              stroke={a.color || (isDark ? '#cbd5e1' : '#374151')}
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ))}

        {/* Dynamic Simulation Packets */}
        {simulationSettings.isPlaying &&
          graph.edges.map((edge) => {
            const fromNode = graph.nodes.find((n) => n.id === edge.fromNodeId);
            const toNode = graph.nodes.find((n) => n.id === edge.toNodeId);
            if (!fromNode || !toNode) return null;

            const x1 = fromNode.x + fromNode.width;
            const y1 = fromNode.y + fromNode.height / 2;
            const x2 = toNode.x;
            const y2 = toNode.y + toNode.height / 2;

            const edgeMetric = simulationMetrics.edgeMetrics[edge.id];
            const latency = edgeMetric?.latencyMs || 20;
            const speed = Math.max(0.3, Math.min(2.5, 80 / latency));

            return [0, 0.33, 0.66].map((offset, pIdx) => {
              const progress =
                ((animTime * 0.001 * speed * simulationSettings.speedMultiplier + offset) %
                  1);
              const px = x1 + (x2 - x1) * progress;
              const py = y1 + (y2 - y1) * progress;

              const isBottleneck =
                simulationMetrics.nodeMetrics[toNode.id]?.status === 'critical';

              return (
                <circle
                  key={`pkt_${edge.id}_${pIdx}`}
                  cx={px}
                  cy={py}
                  r={isBottleneck ? 4.5 : 3.5}
                  fill={isBottleneck ? '#ef4444' : isDark ? '#38bdf8' : '#3b82f6'}
                  filter={
                    isDark
                      ? 'drop-shadow(0 0 4px rgba(56,189,248,0.9))'
                      : 'drop-shadow(0 0 3px rgba(59,130,246,0.8))'
                  }
                />
              );
            });
          })}
      </svg>

      {/* HTML Interactive Node Overlay: Clean Sans-Serif Typography */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transformOrigin: '0 0',
        }}
      >
        {/* Render Annotations: Sticky Notes & Text */}
        {graph.annotations.map((ann) => {
          if (ann.type === 'sticky') {
            return (
              <div
                key={ann.id}
                data-annotation-id={ann.id}
                data-component="sticky-note"
                className="absolute pointer-events-auto p-3 font-sans text-xs md:text-sm font-medium leading-relaxed cursor-text"
                style={{
                  left: ann.x + 8,
                  top: ann.y + 8,
                  width: (ann.width || 140) - 16,
                  height: (ann.height || 90) - 16,
                }}
                onWheel={(e) => {
                  e.stopPropagation();
                  const textarea = e.currentTarget.querySelector('textarea');
                  if (textarea) {
                    textarea.scrollTop += e.deltaY;
                  }
                }}
              >
                <textarea
                  className="w-full h-full bg-transparent resize-none border-none outline-none font-sans text-xs md:text-sm text-gray-900 dark:text-zinc-100 font-medium leading-snug overflow-y-auto overscroll-contain select-text"
                  defaultValue={ann.text || ''}
                  onWheel={(e) => {
                    e.stopPropagation();
                  }}
                  onChange={(e) => {
                    const text = e.target.value;
                    const updated = graph.annotations.map((a) =>
                      a.id === ann.id ? { ...a, text } : a
                    );
                    onUpdateGraph({ ...graph, annotations: updated });
                  }}
                />
              </div>
            );
          }
          if (ann.type === 'text') {
            return (
              <div
                key={ann.id}
                data-annotation-id={ann.id}
                data-component="text-annotation"
                className="absolute pointer-events-auto font-sans text-base md:text-lg font-bold tracking-tight text-gray-900 dark:text-zinc-100 cursor-text"
                style={{ left: ann.x, top: ann.y }}
                onWheel={(e) => {
                  if (!e.ctrlKey && !e.metaKey) {
                    e.stopPropagation();
                  }
                }}
              >
                <input
                  className="bg-transparent border-none outline-none font-sans text-base md:text-lg font-bold tracking-tight text-gray-900 dark:text-zinc-100"
                  defaultValue={ann.text || ''}
                  onChange={(e) => {
                    const text = e.target.value;
                    const updated = graph.annotations.map((a) =>
                      a.id === ann.id ? { ...a, text } : a
                    );
                    onUpdateGraph({ ...graph, annotations: updated });
                  }}
                />
              </div>
            );
          }
          return null;
        })}

        {/* Nodes Cards Content */}
        {graph.nodes.map((node) => {
          const metrics = simulationMetrics.nodeMetrics[node.id];
          const isSelected = activeSelectedNodeIds.includes(node.id);
          const isKilled = node.config.isKilled;
          const isCritical = metrics?.status === 'critical';
          const isGeneric = node.type === 'generic';

          return (
            <div
              key={node.id}
              data-node-id={node.id}
              data-component="node"
              className={`absolute pointer-events-auto flex flex-col justify-between p-2.5 rounded-lg transition-all ${
                isSelected ? 'ring-2 ring-blue-500 dark:ring-blue-400 bg-blue-500/5 shadow-md' : ''
              }`}
              style={{
                left: node.x,
                top: node.y,
                width: node.width,
                height: node.height,
              }}
              onWheel={(e) => {
                if (!e.ctrlKey && !e.metaKey) {
                  e.stopPropagation();
                }
              }}
              onClick={(e) => {
                e.stopPropagation();
                const isMultiKey = e.shiftKey || e.ctrlKey || e.metaKey;
                handleSelectNodeInternal(node.id, isMultiKey);
                onSelectEdge(null);
              }}
            >
              {/* Header: Icon, Clean Label, Region & Chaos Kill Button */}
              <div className="flex items-center justify-between gap-1.5">
                <div className="flex items-center gap-1.5 overflow-hidden flex-1">
                  <div className="p-1 rounded bg-white/80 dark:bg-zinc-800/80 shadow-xs shrink-0">
                    {getNodeIcon(node.type)}
                  </div>
                  {isGeneric ? (
                    <input
                      type="text"
                      value={node.config.label}
                      placeholder="Type component..."
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => {
                        const newLabel = e.target.value;
                        const updated = graph.nodes.map((n) =>
                          n.id === node.id
                            ? { ...n, config: { ...n.config, label: newLabel } }
                            : n
                        );
                        onUpdateGraph({ ...graph, nodes: updated });
                      }}
                      className="w-full bg-transparent border-b border-dashed border-gray-400 dark:border-zinc-500 font-sans font-semibold text-xs tracking-tight text-gray-900 dark:text-zinc-100 focus:outline-none focus:border-indigo-500"
                    />
                  ) : (
                    <span className="font-sans font-semibold text-xs md:text-sm tracking-tight leading-tight truncate text-gray-900 dark:text-zinc-100">
                      {node.config.label}
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  title={isKilled ? 'Restart component' : 'Simulate Failure / Kill'}
                  onClick={(e) => handleToggleKill(e, node)}
                  className={`p-1 rounded text-xs transition-colors shrink-0 ${
                    isKilled
                      ? 'bg-red-600 text-white hover:bg-red-700 animate-pulse'
                      : 'text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-zinc-800'
                  }`}
                >
                  <Skull className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Subtitle / Spec info */}
              <div className="flex items-center justify-between text-[10px] font-mono text-gray-600 dark:text-zinc-400 px-0.5">
                <span className="bg-white/80 dark:bg-zinc-800/80 px-1 py-0.5 rounded border border-gray-200 dark:border-zinc-700">
                  {node.config.region || 'global'}
                </span>
                <span className="bg-white/80 dark:bg-zinc-800/80 px-1 py-0.5 rounded border border-gray-200 dark:border-zinc-700 font-semibold text-gray-800 dark:text-zinc-200">
                  x{node.config.replicas || 1}
                </span>
              </div>

              {/* Multisim Real-time Telemetry Bar */}
              {simulationSettings.isPlaying && (
                <div className="mt-1 pt-1 border-t border-black/10 dark:border-white/10 flex items-center justify-between text-[10px] font-mono">
                  {isKilled ? (
                    <span className="text-red-600 dark:text-red-400 font-bold flex items-center gap-1">
                      <Skull className="w-3 h-3" /> OFFLINE
                    </span>
                  ) : (
                    <>
                      <span
                        className={`font-semibold ${
                          isCritical
                            ? 'text-red-600 dark:text-red-400 animate-pulse flex items-center gap-0.5'
                            : 'text-gray-700 dark:text-zinc-300'
                        }`}
                      >
                        {isCritical && <AlertTriangle className="w-3 h-3" />}
                        {metrics?.inRps || 0} RPS
                      </span>
                      <span
                        className={`px-1 py-0.2 rounded font-bold ${
                          (metrics?.utilizationPercent || 0) > 85
                            ? 'bg-red-100 text-red-700 dark:bg-red-950/70 dark:text-red-400'
                            : (metrics?.utilizationPercent || 0) > 65
                            ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/70 dark:text-amber-400'
                            : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-400'
                        }`}
                      >
                        {metrics?.utilizationPercent || 0}%
                      </span>
                      <span className="text-gray-600 dark:text-zinc-400">
                        {metrics?.avgLatencyMs || 0}ms
                      </span>
                    </>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {/* Edge Labels & Latency Annotations */}
        {graph.edges.map((edge) => {
          const fromNode = graph.nodes.find((n) => n.id === edge.fromNodeId);
          const toNode = graph.nodes.find((n) => n.id === edge.toNodeId);
          if (!fromNode || !toNode) return null;

          const mx = (fromNode.x + fromNode.width + toNode.x) / 2;
          const my = (fromNode.y + fromNode.height / 2 + toNode.y + toNode.height / 2) / 2;
          const edgeMetric = simulationMetrics.edgeMetrics[edge.id];
          const isSelected = selectedEdgeId === edge.id;

          return (
            <div
              key={edge.id}
              data-edge-id={edge.id}
              data-component="edge-label"
              className={`absolute pointer-events-auto -translate-x-1/2 -translate-y-1/2 px-2 py-0.5 rounded text-[10px] font-mono cursor-pointer transition-all shadow-xs ${
                isSelected
                  ? 'bg-blue-600 text-white ring-2 ring-blue-300'
                  : 'bg-white/95 dark:bg-zinc-800/95 text-gray-700 dark:text-zinc-200 border border-gray-300 dark:border-zinc-700 hover:border-gray-500'
              }`}
              style={{ left: mx, top: my }}
              onWheel={(e) => {
                if (!e.ctrlKey && !e.metaKey) {
                  e.stopPropagation();
                }
              }}
              onClick={(e) => {
                e.stopPropagation();
                onSelectEdge(edge.id);
                onSelectNode?.(null);
              }}
            >
              <div className="flex items-center gap-1 font-sans">
                <span className="font-semibold">{edge.protocol}</span>
                {simulationSettings.isPlaying && edgeMetric && (
                  <span className="font-mono font-bold text-blue-600 dark:text-blue-400">
                    • {edgeMetric.latencyMs}ms
                  </span>
                )}
                {edge.isRedundant && (
                  <span className="text-purple-600 dark:text-purple-400 font-semibold">• Standby</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Floating Canvas Zoom and Reset Controls */}
      <div
        data-component="zoom-controls"
        className="absolute bottom-6 left-6 z-10 flex items-center gap-1 bg-white/90 dark:bg-zinc-900/90 backdrop-blur border border-gray-200 dark:border-zinc-800 rounded-lg p-1 shadow-sm text-xs font-mono"
        onWheel={(e) => {
          if (!e.ctrlKey && !e.metaKey) {
            e.stopPropagation();
          }
        }}
      >
        <button
          onClick={() => setZoom((z) => Math.min(2.5, z + 0.15))}
          className="px-2 py-1 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded text-gray-700 dark:text-zinc-300 font-bold"
          title="Zoom In"
        >
          +
        </button>
        <span className="px-1 text-gray-500 dark:text-zinc-400 min-w-[45px] text-center">
          {Math.round(zoom * 100)}%
        </span>
        <button
          onClick={() => setZoom((z) => Math.max(0.3, z - 0.15))}
          className="px-2 py-1 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded text-gray-700 dark:text-zinc-300 font-bold"
          title="Zoom Out"
        >
          -
        </button>
        <div className="w-[1px] h-4 bg-gray-200 dark:bg-zinc-800 mx-1" />
        <button
          onClick={() => {
            setPan({ x: 40, y: 30 });
            setZoom(1);
          }}
          className="px-2 py-1 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded text-gray-600 dark:text-zinc-400 font-sans font-medium"
        >
          Reset View
        </button>
      </div>
    </div>
  );
};
