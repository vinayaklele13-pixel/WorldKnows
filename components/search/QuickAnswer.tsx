import React from 'react';
import { Sparkles, Quote } from 'lucide-react';

interface QuickAnswerProps {
  answer: string;
}

export default function QuickAnswer({ answer }: QuickAnswerProps) {
  return (
    <div className="bg-[#111113] border border-[#27272A] rounded-2xl overflow-hidden shadow-sm">
      <div className="px-6 py-4 border-b border-[#27272A]/60 bg-gradient-to-r from-indigo-500/5 to-transparent flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-indigo-500/10 flex items-center justify-center">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
          </div>
          <h2 className="text-sm font-semibold text-[#FAFAFA] tracking-tight">Quick Answer</h2>
        </div>
        <span className="text-[10px] uppercase tracking-widest text-[#71717A] font-bold">Synthesized</span>
      </div>
      <div className="p-6">
        <div className="relative">
          <Quote className="absolute -left-2 -top-2 w-8 h-8 text-indigo-500/5 -z-0" />
          <p className="text-[#FAFAFA] text-base sm:text-lg leading-relaxed relative z-10 font-normal">
            {answer}
          </p>
        </div>
        <div className="mt-6 flex items-center gap-2 p-3 rounded-xl bg-[#18181B] border border-[#27272A]">
          <div className="w-2 h-2 rounded-full bg-green-500/80 shadow-[0_0_8px_rgba(34,197,94,0.4)]"></div>
          <span className="text-[11px] text-[#A1A1AA] font-medium">Verified against multiple sources below</span>
        </div>
      </div>
    </div>
  );
}
