'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import WorldKnowsSidebar from '@/components/layout/WorldKnowsSidebar';
import QuickAnswer from '@/components/search/QuickAnswer';
import KeyFacts from '@/components/search/KeyFacts';
import SourceList from '@/components/search/SourceList';
import RelatedTopics from '@/components/search/RelatedTopics';
import DetailedSections from '@/components/search/DetailedSections';
import SearchSkeleton from '@/components/search/SearchSkeleton';
import KnowledgeGraph from '@/components/graph/KnowledgeGraph';
import BookmarkButton from '@/components/search/BookmarkButton';
import AddToNotesButton from '@/components/search/AddToNotesButton';
import AddToResearchButton from '@/components/search/AddToResearchButton';
import { defaultMockResult } from '@/lib/mock-search-data';
import { SearchResultData } from '@/types/search';
import { Sparkles, Clock, AlertCircle, Network, BookOpen, MessageSquare, FolderPlus } from 'lucide-react';

export default function SearchResultsClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawQuery = searchParams.get('q') || 'Quantum Computing';
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [resultData, setResultData] = useState<SearchResultData>(defaultMockResult);

  // Build graph nodes/edges dynamically from resultData
  const graphNodes = [
    { id: 'main-node', name: resultData.query, type: 'CONCEPT', description: resultData.quickAnswer },
    ...(resultData.relatedTopics || []).map((topic, idx) => ({
      id: `related-${idx}`,
      name: topic,
      type: 'CONCEPT',
      description: `Related topic: ${topic}`
    }))
  ];

  const graphEdges = (resultData.relatedTopics || []).map((_, idx) => ({
    id: `edge-${idx}`,
    source: 'main-node',
    target: `related-${idx}`,
    type: 'RELATED_TO'
  }));

  const handleNodeClick = (nodeId: string) => {
    if (nodeId === 'main-node') return;
    const nodeIdx = parseInt(nodeId.split('-')[1]);
    if (resultData.relatedTopics && resultData.relatedTopics[nodeIdx]) {
      router.push(`/search?q=${encodeURIComponent(resultData.relatedTopics[nodeIdx])}`);
    }
  };

  const handleStartAIChat = async () => {
    try {
      // Create a new AI conversation preloaded with search context
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: `Chat: ${resultData.query}` }),
      });
      if (res.ok) {
        const data = await res.json();
        const convId = data.conversation.id;
        // Post initial context message
        await fetch(`/api/chat/${convId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            role: 'user',
            content: `I am researching "${resultData.query}". Context summary: ${resultData.quickAnswer.slice(0, 300)}`,
          }),
        });
        router.push(`/chat`);
      } else {
        router.push('/chat');
      }
    } catch {
      router.push('/chat');
    }
  };

  useEffect(() => {
    let isMounted = true;
    async function fetchSearchResults() {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(rawQuery)}`);
        if (!response.ok) {
          throw new Error('Failed to fetch search results from API');
        }
        const data = await response.json();
        if (isMounted) {
          setResultData(data);
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err.message || 'An error occurred while fetching search results.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    fetchSearchResults();

    return () => {
      isMounted = false;
    };
  }, [rawQuery]);

  return (
    <div className="min-h-screen bg-[#09090B] text-[#FAFAFA] flex flex-col selection:bg-indigo-500/30 selection:text-white">
      {/* Global Sidebar */}
      <WorldKnowsSidebar initialQuery={rawQuery} />

      {/* Main Content Area (offset by sidebar on desktop) */}
      <div className="lg:pl-64 flex-1 flex flex-col min-h-screen">
        <main className="flex-1 max-w-[1600px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {loading ? (
            <SearchSkeleton />
          ) : error ? (
            <div className="p-6 rounded-2xl bg-[#111113] border border-red-500/30 text-center space-y-3 my-12">
              <AlertCircle className="w-8 h-8 text-red-400 mx-auto" />
              <h2 className="text-lg font-bold text-[#FAFAFA]">Search Error</h2>
              <p className="text-sm text-[#A1A1AA]">{error}</p>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Search Meta Bar & Action Toolbar */}
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-[#27272A]/60">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 uppercase tracking-widest">
                      {resultData.intent || 'VERIFIED'} INTENT
                    </span>
                    <span className="text-xs text-[#71717A] flex items-center gap-1 font-mono">
                      <Clock className="w-3 h-3" /> Indexed via Verified Pipeline
                    </span>
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#FAFAFA]">
                    {resultData.query}
                  </h1>
                </div>

                {/* Search Action Toolbar */}
                <div className="flex flex-wrap items-center gap-2">
                  <BookmarkButton
                    title={resultData.query}
                    url={typeof window !== 'undefined' ? window.location.href : `https://worldknows.com/search?q=${encodeURIComponent(resultData.query)}`}
                  />
                  <AddToNotesButton
                    query={resultData.query}
                    summary={resultData.quickAnswer}
                  />
                  <AddToResearchButton
                    query={resultData.query}
                  />
                  <button
                    onClick={handleStartAIChat}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#111113] border border-[#27272A] hover:border-indigo-500/50 text-xs font-medium text-[#A1A1AA] hover:text-[#FAFAFA] transition-all shadow-sm"
                  >
                    <MessageSquare className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Start AI Chat</span>
                  </button>
                </div>
              </div>

              {/* Adaptive Grid Layout */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                {/* Primary Content Column (Left / Center) */}
                <div className="lg:col-span-8 space-y-6">
                  <QuickAnswer answer={resultData.quickAnswer} />
                  <DetailedSections sections={resultData.detailedSections} />

                  {/* Interactive Knowledge Graph Card */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-base font-bold text-[#FAFAFA] flex items-center gap-2">
                        <Network className="w-4 h-4 text-indigo-400" />
                        Knowledge Graph & Relations
                      </h3>
                      <span className="text-[10px] font-mono text-[#71717A]">
                        {graphNodes.length} Nodes • {graphEdges.length} Connections
                      </span>
                    </div>
                    <KnowledgeGraph nodes={graphNodes} edges={graphEdges} onNodeClick={handleNodeClick} />
                  </div>

                  <SourceList sources={resultData.sources} />
                </div>

                {/* Sidebar Column (Right) */}
                <div className="lg:col-span-4 space-y-6">
                  <KeyFacts facts={resultData.keyFacts} />
                  <RelatedTopics topics={resultData.relatedTopics} />

                  {/* Quick Discovery / Entity Navigator */}
                  <div className="p-5 rounded-2xl bg-[#111113] border border-[#27272A] space-y-3">
                    <div className="flex items-center gap-2 text-xs font-semibold text-[#FAFAFA]">
                      <Network className="w-4 h-4 text-indigo-400" />
                      <span>Entity & Topic Directory</span>
                    </div>
                    <p className="text-xs text-[#A1A1AA] leading-relaxed">
                      Explore connected topic hierarchies, entity cross-references, and graph relations across the WorldKnows network.
                    </p>
                    <div className="pt-2 flex items-center gap-2">
                      <button
                        onClick={() => router.push('/topics')}
                        className="w-full py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition-all shadow-md shadow-indigo-600/20"
                      >
                        Browse Topics Directory
                      </button>
                    </div>
                  </div>

                  {/* Trust Notice Box */}
                  <div className="p-4 rounded-2xl bg-[#111113] border border-[#27272A] space-y-2">
                    <div className="flex items-center gap-2 text-xs font-semibold text-[#FAFAFA]">
                      <Sparkles className="w-4 h-4 text-indigo-400" />
                      <span>WorldKnows Trust Guarantee</span>
                    </div>
                    <p className="text-xs text-[#A1A1AA] leading-relaxed">
                      All citations are anchored to verified public sources. We prioritize transparency over synthetic confidence.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>

        {/* Footer */}
        <footer className="border-t border-[#27272A]/60 bg-[#09090B] py-8 px-4 sm:px-6 lg:px-8 mt-16">
          <div className="max-w-[1600px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#71717A]">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-[#FAFAFA]">WorldKnows</span>
              <span>—</span>
              <span>Understand Anything.</span>
            </div>
            <div className="flex items-center gap-6">
              <a href="/" className="hover:text-[#A1A1AA] transition-colors">Home</a>
              <a href="/topics" className="hover:text-[#A1A1AA] transition-colors">Topics</a>
              <a href="/research" className="hover:text-[#A1A1AA] transition-colors">Research</a>
              <span className="text-indigo-400">Search Engine Active</span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
