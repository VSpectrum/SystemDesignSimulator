import { SystemDesignGraph, SystemDiscussion } from '../types/system';
import { urlShortenerGraph, urlShortenerDiscussion } from './templates/urlShortener';
import { twitterFeedGraph, twitterFeedDiscussion } from './templates/twitterFeed';
import { netflixStreamingGraph, netflixStreamingDiscussion } from './templates/netflixStreaming';
import { uberDispatchGraph, uberDispatchDiscussion } from './templates/uberDispatch';
import { whatsappMessengerGraph, whatsappMessengerDiscussion } from './templates/whatsappMessenger';
import { webCrawlerGraph, webCrawlerDiscussion } from './templates/webCrawler';
import { rateLimiterGraph, rateLimiterDiscussion } from './templates/rateLimiter';
import { flashSaleGraph, flashSaleDiscussion } from './templates/flashSale';
import { googleDocsGraph, googleDocsDiscussion } from './templates/googleDocs';
import { genaiRagGraph, genaiRagDiscussion } from './templates/genaiRag';

export interface ArchitectureTemplate {
  id: string;
  name: string;
  category:
    | 'Classic Interview'
    | 'Social & Streaming'
    | 'Real-Time & Distributed'
    | 'High Concurrency & E-Commerce'
    | 'AI / GenAI';
  description: string;
  graph: SystemDesignGraph;
  discussion: SystemDiscussion;
}

export const ARCHITECTURE_TEMPLATES: ArchitectureTemplate[] = [
  {
    id: 'url-shortener',
    name: '1. URL Shortener (TinyURL / Bitly)',
    category: 'Classic Interview',
    description:
      'High-throughput read-heavy URL shortener with Base62 KGS (Key Generation Service), distributed Redis LRU caching, and Kafka clickstream analytics.',
    graph: urlShortenerGraph,
    discussion: urlShortenerDiscussion,
  },
  {
    id: 'twitter-timeline',
    name: '2. Twitter / X Timeline & Fan-out',
    category: 'Social & Streaming',
    description:
      '500M tweets/day feed generation with Hybrid Fan-out (push for normal users, pull for celebrities) and in-memory Redis timeline lists.',
    graph: twitterFeedGraph,
    discussion: twitterFeedDiscussion,
  },
  {
    id: 'netflix-streaming',
    name: '3. Netflix Video Streaming & Transcoding',
    category: 'Social & Streaming',
    description:
      'Global video delivery decoupled into AWS cloud control plane and ISP-embedded Open Connect CDN appliances with adaptive bitrate chunking.',
    graph: netflixStreamingGraph,
    discussion: netflixStreamingDiscussion,
  },
  {
    id: 'uber-dispatch',
    name: '4. Uber / Ride-Hailing Geospatial Dispatch',
    category: 'Real-Time & Distributed',
    description:
      'Real-time geospatial matching with high-frequency GPS pings (every 4s), Uber H3 hexagonal spatial indexing, and atomic trip reservation.',
    graph: uberDispatchGraph,
    discussion: uberDispatchDiscussion,
  },
  {
    id: 'whatsapp-messenger',
    name: '5. WhatsApp / Discord Scalable Chat',
    category: 'Real-Time & Distributed',
    description:
      'Billion-user bi-directional messaging with persistent Erlang/Go WebSocket gateways, Redis session registry, E2EE, and Cassandra message archive.',
    graph: whatsappMessengerGraph,
    discussion: whatsappMessengerDiscussion,
  },
  {
    id: 'web-crawler',
    name: '6. Web Crawler & Indexer (Googlebot)',
    category: 'Classic Interview',
    description:
      'Billion-page distributed web crawler with two-stage URL Frontier politeness scheduling, SimHash deduplication, and inverted index pipelines.',
    graph: webCrawlerGraph,
    discussion: webCrawlerDiscussion,
  },
  {
    id: 'rate-limiter',
    name: '7. Distributed Rate Limiter (Stripe / Cloudflare)',
    category: 'High Concurrency & E-Commerce',
    description:
      'Sub-2ms latency distributed rate limiter using atomic Redis Lua scripts, Sliding Window Counters, and L1 in-memory token bucket caches.',
    graph: rateLimiterGraph,
    discussion: rateLimiterDiscussion,
  },
  {
    id: 'flash-sale',
    name: '8. Flash Sale & Ticketmaster Inventory',
    category: 'High Concurrency & E-Commerce',
    description:
      '100k+ TPS flash sales with CDN virtual waiting rooms, Redis atomic inventory pre-allocation (Lua), and asynchronous transactional outbox settlement.',
    graph: flashSaleGraph,
    discussion: flashSaleDiscussion,
  },
  {
    id: 'google-docs-crdt',
    name: '9. Google Docs Real-Time Editor (CRDTs)',
    category: 'Real-Time & Distributed',
    description:
      'Collaborative document editing with mathematical CRDT conflict resolution (Yjs), document-affinity WebSocket routing, and snapshot compaction.',
    graph: googleDocsGraph,
    discussion: googleDocsDiscussion,
  },
  {
    id: 'genai-rag-mcp',
    name: '10. Enterprise GenAI RAG & MCP Agents',
    category: 'AI / GenAI',
    description:
      'High-throughput AI pipeline featuring vLLM GPU inference with PagedAttention, Redis Semantic Cache, vector retrieval, and MCP sandboxes.',
    graph: genaiRagGraph,
    discussion: genaiRagDiscussion,
  },
];
