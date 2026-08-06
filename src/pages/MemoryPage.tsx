import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { BrainCircuit, Grid3x3, Maximize2, Network, Palette } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { graphMemory, type EntityRelation, type GraphPayload, type Memory, type SimilarHit, type GraphMemoryStats } from '../services/graphMemory';
import { GraphMemoryView, type GraphMemoryViewHandle, type NodeSizeBy } from '../components/GraphMemoryView';

const SIZE_BY_OPTIONS: Array<{ label: string; value: NodeSizeBy }> = [
    { label: 'Size: Connections', value: 'connections' },
    { label: 'Size: Content length', value: 'length' },
    { label: 'Size: Uniform', value: 'uniform' },
];

const LEGEND_ITEMS: Array<{ label: string; color: string; shape: 'dot' | 'line' | 'dashed-line' }> = [
    { label: 'Memory', color: '#5b8def', shape: 'dot' },
    { label: 'Entity', color: '#f59e0b', shape: 'dot' },
    { label: 'Selected', color: '#ef4444', shape: 'dot' },
    { label: 'Relation', color: '#64748b', shape: 'line' },
    { label: 'Similarity', color: '#10b981', shape: 'dashed-line' },
];

const BACKGROUND_PRESETS = [
    { label: 'Void', value: '#020617' },
    { label: 'Slate', value: '#0f172a' },
    { label: 'Black', value: '#000000' },
    { label: 'Indigo', value: '#1e1b4b' },
] as const;

const toolbarButtonStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '0.4rem',
    borderRadius: 'var(--r-md)',
    border: '1px solid var(--border-color)',
    background: 'var(--bg-color)',
    color: 'var(--text-primary)',
    cursor: 'pointer',
    fontSize: '0.8rem',
};

// Backed by xibalba-graph-memory's local_api.py (a separate local project/process, see
// src/config.ts's GRAPH_MEMORY_URL) -- not this repo's own oracle/userapi/bccMiddleware
// backends. Read-only: this page never writes to the store.

function RelationTag({ relation }: { relation: EntityRelation }) {
    return (
        <span
            style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.3rem',
                padding: '0.2rem 0.6rem',
                borderRadius: '999px',
                background: 'rgba(16, 185, 129, 0.12)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                fontSize: '0.72rem',
                color: 'var(--text-primary)',
                whiteSpace: 'nowrap',
            }}
        >
            <span style={{ color: 'var(--accent-color)', fontWeight: 600 }}>{relation.predicate}</span>
            <span style={{ color: 'var(--text-secondary)' }}>{relation.object}</span>
        </span>
    );
}

function Legend() {
    return (
        <div
            style={{
                position: 'absolute',
                bottom: '1rem',
                left: '1rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.35rem',
                padding: '0.6rem 0.75rem',
                borderRadius: 'var(--r-md)',
                background: 'rgba(2, 6, 23, 0.65)',
                border: '1px solid var(--border-color)',
                fontSize: '0.72rem',
                color: 'var(--text-secondary)',
                pointerEvents: 'none',
            }}
        >
            {LEGEND_ITEMS.map((item) => (
                <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {item.shape === 'dot' ? (
                        <span style={{ width: '9px', height: '9px', borderRadius: '50%', background: item.color, flexShrink: 0 }} />
                    ) : (
                        <span
                            style={{
                                width: '16px',
                                height: 0,
                                borderTop: `2px ${item.shape === 'dashed-line' ? 'dashed' : 'solid'} ${item.color}`,
                                flexShrink: 0,
                            }}
                        />
                    )}
                    {item.label}
                </div>
            ))}
        </div>
    );
}

function SidePanel({ memoryId, onSelectMemory }: { memoryId: string; onSelectMemory: (id: string) => void }) {
    const [memory, setMemory] = useState<Memory | null>(null);
    const [similar, setSimilar] = useState<SimilarHit[] | null>(null);
    const [neighbors, setNeighbors] = useState<EntityRelation[] | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        setMemory(null);
        setSimilar(null);
        setNeighbors(null);
        setError(null);
        graphMemory.memory(memoryId).then(setMemory).catch((e) => setError(String(e)));
        graphMemory.similar(memoryId).then(setSimilar).catch(() => setSimilar([]));
        graphMemory.neighbors(memoryId).then(setNeighbors).catch(() => setNeighbors([]));
    }, [memoryId]);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '0.85rem' }}>
            {error && <p style={{ color: '#ef4444' }}>{error}</p>}
            {memory && (
                <div>
                    <h4 style={{ margin: '0 0 0.25rem 0', color: 'var(--text-primary)' }}>
                        {(memory.source.metadata.title as string) ?? memory.source.kind}
                    </h4>
                    <p style={{ margin: '0 0 0.75rem 0', color: 'var(--text-secondary)', fontSize: '0.75rem' }}>
                        {memory.status} &middot; {memory.evidence_class} &middot; {memory.source.kind}
                    </p>
                    <div className="memory-markdown" style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', lineHeight: 1.5 }}>
                        <ReactMarkdown>{memory.content.slice(0, 3000)}</ReactMarkdown>
                    </div>
                </div>
            )}
            {neighbors && neighbors.length > 0 && (
                <div>
                    <h5 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-secondary)', textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: '0.04em' }}>
                        Entity relations
                    </h5>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                        {neighbors.map((r, i) => (
                            <RelationTag key={i} relation={r} />
                        ))}
                    </div>
                </div>
            )}
            {similar && similar.length > 0 && (
                <div>
                    <h5 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-secondary)', textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: '0.04em' }}>
                        Similar memories
                    </h5>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                        {similar.map((hit) => (
                            <div
                                key={hit.memory.id}
                                style={{ cursor: 'pointer' }}
                                onClick={() => onSelectMemory(hit.memory.id)}
                            >
                                <span style={{ fontFamily: 'monospace', color: 'var(--accent-color)' }}>
                                    {hit.cosine_similarity.toFixed(2)}
                                </span>{' '}
                                {hit.memory.content.slice(0, 80)}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

export default function MemoryPage() {
    const [graph, setGraph] = useState<GraphPayload | null>(null);
    const [stats, setStats] = useState<GraphMemoryStats | null>(null);
    const [query, setQuery] = useState('');
    const [searchResults, setSearchResults] = useState<Memory[] | null>(null);
    const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [showGrid, setShowGrid] = useState(true);
    const [backgroundColor, setBackgroundColor] = useState<string>(BACKGROUND_PRESETS[0].value);
    const [showMemories, setShowMemories] = useState(true);
    const [showEntities, setShowEntities] = useState(true);
    const [showRelationEdges, setShowRelationEdges] = useState(true);
    const [showSimilarityEdges, setShowSimilarityEdges] = useState(true);
    const [similarityThreshold, setSimilarityThreshold] = useState(0.75);
    const [sizeBy, setSizeBy] = useState<NodeSizeBy>('connections');
    const graphViewRef = useRef<GraphMemoryViewHandle>(null);

    useEffect(() => {
        graphMemory.stats().then(setStats).catch((e) => setError(String(e)));
    }, []);

    // Similarity threshold is a real server-side parameter (graph_payload() computes
    // similarity-edges above it via pairwise cosine similarity) -- refetch on change rather than
    // filtering client-side, since edges below the old threshold were never sent down at all.
    useEffect(() => {
        const timeout = setTimeout(() => {
            graphMemory.graph(500, similarityThreshold).then(setGraph).catch((e) => setError(String(e)));
        }, 200);
        return () => clearTimeout(timeout);
    }, [similarityThreshold]);

    // Type/connection filters (show/hide memory or entity nodes, relation or similarity edges)
    // are client-side -- memoized so toggling one doesn't create a new object on every unrelated
    // re-render (e.g. selecting a node), which would otherwise reset GraphMemoryView's force
    // simulation and grid-snap timers every time the side panel opens.
    const filteredGraph = useMemo<GraphPayload | null>(() => {
        if (!graph) return null;
        const visibleNodes = graph.nodes.filter((n) => (n.type === 'memory' ? showMemories : showEntities));
        const visibleIds = new Set(visibleNodes.map((n) => n.id));
        const visibleEdges = graph.edges.filter((e) => {
            if (!visibleIds.has(e.source) || !visibleIds.has(e.target)) return false;
            return e.type === 'relation' ? showRelationEdges : showSimilarityEdges;
        });
        return { nodes: visibleNodes, edges: visibleEdges };
    }, [graph, showMemories, showEntities, showRelationEdges, showSimilarityEdges]);

    useEffect(() => {
        if (!query.trim()) {
            setSearchResults(null);
            return;
        }
        const timeout = setTimeout(() => {
            graphMemory.search(query).then(setSearchResults).catch(() => setSearchResults([]));
        }, 250);
        return () => clearTimeout(timeout);
    }, [query]);

    const selectedMemoryId =
        selectedNodeId && selectedNodeId.startsWith('memory:') ? selectedNodeId.slice('memory:'.length) : null;

    return (
        // height:100vh (not %) + overflow:hidden, deliberately: MainAppLayout's ancestor chain
        // only sets minHeight (by design, so normal pages can scroll/grow), which gives
        // height:100% no definite basis to resolve against. Combined with the 3D canvas sizing
        // itself off a ResizeObserver on ITS container, that indeterminate height became a
        // feedback loop: canvas asks for space -> container grows to fit -> ResizeObserver
        // reports the bigger size -> canvas grows again. Confirmed empirically -- the canvas's
        // own height reached 2232px before this fix. A hard 100vh here breaks the loop by giving
        // this page a size that doesn't depend on its children's content at all.
        <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden', color: 'var(--text-primary)', padding: '1.5rem', gap: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
                <div>
                    <h2 style={{ margin: '0 0 0.25rem 0', display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--text-primary)' }}>
                        <BrainCircuit size={26} /> Memory
                    </h2>
                    {stats && (
                        <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                            {stats.memories} memories &middot; {stats.entities} entities &middot; {stats.relations} relations &middot;{' '}
                            {stats.embedded_memories} embedded
                        </p>
                    )}
                </div>
                {error && (
                    <p style={{ color: '#ef4444', margin: 0, fontSize: '0.85rem' }}>
                        {error} -- is xibalba_graph.local_api running (see src/config.ts's GRAPH_MEMORY_URL)?
                    </p>
                )}
            </div>

            <div style={{ flex: 1, display: 'flex', gap: '1rem', minHeight: 0 }}>
                {/* The graph itself lives in its own bordered "window" (reusing the dashboard's
                    .panel chrome, same as every other bordered section on this page) rather than
                    bleeding into the page background. */}
                <div className="panel" style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                    <div className="panel-header">
                        <div className="panel-title">
                            <Network size={18} style={{ color: 'var(--accent-color)' }} /> Memory Graph
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <input
                                type="text"
                                placeholder="Search memories..."
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                style={{
                                    padding: '0.4rem 0.65rem',
                                    borderRadius: 'var(--r-md)',
                                    border: '1px solid var(--border-color)',
                                    background: 'var(--bg-color)',
                                    color: 'var(--text-primary)',
                                    minWidth: '220px',
                                    fontSize: '0.85rem',
                                }}
                            />
                            <button
                                type="button"
                                title="Zoom to fit"
                                onClick={() => graphViewRef.current?.zoomToFit()}
                                style={toolbarButtonStyle}
                            >
                                <Maximize2 size={16} />
                            </button>
                            <button
                                type="button"
                                title={showGrid ? 'Hide grid' : 'Show grid'}
                                onClick={() => setShowGrid((v) => !v)}
                                style={{ ...toolbarButtonStyle, color: showGrid ? 'var(--accent-color)' : 'var(--text-secondary)' }}
                            >
                                <Grid3x3 size={16} />
                            </button>
                            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                                <Palette size={16} style={{ position: 'absolute', left: '0.5rem', color: 'var(--text-secondary)', pointerEvents: 'none' }} />
                                <select
                                    value={backgroundColor}
                                    onChange={(e) => setBackgroundColor(e.target.value)}
                                    title="Background color"
                                    style={{
                                        ...toolbarButtonStyle,
                                        paddingLeft: '1.75rem',
                                        paddingRight: '0.5rem',
                                        appearance: 'none',
                                    }}
                                >
                                    {BACKGROUND_PRESETS.map((preset) => (
                                        <option key={preset.value} value={preset.value}>
                                            {preset.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <select
                                value={sizeBy}
                                onChange={(e) => setSizeBy(e.target.value as NodeSizeBy)}
                                title="What node size represents"
                                style={{ ...toolbarButtonStyle, paddingRight: '0.5rem', appearance: 'none' }}
                            >
                                {SIZE_BY_OPTIONS.map((opt) => (
                                    <option key={opt.value} value={opt.value}>
                                        {opt.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '1.25rem',
                            padding: '0.5rem 1.25rem',
                            borderBottom: '1px solid var(--border-color)',
                            background: 'rgba(0, 0, 0, 0.08)',
                            fontSize: '0.78rem',
                            color: 'var(--text-secondary)',
                            flexWrap: 'wrap',
                        }}
                    >
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', cursor: 'pointer' }}>
                            <input type="checkbox" checked={showMemories} onChange={(e) => setShowMemories(e.target.checked)} />
                            Memories
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', cursor: 'pointer' }}>
                            <input type="checkbox" checked={showEntities} onChange={(e) => setShowEntities(e.target.checked)} />
                            Entities
                        </label>
                        <span style={{ width: '1px', height: '16px', background: 'var(--border-color)' }} />
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', cursor: 'pointer' }}>
                            <input type="checkbox" checked={showRelationEdges} onChange={(e) => setShowRelationEdges(e.target.checked)} />
                            Relations
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', cursor: 'pointer' }}>
                            <input type="checkbox" checked={showSimilarityEdges} onChange={(e) => setShowSimilarityEdges(e.target.checked)} />
                            Similarity edges
                        </label>
                        <span style={{ width: '1px', height: '16px', background: 'var(--border-color)' }} />
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            Similarity threshold: {similarityThreshold.toFixed(2)}
                            <input
                                type="range"
                                min={0.5}
                                max={0.99}
                                step={0.01}
                                value={similarityThreshold}
                                onChange={(e) => setSimilarityThreshold(Number(e.target.value))}
                                style={{ width: '140px' }}
                            />
                        </label>
                    </div>
                    <div style={{ flex: 1, minHeight: 0, position: 'relative' }}>
                        {filteredGraph ? (
                            <>
                                <GraphMemoryView
                                    ref={graphViewRef}
                                    data={filteredGraph}
                                    onNodeClick={setSelectedNodeId}
                                    selectedNodeId={selectedNodeId}
                                    showGrid={showGrid}
                                    backgroundColor={backgroundColor}
                                    sizeBy={sizeBy}
                                />
                                <Legend />
                            </>
                        ) : (
                            !error && (
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-secondary)' }}>
                                    <Network size={20} style={{ marginRight: '0.5rem' }} /> Loading graph...
                                </div>
                            )
                        )}
                    </div>
                </div>

                {searchResults && (
                    <div className="panel" style={{ width: '320px', flexShrink: 0, padding: '1rem', overflowY: 'auto', fontSize: '0.85rem' }}>
                        <h5 style={{ margin: '0 0 0.75rem 0', color: 'var(--text-secondary)', textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: '0.04em' }}>
                            Search results
                        </h5>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            {searchResults.map((m) => (
                                <div key={m.id} style={{ cursor: 'pointer' }} onClick={() => setSelectedNodeId(`memory:${m.id}`)}>
                                    {m.content.slice(0, 100)}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
                {selectedMemoryId && (
                    <div className="panel" style={{ width: '360px', flexShrink: 0, padding: '1rem', overflowY: 'auto', position: 'relative' }}>
                        <button
                            onClick={() => setSelectedNodeId(null)}
                            style={{ position: 'absolute', top: '0.5rem', right: '0.75rem', background: 'none', border: 'none', fontSize: '1.25rem', color: 'var(--text-secondary)', cursor: 'pointer' }}
                        >
                            &times;
                        </button>
                        <SidePanel memoryId={selectedMemoryId} onSelectMemory={(id) => setSelectedNodeId(`memory:${id}`)} />
                    </div>
                )}
            </div>
        </div>
    );
}
