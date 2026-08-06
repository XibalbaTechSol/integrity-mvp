import { GRAPH_MEMORY_URL } from '../config';

// Mirrors xibalba_graph.local_api's routes exactly, which themselves are thin wrappers around
// GraphStore's own methods (store.py) -- no response envelope, each route just returns the
// JSON the underlying GraphStore method returned.

export interface GraphNode {
    id: string;
    type: 'memory' | 'entity';
    label: string;
    status?: string;
    evidence_class?: string;
    source_kind?: string;
    entity_type?: string;
}

export interface GraphEdge {
    source: string;
    target: string;
    type: 'relation' | 'similarity';
    predicate?: string;
    cosine_similarity?: number;
}

export interface GraphPayload {
    nodes: GraphNode[];
    edges: GraphEdge[];
}

export interface MemorySource {
    kind: string;
    locator?: string | null;
    role?: string | null;
    session_id?: string | null;
    metadata: Record<string, unknown>;
}

export interface Memory {
    id: string;
    content: string;
    content_hash: string;
    status: string;
    source: MemorySource;
    quarantine_reasons: string[];
    supersedes_id: string | null;
    evidence_class: string;
    cosine_similarity?: number;
}

export interface SimilarHit {
    memory: Memory;
    cosine_similarity: number;
}

export interface EntityRelation {
    subject: string;
    predicate: string;
    object: string;
}

export interface GraphMemoryStats {
    memories: number;
    entities: number;
    relations: number;
    sessions: number;
    embedded_memories: number;
}

async function getJson<T>(path: string): Promise<T> {
    const response = await fetch(`${GRAPH_MEMORY_URL}${path}`);
    if (!response.ok) {
        const body = await response.json().catch(() => ({ error: response.statusText }));
        throw new Error(body.error ?? `request failed: ${response.status}`);
    }
    return response.json() as Promise<T>;
}

export const graphMemory = {
    stats: () => getJson<GraphMemoryStats>('/api/stats'),
    graph: (limit = 500, similarityThreshold = 0.75) =>
        getJson<GraphPayload>(`/api/graph?limit=${limit}&similarity_threshold=${similarityThreshold}`),
    search: (query: string, limit = 20) =>
        getJson<Memory[]>(`/api/search?q=${encodeURIComponent(query)}&limit=${limit}`),
    memory: (id: string) => getJson<Memory>(`/api/memory/${encodeURIComponent(id)}`),
    similar: (id: string, limit = 10) =>
        getJson<SimilarHit[]>(`/api/memory/${encodeURIComponent(id)}/similar?limit=${limit}`),
    neighbors: (id: string) => getJson<EntityRelation[]>(`/api/memory/${encodeURIComponent(id)}/neighbors`),
};
