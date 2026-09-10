import React from 'react';

export default function SearchSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      {/* Header Skeleton */}
      <div className="h-48 bg-[#111113] border border-[#27272A] rounded-2xl w-full"></div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="h-32 bg-[#111113] border border-[#27272A] rounded-2xl w-full"></div>
          <div className="h-64 bg-[#111113] border border-[#27272A] rounded-2xl w-full"></div>
        </div>
        <div className="space-y-6">
          <div className="h-64 bg-[#111113] border border-[#27272A] rounded-2xl w-full"></div>
          <div className="h-48 bg-[#111113] border border-[#27272A] rounded-2xl w-full"></div>
        </div>
      </div>
    </div>
  );
}
