'use client';

import React from 'react';
import { X, ExternalLink, Bookmark, FolderPlus, Globe, Sparkles } from 'lucide-react';

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

interface ImageViewerProps {
  image: ImageItem | null;
  onClose: () => void;
}

export default function ImageViewer({ image, onClose }: ImageViewerProps) {
  if (!image) return null;

  const handleBookmark = async () => {
    try {
      const res = await fetch('/api/bookmarks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: `[Image Viewer] ${image.title}`,
          url: image.imageUrl,
          notes: `Source: ${image.sourceUrl} (${image.sourceDomain})`,
        }),
      });
      if (res.ok) {
        alert('Image bookmarked successfully!');
      } else {
        alert('Failed to bookmark. Please sign in.');
      }
    } catch {
      alert('Failed to bookmark image.');
    }
  };

  const handleAddToResearch = async () => {
    const title = prompt('Enter research project title for this image:', 'WorldKnows Image Research');
    if (!title) return;
    try {
      const res = await fetch('/api/research', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description: `Research project for image: ${image.title}`,
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
              title: `Image: ${image.title}`,
              content: `URL: ${image.imageUrl}\nSource: ${image.sourceUrl}`,
            }),
          });
          alert('Successfully added image to research project!');
        }
      }
    } catch {
      alert('Failed to add to research.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 lg:p-8 animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl bg-[#111113] border border-[#27272A] rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#27272A] flex items-center justify-between bg-[#141417]">
          <div className="flex items-center gap-2.5">
            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/25 uppercase tracking-widest">
              Web Image Viewer
            </span>
            <span className="text-xs text-[#71717A] font-mono truncate max-w-xs sm:max-w-md">{image.title}</span>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-[#71717A] hover:text-[#FAFAFA] hover:bg-[#18181B] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Image Display */}
        <div className="flex-1 bg-black/40 flex items-center justify-center p-4 overflow-hidden relative">
          <img
            src={image.imageUrl}
            alt={image.title}
            className="max-h-[60vh] max-w-full object-contain rounded-xl shadow-2xl"
          />
        </div>

        {/* Footer Metadata & Actions */}
        <div className="p-6 border-t border-[#27272A] bg-[#141417] flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="space-y-1 text-center sm:text-left">
            <h3 className="text-sm font-bold text-[#FAFAFA]">{image.title}</h3>
            <div className="flex items-center justify-center sm:justify-start gap-2 text-xs text-[#A1A1AA]">
              <Globe className="w-3.5 h-3.5 text-indigo-400" />
              <span>Found on <strong className="text-[#FAFAFA]">{image.sourceName}</strong> ({image.sourceDomain})</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {image.sourceUrl && (
              <a
                href={image.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 rounded-xl bg-[#18181B] border border-[#27272A] hover:border-indigo-500/40 text-xs font-medium text-[#FAFAFA] flex items-center gap-1.5 transition-all"
              >
                <span>Open Source Page</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
            <button
              onClick={handleBookmark}
              className="px-4 py-2 rounded-xl bg-[#18181B] border border-[#27272A] hover:border-indigo-500/40 text-xs font-medium text-[#FAFAFA] flex items-center gap-1.5 transition-all"
            >
              <Bookmark className="w-3.5 h-3.5 text-indigo-400" />
              <span>Bookmark</span>
            </button>
            <button
              onClick={handleAddToResearch}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-medium text-white flex items-center gap-1.5 transition-all shadow-lg shadow-indigo-600/20"
            >
              <FolderPlus className="w-3.5 h-3.5" />
              <span>Add to Research</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
