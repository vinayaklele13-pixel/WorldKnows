'use client';

import React, { useState, useEffect } from 'react';
import { Search, Compass, BookOpen, Layers, ArrowRight, Sparkles, Command, Globe2 } from 'lucide-react';
import WorldKnowsSidebar from '@/components/layout/WorldKnowsSidebar';
import { useRouter } from 'next/navigation';

export default function Home() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const router = useRouter();

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
  };

  const exampleQueries = [
    "What is quantum computing?",
    "History of the Mughal Empire",
    "How does a car engine work?",
    "Python vs JavaScript",
    "Explain photosynthesis",
    "What happened during World War 2?"
  ];

  return (
    <div className="min-h-screen bg-[#09090B] text-[#FAFAFA] flex flex-col selection:bg-indigo-500/30 selection:text-white">
      {/* Global Sidebar Integration */}
      <WorldKnowsSidebar initialQuery="" />

      {/* Main Content Area */}
      <div className="lg:pl-64 flex-1 flex flex-col min-h-screen">
        <main className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8 py-16 sm:py-24 relative">
          {/* Subtle background ambient glow */}
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-indigo-500/5 blur-[120px] rounded-full pointer-events-none -z-10"></div>

          {/* Hero Section */}
          <div className="text-center max-w-3xl mx-auto space-y-6 mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#111113] border border-[#27272A] text-xs font-medium text-indigo-300 shadow-sm">
              <Globe2 className="w-3.5 h-3.5 text-indigo-400 animate-spin-slow" />
              <span>Universal Knowledge & Information Discovery</span>
            </div>

            <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold tracking-tight text-[#FAFAFA] leading-[1.1]">
              Understand <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-indigo-200 to-white">Anything.</span>
            </h1>

            <p className="text-base sm:text-lg text-[#A1A1AA] max-w-2xl mx-auto font-normal leading-relaxed">
              Search, explore, compare, and discover reliable information from across the web with a next-generation research instrument.
            </p>
          </div>

          {/* Universal Search Interface */}
          <div className="w-full max-w-2xl mx-auto mb-10">
            <form onSubmit={handleSearchSubmit} className="relative group">
              <div className={`absolute -inset-0.5 rounded-2xl bg-gradient-to-r from-indigo-500/30 via-indigo-500/10 to-transparent opacity-75 blur transition duration-300 ${isFocused ? 'opacity-100' : 'group-hover:opacity-100'}`}></div>

              <div className={`relative flex items-center bg-[#111113] border rounded-2xl p-2.5 sm:p-3 transition-all shadow-2xl shadow-black/40 ${isFocused ? 'border-indigo-500/80 bg-[#141417]' : 'border-[#27272A] hover:border-[#3F3F46]'}`}>
                <div className="pl-3 pr-2 text-[#71717A]">
                  <Search className={`w-5 h-5 transition-colors ${isFocused ? 'text-indigo-400' : 'text-[#71717A]'}`} />
                </div>

                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                  placeholder="Ask anything, search a topic, or explore a question..."
                  className="w-full bg-transparent text-[#FAFAFA] placeholder-[#71717A] text-sm sm:text-base focus:outline-none px-2 py-1"
                  autoFocus
                />

                <div className="hidden sm:flex items-center gap-1.5 pr-2">
                  <kbd className="px-2 py-1 text-[10px] font-mono text-[#A1A1AA] bg-[#18181B] border border-[#27272A] rounded-md flex items-center gap-1">
                    <Command className="w-3 h-3" />
                    <span>K</span>
                  </kbd>
                </div>

                <button
                  type="submit"
                  disabled={!searchQuery.trim()}
                  className={`ml-2 px-4 py-2.5 rounded-xl font-medium text-xs sm:text-sm flex items-center gap-1.5 transition-all ${searchQuery.trim() ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/20' : 'bg-[#18181B] text-[#71717A] cursor-not-allowed border border-[#27272A]'}`}
                >
                  <span>Search</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>

            {/* Example Query Chips */}
            <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
              <span className="text-xs text-[#71717A] font-medium mr-1">Try asking:</span>
              {exampleQueries.map((query, index) => (
                <button
                  key={index}
                  onClick={() => router.push(`/search?q=${encodeURIComponent(query)}`)}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium bg-[#111113] hover:bg-[#18181B] border border-[#27272A] hover:border-[#3F3F46] text-[#A1A1AA] hover:text-[#FAFAFA] transition-all shadow-sm"
                >
                  {query}
                </button>
              ))}
            </div>
          </div>

          {/* Core Pillars Feature Summary */}
          <div className="w-full max-w-5xl mx-auto mt-20 grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-[#111113] border border-[#27272A] space-y-2 hover:border-[#3F3F46] transition-all">
              <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold text-sm">
                01
              </div>
              <h3 className="text-sm font-semibold text-[#FAFAFA]">Search</h3>
              <p className="text-xs text-[#A1A1AA] leading-relaxed">
                Intent-aware query understanding that retrieves reliable context from across the web.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-[#111113] border border-[#27272A] space-y-2 hover:border-[#3F3F46] transition-all">
              <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold text-sm">
                02
              </div>
              <h3 className="text-sm font-semibold text-[#FAFAFA]">Understand</h3>
              <p className="text-xs text-[#A1A1AA] leading-relaxed">
                Synthesized knowledge presented clearly with quick answers and deep exploration paths.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-[#111113] border border-[#27272A] space-y-2 hover:border-[#3F3F46] transition-all">
              <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold text-sm">
                03
              </div>
              <h3 className="text-sm font-semibold text-[#FAFAFA]">Verify</h3>
              <p className="text-xs text-[#A1A1AA] leading-relaxed">
                Transparent citation system anchored to primary and secondary reliable sources.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-[#111113] border border-[#27272A] space-y-2 hover:border-[#3F3F46] transition-all">
              <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold text-sm">
                04
              </div>
              <h3 className="text-sm font-semibold text-[#FAFAFA]">Explore</h3>
              <p className="text-xs text-[#A1A1AA] leading-relaxed">
                Connected knowledge graph and follow-up paths that turn research into continuous discovery.
              </p>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="border-t border-[#27272A]/60 bg-[#09090B] py-8 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#71717A]">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-[#FAFAFA]">WorldKnows</span>
              <span>—</span>
              <span>Understand Anything.</span>
            </div>
            <div className="flex items-center gap-6">
              <a href="#privacy" className="hover:text-[#A1A1AA] transition-colors">Privacy</a>
              <a href="#terms" className="hover:text-[#A1A1AA] transition-colors">Terms</a>
              <a href="#api" className="hover:text-[#A1A1AA] transition-colors">Developer API</a>
              <span className="text-indigo-400">System Online</span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
