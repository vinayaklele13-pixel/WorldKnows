'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { BookOpen, Network, ExternalLink, HelpCircle, FileText, ArrowLeft, GitBranch, ArrowRight, Sparkles } from 'lucide-react';
import SearchHeader from '@/components/search/SearchHeader';

interface EntityData {
  entity: {
    id: string;
    name: string;
    type: string;
    description: string | null;
    createdAt: string;
    updatedAt: string;
  };
  topics: Array<{
    id: string;
    slug: string;
    name: string;
    description: string | null;
  }>;
  relationships: Array<{
    id: string;
    type: string;
    description: string | null;
    direction: 'outgoing' | 'incoming';
    relatedEntity: {
      id: string;
      name: string;
      type: string;
      description: string | null;
    };
    source?: {
      id: string;
      title: string;
      url: string;
      domain: string;
    } | null;
  }>;
  sources: Array<{
    id: string;
    title: string;
    url: string;
    domain: string;
    snippet: string | null;
    evidence: string | null;
  }>;
}

export default function EntityPageClient({ entityId }: { entityId: string }) {
  const router = useRouter();

  const [data, setData] = useState<EntityData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!entityId) return;

    setLoading(true);
    setError(null);

    fetch(`/api/entities/${entityId}`)
      .then(async (res) => {
        if (!res.ok) {
          if (res.status === 404) {
            throw new Error('Entity not found');
          }
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || 'Failed to fetch entity details');
        }
        return res.json();
      })
      .then((entityData) => {
        setData(entityData);
      })
      .catch((err) => {
        setError(err.message);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [entityId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#09090B] text-[#FAFAFA] flex flex-col selection:bg-indigo-500/30 selection:text-white">
        <SearchHeader initialQuery="" />
        <div className="flex-1 flex flex-col items-center justify-center py-24">
          <div className="relative">
            <div className="w-12 h-12 rounded-full border-2 border-indigo-500/10 border-t-indigo-500 animate-spin"></div>
            <Sparkles className="w-4 h-4 text-indigo-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
          </div>
          <span className="text-xs font-mono text-[#A1A1AA] mt-4 uppercase tracking-widest">Resolving entity record...</span>
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
            {error === 'Entity not found' ? 'Entity Not Found' : 'Something went wrong'}
          </h2>
          <p className="text-sm text-[#A1A1AA] mt-2 mb-6 max-w-sm">
            {error === 'Entity not found'
              ? `We couldn't find an entity with ID "${entityId}". Explore the knowledge graph or return to the explore board.`
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

  const { entity, topics, relationships, sources } = data;

  return (
    <div className="min-h-screen bg-[#09090B] text-[#FAFAFA] flex flex-col selection:bg-indigo-500/30 selection:text-white">
      <SearchHeader initialQuery="" />

      {/* Hero Header */}
      <section className="border-b border-[#27272A]/40 bg-gradient-to-b from-[#111113]/50 to-transparent py-12 md:py-16 relative overflow-hidden">
        <div className="absolute top-0 right-1/4 w-[400px] h-[250px] bg-indigo-500/5 blur-[100px] rounded-full pointer-events-none"></div>
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-1.5 text-xs text-[#71717A] hover:text-[#FAFAFA] transition-colors mb-6 group"
          >
            <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
            Back
          </button>

          <div className="max-w-4xl space-y-4">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-[10px] font-mono uppercase tracking-widest text-indigo-400">
              <BookOpen className="w-3.5 h-3.5" />
              {entity.type} Entity
            </div>
            <h1 className="text-4xl md:text-5xl font-black tracking-tight text-[#FAFAFA]">{entity.name}</h1>
            <p className="text-base text-[#A1A1AA] font-normal leading-relaxed max-w-3xl">
              {entity.description || 'No description listed for this public entity node in the global knowledge repository.'}
            </p>
          </div>
        </div>
      </section>

      {/* Content Grid */}
      <main className="max-w-[1600px] mx-auto px-4 sm:px-6 py-12 flex-1 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Column: Relationships & Associated Topics */}
          <div className="lg:col-span-2 space-y-8">
            {/* Relationships */}
            <div className="space-y-4">
              <h2 className="text-xl font-bold tracking-tight text-[#FAFAFA] flex items-center gap-2">
                <GitBranch className="w-4 h-4 text-indigo-400 animate-pulse" />
                Entity Relationships ({relationships.length})
              </h2>
              {relationships.length === 0 ? (
                <div className="rounded-xl border border-[#27272A]/60 bg-[#111113]/30 p-8 text-center">
                  <span className="text-sm text-[#71717A]">No relationships mapped for this entity yet.</span>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {relationships.map((rel) => (
                    <div
                      key={rel.id}
                      onClick={() => router.push(`/entities/${rel.relatedEntity.id}`)}
                      className="rounded-xl border border-[#27272A]/60 bg-[#111113]/30 hover:border-indigo-500/30 p-5 cursor-pointer transition-all group flex flex-col justify-between"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[9px] font-mono tracking-wider bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 px-2 py-0.5 rounded uppercase">
                            {rel.type.replace(/_/g, ' ')}
                          </span>
                          <span className="text-[10px] font-mono text-[#71717A] uppercase">
                            {rel.direction}
                          </span>
                        </div>
                        <h3 className="font-bold text-base text-[#FAFAFA] group-hover:text-indigo-400 transition-colors flex items-center justify-between">
                          <span>{rel.relatedEntity.name}</span>
                          <ArrowRight className="w-4 h-4 text-[#71717A] group-hover:text-indigo-400 group-hover:translate-x-0.5 transition-all" />
                        </h3>
                        <p className="text-xs text-[#A1A1AA] line-clamp-2">
                          {rel.description || rel.relatedEntity.description || 'Connected entity record.'}
                        </p>
                      </div>

                      {rel.source && (
                        <div className="mt-4 pt-3 border-t border-[#27272A]/40 text-[11px] text-[#71717A] flex items-center justify-between truncate">
                          <span className="truncate">Source: {rel.source.title}</span>
                          <ExternalLink className="w-3 h-3 text-[#71717A] shrink-0" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Associated Topics */}
            <div className="space-y-4 pt-4">
              <h2 className="text-xl font-bold tracking-tight text-[#FAFAFA] flex items-center gap-2">
                <Network className="w-4 h-4 text-indigo-400" />
                Associated Topics ({topics.length})
              </h2>
              {topics.length === 0 ? (
                <div className="rounded-xl border border-[#27272A]/60 bg-[#111113]/30 p-8 text-center">
                  <span className="text-sm text-[#71717A]">No topics associated with this entity yet.</span>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {topics.map((t) => (
                    <div
                      key={t.id}
                      onClick={() => router.push(`/topics/${t.slug}`)}
                      className="rounded-xl border border-[#27272A]/60 bg-[#111113]/30 hover:border-indigo-500/30 p-5 cursor-pointer transition-all group flex items-start justify-between gap-3"
                    >
                      <div className="space-y-1.5">
                        <span className="text-[9px] font-mono tracking-wider bg-[#18181B] text-[#71717A] px-2 py-0.5 rounded border border-[#27272A] uppercase">
                          Topic
                        </span>
                        <h4 className="font-bold text-base text-[#FAFAFA] group-hover:text-indigo-400 transition-colors">
                          {t.name}
                        </h4>
                        <p className="text-xs text-[#A1A1AA] line-clamp-2">
                          {t.description || 'Global knowledge topic.'}
                        </p>
                      </div>
                      <ArrowRight className="w-4 h-4 text-[#71717A] group-hover:text-indigo-400 group-hover:translate-x-0.5 transition-all shrink-0 mt-1" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar Column: Provenance Sources */}
          <div className="space-y-6">
            <div className="space-y-4">
              <h2 className="text-xl font-bold tracking-tight text-[#FAFAFA] flex items-center gap-2">
                <FileText className="w-4 h-4 text-indigo-400" />
                Provenance Sources ({sources.length})
              </h2>

              {sources.length === 0 ? (
                <div className="rounded-xl border border-[#27272A]/60 bg-[#111113]/30 p-8 text-center">
                  <span className="text-sm text-[#71717A]">No verified provenance sources recorded for this entity.</span>
                </div>
              ) : (
                <div className="space-y-3">
                  {sources.map((src) => (
                    <a
                      key={src.id}
                      href={src.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block rounded-xl border border-[#27272A]/60 bg-[#111113]/30 hover:border-indigo-500/30 p-4 transition-all group space-y-2"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] font-mono text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20 truncate">
                          {src.domain}
                        </span>
                        <ExternalLink className="w-3.5 h-3.5 text-[#71717A] group-hover:text-indigo-400 transition-colors shrink-0" />
                      </div>
                      <h4 className="font-bold text-sm text-[#FAFAFA] group-hover:text-indigo-400 transition-colors">
                        {src.title}
                      </h4>
                      {src.evidence && (
                        <p className="text-xs text-[#A1A1AA] line-clamp-3">
                          &ldquo;{src.evidence}&rdquo;
                        </p>
                      )}
                    </a>
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
