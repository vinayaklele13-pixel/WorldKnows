'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import WorldKnowsSidebar from '@/components/layout/WorldKnowsSidebar';
import { Bookmark, Trash2, Plus, ExternalLink, Sparkles, X } from 'lucide-react';

interface BookmarkItem {
  id: string;
  title: string;
  url: string;
  notes: string | null;
  createdAt: string;
}

export default function BookmarksPage() {
  const router = useRouter();
  const [bookmarks, setBookmarks] = useState<BookmarkItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/bookmarks')
      .then(async (res) => {
        if (!res.ok) {
          if (res.status === 401) {
            router.push('/auth/signin');
            return;
          }
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || 'Failed to fetch bookmarks');
        }
        return res.json();
      })
      .then((data) => {
        if (data.bookmarks) setBookmarks(data.bookmarks);
      })
      .catch((err) => {
        setError(err.message);
      })
      .finally(() => setLoading(false));
  }, [router]);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this bookmark?')) return;

    const res = await fetch(`/api/bookmarks/${id}`, {
      method: 'DELETE',
    });

    if (res.ok) {
      setBookmarks(bookmarks.filter((b) => b.id !== id));
    } else {
      alert('Failed to delete bookmark.');
    }
  };

  const handleOpenBookmark = (bm: BookmarkItem) => {
    // If it points to an internal search page, navigate directly or open in search
    if (bm.url.includes('/search?')) {
      const urlParams = new URLSearchParams(bm.url.split('?')[1]);
      const query = urlParams.get('q');
      if (query) {
        router.push(`/search?q=${encodeURIComponent(query)}`);
        return;
      }
    }
    window.open(bm.url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="min-h-screen bg-[#09090B] text-[#FAFAFA] flex flex-col selection:bg-indigo-500/30 selection:text-white">
      {/* Global Sidebar */}
      <WorldKnowsSidebar initialQuery="" />

      {/* Main Content Area */}
      <div className="lg:pl-64 flex-1 flex flex-col min-h-screen">
        <main className="max-w-7xl mx-auto px-4 sm:px-6 py-12 flex-1 w-full space-y-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#27272A]/60 pb-8">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 uppercase tracking-widest">
                  Knowledge Vault
                </span>
              </div>
              <h1 className="text-3xl font-bold tracking-tight text-[#FAFAFA]">Saved Bookmarks</h1>
              <p className="text-sm text-[#A1A1AA]">
                Access and manage your saved WorldKnows research result pages.
              </p>
            </div>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <Sparkles className="w-6 h-6 text-indigo-400 animate-spin mb-4" />
              <span className="text-xs font-mono text-[#A1A1AA] uppercase tracking-wider">Loading saved bookmarks...</span>
            </div>
          ) : error ? (
            <div className="rounded-2xl border border-red-500/30 bg-[#111113] p-8 text-center space-y-3">
              <h3 className="text-lg font-bold text-red-400">Authentication Required</h3>
              <p className="text-xs text-[#A1A1AA]">{error}</p>
              <button
                onClick={() => router.push('/auth/signin')}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-medium transition-all"
              >
                Sign In to View Bookmarks
              </button>
            </div>
          ) : bookmarks.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[#27272A] bg-[#111113]/30 p-16 text-center space-y-3">
              <Bookmark className="w-10 h-10 text-[#27272A] mx-auto" />
              <h3 className="text-base font-medium text-[#FAFAFA]">No bookmarks saved yet</h3>
              <p className="text-xs text-[#71717A] max-w-sm mx-auto">
                Save WorldKnows search results with a single click to build your personal knowledge vault.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {bookmarks.map((bm) => (
                <div
                  key={bm.id}
                  className="rounded-2xl border border-[#27272A] bg-[#111113] hover:border-indigo-500/40 p-6 flex flex-col justify-between space-y-4 shadow-lg shadow-black/20 group transition-all"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono uppercase bg-[#18181B] text-[#71717A] border border-[#27272A] px-2 py-0.5 rounded">
                        WorldKnows Search
                      </span>
                      <button
                        onClick={() => handleDelete(bm.id)}
                        className="p-1.5 rounded-lg text-[#71717A] hover:text-red-400 hover:bg-red-500/10 transition-colors"
                        title="Delete Bookmark"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <button
                      onClick={() => handleOpenBookmark(bm)}
                      className="font-bold text-base text-left text-[#FAFAFA] hover:text-indigo-400 transition-colors flex items-start gap-2 group-hover:underline w-full"
                    >
                      <span className="line-clamp-2">{bm.title}</span>
                    </button>
                    {bm.notes && (
                      <p className="text-xs text-[#A1A1AA] bg-[#18181B] border border-[#27272A] p-3 rounded-xl italic line-clamp-3">
                        &quot;{bm.notes}&quot;
                      </p>
                    )}
                  </div>

                  <div className="pt-4 border-t border-[#27272A]/60 flex items-center justify-between text-[10px] font-mono text-[#71717A]">
                    <span>Saved {new Date(bm.createdAt).toLocaleDateString()}</span>
                    <button onClick={() => handleOpenBookmark(bm)} className="text-indigo-400 hover:underline">
                      Open Search →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
