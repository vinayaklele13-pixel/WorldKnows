'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import SearchHeader from '@/components/search/SearchHeader';
import Link from 'next/link';
import { Layers, Sparkles, ArrowRight, Network } from 'lucide-react';

interface TopicItem {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  updatedAt: string;
  _count: {
    topicEntities: number;
  };
}

export default function TopicsDirectoryPage() {
  const router = useRouter();
  const [topics, setTopics] = useState<TopicItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchFilter, setSearchFilter] = useState('');

  useEffect(() => {
    fetch('/api/topics')
      .then((res) => res.json())
      .then((data) => {
        if (data.topics) setTopics(data.topics);
      })
      .finally(() => setLoading(false));
  }, []);

  const filteredTopics = topics.filter((t) =>
    t.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
    (t.description && t.description.toLowerCase().includes(searchFilter.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-[#09090B] text-[#FAFAFA] flex flex-col selection:bg-indigo-500/30 selection:text-white">
      <SearchHeader initialQuery="" />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-12 flex-1 w-full space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#27272A]/60 pb-8">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 uppercase tracking-widest">
                Knowledge Directory
              </span>
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-[#FAFAFA]">Topics & Concepts</h1>
            <p className="text-sm text-[#A1A1AA]">
              Explore indexed knowledge topics, connected entities, and verifiable graph relations.
            </p>
          </div>

          <div className="w-full md:w-72">
            <input
              type="text"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder="Filter topics..."
              className="w-full bg-[#111113] border border-[#27272A] rounded-xl px-4 py-2.5 text-sm text-[#FAFAFA] placeholder-[#71717A] focus:outline-none focus:border-indigo-500 transition-all"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <Sparkles className="w-6 h-6 text-indigo-400 animate-spin mb-4" />
            <span className="text-xs font-mono text-[#A1A1AA] uppercase tracking-wider">Loading topics directory...</span>
          </div>
        ) : filteredTopics.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[#27272A] bg-[#111113]/30 p-16 text-center space-y-3">
            <Layers className="w-10 h-10 text-[#27272A] mx-auto" />
            <h3 className="text-base font-medium text-[#FAFAFA]">No topics found</h3>
            <p className="text-xs text-[#71717A] max-w-sm mx-auto">
              Try searching for a different term or run a new search in WorldKnows to automatically populate the knowledge graph.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTopics.map((topic) => (
              <div
                key={topic.id}
                onClick={() => router.push(`/topics/${topic.slug}`)}
                className="rounded-2xl border border-[#27272A] bg-[#111113] hover:border-indigo-500/40 p-6 cursor-pointer transition-all flex flex-col justify-between group space-y-4 shadow-lg shadow-black/20"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono uppercase bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2 py-0.5 rounded">
                      Topic Node
                    </span>
                    <span className="text-xs text-[#71717A] flex items-center gap-1">
                      <Network className="w-3.5 h-3.5 text-indigo-400" />
                      {topic._count.topicEntities} Entities
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-[#FAFAFA] group-hover:text-indigo-400 transition-colors">
                    {topic.name}
                  </h3>
                  <p className="text-xs text-[#A1A1AA] line-clamp-3 leading-relaxed">
                    {topic.description || 'Verified knowledge topic indexed in the WorldKnows network.'}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-[#27272A]/60 text-xs font-medium text-indigo-400 group-hover:translate-x-1 transition-transform">
                  <span>Explore Topic Graph</span>
                  <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <footer className="border-t border-[#27272A]/60 bg-[#09090B] py-8 px-4 sm:px-6 mt-16">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#71717A]">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-[#FAFAFA]">WorldKnows</span>
            <span>—</span>
            <span>Understand Anything.</span>
          </div>
          <div className="flex items-center gap-6">
            <Link href="/" className="hover:text-[#A1A1AA] transition-colors">Home</Link>
            <Link href="/research" className="hover:text-[#A1A1AA] transition-colors">Research</Link>
            <span className="text-indigo-400">Topics Directory Active</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
