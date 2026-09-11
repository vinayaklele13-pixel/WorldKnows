'use client';

import React from 'react';
import { X, ExternalLink, Bookmark, FolderPlus, Video, User, Clock } from 'lucide-react';

interface VideoItem {
  id: string;
  videoId?: string;
  title: string;
  thumbnailUrl: string;
  videoUrl: string;
  sourceUrl: string;
  sourceDomain: string;
  sourceName: string;
  channelName?: string;
  description?: string;
  publishedAt?: string;
  duration?: string;
  isMock?: boolean;
}

interface VideoViewerProps {
  video: VideoItem | null;
  onClose: () => void;
}

export default function VideoViewer({ video, onClose }: VideoViewerProps) {
  if (!video) return null;

  // Extract YouTube video ID for embed if possible, prioritizing explicit videoId from provider
  const getEmbedUrl = (video: VideoItem) => {
    if (video.videoId) {
      return `https://www.youtube.com/embed/${video.videoId}?autoplay=1`;
    }
    try {
      const parsed = new URL(video.videoUrl);
      let vId = parsed.searchParams.get('v');
      if (!vId && parsed.hostname.includes('youtu.be')) {
        vId = parsed.pathname.slice(1);
      }
      if (vId) {
        return `https://www.youtube.com/embed/${vId}?autoplay=1`;
      }
    } catch {
      // ignore
    }
    return null;
  };

  const embedUrl = getEmbedUrl(video);

  const handleBookmark = async () => {
    try {
      const res = await fetch('/api/bookmarks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: `[Video Viewer] ${video.title}`,
          url: video.videoUrl,
          notes: `Channel: ${video.channelName || 'N/A'} (${video.sourceUrl})`,
        }),
      });
      if (res.ok) {
        alert('Video bookmarked successfully!');
      } else {
        alert('Failed to bookmark. Please sign in.');
      }
    } catch {
      alert('Failed to bookmark video.');
    }
  };

  const handleAddToResearch = async () => {
    const title = prompt('Enter research project title for this video:', 'WorldKnows Video Research');
    if (!title) return;
    try {
      const res = await fetch('/api/research/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description: `Research project for video: ${video.title}`,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        const projectId = data.project?.id;
        if (projectId) {
          await fetch(`/api/research/projects/${projectId}/notes`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              title: `Video: ${video.title}`,
              content: `URL: ${video.videoUrl}\nChannel: ${video.channelName || 'N/A'}`,
            }),
          });
          alert('Successfully added video to research project!');
        }
      }
    } catch {
      alert('Failed to add to research.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 lg:p-8 animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl bg-[#111113] border border-[#27272A] rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#27272A] flex items-center justify-between bg-[#141417]">
          <div className="flex items-center gap-2.5">
            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-red-500/10 text-red-400 border border-red-500/25 uppercase tracking-widest flex items-center gap-1">
              <Video className="w-3 h-3" /> YouTube Player
            </span>
            <span className="text-xs text-[#71717A] font-mono truncate max-w-xs sm:max-w-md">{video.title}</span>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-[#71717A] hover:text-[#FAFAFA] hover:bg-[#18181B] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Video Player Display */}
        <div className="flex-1 bg-black flex items-center justify-center aspect-video relative">
          {embedUrl ? (
            <iframe
              src={embedUrl}
              title={video.title}
              className="w-full h-full border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : (
            <div className="flex flex-col items-center justify-center space-y-4 p-8 text-center">
              <img src={video.thumbnailUrl} alt={video.title} className="max-h-64 rounded-xl object-cover" />
              <a
                href={video.videoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-medium"
              >
                Watch on YouTube →
              </a>
            </div>
          )}
        </div>

        {/* Footer Metadata & Actions */}
        <div className="p-6 border-t border-[#27272A] bg-[#141417] flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="space-y-1 text-center sm:text-left">
            <h3 className="text-sm font-bold text-[#FAFAFA]">{video.title}</h3>
            <div className="flex items-center justify-center sm:justify-start gap-3 text-xs text-[#A1A1AA]">
              <div className="flex items-center gap-1 text-indigo-400">
                <User className="w-3.5 h-3.5" />
                <span>{video.channelName || 'YouTube Creator'}</span>
              </div>
              {video.publishedAt && (
                <div className="flex items-center gap-1 font-mono text-[#71717A]">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{video.publishedAt}</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={video.videoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 rounded-xl bg-[#18181B] border border-[#27272A] hover:border-indigo-500/40 text-xs font-medium text-[#FAFAFA] flex items-center gap-1.5 transition-all"
            >
              <span>Open on YouTube</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
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
