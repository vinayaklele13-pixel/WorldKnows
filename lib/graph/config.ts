/**
 * ============================================================================
 * Knowledge Graph 2.0 Centralized Configuration & Limits (`lib/graph/config.ts`)
 * ============================================================================
 *
 * Centralized server-side limits for graph size, depth, extraction, and context.
 */

export const GRAPH_LIMITS = {
  MAX_NODES: 50,
  MAX_EDGES: 100,
  MAX_TRAVERSAL_DEPTH: 3,
  MAX_SOURCES_PER_EXTRACTION: 10,
  MAX_AI_CONTEXT_CHARS: 15000,
  MAX_QUERY_LENGTH: 500,
  MAX_RELATED_ENTITIES_PER_NODE: 15,
};
