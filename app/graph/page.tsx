'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import WorldKnowsSidebar from '@/components/layout/WorldKnowsSidebar';
import KnowledgeGraph2 from '@/components/graph/KnowledgeGraph2';
import EntityInspector from '@/components/graph/EntityInspector';
import { Network, Sparkles, Search, ArrowLeft, Loader2, AlertCircle } from 'lucide-react';

function GraphExplorerContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawQuery = searchParams.get('q') || 'Artificial Intelligence';
  const researchId = searchParams.get('researchId') || undefined;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [graphData, setGraphData] = useState<{
    nodes: any[];
    edges: any[];
    sources: any[];
  }>({ nodes: [], edges: [], sources: [] });

  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [searchQueryInput, setSearchQueryInput] = useState(rawQuery);

  useEffect(() => {
    let isMounted = true;
    async function fetchGraph() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch('/api/knowledge-graph', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query: rawQuery,
            researchId,
          }),
        });

        if (!res.ok) {
          const errJson = await res.json().catch(() => ({}));
          throw new Error(errJson.error || `Failed to generate knowledge graph (status ${res.status})`);
        }

        const data = await res.json();
        if (isMounted && data.graph) {
          setGraphData(data.graph);
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err.message || 'An error occurred while generating the graph.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    fetchGraph();

    return () => {
      isMounted = false;
    };
  }, [rawQuery, researchId]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQueryInput.trim()) return;
    router.push(`/graph?q=${encodeURIComponent(searchQueryInput.trim())}`);
  };

  const selectedNode = graphData.nodes.find(n => n.id === selectedNodeId) || null;

  return (
    <div className="min-h-screen bg-[#09090B] text-[#FAFAFA] flex flex-col selection:bg-indigo-500/30 selection:text-white">
      {/* Sidebar */}
      <WorldKnowsSidebar initialQuery={rawQuery} />

      {/* Main Content */}
      <div className="lg:pl-64 flex-1 flex flex-col min-h-screen">
        <main className="flex-1 max-w-[1600px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
          {/* Top Header & Search Bar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-[#27272A]/60">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 uppercase tracking-widest">
                  KNOWLEDGE GRAPH 2.0
                </span>
                <span className="text-xs text-[#71717A] font-mono">
                  {graphData.nodes.length} Nodes • {graphData.edges.length} Connections • {graphData.sources.length} Sources
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#FAFAFA] flex items-center gap-2">
                <Network className="w-7 h-7 text-indigo-400" />
                <span>Exploration: {rawQuery}</span>
              </h1>
            </div>

            <div className="flex items-center gap-3">
              <form onSubmit={handleSearchSubmit} className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#71717A]" />
                  <input
                    type="text"
                    value={searchQueryInput}
                    onChange={(e) => setSearchQueryInput(e.target.value)}
                    placeholder="Explore new topic..."
                    className="w-64 sm:w-80 bg-[#111113] border border-[#27272A] rounded-xl pl-9 pr-4 py-2 text-sm text-[#FAFAFA] placeholder-[#71717A] focus:outline-none focus:border-indigo-500 transition-all"
                  />
                </div>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition-all shadow-md shadow-indigo-600/20"
                >
                  Explore
                </button>
              </form>
              <button
                onClick={() => router.push(`/search?q=${encodeURIComponent(rawQuery)}`)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#111113] border border-[#27272A] hover:border-indigo-500/50 text-xs font-medium text-[#A1A1AA] hover:text-[#FAFAFA] transition-all"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to Search</span>
              </button>
            </div>
          </div>

          {/* Graph Visualization Container */}
          {loading ? (
            <div className="w-full h-[650px] rounded-2xl border border-[#27272A]/60 bg-[#111113]/40 flex flex-col items-center justify-center space-y-3">
              <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
              <p className="text-sm text-[#A1A1AA]">Extracting entities, relationships & supporting evidence...</p>
            </div>
          ) : error ? (
            <div className="p-8 rounded-2xl bg-[#111113] border border-red-500/30 text-center space-y-3 my-12">
              <AlertCircle className="w-8 h-8 text-red-400 mx-auto" />
              <h2 className="text-lg font-bold text-[#FAFAFA]">Graph Generation Error</h2>
              <p className="text-sm text-[#A1A1AA]">{error}</p>
            </div>
          ) : (
            <div className="relative w-full">
              <KnowledgeGraph2
                nodes={graphData.nodes}
                edges={graphData.edges}
                selectedNodeId={selectedNodeId}
                onNodeClick={(id) => setSelectedNodeId(id)}
              />

              {/* Entity Inspector Side Panel */}
              <EntityInspector
                entity={selectedNode}
                relationships={graphData.edges}
                nodes={graphData.nodes}
                sources={graphData.sources}
                onClose={() => setSelectedNodeId(null)}
              />
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default function GraphExplorerPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#09090B] flex items-center justify-center text-[#A1A1AA]">
        <Loader2 className="w-6 h-6 animate-spin text-indigo-400 mr-2" /> Loading Knowledge Graph 2.0...
      </div>
    }>
      <GraphExplorerContent />
    </Suspense>
  );
}
