import React from 'react';
import { Source } from '@/types/search';
import { ExternalLink, ShieldCheck, BookOpen } from 'lucide-react';

interface SourceListProps {
  sources: Source[];
}

export default function SourceList({ sources }: SourceListProps) {
  if (!sources || sources.length === 0) return null;

  const getTypeColor = (type: Source['sourceType']) => {
    switch (type) {
      case 'GOVERNMENT': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'ACADEMIC': return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
      case 'REFERENCE': return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20';
      default: return 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20';
    }
  };

  return (
    <div className="bg-[#111113] border border-[#27272A] rounded-2xl overflow-hidden shadow-sm">
      <div className="px-5 py-4 border-b border-[#27272A]/60 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-indigo-400" />
          <h3 className="text-sm font-semibold text-[#FAFAFA]">Sources & Citations</h3>
        </div>
        <span className="text-xs text-[#71717A] font-medium">{sources.length} Verified</span>
      </div>
      <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
        {sources.map((source, index) => (
          <a
            key={source.id || index}
            href={source.url}
            target="_blank"
            rel="noopener noreferrer"
            className="group p-3.5 rounded-xl bg-[#18181B] border border-[#27272A] hover:border-indigo-500/50 hover:bg-[#1C1C21] transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${getTypeColor(source.sourceType)}`}>
                  {source.sourceType}
                </span>
                <span className="text-[11px] text-[#71717A] flex items-center gap-1 font-mono">
                  <span>{source.domain}</span>
                  <ExternalLink className="w-3 h-3 group-hover:text-indigo-400 transition-colors" />
                </span>
              </div>
              <h4 className="text-xs font-semibold text-[#FAFAFA] group-hover:text-indigo-300 transition-colors line-clamp-1 mb-1">
                {source.title}
              </h4>
              <p className="text-[11px] text-[#A1A1AA] line-clamp-2 leading-relaxed">
                {source.excerpt}
              </p>
            </div>
            <div className="mt-3 pt-2.5 border-t border-[#27272A] flex items-center justify-between text-[10px] text-[#71717A]">
              <span>Publisher: {source.publisher}</span>
              <span className="flex items-center gap-1 text-green-400 font-medium">
                <ShieldCheck className="w-3 h-3" />
                <span>Score: {Math.round(source.reliabilityScore * 100)}%</span>
              </span>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}
