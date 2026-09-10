'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import SearchHeader from '@/components/search/SearchHeader';
import QuickAnswer from '@/components/search/QuickAnswer';
import KeyFacts from '@/components/search/KeyFacts';
import SourceList from '@/components/search/SourceList';
import RelatedTopics from '@/components/search/RelatedTopics';
import DetailedSections from '@/components/search/DetailedSections';
import SearchSkeleton from '@/components/search/SearchSkeleton';
import { defaultMockResult } from '@/lib/mock-search-data';
import { SearchResultData } from '@/types/search';
import { Sparkles, Globe, Clock, AlertCircle } from 'lucide-react';

export default function SearchResultsClient() {
  const searchParams = useSearchParams();
  const rawQuery = searchParams.get('q') || 'Quantum Computing';
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [resultData, setResultData] = useState<SearchResultData>(defaultMockResult);

  useEffect(() => {
    let isMounted = true;
    async function fetchSearchResults() {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(rawQuery)}`);
        if (!response.ok) {
          throw new Error('Failed to fetch search results from API');
        }
        const data = await response.json();
        if (isMounted) {
          setResultData(data);
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err.message || 'An error occurred while fetching search results.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    fetchSearchResults();

    return () => {
      isMounted = false;
    };
  }, [rawQuery]);

  return (
    <div className="min-h-screen bg-[#09090B] text-[#FAFAFA] flex flex-col selection:bg-indigo-500/30 selection:text-white">
      {/* Header */}
      <SearchHeader initialQuery={rawQuery} />

      {/* Main Content */}
      <main className="flex-1 max-w-[1600px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <SearchSkeleton />
        ) : error ? (
          <div className="p-6 rounded-2xl bg-[#111113] border border-red-500/30 text-center space-y-3 my-12">
            <AlertCircle className="w-8 h-8 text-red-400 mx-auto" />
            <h2 className="text-lg font-bold text-[#FAFAFA]">Search Error</h2>
            <p className="text-sm text-[#A1A1AA]">{error}</p>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Search Meta Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-6 border-b border-[#27272A]/60">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 uppercase tracking-widest">
                    {resultData.intent} INTENT
                  </span>
                  <span className="text-xs text-[#71717A] flex items-center gap-1 font-mono">
                    <Clock className="w-3 h-3" /> Indexed via OmniRoute API
                  </span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#FAFAFA]">
                  {resultData.query}
                </h1>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#111113] border border-[#27272A] text-xs text-[#A1A1AA]">
                  <Globe className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Verified Knowledge Index</span>
                </div>
              </div>
            </div>

            {/* Adaptive Grid Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Primary Content Column (Left / Center) */}
              <div className="lg:col-span-8 space-y-6">
                <QuickAnswer answer={resultData.quickAnswer} />
                <DetailedSections sections={resultData.detailedSections} />
                <SourceList sources={resultData.sources} />
              </div>

              {/* Sidebar Column (Right) */}
              <div className="lg:col-span-4 space-y-6">
                <KeyFacts facts={resultData.keyFacts} />
                <RelatedTopics topics={resultData.relatedTopics} />

                {/* Trust Notice Box */}
                <div className="p-4 rounded-2xl bg-[#111113] border border-[#27272A] space-y-2">
                  <div className="flex items-center gap-2 text-xs font-semibold text-[#FAFAFA]">
                    <Sparkles className="w-4 h-4 text-indigo-400" />
                    <span>WorldKnows Trust Guarantee</span>
                  </div>
                  <p className="text-xs text-[#A1A1AA] leading-relaxed">
                    All citations are anchored to verified public sources. We prioritize transparency over synthetic confidence.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-[#27272A]/60 bg-[#09090B] py-8 px-4 sm:px-6 lg:px-8 mt-16">
        <div className="max-w-[1600px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#71717A]">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-[#FAFAFA]">WorldKnows</span>
            <span>—</span>
            <span>Understand Anything.</span>
          </div>
          <div className="flex items-center gap-6">
            <a href="/" className="hover:text-[#A1A1AA] transition-colors">Home</a>
            <a href="/" className="hover:text-[#A1A1AA] transition-colors">Privacy</a>
            <span className="text-indigo-400">Search Engine Active</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
