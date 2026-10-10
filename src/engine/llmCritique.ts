import {
  SystemDesignGraph,
  SystemNode,
  ConnectionEdge,
  SystemMetrics,
} from '../types/system';
import { generateVerilogHDL, generateTopologyJson } from './dslGenerator';

export interface LlmCritiqueConfig {
  apiKey: string;
  baseUrl?: string;
  endpoint?: string;
  model?: string;
}

/**
 * Normalizes OpenAI-compatible base URL or endpoint to standard /chat/completions.
 * Handles:
 * - https://api.openai.com/v1 -> https://api.openai.com/v1/chat/completions
 * - https://api.openai.com -> https://api.openai.com/v1/chat/completions
 * - http://localhost:11434/v1 -> http://localhost:11434/v1/chat/completions
 * - http://localhost:11434 -> http://localhost:11434/v1/chat/completions
 * - Full endpoint https://api.openai.com/v1/chat/completions -> kept as-is
 */
export function resolveChatCompletionsUrl(inputUrl?: string): string {
  let url = (inputUrl || '').trim();
  if (!url) {
    return 'https://api.openai.com/v1/chat/completions';
  }

  // Remove trailing slashes
  url = url.replace(/\/+$/, '');

  // If already pointing to /chat/completions
  if (url.endsWith('/chat/completions')) {
    return url;
  }

  // If ending in /v1
  if (url.endsWith('/v1')) {
    return `${url}/chat/completions`;
  }

  // If contains /v1/ (e.g. /api/v1)
  if (url.includes('/v1/')) {
    return `${url}/chat/completions`;
  }

  // Standard fallback: append /v1/chat/completions
  return `${url}/v1/chat/completions`;
}

export const STAFF_ARCHITECT_SYSTEM_PROMPT = `You are a Principal / Staff Infrastructure & Distributed Systems Architect with 25+ years of experience designing and operating mission-critical hyperscale platforms and modern AI infrastructure.

CRITICAL DIRECTIVES:
- Provide an uncompromising, rigorous, and ruthless technical critique of the architecture.
- ZERO fluff, ZERO pleasantries, and ZERO positive encouragement or cheerleading. Do not say "Great design!", "This is a good start", or "Overall solid". Dive directly into the technical flaws and architectural hazards.
- Unsparingly dissect architectural anti-patterns, single points of failure (SPOF), cascading failure modes, distributed race conditions, cross-region latency traps, missing backpressure / queuing, security/isolation bypasses, and unhandled edge cases.
- Offer authoritative, specific remediation advice (e.g., exact protocols, partition strategies, backpressure mechanisms, caching topologies, queueing semantics).
- Prioritize realistic edge cases: thundering herds, split-brain scenarios, unbounded queues, lack of idempotency, cascading timeouts, retry storms, hot-spotting, cold-start latency spikes.
`;

/**
 * Builds the optimal prompt for live connection critique by combining:
 * 1. The specific connection delta event (source -> target, protocol, RTT)
 * 2. Formal Verilog HDL Netlist representation (structural wire & port interconnect)
 * 3. Topology JSON (component specs, regions, concurrency limits, AI parameters)
 * 4. Simulated telemetry metrics (RPS, latencies, bottlenecks)
 */
export function buildConnectionCritiquePrompt(
  graph: SystemDesignGraph,
  newEdge: ConnectionEdge,
  fromNode: SystemNode,
  toNode: SystemNode,
  metrics?: SystemMetrics
): string {
  const verilogNetlist = generateVerilogHDL(graph);
  const topologyJson = generateTopologyJson(graph);

  const isCrossRegion = fromNode.config.region !== toNode.config.region;

  return `### EVENT: NEW CONNECTION CREATED IN CANVAS
The engineer just connected the following components in the system topology:
- **Wire ID**: \`${newEdge.id}\`
- **Source**: "${fromNode.config.label}" (Type: \`${fromNode.type}\`, Region: \`${fromNode.config.region}\`, Replicas: ${fromNode.config.replicas}, Concurrency/Replica: ${fromNode.config.maxConcurrencyPerReplica}, Base Latency: ${fromNode.config.baseLatencyMs}ms)
- **Target**: "${toNode.config.label}" (Type: \`${toNode.type}\`, Region: \`${toNode.config.region}\`, Replicas: ${toNode.config.replicas}, Concurrency/Replica: ${toNode.config.maxConcurrencyPerReplica}, Base Latency: ${toNode.config.baseLatencyMs}ms)
- **Protocol**: \`${newEdge.protocol}\`
- **Configured Base RTT**: ${newEdge.baseNetworkLatencyMs || 5}ms
- **Cross-Region**: ${isCrossRegion ? `YES (${fromNode.config.region} -> ${toNode.config.region})` : 'NO (Same region)'}
${fromNode.type === 'client' && toNode.type === 'database' ? '- ⚠️ CRITICAL FLAG: Direct Client-to-Database link detected!\n' : ''}${fromNode.type === 'client' && toNode.type === 'llm_server' ? '- ⚠️ CRITICAL FLAG: Direct Client-to-LLM link detected without rate limiter or API gateway!\n' : ''}
### FULL ARCHITECTURE INTERCONNECT NETLIST (Verilog HDL):
\`\`\`verilog
${verilogNetlist}
\`\`\`

### TOPOLOGY SPECIFICATION (JSON IR):
\`\`\`json
${topologyJson}
\`\`\`
${
  metrics
    ? `
### LIVE SIMULATION TELEMETRY:
- Target Ingress Load: ${metrics.currentRps} RPS
- Latencies: P50=${metrics.p50LatencyMs}ms | P95=${metrics.p95LatencyMs}ms | P99=${metrics.p99LatencyMs}ms
- Error Rate: ${metrics.errorRatePercent}%
- Saturated Nodes / Bottlenecks: ${JSON.stringify(metrics.bottlenecksDetected)}
`
    : ''
}
### EVALUATION INSTRUCTIONS:
Assess the implications of adding this specific connection into this architecture.
Format your response concisely using markdown with these 4 high-density sections:

#### 1. 🚨 Flaws & Anti-Patterns Introduced
Identify immediate structural defects, anti-patterns, or architectural violations caused by this link (e.g. bypassed API gateways, unauthenticated datastores, synchronous blocking coupling, missing load balancing).

#### 2. ⚡ Performance, Latency & Capacity Mismatches
Analyze capacity imbalances between source and target, cross-region latency penalties, head-of-line blocking, or lack of buffering.

#### 3. 🛡️ Critical Edge Cases & Failure Modes
Detail concrete failure scenarios: What happens during network partitions, upstream retries, downstream brownouts, or thundering herds?

#### 4. 🔧 Staff-Level Remediation
Give the exact, production-ready fix (e.g. "Introduce an asynchronous queue buffer (Kafka/RabbitMQ)", "Place a CDN/Cache in front of target", "Route through regional API Gateway with circuit breaker").
`;
}

/**
 * Builds the prompt for a full architectural critique.
 */
export function buildFullArchitectureCritiquePrompt(
  graph: SystemDesignGraph,
  metrics?: SystemMetrics
): string {
  const verilogNetlist = generateVerilogHDL(graph);
  const topologyJson = generateTopologyJson(graph);

  return `### FULL SYSTEM DESIGN ARCHITECTURE TO CRITIQUE

### Interconnect Netlist (Verilog HDL):
\`\`\`verilog
${verilogNetlist}
\`\`\`

### Intermediate Representation & Specs:
\`\`\`json
${topologyJson}
\`\`\`
${
  metrics
    ? `
### Live Simulation Load Telemetry:
- Current Load: ${metrics.currentRps} RPS
- Latencies: P50=${metrics.p50LatencyMs}ms, P95=${metrics.p95LatencyMs}ms, P99=${metrics.p99LatencyMs}ms
- Error Rate: ${metrics.errorRatePercent}%
- Saturated Nodes / Bottlenecks: ${JSON.stringify(metrics.bottlenecksDetected)}
`
    : ''
}
### EVALUATION INSTRUCTIONS:
Perform a ruthless, principal-engineer level architectural audit.
Format your review with:
1. 🚨 **Single Points of Failure (SPOF) & Redundancy Defects**
2. ⚡ **Performance Bottlenecks & Capacity Imbalances**
3. 🛡️ **Edge Cases & Distributed Failure Modes** (partition tolerance, split brain, cascading timeouts)
4. 🤖 **AI/LLM/RAG Pipeline Inefficiencies** (if applicable: missing semantic cache, unbatched inference, retrieval latency)
5. 🔧 **Priority Architectural Remedies** (concrete architectural fixes)
`;
}

/**
 * Sends a critique request to an OpenAI-compatible endpoint.
 */
export async function requestOpenAiCritique(
  config: LlmCritiqueConfig,
  prompt: string,
  signal?: AbortSignal
): Promise<string> {
  const cleanKey = (config.apiKey || '').trim();
  if (!cleanKey) {
    throw new Error('API token is missing. Please provide an OpenAI-compatible API key.');
  }

  const rawUrl = config.baseUrl || config.endpoint || 'https://api.openai.com/v1';
  const endpoint = resolveChatCompletionsUrl(rawUrl);

  const model =
    config.model && config.model.trim() ? config.model.trim() : 'gpt-4o';

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${cleanKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: STAFF_ARCHITECT_SYSTEM_PROMPT },
        { role: 'user', content: prompt },
      ],
      temperature: 0.2,
      max_tokens: 1500,
    }),
    signal,
  });

  if (!response.ok) {
    let errorDetail = `HTTP ${response.status} ${response.statusText}`;
    try {
      const errJson = await response.json();
      if (errJson?.error?.message) {
        errorDetail = errJson.error.message;
      }
    } catch {
      // ignore json parse error
    }

    if (response.status === 401) {
      throw new Error(`Unauthorized (401): Invalid API token. Please check your token.`);
    }
    if (response.status === 429) {
      throw new Error(`Rate limited (429): ${errorDetail}`);
    }
    throw new Error(`LLM API Error (${response.status}): ${errorDetail}`);
  }

  const data = await response.json();
  const content = data?.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error('LLM returned an empty response.');
  }

  return content;
}
