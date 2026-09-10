'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import SearchHeader from '@/components/search/SearchHeader';
import { Folder, Plus, Sparkles, ArrowRight, BookOpen, Trash2 } from 'lucide-react';

interface CollectionItem {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
  items: Array<{
    id: string;
    bookmark?: { title: string; url: string };
    search?: { query: string; summary: string };
  }>;
}

export default function CollectionsPage() {
  const router = useRouter();
  const [collections, setCollections] = useState<CollectionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch('/api/collections')
      .then(async (res) => {
        if (!res.ok) {
          if (res.status === 401) {
            router.push('/auth/signin');
            return;
          }
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || 'Failed to fetch collections');
        }
        return res.json();
      })
      .then((data) => {
        if (data.collections) setCollections(data.collections);
      })
      .catch((err) => {
        setError(err.message);
      })
      .finally(() => setLoading(false));
  }, [router]);

  const handleCreateCollection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setSubmitting(true);
    try {
      const res = await fetch('/api/collections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description }),
      });

      if (res.ok) {
        const { collection } = await res.json();
        setCollections([collection, ...collections]);
        setName('');
        setDescription('');
        setShowModal(false);
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to create collection.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this collection?')) return;

    const res = await fetch(`/api/collections/${id}`, {
      method: 'DELETE',
    });

    if (res.ok) {
      setCollections(collections.filter((c) => c.id !== id));
    } else {
      alert('Failed to delete collection.');
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
                Knowledge Organizer
              </span>
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-[#FAFAFA]">Research Collections</h1>
            <p className="text-sm text-[#A1A1AA]">
              Group your bookmarks and search results into structured thematic collections.
            </p>
          </div>

          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-all shadow-lg shadow-indigo-600/20"
          >
            <Plus className="w-4 h-4" />
            New Collection
          </button>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <Sparkles className="w-6 h-6 text-indigo-400 animate-spin mb-4" />
            <span className="text-xs font-mono text-[#A1A1AA] uppercase tracking-wider">Loading collections...</span>
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-red-500/30 bg-[#111113] p-8 text-center space-y-3">
            <h3 className="text-lg font-bold text-red-400">Authentication Required</h3>
            <p className="text-xs text-[#A1A1AA]">{error}</p>
            <button
              onClick={() => router.push('/auth/signin')}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-medium transition-all"
            >
              Sign In to View Collections
            </button>
          </div>
        ) : collections.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[#27272A] bg-[#111113]/30 p-16 text-center space-y-3">
            <Folder className="w-10 h-10 text-[#27272A] mx-auto" />
            <h3 className="text-base font-medium text-[#FAFAFA]">No collections created yet</h3>
            <p className="text-xs text-[#71717A] max-w-sm mx-auto">
              Create collections to organize your saved research topics and bookmarks.
            </p>
            <button
              onClick={() => setShowModal(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              Create First Collection
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {collections.map((col) => (
              <div
                key={col.id}
                className="rounded-2xl border border-[#27272A] bg-[#111113] hover:border-indigo-500/40 p-6 flex flex-col justify-between space-y-4 shadow-lg shadow-black/20 transition-all group"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                      <Folder className="w-5 h-5 text-indigo-400" />
                    </div>
                    <button
                      onClick={() => handleDelete(col.id)}
                      className="p-1.5 rounded-lg text-[#71717A] hover:text-red-400 hover:bg-red-500/10 transition-colors"
                      title="Delete Collection"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-[#FAFAFA] group-hover:text-indigo-400 transition-colors">
                      {col.name}
                    </h3>
                    <p className="text-xs text-[#A1A1AA] mt-1 line-clamp-2">
                      {col.description || 'No description provided.'}
                    </p>
                  </div>
                </div>

                <div className="pt-4 border-t border-[#27272A]/60 flex items-center justify-between text-xs text-[#71717A]">
                  <span className="font-mono">{col.items.length} Saved Items</span>
                  <button
                    onClick={() => router.push(`/research`)}
                    className="text-indigo-400 hover:underline flex items-center gap-1 font-medium"
                  >
                    <span>View in Research</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#111113] border border-[#27272A] rounded-2xl w-full max-w-lg p-6 space-y-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-[#27272A] pb-4">
              <h3 className="text-lg font-bold">New Collection</h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-[#71717A] hover:text-[#FAFAFA] transition-colors"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateCollection} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-mono text-[#A1A1AA] uppercase tracking-wider">Collection Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Artificial Intelligence Research"
                  className="w-full bg-[#18181B] border border-[#27272A] rounded-xl px-4 py-2.5 text-sm focus:border-indigo-500 focus:outline-none transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-mono text-[#A1A1AA] uppercase tracking-wider">Description (Optional)</label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe the scope of this collection..."
                  className="w-full bg-[#18181B] border border-[#27272A] rounded-xl p-4 text-sm focus:border-indigo-500 focus:outline-none transition-all resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2 border-t border-[#27272A]">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl text-sm font-medium text-[#71717A] hover:text-[#FAFAFA] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || !name.trim()}
                  className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2 rounded-xl text-sm font-medium transition-all disabled:opacity-50"
                >
                  {submitting ? <Sparkles className="w-4 h-4 animate-spin" /> : <Folder className="w-4 h-4" />}
                  Create Collection
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
