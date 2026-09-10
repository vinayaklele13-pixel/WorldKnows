'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Compass, Sparkles, BookOpen, ExternalLink, HelpCircle, FileText, ArrowLeft, Network, GitBranch, ArrowRight } from 'lucide-react';
import SearchHeader from '@/components/search/SearchHeader';
import KnowledgeGraph from '@/components/graph/KnowledgeGraph';

interface TopicData {
  topic: {
    id: string;
    slug: string;
    name: string;
    description: string | null;
    createdAt: string;
    updatedAt: string;
  };
  entities: Array<{
    id: string;
    name: string;
    type: string;
    description: string | null;
    sources: Array<{
      id: string;
      title: string;
      url: string;
      domain: string;
    }>;
  }>;
  relationships: Array<{
    id: string;
    type: string;
    description: string | null;
    direction: 'outgoing' | 'incoming';
    relatedTopic: {
      id: string;
      slug: string;
      name: string;
      description: string | null;
    };
  }>;
}

export default function TopicPageClient({ slug }: { slug: string }) {
  const router = useRouter();

  const [data, setData] = useState<TopicData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;

    setLoading(true);
    setError(null);

    fetch(`/api/topics/${slug}`)
      .then(async (res) => {
        if (!res.ok) {
          if (res.status === 404) {
            throw new Error('Topic not found');
          }
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || 'Failed to fetch topic details');
        }
        return res.json();
      })
      .then((topicData) => {
        setData(topicData);
      })
      .catch((err) => {
        setError(err.message);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#09090B] text-[#FAFAFA] flex flex-col selection:bg-indigo-500/30 selection:text-white">
        <SearchHeader initialQuery="" />
        <div className="flex-1 flex flex-col items-center justify-center py-24">
          <div className="relative">
            <div className="w-12 h-12 rounded-full border-2 border-indigo-500/10 border-t-indigo-500 animate-spin"></div>
            <Sparkles className="w-4 h-4 text-indigo-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
          </div>
          <span className="text-xs font-mono text-[#A1A1AA] mt-4 uppercase tracking-widest">Resolving topic nodes...</span>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-[#09090B] text-[#FAFAFA] flex flex-col selection:bg-indigo-500/30 selection:text-white">
        <SearchHeader initialQuery="" />
        <div className="flex-1 flex flex-col items-center justify-center max-w-xl mx-auto px-4 text-center py-24">
          <div className="w-12 h-12 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-4">
            <HelpCircle className="w-5 h-5 text-red-400" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-[#FAFAFA]">
            {error === 'Topic not found' ? 'Topic Not Found' : 'Something went wrong'}
          </h2>
          <p className="text-sm text-[#A1A1AA] mt-2 mb-6 max-w-sm">
            {error === 'Topic not found'
              ? `We couldn't find a topic matching "${slug}". Explore another topic or return to the explore board.`
              : error}
          </p>
          <button
            onClick={() => router.push('/')}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#111113] border border-[#27272A] hover:border-[#3F3F46] text-sm text-[#FAFAFA] transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Explore
          </button>
        </div>
      </div>
    );
  }

  const { topic, entities, relationships } = data;

  // Build graph nodes and edges from entities and relationships
  const graphNodes = entities.map((e) => ({
    id: e.id,
    name: e.name,
    type: e.type,
    description: e.description,
  }));

  const graphEdges = entities.length > 1 ? entities.slice(0, entities.length - 1).map((e, idx) => ({
    id: `edge-${idx}`,
    source: e.id,
    target: entities[idx + 1].id,
    type: 'ASSOCIATED_WITH',
  })) : [];

  const handleNodeClick = (nodeId: string) => {
    const entity = entities.find(e => e.id === nodeId);
    if (entity && entity.sources && entity.sources.length > 0) {
      window.open(entity.sources[0].url, '_blank');
    }
  };

  return (
    <div className="min-h-screen bg-[#09090B] text-[#FAFAFA] flex flex-col selection:bg-indigo-500/30 selection:text-white">
      <SearchHeader initialQuery="" />

      {/* Hero Header */}
      <section className="border-b border-[#27272A]/40 bg-gradient-to-b from-[#111113]/50 to-transparent py-12 md:py-16 relative overflow-hidden">
        <div className="absolute top-0 right-1/4 w-[400px] h-[250px] bg-indigo-500/5 blur-[100px] rounded-full pointer-events-none"></div>
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6">
          <button
            onClick={() => router.push('/')}
            className="inline-flex items-center gap-1.5 text-xs text-[#71717A] hover:text-[#FAFAFA] transition-colors mb-6 group"
          >
            <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
            Back to Hub
          </button>

          <div className="max-w-4xl space-y-4">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-[10px] font-mono uppercase tracking-widest text-indigo-400">
              <Network className="w-3.5 h-3.5" />
              Topic Node
            </div>
            <h1 className="text-4xl md:text-5xl font-black tracking-tight text-[#FAFAFA]">{topic.name}</h1>
            <p className="text-base text-[#A1A1AA] font-normal leading-relaxed max-w-3xl">
              {topic.description || 'No description provided for this topic yet. It is mapped as a relational concept in the global public knowledge repository.'}
            </p>
          </div>
        </div>
      </section>

      {/* Interactive Knowledge Graph Section */}
      <section className="border-b border-[#27272A]/40 bg-[#0C0C0E] py-8">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold tracking-tight text-[#FAFAFA] flex items-center gap-2">
              <Network className="w-4 h-4 text-indigo-400" />
              Interactive Knowledge Graph
            </h2>
            <span className="text-xs font-mono text-[#71717A]">
              {graphNodes.length} Nodes • {graphEdges.length} Edges
            </span>
          </div>
          <KnowledgeGraph nodes={graphNodes} edges={graphEdges} onNodeClick={handleNodeClick} />
        </div>
      </section>

      {/* Content Grid */}
      <main className="max-w-[1600px] mx-auto px-4 sm:px-6 py-12 flex-1 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Column: Mapped Entities */}
          <div className="lg:col-span-2 space-y-8">
            <div className="space-y-4">
              <h2 className="text-xl font-bold tracking-tight text-[#FAFAFA] flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-indigo-400" />
                Associated Entities
              </h2>
              {entities.length === 0 ? (
                <div className="rounded-xl border border-[#27272A]/60 bg-[#111113]/30 p-8 text-center">
                  <span className="text-sm text-[#71717A]">No associated entities are mapped to this topic yet.</span>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {entities.map((ent) => (
                    <div
                      key={ent.id}
                      className="rounded-xl border border-[#27272A]/60 bg-[#111113]/30 hover:border-indigo-500/30 p-5 flex flex-col justify-between transition-all group"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-mono tracking-widest text-[#71717A] uppercase bg-[#18181B] px-2 py-0.5 rounded border border-[#27272A]">
                            {ent.type}
                          </span>
                        </div>
                        <h3 className="font-bold text-base text-[#FAFAFA] group-hover:text-indigo-400 transition-colors">
                          {ent.name}
                        </h3>
                        <p className="text-xs text-[#A1A1AA] line-clamp-3 leading-relaxed">
                          {ent.description || 'No description listed for this public entity node.'}
                        </p>
                      </div>

                      {ent.sources && ent.sources.length > 0 && (
                        <div className="mt-4 pt-3 border-t border-[#27272A]/40 space-y-1.5">
                          <span className="text-[10px] font-mono tracking-widest text-[#71717A] uppercase flex items-center gap-1">
                            <FileText className="w-3 h-3" />
                            Provenance Sources
                          </span>
                          <div className="space-y-1">
                            {ent.sources.slice(0, 2).map((src) => (
                              <a
                                key={src.id}
                                href={src.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center justify-between gap-2 p-1.5 rounded bg-[#18181B] hover:bg-indigo-500/5 border border-[#27272A]/40 text-[11px] text-[#A1A1AA] hover:text-[#FAFAFA] transition-all group/link"
                              >
                                <span className="truncate max-w-[180px]">{src.title}</span>
                                <ExternalLink className="w-3 h-3 text-[#71717A] group-hover/link:text-indigo-400 shrink-0" />
                              </a>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar Column: Topic Relationships */}
          <div className="space-y-8">
            <div className="space-y-4">
              <h2 className="text-xl font-bold tracking-tight text-[#FAFAFA] flex items-center gap-2">
                <GitBranch className="w-4 h-4 text-indigo-400 animate-pulse" />
                Symmetric Connections
              </h2>

              {relationships.length === 0 ? (
                <div className="rounded-xl border border-[#27272A]/60 bg-[#111113]/30 p-8 text-center">
                  <span className="text-sm text-[#71717A]">No relationship vectors exist for this topic yet.</span>
                </div>
              ) : (
                <div className="space-y-3">
                  {relationships.map((rel) => (
                    <div
                      key={rel.id}
                      onClick={() => router.push(`/topics/${rel.relatedTopic.slug}`)}
                      className="rounded-xl border border-[#27272A]/60 bg-[#111113]/30 hover:border-indigo-500/30 p-4 cursor-pointer transition-all group flex items-start justify-between gap-3"
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[9px] font-mono tracking-wider bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 px-1.5 py-0.5 rounded uppercase">
                            {rel.type.replace(/_/g, ' ')}
                          </span>
                        </div>
                        <h4 className="font-bold text-sm text-[#FAFAFA] group-hover:text-indigo-400 transition-colors">
                          {rel.relatedTopic.name}
                        </h4>
                        {rel.description && (
                          <p className="text-[11px] text-[#71717A] line-clamp-2">
                            {rel.description}
                          </p>
                        )}
                      </div>
                      <ArrowRight className="w-4 h-4 text-[#71717A] group-hover:text-indigo-400 group-hover:translate-x-0.5 transition-all shrink-0 mt-1" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
