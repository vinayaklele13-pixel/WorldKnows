'use client';

import React, { useState } from 'react';
import { Search, Sparkles, Command, ArrowLeft, X, Menu, BookOpen, Layers, Bookmark, Folder, MessageSquare, Compass } from 'lucide-react';
import AuthNav from '@/components/auth/AuthNav';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface SearchHeaderProps {
  initialQuery: string;
}

export default function SearchHeader({ initialQuery }: SearchHeaderProps) {
  const [query, setQuery] = useState(initialQuery);
  const [isFocused, setIsFocused] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    router.push(`/search?q=${encodeURIComponent(query.trim())}`);
  };

  return (
    <header className="sticky top-0 z-50 backdrop-blur-md bg-[#09090B]/80 border-b border-[#27272A]/60">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Brand/Back */}
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-lg bg-[#111113] border border-[#27272A] flex items-center justify-center group-hover:border-indigo-500/50 transition-all shadow-sm">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            </div>
            <span className="font-bold tracking-tight text-base text-[#FAFAFA] hidden sm:inline">WorldKnows</span>
          </Link>
        </div>

        {/* Search Bar */}
        <div className="flex-1 max-w-xl mx-2">
          <form onSubmit={handleSearch} className="relative group">
            <div className={`relative flex items-center bg-[#111113] border rounded-xl px-3 py-2 transition-all ${isFocused ? 'border-indigo-500/80 bg-[#141417] shadow-lg shadow-indigo-500/5' : 'border-[#27272A] hover:border-[#3F3F46]'}`}>
              <Search className={`w-4 h-4 mr-2 transition-colors shrink-0 ${isFocused ? 'text-indigo-400' : 'text-[#71717A]'}`} />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                className="w-full bg-transparent text-[#FAFAFA] text-sm focus:outline-none placeholder-[#71717A]"
                placeholder="Search anything..."
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
            </div>
          </form>
        </div>

        {/* Desktop Nav & Auth */}
        <div className="flex items-center gap-3">
          <nav className="hidden lg:flex items-center gap-1 text-xs font-medium text-[#A1A1AA]">
            <Link href="/" className="px-3 py-1.5 hover:text-[#FAFAFA] hover:bg-[#111113] rounded-lg transition-colors flex items-center gap-1.5">
              <Compass className="w-3.5 h-3.5 text-indigo-400" />
              <span>Explore</span>
            </Link>
            <Link href="/topics" className="px-3 py-1.5 hover:text-[#FAFAFA] hover:bg-[#111113] rounded-lg transition-colors flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-indigo-400" />
              <span>Topics</span>
            </Link>
            <Link href="/research" className="px-3 py-1.5 hover:text-[#FAFAFA] hover:bg-[#111113] rounded-lg transition-colors flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
              <span>Research</span>
            </Link>
            <Link href="/bookmarks" className="px-3 py-1.5 hover:text-[#FAFAFA] hover:bg-[#111113] rounded-lg transition-colors flex items-center gap-1.5">
              <Bookmark className="w-3.5 h-3.5 text-indigo-400" />
              <span>Bookmarks</span>
            </Link>
            <Link href="/collections" className="px-3 py-1.5 hover:text-[#FAFAFA] hover:bg-[#111113] rounded-lg transition-colors flex items-center gap-1.5">
              <Folder className="w-3.5 h-3.5 text-indigo-400" />
              <span>Collections</span>
            </Link>
            <Link href="/chat" className="px-3 py-1.5 hover:text-[#FAFAFA] hover:bg-[#111113] rounded-lg transition-colors flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5 text-indigo-400" />
              <span>AI Chat</span>
            </Link>
          </nav>

          <AuthNav />

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 rounded-xl bg-[#111113] border border-[#27272A] text-[#A1A1AA] hover:text-[#FAFAFA]"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Dropdown Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-[#111113] border-b border-[#27272A] px-4 py-4 space-y-2 animate-in slide-in-from-top duration-200">
          <Link
            href="/"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-[#A1A1AA] hover:text-[#FAFAFA] hover:bg-[#18181B] transition-all"
          >
            <Compass className="w-4 h-4 text-indigo-400" />
            <span>Explore</span>
          </Link>
          <Link
            href="/topics"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-[#A1A1AA] hover:text-[#FAFAFA] hover:bg-[#18181B] transition-all"
          >
            <Layers className="w-4 h-4 text-indigo-400" />
            <span>Topics Directory</span>
          </Link>
          <Link
            href="/research"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-[#A1A1AA] hover:text-[#FAFAFA] hover:bg-[#18181B] transition-all"
          >
            <BookOpen className="w-4 h-4 text-indigo-400" />
            <span>Research Mode</span>
          </Link>
          <Link
            href="/bookmarks"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-[#A1A1AA] hover:text-[#FAFAFA] hover:bg-[#18181B] transition-all"
          >
            <Bookmark className="w-4 h-4 text-indigo-400" />
            <span>Bookmarks</span>
          </Link>
          <Link
            href="/collections"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-[#A1A1AA] hover:text-[#FAFAFA] hover:bg-[#18181B] transition-all"
          >
            <Folder className="w-4 h-4 text-indigo-400" />
            <span>Collections</span>
          </Link>
          <Link
            href="/chat"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-[#A1A1AA] hover:text-[#FAFAFA] hover:bg-[#18181B] transition-all"
          >
            <MessageSquare className="w-4 h-4 text-indigo-400" />
            <span>AI Chat Conversations</span>
          </Link>
        </div>
      )}
    </header>
  );
}
