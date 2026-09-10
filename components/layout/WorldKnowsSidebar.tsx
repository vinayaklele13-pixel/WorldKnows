'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Compass,
  Layers,
  BookOpen,
  Bookmark,
  Folder,
  MessageSquare,
  Sparkles,
  Menu,
  X,
  Search as SearchIcon,
  User as UserIcon,
  LogOut
} from 'lucide-react';
import AuthNav from '@/components/auth/AuthNav';

interface WorldKnowsSidebarProps {
  initialQuery?: string;
}

export default function WorldKnowsSidebar({ initialQuery = '' }: WorldKnowsSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    router.push(`/search?q=${encodeURIComponent(query.trim())}`);
  };

  const navItems = [
    { label: 'Explore / Search', href: '/', icon: Compass },
    { label: 'Topics', href: '/topics', icon: Layers },
    { label: 'Research', href: '/research', icon: BookOpen },
    { label: 'Bookmarks', href: '/bookmarks', icon: Bookmark },
    { label: 'Collections', href: '/collections', icon: Folder },
    { label: 'AI Chat', href: '/chat', icon: MessageSquare },
  ];

  return (
    <>
      {/* Mobile Header */}
      <div className="lg:hidden sticky top-0 z-50 bg-[#09090B]/90 backdrop-blur-md border-b border-[#27272A]/60 px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[#111113] border border-[#27272A] flex items-center justify-center shadow-sm">
            <Sparkles className="w-4 h-4 text-indigo-400" />
          </div>
          <span className="font-bold tracking-tight text-[#FAFAFA]">WorldKnows</span>
        </Link>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 rounded-xl bg-[#111113] border border-[#27272A] text-[#A1A1AA] hover:text-[#FAFAFA]"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-[#09090B]/80 backdrop-blur-sm flex">
          <div className="w-72 bg-[#09090B] border-r border-[#27272A] p-6 flex flex-col justify-between h-full shadow-2xl animate-in slide-in-from-left duration-200">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <Link href="/" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-[#111113] border border-[#27272A] flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-indigo-400" />
                  </div>
                  <span className="font-bold tracking-tight text-[#FAFAFA]">WorldKnows</span>
                </Link>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1.5 rounded-lg text-[#71717A] hover:text-[#FAFAFA]"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Mobile Search */}
              <form onSubmit={handleSearch} className="relative">
                <div className="flex items-center bg-[#111113] border border-[#27272A] rounded-xl px-3 py-2">
                  <SearchIcon className="w-4 h-4 text-[#71717A] mr-2 shrink-0" />
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search anything..."
                    className="w-full bg-transparent text-xs text-[#FAFAFA] focus:outline-none placeholder-[#71717A]"
                  />
                </div>
              </form>

              {/* Mobile Nav Links */}
              <nav className="space-y-1.5">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                        isActive
                          ? 'bg-indigo-600/15 border border-indigo-500/30 text-indigo-400'
                          : 'text-[#A1A1AA] hover:text-[#FAFAFA] hover:bg-[#111113]'
                      }`}
                    >
                      <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-400' : 'text-[#71717A]'}`} />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </nav>
            </div>

            <div className="pt-6 border-t border-[#27272A]">
              <AuthNav />
            </div>
          </div>
          <div className="flex-1" onClick={() => setMobileMenuOpen(false)} />
        </div>
      )}

      {/* Desktop Persistent Sidebar */}
      <aside className="hidden lg:flex fixed inset-y-0 left-0 w-64 bg-[#09090B] border-r border-[#27272A]/60 flex-col justify-between z-40 p-6">
        <div className="space-y-6">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-[#111113] border border-[#27272A] flex items-center justify-center group-hover:border-indigo-500/50 transition-all shadow-sm">
              <Sparkles className="w-4 h-4 text-indigo-400" />
            </div>
            <div>
              <span className="font-bold tracking-tight text-sm text-[#FAFAFA] block">WorldKnows</span>
              <span className="text-[10px] font-mono text-[#71717A] block">V1 Knowledge Engine</span>
            </div>
          </Link>

          {/* Search Input in Sidebar */}
          <form onSubmit={handleSearch} className="relative">
            <div className="flex items-center bg-[#111113] border border-[#27272A] hover:border-[#3F3F46] rounded-xl px-3 py-2.5 transition-all">
              <SearchIcon className="w-4 h-4 text-[#71717A] mr-2 shrink-0" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search anything..."
                className="w-full bg-transparent text-xs text-[#FAFAFA] focus:outline-none placeholder-[#71717A]"
              />
            </div>
          </form>

          {/* Navigation */}
          <nav className="space-y-1">
            <div className="px-3 pb-2 text-[10px] font-mono uppercase tracking-wider text-[#71717A]">
              Navigation
            </div>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-indigo-600/15 border border-indigo-500/30 text-indigo-400 font-semibold shadow-sm'
                      : 'text-[#A1A1AA] hover:text-[#FAFAFA] hover:bg-[#111113]'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-400' : 'text-[#71717A]'}`} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User / Account Area */}
        <div className="pt-6 border-t border-[#27272A]/60">
          <AuthNav />
        </div>
      </aside>
    </>
  );
}
