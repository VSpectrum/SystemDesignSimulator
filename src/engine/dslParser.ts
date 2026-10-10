import {
  SystemDesignGraph,
  SystemNode,
  ConnectionEdge,
  ComponentType,
  RegionId,
  SystemDiscussion,
} from '../types/system';
import { ARCHITECTURE_TEMPLATES } from './templates';

function extractBalancedParen(
  str: string,
  openIndex: number
): { content: string; endIndex: number } | null {
  if (str[openIndex] !== '(') return null;
  let depth = 1;
  let inQuote = false;
  let quoteChar = '';
  let escape = false;

  for (let i = openIndex + 1; i < str.length; i++) {
    const ch = str[i];
    if (escape) {
      escape = false;
      continue;
    }
    if (ch === '\\') {
      escape = true;
      continue;
    }
    if (inQuote) {
      if (ch === quoteChar) {
        inQuote = false;
      }
      continue;
    }
    if (ch === '"' || ch === '\'') {
      inQuote = true;
      quoteChar = ch;
      continue;
    }
    if (ch === '(') {
      depth++;
    } else if (ch === ')') {
      depth--;
      if (depth === 0) {
        return { content: str.slice(openIndex + 1, i), endIndex: i };
      }
    }
  }
  return null;
}

const TYPE_MAP: Record<string, ComponentType> = {
  client: 'client',
  cdn_edge: 'cdn_edge',
  cdn: 'cdn_edge',
  api_gateway: 'api_gateway',
  gateway: 'api_gateway',
  load_balancer: 'load_balancer',
  alb: 'load_balancer',
  service: 'service',
  llm_server: 'llm_server',
  llm: 'llm_server',
  rag_pipeline: 'rag_pipeline',
  rag: 'rag_pipeline',
  mcp_server: 'mcp_server',
  mcp: 'mcp_server',
  vector_db: 'vector_db',
  vectordb: 'vector_db',
  cache: 'cache',
  redis: 'cache',
  memcached: 'cache',
  database: 'database',
  db: 'database',
  message_queue: 'message_queue',
  queue: 'message_queue',
  kafka: 'message_queue',
  worker: 'worker',
  storage: 'storage',
  s3: 'storage',
  region_zone: 'region_zone',
  generic: 'generic',
  box: 'generic',
  custom: 'generic',
};

/**
 * Parses Verilog HDL netlist text into a SystemDesignGraph
 */
export function parseVerilogHDL(hdl: string): { graph: SystemDesignGraph; warnings: string[] } {
  const warnings: string[] = [];

  // 1. Extract metadata from header comments
  let systemName = 'Imported Architecture';
  let systemDesc = 'Imported from Verilog HDL Netlist';

  const moduleCommentMatch = hdl.match(/\/\/\s*Module:\s*([^\r\n]+)/i);
  if (moduleCommentMatch) {
    systemName = moduleCommentMatch[1]
      .trim()
      .replace(/_+/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase());
  }

  const descCommentMatch = hdl.match(/\/\/\s*Description:\s*([^\r\n]+)/i);
  if (descCommentMatch) {
    systemDesc = descCommentMatch[1].trim();
  }

  const moduleHeaderMatch = hdl.match(/module\s+([a-zA-Z0-9_]+)/i);
  if (!moduleCommentMatch && moduleHeaderMatch) {
    systemName = moduleHeaderMatch[1]
      .replace(/_+/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase())
      .trim();
  }

  // 2. Extract wire declarations
  // e.g. wire [TCP_BUS] w_from_to_0; /* RTT: 5ms */
  interface WireInfo {
    name: string;
    protocol: ConnectionEdge['protocol'];
    latencyMs: number;
  }
  const wiresMap = new Map<string, WireInfo>();

  const wireRegex =
    /wire\s*(?:\[\s*([a-zA-Z0-9_]+?)(?:_BUS)?\s*\])?\s*([a-zA-Z0-9_]+)\s*;(?:\s*\/\*\s*RTT:\s*([0-9.]+)\s*ms\s*\*\/)?/gi;
  let wireMatch: RegExpExecArray | null;
  while ((wireMatch = wireRegex.exec(hdl)) !== null) {
    const rawProto = (wireMatch[1] || 'TCP').toUpperCase();
    const wireName = wireMatch[2];
    const rtt = wireMatch[3] ? parseFloat(wireMatch[3]) : 10;

    let proto: ConnectionEdge['protocol'] = 'TCP';
    if (rawProto === 'HTTP') proto = 'HTTP';
    else if (rawProto === 'GRPC') proto = 'gRPC';
    else if (rawProto === 'ASYNC') proto = 'ASYNC';
    else if (rawProto === 'MCP_IPC') proto = 'MCP_IPC';
    else if (rawProto === 'TCP') proto = 'TCP';

    wiresMap.set(wireName, {
      name: wireName,
      protocol: proto,
      latencyMs: rtt,
    });
  }

  // 3. Extract component instances
  // Pattern: <TYPE> #( ...params... ) <INST_NAME> ( ...ports... );
  const nodes: SystemNode[] = [];
  const nodeMap = new Map<string, SystemNode>();

  const wireProducers = new Map<string, string>();
  const wireConsumers = new Map<string, string[]>();

  const instanceTriggerRegex = /([a-zA-Z0-9_]+)\s*#\s*\(/g;
  let instTrigger: RegExpExecArray | null;

  while ((instTrigger = instanceTriggerRegex.exec(hdl)) !== null) {
    const rawType = instTrigger[1];
    const paramsOpenParenIndex = instTrigger.index + instTrigger[0].length - 1;
    const paramsParen = extractBalancedParen(hdl, paramsOpenParenIndex);
    if (!paramsParen) continue;

    // Scan for instance name and port connections: inst_name ( ... )
    const remainder = hdl.slice(paramsParen.endIndex + 1);
    const instNameMatch = remainder.match(/^\s*([a-zA-Z0-9_]+)\s*\(/);
    if (!instNameMatch) continue;

    const instName = instNameMatch[1];
    const portsOpenParenIndex = paramsParen.endIndex + 1 + instNameMatch[0].length - 1;
    const portsParen = extractBalancedParen(hdl, portsOpenParenIndex);
    if (!portsParen) continue;

    // Advance regex pointer past this instance
    instanceTriggerRegex.lastIndex = portsParen.endIndex + 1;

    // Parse parameters
    const paramsStr = paramsParen.content;
    const paramRegex = /\.([a-zA-Z0-9_]+)\s*\(\s*(".*?"|[^,)]+)\s*\)/g;
    let paramMatch: RegExpExecArray | null;
    const rawParams: Record<string, string> = {};

    while ((paramMatch = paramRegex.exec(paramsStr)) !== null) {
      const key = paramMatch[1].toUpperCase();
      let val = paramMatch[2].trim();
      if (val.startsWith('"') && val.endsWith('"')) {
        val = val.slice(1, -1);
      }
      rawParams[key] = val;
    }

    const normalizedType: ComponentType = TYPE_MAP[rawType.toLowerCase()] || 'service';

    let nodeId = instName.startsWith('inst_') ? instName.slice(5) : instName;
    if (!nodeId) nodeId = `node_${nodes.length + 1}`;

    const label = rawParams['LABEL'] || nodeId.replace(/_/g, ' ');
    const region = (rawParams['REGION'] || 'us-east-1') as RegionId;
    const replicas = rawParams['REPLICAS'] ? parseInt(rawParams['REPLICAS'], 10) : 1;
    const maxConcurrency = rawParams['MAX_CONCURRENCY']
      ? parseInt(rawParams['MAX_CONCURRENCY'], 10)
      : 1000;
    const baseLatency = rawParams['BASE_LATENCY_MS']
      ? parseFloat(rawParams['BASE_LATENCY_MS'])
      : 10;
    const cacheHitRatio = rawParams['CACHE_HIT_RATIO']
      ? parseFloat(rawParams['CACHE_HIT_RATIO'])
      : undefined;
    const modelName = rawParams['MODEL_NAME'] || undefined;
    const ttftMs = rawParams['TTFT_MS'] ? parseFloat(rawParams['TTFT_MS']) : undefined;
    const tokensPerSec = rawParams['TOKENS_PER_SEC']
      ? parseFloat(rawParams['TOKENS_PER_SEC'])
      : undefined;

    const posX = rawParams['POS_X'] ? parseInt(rawParams['POS_X'], 10) : undefined;
    const posY = rawParams['POS_Y'] ? parseInt(rawParams['POS_Y'], 10) : undefined;
    const width = rawParams['WIDTH']
      ? parseInt(rawParams['WIDTH'], 10)
      : normalizedType === 'database' || normalizedType === 'vector_db'
      ? 140
      : 150;
    const height = rawParams['HEIGHT'] ? parseInt(rawParams['HEIGHT'], 10) : 75;

    const node: SystemNode = {
      id: nodeId,
      type: normalizedType,
      x: posX ?? 0,
      y: posY ?? 0,
      width,
      height,
      config: {
        label,
        type: normalizedType,
        region,
        replicas,
        maxConcurrencyPerReplica: maxConcurrency,
        baseLatencyMs: baseLatency,
        cacheHitRatio,
        modelName,
        ttftMs,
        tokensPerSec,
      },
    };

    nodes.push(node);
    nodeMap.set(nodeId, node);
    nodeMap.set(instName, node);

    // Parse ports
    const portsStr = portsParen.content;
    const portRegex = /\.([a-zA-Z0-9_]+)\s*\(\s*([a-zA-Z0-9_]+)\s*\)/g;
    let portMatch: RegExpExecArray | null;

    while ((portMatch = portRegex.exec(portsStr)) !== null) {
      const portName = portMatch[1];
      const wireRef = portMatch[2];

      if (
        wireRef === 'client_ingress' ||
        wireRef === 'client_egress' ||
        wireRef === 'system_telemetry'
      ) {
        continue;
      }

      if (portName.startsWith('port_out') || portName === 'out') {
        wireProducers.set(wireRef, nodeId);
      } else if (portName.startsWith('port_in') || portName === 'in') {
        const existing = wireConsumers.get(wireRef) || [];
        existing.push(nodeId);
        wireConsumers.set(wireRef, existing);
      }
    }
  }

  // 4. Build edges from wire connections
  const edges: ConnectionEdge[] = [];
  const edgeSet = new Set<string>();

  for (const [wireName, fromNodeId] of wireProducers.entries()) {
    const toNodeIds = wireConsumers.get(wireName) || [];
    const wireMeta = wiresMap.get(wireName);

    for (const toNodeId of toNodeIds) {
      if (fromNodeId === toNodeId) continue;
      const edgeKey = `${fromNodeId}->${toNodeId}`;
      if (edgeSet.has(edgeKey)) continue;
      edgeSet.add(edgeKey);

      edges.push({
        id: `edge_${fromNodeId}_${toNodeId}_${edges.length}`,
        fromNodeId,
        toNodeId,
        protocol: wireMeta?.protocol || 'TCP',
        baseNetworkLatencyMs: wireMeta?.latencyMs || 5,
      });
    }
  }

  // Fallback: Parse wire names like w_<from>_to_<to>_<idx>
  for (const [wireName, wireMeta] of wiresMap.entries()) {
    const wireNameMatch = wireName.match(/^w_([a-zA-Z0-9_]+)_to_([a-zA-Z0-9_]+?)(?:_\d+)?$/);
    if (wireNameMatch) {
      const rawFrom = wireNameMatch[1];
      const rawTo = wireNameMatch[2];

      const fromNode =
        nodes.find((n) => n.id === rawFrom || n.id.toLowerCase() === rawFrom.toLowerCase()) ||
        nodes.find(
          (n) => n.id.replace(/[^a-zA-Z0-9_]/g, '_').toLowerCase() === rawFrom.toLowerCase()
        );

      const toNode =
        nodes.find((n) => n.id === rawTo || n.id.toLowerCase() === rawTo.toLowerCase()) ||
        nodes.find(
          (n) => n.id.replace(/[^a-zA-Z0-9_]/g, '_').toLowerCase() === rawTo.toLowerCase()
        );

      if (fromNode && toNode && fromNode.id !== toNode.id) {
        const edgeKey = `${fromNode.id}->${toNode.id}`;
        if (!edgeSet.has(edgeKey)) {
          edgeSet.add(edgeKey);
          edges.push({
            id: `edge_${fromNode.id}_${toNode.id}_${edges.length}`,
            fromNodeId: fromNode.id,
            toNodeId: toNode.id,
            protocol: wireMeta.protocol,
            baseNetworkLatencyMs: wireMeta.latencyMs,
          });
        }
      }
    }
  }

  // 5. Layout calculation if positions are missing
  const needsLayout = nodes.some((n) => n.x === 0 && n.y === 0);
  if (needsLayout) {
    const inDegree = new Map<string, number>();
    nodes.forEach((n) => inDegree.set(n.id, 0));
    edges.forEach((e) => {
      inDegree.set(e.toNodeId, (inDegree.get(e.toNodeId) || 0) + 1);
    });

    const levels = new Map<string, number>();
    const queue: string[] = [];

    nodes.forEach((n) => {
      if ((inDegree.get(n.id) || 0) === 0) {
        levels.set(n.id, 0);
        queue.push(n.id);
      }
    });

    if (queue.length === 0 && nodes.length > 0) {
      levels.set(nodes[0].id, 0);
      queue.push(nodes[0].id);
    }

    const visited = new Set<string>();
    let steps = 0;
    const maxSteps = nodes.length * 4;

    while (queue.length > 0 && steps < maxSteps) {
      steps++;
      const curr = queue.shift()!;
      visited.add(curr);
      const currLevel = levels.get(curr) || 0;
      const outgoing = edges.filter((e) => e.fromNodeId === curr);
      for (const e of outgoing) {
        const nextLevel = Math.min(Math.max(levels.get(e.toNodeId) || 0, currLevel + 1), 10);
        levels.set(e.toNodeId, nextLevel);
        if (!visited.has(e.toNodeId) && !queue.includes(e.toNodeId)) {
          queue.push(e.toNodeId);
        }
      }
    }

    const levelBuckets = new Map<number, SystemNode[]>();
    nodes.forEach((n) => {
      const lvl = levels.get(n.id) || 0;
      const list = levelBuckets.get(lvl) || [];
      list.push(n);
      levelBuckets.set(lvl, list);
    });

    levelBuckets.forEach((bucketNodes, lvl) => {
      const startX = 80 + lvl * 240;
      const startY = 120;
      bucketNodes.forEach((node, idx) => {
        if (node.x === 0 && node.y === 0) {
          node.x = startX;
          node.y = startY + idx * 130;
        }
      });
    });
  }

  // 6. Match template discussion if available
  const matchingTemplate = ARCHITECTURE_TEMPLATES.find(
    (t) =>
      t.name.toLowerCase().includes(systemName.toLowerCase()) ||
      systemName.toLowerCase().includes(t.name.toLowerCase()) ||
      t.id === systemName.toLowerCase()
  );

  const graph: SystemDesignGraph = {
    nodes,
    edges,
    annotations: [],
    meta: {
      name: systemName,
      description: systemDesc,
      version: 1,
      updatedAt: new Date().toISOString(),
      templateId: matchingTemplate?.id,
    },
    discussion: matchingTemplate?.discussion,
  };

  return { graph, warnings };
}

/**
 * Parses Topology JSON IR into a SystemDesignGraph
 */
export function parseTopologyJson(jsonStr: string): { graph: SystemDesignGraph; warnings: string[] } {
  const warnings: string[] = [];
  const data = JSON.parse(jsonStr);

  const systemName = data.system_name || data.meta?.name || 'Imported Architecture';
  const systemDesc = data.description || data.meta?.description || 'Imported from JSON Topology IR';

  const rawNodes = data.nodes || [];
  const rawEdges = data.topology_matrix || data.edges || [];

  const nodes: SystemNode[] = rawNodes.map((n: any, idx: number) => {
    const rawType = (n.type || 'service').toLowerCase();
    const type: ComponentType = TYPE_MAP[rawType] || 'service';
    const replicas = n.replicas || 1;
    const maxConcurrency = n.capacity
      ? Math.round(n.capacity / replicas)
      : n.config?.maxConcurrencyPerReplica || 1000;

    return {
      id: n.id || `node_${idx + 1}`,
      type,
      x: n.x ?? 0,
      y: n.y ?? 0,
      width: n.width || (type === 'database' || type === 'vector_db' ? 140 : 150),
      height: n.height || 75,
      config: {
        label: n.label || n.config?.label || `Component ${idx + 1}`,
        type,
        region: (n.region || n.config?.region || 'us-east-1') as RegionId,
        replicas,
        maxConcurrencyPerReplica: maxConcurrency,
        baseLatencyMs: n.base_latency_ms ?? n.config?.baseLatencyMs ?? 10,
        cacheHitRatio: n.cache_hit_ratio ?? n.config?.cacheHitRatio,
        modelName: n.ai_specs?.model ?? n.config?.modelName,
        ttftMs: n.ai_specs?.ttft_ms ?? n.config?.ttftMs,
        tokensPerSec: n.ai_specs?.tokens_per_sec ?? n.config?.tokensPerSec,
      },
    };
  });

  const nodeMap = new Map<string, SystemNode>();
  nodes.forEach((n) => {
    nodeMap.set(n.id, n);
    nodeMap.set(n.config.label, n);
  });

  const edges: ConnectionEdge[] = [];
  rawEdges.forEach((e: any, idx: number) => {
    const fromRef = e.from_id || e.fromNodeId || e.from;
    const toRef = e.to_id || e.toNodeId || e.to;

    const fromNode =
      nodeMap.get(fromRef) || nodes.find((n) => n.id === fromRef || n.config.label === fromRef);
    const toNode =
      nodeMap.get(toRef) || nodes.find((n) => n.id === toRef || n.config.label === toRef);

    if (fromNode && toNode) {
      edges.push({
        id: e.id || `edge_${fromNode.id}_${toNode.id}_${idx}`,
        fromNodeId: fromNode.id,
        toNodeId: toNode.id,
        protocol: e.protocol || 'TCP',
        baseNetworkLatencyMs: e.latency_rtt_ms || e.baseNetworkLatencyMs || 5,
        isRedundant: !!e.is_redundant || !!e.isRedundant,
      });
    } else {
      warnings.push(`Could not resolve connection from "${fromRef}" to "${toRef}"`);
    }
  });

  // Layout calculation if coordinates are missing
  const needsLayout = nodes.some((n) => n.x === 0 && n.y === 0);
  if (needsLayout) {
    const inDegree = new Map<string, number>();
    nodes.forEach((n) => inDegree.set(n.id, 0));
    edges.forEach((e) => {
      inDegree.set(e.toNodeId, (inDegree.get(e.toNodeId) || 0) + 1);
    });

    const levels = new Map<string, number>();
    const queue: string[] = [];

    nodes.forEach((n) => {
      if ((inDegree.get(n.id) || 0) === 0) {
        levels.set(n.id, 0);
        queue.push(n.id);
      }
    });

    if (queue.length === 0 && nodes.length > 0) {
      levels.set(nodes[0].id, 0);
      queue.push(nodes[0].id);
    }

    const visited = new Set<string>();
    let steps = 0;
    const maxSteps = nodes.length * 4;

    while (queue.length > 0 && steps < maxSteps) {
      steps++;
      const curr = queue.shift()!;
      visited.add(curr);
      const currLevel = levels.get(curr) || 0;
      const outgoing = edges.filter((e) => e.fromNodeId === curr);
      for (const e of outgoing) {
        const nextLevel = Math.min(Math.max(levels.get(e.toNodeId) || 0, currLevel + 1), 10);
        levels.set(e.toNodeId, nextLevel);
        if (!visited.has(e.toNodeId) && !queue.includes(e.toNodeId)) {
          queue.push(e.toNodeId);
        }
      }
    }

    const levelBuckets = new Map<number, SystemNode[]>();
    nodes.forEach((n) => {
      const lvl = levels.get(n.id) || 0;
      const list = levelBuckets.get(lvl) || [];
      list.push(n);
      levelBuckets.set(lvl, list);
    });

    levelBuckets.forEach((bucketNodes, lvl) => {
      const startX = 80 + lvl * 240;
      const startY = 120;
      bucketNodes.forEach((node, idx) => {
        if (node.x === 0 && node.y === 0) {
          node.x = startX;
          node.y = startY + idx * 130;
        }
      });
    });
  }

  const matchingTemplate = ARCHITECTURE_TEMPLATES.find(
    (t) =>
      t.name.toLowerCase().includes(systemName.toLowerCase()) ||
      systemName.toLowerCase().includes(t.name.toLowerCase()) ||
      t.id === systemName.toLowerCase()
  );

  const graph: SystemDesignGraph = {
    nodes,
    edges,
    annotations: data.annotations || [],
    meta: {
      name: systemName,
      description: systemDesc,
      version: 1,
      updatedAt: new Date().toISOString(),
      templateId: data.meta?.templateId || matchingTemplate?.id,
    },
    discussion: data.discussion || matchingTemplate?.discussion,
  };

  return { graph, warnings };
}

/**
 * Universal architecture file importer. Automatically detects Verilog HDL,
 * Topology JSON IR, or Full Graph JSON.
 */
export function parseArchitectureFile(
  content: string,
  filename?: string
): {
  graph: SystemDesignGraph;
  format: 'verilog' | 'topology_json' | 'full_graph';
  warnings: string[];
} {
  const trimmed = content.trim();

  // 1. Check if JSON
  if (trimmed.startsWith('{') || (filename && filename.toLowerCase().endsWith('.json'))) {
    try {
      const parsed = JSON.parse(trimmed);

      // Check if full SystemDesignGraph
      if (
        parsed &&
        Array.isArray(parsed.nodes) &&
        Array.isArray(parsed.edges) &&
        parsed.meta &&
        parsed.nodes.length > 0 &&
        parsed.nodes[0].config !== undefined
      ) {
        return {
          graph: parsed as SystemDesignGraph,
          format: 'full_graph',
          warnings: [],
        };
      }

      // Check if Topology JSON IR
      if (parsed && Array.isArray(parsed.nodes)) {
        const { graph, warnings } = parseTopologyJson(trimmed);
        return {
          graph,
          format: 'topology_json',
          warnings,
        };
      }
    } catch (err: any) {
      // If filename ended in .json, surface JSON error
      if (filename && filename.toLowerCase().endsWith('.json')) {
        throw new Error(`Invalid JSON syntax in file: ${err.message}`);
      }
    }
  }

  // 2. Check if Verilog HDL
  if (
    trimmed.includes('module') ||
    trimmed.includes('// SysDesign HDL') ||
    trimmed.includes('wire [') ||
    (filename && (filename.endsWith('.v') || filename.endsWith('.sv') || filename.endsWith('.hdl')))
  ) {
    const { graph, warnings } = parseVerilogHDL(trimmed);
    if (graph.nodes.length === 0) {
      throw new Error(
        'No valid component instances detected in Verilog netlist. Make sure the file contains module instances like COMPONENT #( ... ) inst_name ( ... );'
      );
    }
    return {
      graph,
      format: 'verilog',
      warnings,
    };
  }

  // 3. Fallback: try Verilog parsing
  try {
    const { graph, warnings } = parseVerilogHDL(trimmed);
    if (graph.nodes.length > 0) {
      return {
        graph,
        format: 'verilog',
        warnings,
      };
    }
  } catch {}

  throw new Error(
    'Unrecognized architecture file format. Please upload a Verilog HDL Netlist (.v, .hdl) or SysDesign JSON (.json).'
  );
}
