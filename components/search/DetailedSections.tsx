import React from 'react';
import { Layers } from 'lucide-react';

interface Section {
  title: string;
  content: string;
}

interface DetailedSectionsProps {
  sections: Section[];
}

export default function DetailedSections({ sections }: DetailedSectionsProps) {
  if (!sections || sections.length === 0) return null;

  return (
    <div className="space-y-4">
      {sections.map((section, index) => (
        <div key={index} className="bg-[#111113] border border-[#27272A] rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-5 h-5 rounded bg-indigo-500/10 flex items-center justify-center text-indigo-400 font-bold text-xs">
              {index + 1}
            </div>
            <h3 className="text-base font-semibold text-[#FAFAFA] tracking-tight">{section.title}</h3>
          </div>
          <p className="text-sm sm:text-base text-[#A1A1AA] leading-relaxed font-normal">
            {section.content}
          </p>
        </div>
      ))}
    </div>
  );
}
