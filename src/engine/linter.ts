import { SystemDesignGraph } from '../types/system';

export interface LintIssue {
  id: string;
  category: 'reliability' | 'scalability' | 'latency' | 'security' | 'cost';
  severity: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  affectedNodeIds: string[];
  recommendation: string;
}

export function lintArchitecture(graph: SystemDesignGraph): LintIssue[] {
  const issues: LintIssue[] = [];

  // 1. Check for disconnected / orphaned nodes
  graph.nodes.forEach((node) => {
    if (node.type === 'region_zone') return;
    const connectedEdges = graph.edges.filter(
      (e) => e.fromNodeId === node.id || e.toNodeId === node.id
    );
    if (connectedEdges.length === 0) {
      issues.push({
        id: `orphan-${node.id}`,
        category: 'reliability',
        severity: 'low',
        title: `Disconnected Component: "${node.config.label}"`,
        description: `This node is isolated on the canvas and is not wired to any input or output bus.`,
        affectedNodeIds: [node.id],
        recommendation: `Connect it using an arrow wire or remove it if unused.`,
      });
    }
  });

  // 2. Single Point of Failure (SPOF)
  graph.nodes.forEach((node) => {
    if (
      ['database', 'api_gateway', 'load_balancer', 'service', 'llm_server'].includes(
        node.type
      )
    ) {
      if ((node.config.replicas || 1) === 1) {
        // Check if there are parallel sibling nodes of same type
        const incoming = graph.edges.filter((e) => e.toNodeId === node.id);
        const hasRedundantRoute = incoming.some((e) => e.isRedundant);

        if (!hasRedundantRoute) {
          issues.push({
            id: `spof-${node.id}`,
            category: 'reliability',
            severity: 'high',
            title: `Single Point of Failure: "${node.config.label}"`,
            description: `Only 1 replica configured for this critical component with no active-passive standby or redundant route. If this instance crashes, downstream service breaks.`,
            affectedNodeIds: [node.id],
            recommendation: `Increase replicas to >= 2 across multiple Availability Zones, or add a secondary fallback route.`,
          });
        }
      }
    }
  });

  // 3. Client directly hitting database or backend service (Missing API Gateway / Load Balancer)
  graph.edges.forEach((edge) => {
    const fromNode = graph.nodes.find((n) => n.id === edge.fromNodeId);
    const toNode = graph.nodes.find((n) => n.id === edge.toNodeId);

    if (fromNode?.type === 'client') {
      if (toNode?.type === 'database') {
        issues.push({
          id: `client-direct-db-${edge.id}`,
          category: 'security',
          severity: 'high',
          title: `Direct Client Database Access`,
          description: `Traffic client is connected directly to "${toNode.config.label}" without an API Gateway or auth service.`,
          affectedNodeIds: [fromNode.id, toNode.id],
          recommendation: `Place an API Gateway and Backend Service between Client and Database to enforce authentication and access control.`,
        });
      } else if (toNode?.type === 'service' || toNode?.type === 'llm_server') {
        issues.push({
          id: `client-no-gw-${edge.id}`,
          category: 'scalability',
          severity: 'medium',
          title: `Missing Ingress / Load Balancer before "${toNode.config.label}"`,
          description: `Clients are hitting backend nodes directly without an Application Load Balancer or API Gateway.`,
          affectedNodeIds: [fromNode.id, toNode.id],
          recommendation: `Add a Load Balancer (ALB) or API Gateway for SSL termination, rate limiting, and traffic distribution.`,
        });
      }
    }
  });

  // 4. Cross-Region Latency Traps
  graph.edges.forEach((edge) => {
    const fromNode = graph.nodes.find((n) => n.id === edge.fromNodeId);
    const toNode = graph.nodes.find((n) => n.id === edge.toNodeId);

    if (fromNode && toNode) {
      const fromReg = fromNode.config.region || 'us-east-1';
      const toReg = toNode.config.region || 'us-east-1';

      if (fromReg !== toReg && fromReg !== 'global' && toReg !== 'global') {
        issues.push({
          id: `cross-region-${edge.id}`,
          category: 'latency',
          severity: 'medium',
          title: `Cross-Region Latency Penalty (${fromReg} -> ${toReg})`,
          description: `Synchronous wire between "${fromNode.config.label}" and "${toNode.config.label}" traverses intercontinental fiber (~70-190ms RTT penalty per request).`,
          affectedNodeIds: [fromNode.id, toNode.id],
          recommendation: `Deploy read-replicas or local caching in "${fromReg}", or use asynchronous message streaming.`,
        });
      }
    }
  });

  // 5. LLM Inference Saturation Risk (Missing Semantic Cache)
  const llmNodes = graph.nodes.filter((n) => n.type === 'llm_server');
  llmNodes.forEach((llm) => {
    // Check if an upstream cache exists
    const incomingEdges = graph.edges.filter((e) => e.toNodeId === llm.id);
    const upstreamNodeIds = incomingEdges.map((e) => e.fromNodeId);
    const hasCache = graph.nodes.some(
      (n) => n.type === 'cache' && (upstreamNodeIds.includes(n.id) || graph.edges.some((e) => e.toNodeId === n.id))
    );

    if (!hasCache) {
      issues.push({
        id: `llm-no-cache-${llm.id}`,
        category: 'cost',
        severity: 'medium',
        title: `Uncached LLM Inference: "${llm.config.label}"`,
        description: `High token generation cost and latency. Identical queries will repeatedly hit costly GPU clusters.`,
        affectedNodeIds: [llm.id],
        recommendation: `Add a Redis Semantic Cache or GPTCache in front of the LLM to achieve 25-40% cache hit ratios and sub-10ms responses.`,
      });
    }

    if ((llm.config.replicas || 1) < 2) {
      issues.push({
        id: `llm-low-gpu-${llm.id}`,
        category: 'scalability',
        severity: 'medium',
        title: `Single GPU Inference Node`,
        description: `vLLM node will hit KV cache limits and queue serialization under concurrency spikes.`,
        affectedNodeIds: [llm.id],
        recommendation: `Configure at least 2-4 vLLM worker replicas with continuous batching and PagedAttention.`,
      });
    }
  });

  // 6. Database direct writes under high load (Missing Message Queue for decoupling)
  const dbNodes = graph.nodes.filter((n) => n.type === 'database');
  const queueNodes = graph.nodes.filter((n) => n.type === 'message_queue');
  if (dbNodes.length > 0 && queueNodes.length === 0) {
    issues.push({
      id: `no-async-queue`,
      category: 'scalability',
      severity: 'low',
      title: `No Asynchronous Buffer / Message Queue Detected`,
      description: `All write requests appear synchronous. Sudden spikes can exhaust database connection pools.`,
      affectedNodeIds: dbNodes.map((d) => d.id),
      recommendation: `Consider introducing Kafka or AWS SQS for asynchronous event ingestion and database write buffering.`,
    });
  }

  return issues;
}
