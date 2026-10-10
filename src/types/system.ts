export type ComponentType =
  | 'client'
  | 'cdn_edge'
  | 'api_gateway'
  | 'load_balancer'
  | 'service'
  | 'llm_server'
  | 'rag_pipeline'
  | 'mcp_server'
  | 'vector_db'
  | 'cache'
  | 'database'
  | 'message_queue'
  | 'worker'
  | 'storage'
  | 'region_zone'
  | 'generic';

export type RegionId =
  | 'global'
  | 'us-east-1'
  | 'us-west-2'
  | 'eu-central-1'
  | 'ap-southeast-1'
  | 'sa-east-1';

export interface ComponentConfig {
  label: string;
  type: ComponentType;
  region: RegionId;
  // Compute & concurrency specs
  replicas: number;
  maxConcurrencyPerReplica: number;
  baseLatencyMs: number;
  // Specific behaviors
  cacheHitRatio?: number; // 0..1 (for cache, cdn)
  failureRate?: number; // 0..1 (simulated internal error)
  timeoutMs?: number;
  costPerHour?: number; // for cloud cost estimation
  // AI specific specs
  modelName?: string;
  tokensPerSec?: number;
  ttftMs?: number; // Time To First Token
  contextWindow?: number;
  mcpToolsCount?: number;
  // State
  isDegraded?: boolean;
  isKilled?: boolean;
}

export interface SystemNode {
  id: string;
  type: ComponentType;
  x: number;
  y: number;
  width: number;
  height: number;
  config: ComponentConfig;
  // Optional style customization
  customColor?: string;
  annotationText?: string;
}

export interface ConnectionEdge {
  id: string;
  fromNodeId: string;
  toNodeId: string;
  fromPort?: 'top' | 'right' | 'bottom' | 'left';
  toPort?: 'top' | 'right' | 'bottom' | 'left';
  label?: string;
  protocol: 'HTTP' | 'gRPC' | 'TCP' | 'ASYNC' | 'MCP_IPC';
  baseNetworkLatencyMs?: number; // Cross-region or local RTT
  bandwidthMbps?: number;
  isRedundant?: boolean; // Hot standby or secondary route
  weight?: number; // Traffic distribution weight (0..100)
}

export interface FreehandAnnotation {
  id: string;
  type: 'pencil' | 'sticky' | 'text' | 'rect_zone';
  x: number;
  y: number;
  width?: number;
  height?: number;
  points?: Array<{ x: number; y: number }>; // For pencil freehand
  text?: string;
  color?: string;
  fontSize?: number;
}

export interface SystemMetrics {
  totalRequestsProcessed: number;
  currentRps: number;
  p50LatencyMs: number;
  p95LatencyMs: number;
  p99LatencyMs: number;
  errorRatePercent: number;
  bottlenecksDetected: Array<{
    nodeId: string;
    nodeLabel: string;
    reason: string;
    severity: 'critical' | 'warning' | 'info';
    suggestedFix: string;
  }>;
  totalMonthlyCostEstimate: number;
  nodeMetrics: Record<
    string,
    {
      inRps: number;
      outRps: number;
      activeConcurrency: number;
      utilizationPercent: number;
      avgLatencyMs: number;
      droppedRequests: number;
      status: 'healthy' | 'warning' | 'critical' | 'dead';
    }
  >;
  edgeMetrics: Record<
    string,
    {
      activeInFlight: number;
      latencyMs: number;
      throughputRps: number;
    }
  >;
}

export interface SimulationSettings {
  isPlaying: boolean;
  speedMultiplier: number; // 0.5x, 1x, 2x, 5x
  globalTargetRps: number; // 100 .. 20,000
  clientRegion: RegionId; // Traffic origin
  trafficProfile: 'steady' | 'spike' | 'chaos_monkey' | 'ddos';
  networkJitterEnabled: boolean;
}

export interface DiscussionPoint {
  id: string;
  category: 'pro' | 'con' | 'tradeoff';
  title: string;
  content: string;
  authorRole?: string;
  tags?: string[];
  severity?: 'critical' | 'high' | 'medium' | 'info';
  impact?: 'high' | 'medium' | 'low';
  mitigationOrAlternative?: string;
}

export interface StaffQnA {
  id: string;
  question: string;
  answer: string;
  authorRole: string;
  keyTakeaway: string;
}

export interface SystemDiscussion {
  templateId?: string;
  isPreloaded?: boolean;
  summary: string;
  overviewRecommendation: string;
  pros: DiscussionPoint[];
  cons: DiscussionPoint[];
  tradeoffs: Array<{
    dimension: string;
    chosenStrategy: string;
    reasoning: string;
  }>;
  staffQnA: StaffQnA[];
  capacityEstimation?: {
    dailyActiveUsers?: string;
    readWriteRatio?: string;
    peakRps?: string;
    storagePerYear?: string;
    bandwidthRequirement?: string;
  };
}

export interface SystemDesignGraph {
  nodes: SystemNode[];
  edges: ConnectionEdge[];
  annotations: FreehandAnnotation[];
  meta: {
    name: string;
    description: string;
    author?: string;
    version: number;
    updatedAt: string;
    templateId?: string;
  };
  discussion?: SystemDiscussion;
}
