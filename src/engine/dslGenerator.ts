import { SystemDesignGraph } from '../types/system';

export function generateVerilogHDL(graph: SystemDesignGraph): string {
  const sanitizeIdentifier = (str: string) => {
    return str
      .replace(/[^a-zA-Z0-9_]/g, '_')
      .replace(/^([0-9])/, '_$1')
      .toLowerCase();
  };

  const moduleName =
    sanitizeIdentifier(graph.meta.name || 'SystemArchitecture') || 'DistributedSystem';

  const lines: string[] = [];

  lines.push('// =========================================================================');
  lines.push(`// SysDesign HDL - Hardware & Distributed Architecture Netlist`);
  lines.push(`// Module: ${moduleName}`);
  lines.push(`// Description: ${graph.meta.description || 'System Topology'}`);
  lines.push(`// Generated: ${new Date().toISOString()}`);
  lines.push('// =========================================================================\n');

  lines.push(`module ${moduleName} (`);
  lines.push(`  input  wire [QPS_STREAM]   client_ingress,`);
  lines.push(`  output wire [RESP_STREAM]  client_egress,`);
  lines.push(`  output wire [TELEMETRY]    system_telemetry`);
  lines.push(`);\n`);

  lines.push(`  // -----------------------------------------------------------------------`);
  lines.push(`  // Interconnect Wires & Buses`);
  lines.push(`  // -----------------------------------------------------------------------`);

  // Declare wires for all edges
  graph.edges.forEach((edge, idx) => {
    const wireName = `w_${sanitizeIdentifier(edge.fromNodeId)}_to_${sanitizeIdentifier(
      edge.toNodeId
    )}_${idx}`;
    const proto = edge.protocol || 'TCP';
    const latency = edge.baseNetworkLatencyMs ? ` /* RTT: ${edge.baseNetworkLatencyMs}ms */` : '';
    lines.push(`  wire [${proto}_BUS] ${wireName};${latency}`);
  });

  lines.push('\n  // -----------------------------------------------------------------------');
  lines.push(`  // Subsystem Component Instances & Parameter Mapping`);
  lines.push(`  // -----------------------------------------------------------------------`);

  graph.nodes.forEach((node) => {
    const instanceName = sanitizeIdentifier(node.id);
    const typeUpper = node.type.toUpperCase();
    const config = node.config;

    // Incoming edges to this node
    const inEdges = graph.edges.filter((e) => e.toNodeId === node.id);
    // Outgoing edges from this node
    const outEdges = graph.edges.filter((e) => e.fromNodeId === node.id);

    lines.push(`\n  // Component: ${config.label} [${node.type}]`);
    lines.push(`  ${typeUpper} #(`);

    const params: string[] = [
      `.LABEL("${config.label.replace(/"/g, '\\"')}")`,
      `.REGION("${config.region || 'us-east-1'}")`,
      `.REPLICAS(${config.replicas || 1})`,
      `.MAX_CONCURRENCY(${config.maxConcurrencyPerReplica || 50})`,
      `.BASE_LATENCY_MS(${config.baseLatencyMs || 10})`,
      `.POS_X(${Math.round(node.x)})`,
      `.POS_Y(${Math.round(node.y)})`,
      `.WIDTH(${Math.round(node.width || 150)})`,
      `.HEIGHT(${Math.round(node.height || 75)})`,
    ];

    if (config.cacheHitRatio !== undefined) {
      params.push(`.CACHE_HIT_RATIO(${config.cacheHitRatio})`);
    }
    if (config.modelName) {
      params.push(`.MODEL_NAME("${config.modelName.replace(/"/g, '\\"')}")`);
      params.push(`.TTFT_MS(${config.ttftMs || 200})`);
      params.push(`.TOKENS_PER_SEC(${config.tokensPerSec || 40})`);
    }

    lines.push(params.map((p) => `    ${p}`).join(',\n'));
    lines.push(`  ) inst_${instanceName} (`);

    // Port mappings
    const portMaps: string[] = [];

    if (inEdges.length === 0) {
      portMaps.push(`    .in(client_ingress)`);
    } else {
      inEdges.forEach((e, i) => {
        const edgeIdx = graph.edges.indexOf(e);
        const wireName = `w_${sanitizeIdentifier(e.fromNodeId)}_to_${sanitizeIdentifier(
          e.toNodeId
        )}_${edgeIdx}`;
        portMaps.push(`    .port_in_${i}(${wireName})`);
      });
    }

    if (outEdges.length === 0) {
      portMaps.push(`    .out(client_egress)`);
    } else {
      outEdges.forEach((e, i) => {
        const edgeIdx = graph.edges.indexOf(e);
        const wireName = `w_${sanitizeIdentifier(e.fromNodeId)}_to_${sanitizeIdentifier(
          e.toNodeId
        )}_${edgeIdx}`;
        portMaps.push(`    .port_out_${i}(${wireName})`);
      });
    }

    lines.push(portMaps.join(',\n'));
    lines.push(`  );`);
  });

  lines.push('\nendmodule\n');
  return lines.join('\n');
}

export function generateTopologyJson(graph: SystemDesignGraph): string {
  const summary = {
    system_name: graph.meta.name,
    description: graph.meta.description,
    component_count: graph.nodes.length,
    connection_count: graph.edges.length,
    nodes: graph.nodes.map((n) => ({
      id: n.id,
      label: n.config.label,
      type: n.type,
      region: n.config.region,
      replicas: n.config.replicas,
      capacity: (n.config.replicas || 1) * (n.config.maxConcurrencyPerReplica || 50),
      base_latency_ms: n.config.baseLatencyMs,
      cache_hit_ratio: n.config.cacheHitRatio,
      x: Math.round(n.x),
      y: Math.round(n.y),
      width: n.width,
      height: n.height,
      ai_specs:
        n.type === 'llm_server' || n.type === 'rag_pipeline' || n.type === 'mcp_server'
          ? {
              model: n.config.modelName,
              ttft_ms: n.config.ttftMs,
              tokens_per_sec: n.config.tokensPerSec,
            }
          : undefined,
    })),
    topology_matrix: graph.edges.map((e) => {
      const from = graph.nodes.find((n) => n.id === e.fromNodeId);
      const to = graph.nodes.find((n) => n.id === e.toNodeId);
      return {
        id: e.id,
        from_id: e.fromNodeId,
        to_id: e.toNodeId,
        from: from?.config.label || e.fromNodeId,
        to: to?.config.label || e.toNodeId,
        protocol: e.protocol,
        latency_rtt_ms: e.baseNetworkLatencyMs || 5,
        is_redundant: !!e.isRedundant,
      };
    }),
  };

  return JSON.stringify(summary, null, 2);
}

export function generateFullGraphJson(graph: SystemDesignGraph): string {
  return JSON.stringify(graph, null, 2);
}
