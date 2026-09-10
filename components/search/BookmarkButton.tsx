'use client';

import React, { useState } from 'react';
import { Bookmark, Check, Sparkles, X } from 'lucide-react';

interface BookmarkButtonProps {
  title: string;
  url: string;
  searchId?: string;
  notes?: string;
}

export default function BookmarkButton({ title, url, searchId, notes }: BookmarkButtonProps) {
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [bookmarkName, setBookmarkName] = useState(title);

  const handleOpenModal = () => {
    if (saved) return;
    setBookmarkName(title);
    setModalOpen(true);
  };

  const handleSaveBookmark = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookmarkName.trim()) return;
    setLoading(true);
    try {
      const res = await fetch('/api/bookmarks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: bookmarkName.trim(),
          url,
          notes: notes || `WorldKnows page: ${title}`,
        }),
      });

      if (res.ok) {
        setSaved(true);
        setModalOpen(false);
      } else {
        const data = await res.json();
        if (res.status === 401) {
          alert('Please sign in to save bookmarks.');
          window.location.href = '/auth/signin';
        } else {
          alert(data.error || 'Failed to save bookmark.');
        }
      }
    } catch (err) {
      console.error('Bookmark error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={handleOpenModal}
        disabled={loading || saved}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all shadow-sm ${
          saved
            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
            : 'bg-[#111113] border-[#27272A] hover:border-indigo-500/50 text-[#A1A1AA] hover:text-[#FAFAFA]'
        }`}
      >
        {loading ? (
          <Sparkles className="w-3.5 h-3.5 animate-spin text-indigo-400" />
        ) : saved ? (
          <Check className="w-3.5 h-3.5 text-emerald-400" />
        ) : (
          <Bookmark className="w-3.5 h-3.5 text-indigo-400" />
        )}
        <span>{saved ? 'Saved in Vault' : 'Bookmark'}</span>
      </button>

      {/* Simplified Bookmark Modal: Name Only */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-[#09090B]/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#111113] border border-[#27272A] rounded-2xl p-6 space-y-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bookmark className="w-5 h-5 text-indigo-400" />
                <h3 className="text-lg font-bold text-[#FAFAFA]">Save Bookmark</h3>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1.5 rounded-lg text-[#71717A] hover:text-[#FAFAFA] hover:bg-[#18181B]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveBookmark} className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-medium text-[#A1A1AA]">Name</label>
                <input
                  type="text"
                  value={bookmarkName}
                  onChange={(e) => setBookmarkName(e.target.value)}
                  placeholder="Enter bookmark name..."
                  required
                  className="w-full bg-[#18181B] border border-[#27272A] rounded-xl px-4 py-3 text-sm text-[#FAFAFA] focus:outline-none focus:border-indigo-500 transition-all"
                />
                <p className="text-[11px] text-[#71717A]">
                  This WorldKnows page will be automatically associated with your bookmark.
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-[#A1A1AA] hover:text-[#FAFAFA] hover:bg-[#18181B] transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || !bookmarkName.trim()}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition-all shadow-md shadow-indigo-600/20 disabled:opacity-50 flex items-center gap-2"
                >
                  {loading && <Sparkles className="w-3.5 h-3.5 animate-spin" />}
                  <span>Save Bookmark</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
