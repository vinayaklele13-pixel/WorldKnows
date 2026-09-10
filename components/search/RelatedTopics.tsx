import React from 'react';
import { Compass, ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface RelatedTopicsProps {
  topics: string[];
}

export default function RelatedTopics({ topics }: RelatedTopicsProps) {
  const router = useRouter();

  if (!topics || topics.length === 0) return null;

  return (
    <div className="bg-[#111113] border border-[#27272A] rounded-2xl p-5 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <Compass className="w-4 h-4 text-indigo-400" />
        <h3 className="text-sm font-semibold text-[#FAFAFA]">Explore Further</h3>
      </div>
      <div className="flex flex-wrap gap-2">
        {topics.map((topic, index) => (
          <button
            key={index}
            onClick={() => router.push(`/search?q=${encodeURIComponent(topic)}`)}
            className="group px-3 py-2 rounded-xl bg-[#18181B] border border-[#27272A] hover:border-indigo-500/50 hover:bg-[#1C1C21] text-xs font-medium text-[#A1A1AA] hover:text-[#FAFAFA] transition-all flex items-center gap-2"
          >
            <span>{topic}</span>
            <ArrowRight className="w-3 h-3 text-[#71717A] group-hover:text-indigo-400 group-hover:translate-x-0.5 transition-all" />
          </button>
        ))}
      </div>
    </div>
  );
}
