import {
  SystemDesignGraph,
  SystemMetrics,
  SimulationSettings,
  RegionId,
  SystemNode,
} from '../types/system';

// Cross-region network RTT matrix (in ms)
export const REGION_LATENCY_MATRIX: Record<RegionId, Record<RegionId, number>> = {
  'global': {
    'global': 15,
    'us-east-1': 35,
    'us-west-2': 50,
    'eu-central-1': 60,
    'ap-southeast-1': 110,
    'sa-east-1': 95,
  },
  'us-east-1': {
    'global': 35,
    'us-east-1': 2,
    'us-west-2': 68,
    'eu-central-1': 88,
    'ap-southeast-1': 190,
    'sa-east-1': 115,
  },
  'us-west-2': {
    'global': 50,
    'us-east-1': 68,
    'us-west-2': 2,
    'eu-central-1': 140,
    'ap-southeast-1': 135,
    'sa-east-1': 150,
  },
  'eu-central-1': {
    'global': 60,
    'us-east-1': 88,
    'us-west-2': 140,
    'eu-central-1': 2,
    'ap-southeast-1': 175,
    'sa-east-1': 160,
  },
  'ap-southeast-1': {
    'global': 110,
    'us-east-1': 190,
    'us-west-2': 135,
    'eu-central-1': 175,
    'ap-southeast-1': 2,
    'sa-east-1': 280,
  },
  'sa-east-1': {
    'global': 95,
    'us-east-1': 115,
    'us-west-2': 150,
    'eu-central-1': 160,
    'ap-southeast-1': 280,
    'sa-east-1': 2,
  },
};

export function getNetworkRTT(fromRegion: RegionId, toRegion: RegionId): number {
  const fromMap = REGION_LATENCY_MATRIX[fromRegion] || REGION_LATENCY_MATRIX['global'];
  return fromMap[toRegion] ?? 45;
}

// Default Hourly Cloud Cost by Component
export const DEFAULT_HOURLY_COST: Record<string, number> = {
  client: 0,
  cdn_edge: 0.08,
  api_gateway: 0.05,
  load_balancer: 0.035,
  service: 0.12,
  llm_server: 3.85, // GPU-accelerated node (e.g. A100/H100 slice)
  rag_pipeline: 0.45,
  mcp_server: 0.25,
  vector_db: 0.95,
  cache: 0.35,
  database: 1.25,
  message_queue: 0.30,
  worker: 0.15,
  storage: 0.05,
  region_zone: 0,
  generic: 0.10,
};

export class SimulationEngine {
  private totalRequests = 0;
  private tickCount = 0;

  public runTick(
    graph: SystemDesignGraph,
    settings: SimulationSettings,
    previousMetrics?: SystemMetrics
  ): SystemMetrics {
    this.tickCount++;

    if (!settings.isPlaying) {
      return (
        previousMetrics ?? {
          totalRequestsProcessed: 0,
          currentRps: 0,
          p50LatencyMs: 0,
          p95LatencyMs: 0,
          p99LatencyMs: 0,
          errorRatePercent: 0,
          bottlenecksDetected: [],
          totalMonthlyCostEstimate: this.calculateMonthlyCost(graph),
          nodeMetrics: {},
          edgeMetrics: {},
        }
      );
    }

    // Determine current effective target RPS based on traffic profile
    let effectiveTargetRps = settings.globalTargetRps;
    if (settings.trafficProfile === 'spike') {
      // Periodic traffic wave
      const wave = Math.sin(this.tickCount * 0.25);
      effectiveTargetRps = Math.round(settings.globalTargetRps * (1 + (wave > 0.5 ? 2.5 : 0.1)));
    } else if (settings.trafficProfile === 'ddos') {
      effectiveTargetRps = Math.round(settings.globalTargetRps * 4.5);
    } else if (settings.trafficProfile === 'chaos_monkey') {
      effectiveTargetRps = Math.round(
        settings.globalTargetRps * (0.8 + Math.random() * 0.5)
      );
    }

    const nodeMetrics: SystemMetrics['nodeMetrics'] = {};
    const edgeMetrics: SystemMetrics['edgeMetrics'] = {};
    const bottlenecks: SystemMetrics['bottlenecksDetected'] = [];

    // Find ingress nodes: client nodes or nodes with 0 incoming edges
    const incomingEdgeMap: Record<string, string[]> = {};
    const outgoingEdgeMap: Record<string, string[]> = {};

    graph.nodes.forEach((n) => {
      incomingEdgeMap[n.id] = [];
      outgoingEdgeMap[n.id] = [];
    });

    graph.edges.forEach((e) => {
      if (incomingEdgeMap[e.toNodeId]) incomingEdgeMap[e.toNodeId].push(e.id);
      if (outgoingEdgeMap[e.fromNodeId]) outgoingEdgeMap[e.fromNodeId].push(e.id);
    });

    const ingressNodes = graph.nodes.filter(
      (n) => n.type === 'client' || incomingEdgeMap[n.id]?.length === 0
    );

    // Initial flow assignment
    const nodeInRps: Record<string, number> = {};
    graph.nodes.forEach((n) => (nodeInRps[n.id] = 0));

    if (ingressNodes.length > 0) {
      const perIngressRps = effectiveTargetRps / ingressNodes.length;
      ingressNodes.forEach((n) => {
        nodeInRps[n.id] = perIngressRps;
      });
    }

    // Topological/breadth traversal to simulate flow propagation
    // We compute queue lengths and latencies
    const pathLatencies: number[] = [];
    let totalErrors = 0;
    let totalProcessed = 0;

    // Traverse along edges (up to 25 iterations to handle complex networks)
    const queue = [...ingressNodes.map((n) => n.id)];
    const visited = new Set<string>();
    let safetyCounter = 0;

    while (queue.length > 0 && safetyCounter < 150) {
      safetyCounter++;
      const currentId = queue.shift()!;
      visited.add(currentId);

      const node = graph.nodes.find((n) => n.id === currentId);
      if (!node) continue;

      const inRps = nodeInRps[currentId] || 0;
      const config = node.config;

      // Handle chaos monkey random failure injection
      let isKilled = config.isKilled;
      let isDegraded = config.isDegraded;
      if (settings.trafficProfile === 'chaos_monkey' && Math.random() < 0.04) {
        isDegraded = true;
      }

      // Compute node processing latency and capacity
      const replicas = Math.max(1, config.replicas || 1);
      const concurrencyPerReplica = config.maxConcurrencyPerReplica || 50;
      const totalConcurrencyLimit = replicas * concurrencyPerReplica;
      const baseLatency = config.baseLatencyMs || 10;

      // Service rate in requests per second
      const serviceRatePerReplica = Math.max(1, 1000 / baseLatency);
      const maxThroughput = replicas * serviceRatePerReplica;

      // Effective load factor rho (arrival / service capacity)
      let utilization = maxThroughput > 0 ? (inRps / maxThroughput) * 100 : 100;
      if (isDegraded) utilization = Math.min(100, utilization * 1.8);

      let effectiveLatency = baseLatency;
      let dropped = 0;

      if (isKilled) {
        effectiveLatency = config.timeoutMs || 5000;
        dropped = inRps;
        utilization = 100;
        totalErrors += dropped;
        bottlenecks.push({
          nodeId: node.id,
          nodeLabel: config.label,
          reason: 'Node is offline / down (Killed). Cascading failure downstream.',
          severity: 'critical',
          suggestedFix: 'Enable multi-AZ redundancy, health-checked failover, or restart instance.',
        });
      } else if (utilization >= 100) {
        // Overload: Queue saturated, dropping requests
        const excess = inRps - maxThroughput;
        dropped = Math.max(0, excess * 0.85);
        totalErrors += dropped;
        // High queuing latency spike (Little's law queue explosion)
        effectiveLatency = Math.min(config.timeoutMs || 3000, baseLatency * 8);

        bottlenecks.push({
          nodeId: node.id,
          nodeLabel: config.label,
          reason: `Node saturated at ${Math.round(utilization)}% capacity (Handling ${Math.round(inRps)} RPS vs ${Math.round(maxThroughput)} Max).`,
          severity: 'critical',
          suggestedFix: `Scale replicas from ${replicas} to ${Math.ceil(inRps / serviceRatePerReplica) + 1}, add caching, or introduce rate limiting.`,
        });
      } else if (utilization > 80) {
        // High load queuing delay
        const queueMultiplier = 1 / (1 - (utilization / 100) * 0.95);
        effectiveLatency = baseLatency * Math.min(4, queueMultiplier);
        bottlenecks.push({
          nodeId: node.id,
          nodeLabel: config.label,
          reason: `High load (${Math.round(utilization)}% utilization). P95 latency is rising.`,
          severity: 'warning',
          suggestedFix: 'Consider proactive auto-scaling or connection pooling.',
        });
      }

      // Add simulated internal failure rate (e.g. 500 errors)
      if (config.failureRate && config.failureRate > 0) {
        const failureDrop = inRps * config.failureRate;
        dropped += failureDrop;
        totalErrors += failureDrop;
      }

      // Add AI-specific processing latency if LLM or RAG
      if (node.type === 'llm_server') {
        const ttft = config.ttftMs || 250;
        const tokensPerSec = config.tokensPerSec || 40;
        const genTokens = 60; // average response token length
        effectiveLatency += ttft + (genTokens / tokensPerSec) * 1000;
      } else if (node.type === 'rag_pipeline') {
        effectiveLatency += 45; // vector retrieval + reranking
      } else if (node.type === 'mcp_server') {
        effectiveLatency += 85; // sandbox tool execution
      }

      const activeConcurrency = Math.min(
        totalConcurrencyLimit,
        Math.round((inRps * effectiveLatency) / 1000)
      );

      const status = isKilled
        ? 'dead'
        : utilization > 95
        ? 'critical'
        : utilization > 75
        ? 'warning'
        : 'healthy';

      const processedRps = Math.max(0, inRps - dropped);
      totalProcessed += processedRps;

      nodeMetrics[node.id] = {
        inRps: Math.round(inRps),
        outRps: Math.round(processedRps),
        activeConcurrency,
        utilizationPercent: Math.min(100, Math.round(utilization)),
        avgLatencyMs: Math.round(effectiveLatency),
        droppedRequests: Math.round(dropped),
        status,
      };

      pathLatencies.push(effectiveLatency);

      // Now route traffic downstream via outgoing edges
      const outEdges = (outgoingEdgeMap[node.id] || [])
        .map((eid) => graph.edges.find((e) => e.id === eid))
        .filter((e): e is NonNullable<typeof e> => !!e);

      if (outEdges.length > 0) {
        // If node is a Cache or CDN, factor in cache hit ratio!
        let outboundRps = processedRps;
        if ((node.type === 'cache' || node.type === 'cdn_edge') && config.cacheHitRatio) {
          // Hits return immediately to client; misses pass to downstream
          const misses = outboundRps * (1 - config.cacheHitRatio);
          outboundRps = misses;
        }

        const totalWeight = outEdges.reduce((acc, e) => acc + (e.weight || 1), 0);

        outEdges.forEach((edge) => {
          const share = ((edge.weight || 1) / totalWeight) * outboundRps;
          const targetNode = graph.nodes.find((n) => n.id === edge.toNodeId);

          // Calculate network RTT between source and target regions
          const sourceRegion = node.config.region || 'us-east-1';
          const targetRegion = targetNode?.config.region || 'us-east-1';
          let networkRtt = getNetworkRTT(sourceRegion, targetRegion);

          // Factor in client origin network RTT if this is the first hop
          if (node.type === 'client') {
            networkRtt += getNetworkRTT(settings.clientRegion, targetRegion);
          }

          if (settings.networkJitterEnabled) {
            networkRtt += (Math.random() - 0.5) * 8;
          }

          edgeMetrics[edge.id] = {
            activeInFlight: Math.round((share * networkRtt) / 1000),
            latencyMs: Math.round(networkRtt),
            throughputRps: Math.round(share),
          };

          pathLatencies.push(networkRtt);

          if (edge.toNodeId) {
            nodeInRps[edge.toNodeId] = (nodeInRps[edge.toNodeId] || 0) + share;
            if (!visited.has(edge.toNodeId) && !queue.includes(edge.toNodeId)) {
              queue.push(edge.toNodeId);
            }
          }
        });
      }
    }

    this.totalRequests += Math.round(effectiveTargetRps);

    // Compute P50, P95, P99 system latencies
    pathLatencies.sort((a, b) => a - b);
    const len = Math.max(1, pathLatencies.length);
    const p50 = pathLatencies[Math.floor(len * 0.5)] || 25;
    const p95 = pathLatencies[Math.floor(len * 0.95)] || p50 * 1.6;
    const p99 = pathLatencies[Math.floor(len * 0.99)] || p95 * 2.1;

    const errorRatePercent =
      effectiveTargetRps > 0
        ? Math.min(100, Math.round((totalErrors / effectiveTargetRps) * 1000) / 10)
        : 0;

    return {
      totalRequestsProcessed: this.totalRequests,
      currentRps: effectiveTargetRps,
      p50LatencyMs: Math.round(p50),
      p95LatencyMs: Math.round(p95),
      p99LatencyMs: Math.round(p99),
      errorRatePercent,
      bottlenecksDetected: bottlenecks,
      totalMonthlyCostEstimate: this.calculateMonthlyCost(graph),
      nodeMetrics,
      edgeMetrics,
    };
  }

  public calculateMonthlyCost(graph: SystemDesignGraph): number {
    let monthlyTotal = 0;
    const hoursInMonth = 730;

    graph.nodes.forEach((node) => {
      const costPerHour =
        node.config.costPerHour !== undefined
          ? node.config.costPerHour
          : DEFAULT_HOURLY_COST[node.type] || 0.1;
      const replicas = Math.max(1, node.config.replicas || 1);
      monthlyTotal += costPerHour * replicas * hoursInMonth;
    });

    return Math.round(monthlyTotal);
  }

  public reset() {
    this.totalRequests = 0;
    this.tickCount = 0;
  }
}
