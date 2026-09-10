'use client';

import React, { useState } from 'react';
import { Bookmark, Check, Sparkles } from 'lucide-react';

interface BookmarkButtonProps {
  title: string;
  url: string;
  notes?: string;
}

export default function BookmarkButton({ title, url, notes }: BookmarkButtonProps) {
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleBookmark = async () => {
    if (saved) return;
    setLoading(true);
    try {
      const res = await fetch('/api/bookmarks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, url, notes: notes || 'Saved from WorldKnows Search' }),
      });

      if (res.ok) {
        setSaved(true);
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
    <button
      onClick={handleBookmark}
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
      <span>{saved ? 'Saved in Vault' : 'Save Bookmark'}</span>
    </button>
  );
}
