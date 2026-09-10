'use client';

import React, { useState } from 'react';
import { Search, Sparkles, Command, ArrowLeft, X } from 'lucide-react';
import AuthNav from '@/components/auth/AuthNav';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface SearchHeaderProps {
  initialQuery: string;
}

export default function SearchHeader({ initialQuery }: SearchHeaderProps) {
  const [query, setQuery] = useState(initialQuery);
  const [isFocused, setIsFocused] = useState(false);
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    router.push(`/search?q=${encodeURIComponent(query.trim())}`);
  };

  return (
    <header className="sticky top-0 z-50 backdrop-blur-md bg-[#09090B]/80 border-b border-[#27272A]/60">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 h-16 flex items-center gap-4 md:gap-8">
        {/* Brand/Back */}
        <div className="flex items-center gap-4">
          <Link href="/" className="md:hidden p-2 hover:bg-[#111113] rounded-lg text-[#A1A1AA]">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <Link href="/" className="hidden md:flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-lg bg-[#111113] border border-[#27272A] flex items-center justify-center group-hover:border-indigo-500/50 transition-all">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            </div>
            <span className="font-bold tracking-tight text-base text-[#FAFAFA]">WorldKnows</span>
          </Link>
        </div>

        {/* Search Bar */}
        <div className="flex-1 max-w-2xl">
          <form onSubmit={handleSearch} className="relative group">
            <div className={`relative flex items-center bg-[#111113] border rounded-xl px-3 py-2 transition-all ${isFocused ? 'border-indigo-500/80 bg-[#141417] shadow-lg shadow-indigo-500/5' : 'border-[#27272A] hover:border-[#3F3F46]'}`}>
              <Search className={`w-4 h-4 mr-2 transition-colors ${isFocused ? 'text-indigo-400' : 'text-[#71717A]'}`} />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                className="w-full bg-transparent text-[#FAFAFA] text-sm focus:outline-none placeholder-[#71717A]"
                placeholder="Ask anything..."
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery('')}
                  className="p-1 hover:bg-[#18181B] rounded-md text-[#71717A] hover:text-[#FAFAFA]"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
              <div className="hidden sm:flex items-center gap-1 ml-2 pl-2 border-l border-[#27272A]">
                <kbd className="px-1.5 py-0.5 text-[9px] font-mono text-[#71717A] bg-[#18181B] border border-[#27272A] rounded flex items-center gap-0.5">
                  <Command className="w-2.5 h-2.5" />
                  <span>K</span>
                </kbd>
              </div>
            </div>
          </form>
        </div>

        {/* Right Nav */}
        <div className="flex items-center gap-4">
          <nav className="hidden md:flex items-center gap-1 text-xs font-medium text-[#A1A1AA]">
            <Link href="/" className="px-3 py-1.5 hover:text-[#FAFAFA] transition-colors">Explore</Link>
            <Link href="/" className="px-3 py-1.5 hover:text-[#FAFAFA] transition-colors">Topics</Link>
          </nav>
          <AuthNav />
        </div>
      </div>
    </header>
  );
}
