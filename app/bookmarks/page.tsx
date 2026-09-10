'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import SearchHeader from '@/components/search/SearchHeader';
import { Bookmark, Trash2, Plus, ExternalLink, Sparkles, FolderPlus, Globe } from 'lucide-react';

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

  // New bookmark form state
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newUrl, setNewUrl] = useState('');
  const [newNotes, setNewNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

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

  const handleCreateBookmark = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newUrl.trim()) return;

    setSubmitting(true);
    try {
      const res = await fetch('/api/bookmarks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newTitle, url: newUrl, notes: newNotes }),
      });

      if (res.ok) {
        const { bookmark } = await res.json();
        setBookmarks([bookmark, ...bookmarks]);
        setNewTitle('');
        setNewUrl('');
        setNewNotes('');
        setShowAddModal(false);
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to create bookmark.');
      }
    } finally {
      setSubmitting(false);
    }
  };

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

  return (
    <div className="min-h-screen bg-[#09090B] text-[#FAFAFA] flex flex-col selection:bg-indigo-500/30 selection:text-white">
      <SearchHeader initialQuery="" />

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
              Manage your saved web sources, references, and research bookmarks.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-all shadow-lg shadow-indigo-600/20"
            >
              <Plus className="w-4 h-4" />
              Add Bookmark
            </button>
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
              Save sources from search results or manually add links to build your research library.
            </p>
            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              Add First Bookmark
            </button>
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
                      {new URL(bm.url || 'http://localhost').hostname}
                    </span>
                    <button
                      onClick={() => handleDelete(bm.id)}
                      className="p-1.5 rounded-lg text-[#71717A] hover:text-red-400 hover:bg-red-500/10 transition-colors"
                      title="Delete Bookmark"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <a
                    href={bm.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-bold text-base text-[#FAFAFA] hover:text-indigo-400 transition-colors flex items-start gap-2 group-hover:underline"
                  >
                    <span className="line-clamp-2">{bm.title}</span>
                    <ExternalLink className="w-4 h-4 shrink-0 mt-1 text-[#71717A]" />
                  </a>
                  {bm.notes && (
                    <p className="text-xs text-[#A1A1AA] bg-[#18181B] border border-[#27272A] p-3 rounded-xl italic">
                      &quot;{bm.notes}&quot;
                    </p>
                  )}
                </div>

                <div className="pt-4 border-t border-[#27272A]/60 flex items-center justify-between text-[10px] font-mono text-[#71717A]">
                  <span>Saved {new Date(bm.createdAt).toLocaleDateString()}</span>
                  <a href={bm.url} target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:underline">
                    Visit Link →
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Add Bookmark Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#111113] border border-[#27272A] rounded-2xl w-full max-w-lg p-6 space-y-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-[#27272A] pb-4">
              <h3 className="text-lg font-bold">Save New Bookmark</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-[#71717A] hover:text-[#FAFAFA] transition-colors"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateBookmark} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-mono text-[#A1A1AA] uppercase tracking-wider">Title</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Stanford Encyclopedia of Philosophy"
                  className="w-full bg-[#18181B] border border-[#27272A] rounded-xl px-4 py-2.5 text-sm focus:border-indigo-500 focus:outline-none transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-mono text-[#A1A1AA] uppercase tracking-wider">URL</label>
                <input
                  type="url"
                  required
                  value={newUrl}
                  onChange={(e) => setNewUrl(e.target.value)}
                  placeholder="https://example.com"
                  className="w-full bg-[#18181B] border border-[#27272A] rounded-xl px-4 py-2.5 text-sm focus:border-indigo-500 focus:outline-none transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-mono text-[#A1A1AA] uppercase tracking-wider">Research Notes (Optional)</label>
                <textarea
                  rows={3}
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  placeholder="Add your personal notes or takeaways..."
                  className="w-full bg-[#18181B] border border-[#27272A] rounded-xl p-4 text-sm focus:border-indigo-500 focus:outline-none transition-all resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2 border-t border-[#27272A]">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl text-sm font-medium text-[#71717A] hover:text-[#FAFAFA] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || !newTitle.trim() || !newUrl.trim()}
                  className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2 rounded-xl text-sm font-medium transition-all disabled:opacity-50"
                >
                  {submitting ? <Sparkles className="w-4 h-4 animate-spin" /> : <Bookmark className="w-4 h-4" />}
                  Save Bookmark
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
