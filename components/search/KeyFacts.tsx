import React from 'react';
import { KeyFact } from '@/types/search';
import { Info } from 'lucide-react';

interface KeyFactsProps {
  facts: KeyFact[];
}

export default function KeyFacts({ facts }: KeyFactsProps) {
  if (!facts || facts.length === 0) return null;

  return (
    <div className="bg-[#111113] border border-[#27272A] rounded-2xl overflow-hidden shadow-sm">
      <div className="px-5 py-3.5 border-b border-[#27272A]/60 flex items-center gap-2">
        <Info className="w-4 h-4 text-indigo-400" />
        <h3 className="text-sm font-semibold text-[#FAFAFA]">Key Facts</h3>
      </div>
      <div className="divide-y divide-[#27272A]/60">
        {facts.map((fact, index) => (
          <div key={index} className="px-5 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-1 hover:bg-[#18181B]/40 transition-colors">
            <span className="text-xs text-[#A1A1AA] font-medium">{fact.label}</span>
            <span className="text-xs font-semibold text-[#FAFAFA] text-left sm:text-right">{fact.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
