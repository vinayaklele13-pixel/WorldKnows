'use client';

import React from 'react';
import { X, ExternalLink, Search, Sparkles, BookMarked, FileText, Network } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface EntityInspectorProps {
  entity: {
    id: string;
    name: string;
    type: string;
    description?: string | null;
    sourceIds?: string[];
  } | null;
  relationships: Array<{
    id: string;
    source: string;
    target: string;
    type: string;
    description?: string | null;
    sourceIds?: string[];
  }>;
  nodes: Array<{
    id: string;
    name: string;
    type: string;
  }>;
  sources: Array<{
    id: string;
    title: string;
    url: string;
    domain: string;
    snippet?: string | null;
  }>;
  onClose: () => void;
}

const TYPE_BADGE_COLORS: Record<string, string> = {
  PERSON: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30',
  ORGANIZATION: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
  PLACE: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
  TECHNOLOGY: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
  CONCEPT: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
  EVENT: 'bg-pink-500/10 text-pink-400 border-pink-500/30',
  OTHER: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/30',
};

export default function EntityInspector({
  entity,
  relationships,
  nodes,
  sources,
  onClose,
}: EntityInspectorProps) {
  const router = useRouter();

  if (!entity) return null;

  const nodeMap = new Map(nodes.map(n => [n.id, n]));
  const sourceMap = new Map(sources.map(s => [s.id, s]));

  // Find relationships connected to this entity
  const connectedRels = relationships.filter(
    r => r.source === entity.id || r.target === entity.id
  );

  // Collect unique source IDs supporting this entity or its connected relationships
  const entitySourceIds = new Set(entity.sourceIds || []);
  connectedRels.forEach(r => {
    (r.sourceIds || []).forEach(sId => entitySourceIds.add(sId));
  });

  const supportingSources = Array.from(entitySourceIds)
    .map(id => sourceMap.get(id))
    .filter(Boolean);

  const handleSearchEntity = () => {
    router.push(`/search?q=${encodeURIComponent(entity.name)}`);
  };

  const handleDeepResearch = () => {
    router.push(`/research?q=${encodeURIComponent(entity.name)}`);
  };

  const handleAddToNotes = async () => {
    try {
      await fetch('/api/research/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: `Note: ${entity.name}`,
          description: entity.description || `Entity inspection note for ${entity.name}`,
        }),
      });
      alert(`Added "${entity.name}" to Notes/Research successfully.`);
    } catch {
      alert('Failed to add to notes.');
    }
  };

  const handleBookmark = async () => {
    try {
      await fetch('/api/bookmarks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: entity.name,
          url: window.location.href,
          notes: entity.description || `Knowledge graph entity: ${entity.name}`,
        }),
      });
      alert(`Bookmarked "${entity.name}" successfully.`);
    } catch {
      alert('Failed to bookmark.');
    }
  };

  return (
    <div className="absolute top-0 right-0 h-full w-full sm:w-[420px] bg-[#18181B]/95 backdrop-blur-xl border-l border-[#27272A] p-6 shadow-2xl flex flex-col z-30 overflow-y-auto animate-in slide-in-from-right duration-200">
      {/* Header */}
      <div className="flex items-start justify-between pb-4 border-b border-[#27272A]">
        <div className="space-y-1.5 pr-4">
          <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold uppercase border ${TYPE_BADGE_COLORS[entity.type] || TYPE_BADGE_COLORS.OTHER}`}>
            {entity.type}
          </span>
          <h2 className="text-xl font-bold text-[#FAFAFA] tracking-tight">{entity.name}</h2>
        </div>
        <button
          onClick={onClose}
          className="p-2 rounded-xl bg-[#27272A]/50 hover:bg-[#27272A] text-[#A1A1AA] hover:text-[#FAFAFA] transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Content Body */}
      <div className="flex-1 py-6 space-y-6">
        {/* Description */}
        <div className="space-y-2">
          <h3 className="text-xs font-mono text-[#71717A] uppercase tracking-wider">Description</h3>
          <p className="text-sm text-[#D4D4D8] leading-relaxed">
            {entity.description || 'No detailed description available for this entity.'}
          </p>
        </div>

        {/* Action Toolbar */}
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={handleSearchEntity}
            className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition-all shadow-md shadow-indigo-600/20"
          >
            <Search className="w-3.5 h-3.5" />
            <span>Search Entity</span>
          </button>
          <button
            onClick={handleDeepResearch}
            className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-[#27272A] hover:bg-[#3f3f46] text-[#FAFAFA] text-xs font-medium transition-all"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>Deep Research</span>
          </button>
          <button
            onClick={handleAddToNotes}
            className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-[#27272A] hover:bg-[#3f3f46] text-[#FAFAFA] text-xs font-medium transition-all"
          >
            <FileText className="w-3.5 h-3.5 text-amber-400" />
            <span>Add to Notes</span>
          </button>
          <button
            onClick={handleBookmark}
            className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-[#27272A] hover:bg-[#3f3f46] text-[#FAFAFA] text-xs font-medium transition-all"
          >
            <BookMarked className="w-3.5 h-3.5 text-emerald-400" />
            <span>Bookmark</span>
          </button>
        </div>

        {/* Connected Relationships */}
        <div className="space-y-3">
          <h3 className="text-xs font-mono text-[#71717A] uppercase tracking-wider flex items-center gap-1.5">
            <Network className="w-3.5 h-3.5 text-indigo-400" />
            Relationships ({connectedRels.length})
          </h3>
          {connectedRels.length === 0 ? (
            <p className="text-xs text-[#71717A]">No direct relationships recorded.</p>
          ) : (
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {connectedRels.map(rel => {
                const isOutgoing = rel.source === entity.id;
                const targetId = isOutgoing ? rel.target : rel.source;
                const targetNode = nodeMap.get(targetId);

                return (
                  <div key={rel.id} className="p-3 rounded-xl bg-[#111113] border border-[#27272A] space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-indigo-400 font-mono text-[10px] uppercase">
                        {rel.type.replace(/_/g, ' ')}
                      </span>
                      <span className="text-[10px] text-[#71717A]">
                        {isOutgoing ? '→ outgoing' : '← incoming'}
                      </span>
                    </div>
                    <div className="text-xs text-[#FAFAFA] font-medium">
                      {targetNode ? targetNode.name : 'Connected Entity'}
                    </div>
                    {rel.description && (
                      <p className="text-[11px] text-[#A1A1AA]">{rel.description}</p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Supporting Sources & Evidence */}
        <div className="space-y-3">
          <h3 className="text-xs font-mono text-[#71717A] uppercase tracking-wider flex items-center gap-1.5">
            <ExternalLink className="w-3.5 h-3.5 text-emerald-400" />
            Supporting Evidence & Sources ({supportingSources.length})
          </h3>
          {supportingSources.length === 0 ? (
            <p className="text-xs text-[#71717A]">No explicit source citations attached.</p>
          ) : (
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {supportingSources.map((src: any) => (
                <a
                  key={src.id}
                  href={src.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block p-3 rounded-xl bg-[#111113] border border-[#27272A] hover:border-indigo-500/50 transition-all group space-y-1"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-[#FAFAFA] group-hover:text-indigo-400 transition-colors line-clamp-1">
                      {src.title}
                    </span>
                    <ExternalLink className="w-3 h-3 text-[#71717A] group-hover:text-indigo-400 flex-shrink-0" />
                  </div>
                  <div className="text-[10px] font-mono text-[#71717A]">{src.domain}</div>
                  {src.snippet && (
                    <p className="text-[11px] text-[#A1A1AA] line-clamp-2 mt-1">{src.snippet}</p>
                  )}
                </a>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
