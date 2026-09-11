'use client';

import React, { useState } from 'react';
import { ExternalLink, Bookmark, FolderPlus, FileText, Globe, Maximize2, Sparkles, Check, Wand2 } from 'lucide-react';

interface ImageItem {
  id: string;
  title: string;
  thumbnailUrl: string;
  imageUrl: string;
  sourceUrl: string;
  sourceDomain: string;
  sourceName: string;
  isMock?: boolean;
}

interface ImageGridProps {
  images: ImageItem[];
  loading: boolean;
  onSelectImage: (image: ImageItem) => void;
  onOpenGenerator?: () => void;
}

import ImageGenerator from '@/components/ai/ImageGenerator';

export default function ImageGrid({ images, loading, onSelectImage }: ImageGridProps) {
  const [showGenerator, setShowGenerator] = useState(false);
  const [bookmarkedIds, setBookmarkedIds] = useState<Record<string, boolean>>({});
  const [researchSavedIds, setResearchSavedIds] = useState<Record<string, boolean>>({});
  const [noteSavedIds, setNoteSavedIds] = useState<Record<string, boolean>>({});

  const handleBookmarkImage = async (e: React.MouseEvent, img: ImageItem) => {
    e.stopPropagation();
    try {
      const res = await fetch('/api/bookmarks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: `[Image] ${img.title}`,
          url: img.imageUrl,
          notes: `Web Image from ${img.sourceDomain} (${img.sourceUrl})`,
        }),
      });
      if (res.ok) {
        setBookmarkedIds((prev) => ({ ...prev, [img.id]: true }));
      } else {
        alert('Failed to bookmark image (Sign in required).');
      }
    } catch {
      alert('Failed to bookmark image.');
    }
  };

  const handleAddToResearch = async (e: React.MouseEvent, img: ImageItem) => {
    e.stopPropagation();
    const title = prompt('Enter research project title to add this image:', 'WorldKnows Image Research');
    if (!title) return;

    try {
      const res = await fetch('/api/research', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description: `Research project containing image: ${img.title} from ${img.sourceDomain}`,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        const projectId = data.project?.id;
        if (projectId) {
          await fetch(`/api/research/${projectId}/notes`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              title: `Image: ${img.title}`,
              content: `Image URL: ${img.imageUrl}\nSource: ${img.sourceUrl}\nDomain: ${img.sourceDomain}`,
            }),
          });
          setResearchSavedIds((prev) => ({ ...prev, [img.id]: true }));
          alert('Successfully added image to research project!');
        }
      } else {
        alert('Failed to create research project.');
      }
    } catch {
      alert('Failed to add to research.');
    }
  };

  const handleAddToNotes = async (e: React.MouseEvent, img: ImageItem) => {
    e.stopPropagation();
    try {
      const res = await fetch('/api/research');
      if (!res.ok) {
        alert('Please sign in and create a research project first.');
        return;
      }
      const data = await res.json();
      const projects = data.projects || [];
      if (projects.length === 0) {
        alert('Please create a research project first to store notes.');
        return;
      }
      const projId = projects[0].id;
      const noteRes = await fetch(`/api/research/${projId}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: `Image Note: ${img.title}`,
          content: `Web Image Reference\n- Image URL: ${img.imageUrl}\n- Source: ${img.sourceUrl}`,
        }),
      });
      if (noteRes.ok) {
        setNoteSavedIds((prev) => ({ ...prev, [img.id]: true }));
        alert('Successfully added image note to project!');
      }
    } catch {
      alert('Failed to add note.');
    }
  };

  if (loading) {
    return (
      <div className="space-y-4 my-6">
        <div className="flex items-center gap-2 text-xs font-mono text-indigo-400">
          <Sparkles className="w-4 h-4 animate-spin" />
          <span>Searching live web images...</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="aspect-video bg-[#111113] border border-[#27272A] rounded-2xl animate-pulse flex items-center justify-center">
              <span className="text-[10px] text-[#71717A]">Loading image...</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!images || images.length === 0) {
    return (
      <div className="my-6 p-6 rounded-2xl border border-dashed border-[#27272A] bg-[#111113]/30 text-center space-y-2">
        <Globe className="w-6 h-6 text-[#71717A] mx-auto" />
        <p className="text-xs text-[#71717A]">No relevant images were found for this query.</p>
      </div>
    );
  }

  return (
    <div className="my-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/25 uppercase tracking-widest">
            Web Images
          </span>
          <span className="text-xs text-[#71717A] font-mono">Found on the web</span>
        </div>
        <button
          onClick={() => setShowGenerator(!showGenerator)}
          className="text-xs font-medium text-indigo-400 hover:text-indigo-300 flex items-center gap-1.5"
        >
          <Wand2 className="w-3.5 h-3.5" />
          {showGenerator ? 'Close AI Studio' : 'Generate with AI'}
        </button>
      </div>

      {showGenerator && <ImageGenerator />}

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {images.map((img) => (
          <div
            key={img.id}
            onClick={() => onSelectImage(img)}
            className="group relative rounded-2xl bg-[#111113] border border-[#27272A] hover:border-indigo-500/50 overflow-hidden flex flex-col cursor-pointer transition-all shadow-lg shadow-black/20"
          >
            {/* Image Thumbnail Container */}
            <div className="relative aspect-video w-full overflow-hidden bg-[#18181B]">
              <img
                src={img.thumbnailUrl}
                alt={img.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-between p-2.5">
                <span className="text-[10px] font-mono text-white bg-black/60 px-2 py-0.5 rounded backdrop-blur-sm truncate max-w-[120px]">
                  {img.sourceDomain}
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectImage(img);
                  }}
                  className="p-1.5 rounded-lg bg-indigo-600/90 text-white hover:bg-indigo-500 transition-colors"
                  title="View Larger"
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Metadata & Actions */}
            <div className="p-3 flex flex-col justify-between flex-1 space-y-2">
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-[#FAFAFA] line-clamp-1 group-hover:text-indigo-400 transition-colors">
                  {img.title}
                </h4>
                <div className="flex items-center gap-1.5 text-[10px] text-[#A1A1AA]">
                  <Globe className="w-3 h-3 text-[#71717A]" />
                  <span className="truncate">{img.sourceName}</span>
                </div>
              </div>

              {/* Action Toolbar */}
              <div className="pt-2 border-t border-[#27272A]/60 flex items-center justify-between">
                <a
                  href={img.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="text-[10px] font-mono text-indigo-400 hover:underline flex items-center gap-1"
                >
                  <span>Source</span>
                  <ExternalLink className="w-3 h-3" />
                </a>

                <div className="flex items-center gap-1">
                  <button
                    onClick={(e) => handleBookmarkImage(e, img)}
                    className={`p-1.5 rounded-lg transition-colors ${
                      bookmarkedIds[img.id] ? 'bg-indigo-600 text-white' : 'text-[#71717A] hover:text-[#FAFAFA] hover:bg-[#18181B]'
                    }`}
                    title="Bookmark Image"
                  >
                    {bookmarkedIds[img.id] ? <Check className="w-3 h-3" /> : <Bookmark className="w-3 h-3" />}
                  </button>
                  <button
                    onClick={(e) => handleAddToResearch(e, img)}
                    className={`p-1.5 rounded-lg transition-colors ${
                      researchSavedIds[img.id] ? 'bg-indigo-600 text-white' : 'text-[#71717A] hover:text-[#FAFAFA] hover:bg-[#18181B]'
                    }`}
                    title="Add to Research"
                  >
                    <FolderPlus className="w-3 h-3" />
                  </button>
                  <button
                    onClick={(e) => handleAddToNotes(e, img)}
                    className={`p-1.5 rounded-lg transition-colors ${
                      noteSavedIds[img.id] ? 'bg-indigo-600 text-white' : 'text-[#71717A] hover:text-[#FAFAFA] hover:bg-[#18181B]'
                    }`}
                    title="Add to Notes"
                  >
                    <FileText className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
