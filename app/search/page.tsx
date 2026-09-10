import React, { Suspense } from 'react';
import SearchResultsClient from './SearchResultsClient';
import SearchSkeleton from '@/components/search/SearchSkeleton';

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#09090B] p-8">
        <SearchSkeleton />
      </div>
    }>
      <SearchResultsClient />
    </Suspense>
  );
}
