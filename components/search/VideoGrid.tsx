'use client';

import React, { useState } from 'react';
import { ExternalLink, Bookmark, FolderPlus, FileText, Play, Globe, Sparkles, Check, Clock, User } from 'lucide-react';

interface VideoItem {
  id: string;
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

interface VideoGridProps {
  videos: VideoItem[];
  loading: boolean;
  error?: string | null;
  onSelectVideo: (video: VideoItem) => void;
}

export default function VideoGrid({ videos, loading, error, onSelectVideo }: VideoGridProps) {
  const [bookmarkedIds, setBookmarkedIds] = useState<Record<string, boolean>>({});
  const [researchSavedIds, setResearchSavedIds] = useState<Record<string, boolean>>({});
  const [noteSavedIds, setNoteSavedIds] = useState<Record<string, boolean>>({});

  const handleBookmarkVideo = async (e: React.MouseEvent, vid: VideoItem) => {
    e.stopPropagation();
    try {
      const res = await fetch('/api/bookmarks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: `[Video] ${vid.title}`,
          url: vid.videoUrl,
          notes: `YouTube Video by ${vid.channelName || 'Creator'} (${vid.sourceUrl})`,
        }),
      });
      if (res.ok) {
        setBookmarkedIds((prev) => ({ ...prev, [vid.id]: true }));
      } else {
        alert('Failed to bookmark video (Sign in required).');
      }
    } catch {
      alert('Failed to bookmark video.');
    }
  };

  const handleAddToResearch = async (e: React.MouseEvent, vid: VideoItem) => {
    e.stopPropagation();
    const title = prompt('Enter research project title to add this video:', 'WorldKnows Video Research');
    if (!title) return;

    try {
      const res = await fetch('/api/research/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description: `Research project containing video: ${vid.title} by ${vid.channelName || 'Creator'}`,
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
              title: `Video: ${vid.title}`,
              content: `Video URL: ${vid.videoUrl}\nChannel: ${vid.channelName || 'N/A'}\nSource: ${vid.sourceUrl}`,
            }),
          });
          setResearchSavedIds((prev) => ({ ...prev, [vid.id]: true }));
          alert('Successfully added video to research project!');
        }
      } else {
        alert('Failed to create research project.');
      }
    } catch {
      alert('Failed to add to research.');
    }
  };

  const handleAddToNotes = async (e: React.MouseEvent, vid: VideoItem) => {
    e.stopPropagation();
    try {
      const res = await fetch('/api/research/projects');
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
      const noteRes = await fetch(`/api/research/projects/${projId}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: `Video Note: ${vid.title}`,
          content: `Web Video Reference\n- Video URL: ${vid.videoUrl}\n- Channel: ${vid.channelName || 'N/A'}`,
        }),
      });
      if (noteRes.ok) {
        setNoteSavedIds((prev) => ({ ...prev, [vid.id]: true }));
        alert('Successfully added video note to project!');
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
          <span>Searching YouTube & web videos...</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="aspect-video bg-[#111113] border border-[#27272A] rounded-2xl animate-pulse flex items-center justify-center">
              <span className="text-[10px] text-[#71717A]">Loading video...</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="my-6 p-6 rounded-2xl border border-red-500/30 bg-[#111113] text-center space-y-2">
        <p className="text-xs text-red-400 font-medium">{error}</p>
        <p className="text-[10px] text-[#71717A]">Video search is temporarily unavailable.</p>
      </div>
    );
  }

  if (!videos || videos.length === 0) {
    return (
      <div className="my-6 p-6 rounded-2xl border border-dashed border-[#27272A] bg-[#111113]/30 text-center space-y-2">
        <Globe className="w-6 h-6 text-[#71717A] mx-auto" />
        <p className="text-xs text-[#71717A]">No relevant videos were found for this query.</p>
      </div>
    );
  }

  return (
    <div className="my-8 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/25 uppercase tracking-widest">
            Web & YouTube Videos
          </span>
          <span className="text-xs text-[#71717A] font-mono">
            {videos[0]?.isMock ? 'DEVELOPMENT MOCK' : 'FOUND ON THE WEB'}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {videos.map((vid) => (
          <div
            key={vid.id}
            onClick={() => onSelectVideo(vid)}
            className="group relative rounded-2xl bg-[#111113] border border-[#27272A] hover:border-indigo-500/50 overflow-hidden flex flex-col cursor-pointer transition-all shadow-lg shadow-black/20"
          >
            {/* Video Thumbnail Container */}
            <div className="relative aspect-video w-full overflow-hidden bg-[#18181B]">
              <img
                src={vid.thumbnailUrl}
                alt={vid.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-between p-3">
                <span className="text-[10px] font-mono text-white bg-black/60 px-2 py-0.5 rounded backdrop-blur-sm">
                  {vid.sourceDomain}
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectVideo(vid);
                  }}
                  className="p-2 rounded-xl bg-indigo-600 text-white hover:bg-indigo-500 transition-colors shadow-lg"
                  title="Play Video"
                >
                  <Play className="w-4 h-4 fill-white" />
                </button>
              </div>
              {vid.duration && (
                <div className="absolute bottom-2 right-2 bg-black/80 text-white text-[10px] font-mono px-1.5 py-0.5 rounded">
                  {vid.duration}
                </div>
              )}
            </div>

            {/* Metadata & Actions */}
            <div className="p-4 flex flex-col justify-between flex-1 space-y-3">
              <div className="space-y-1.5">
                <h4 className="text-xs font-bold text-[#FAFAFA] line-clamp-2 group-hover:text-indigo-400 transition-colors leading-relaxed">
                  {vid.title}
                </h4>
                <div className="flex items-center justify-between text-[10px] text-[#A1A1AA]">
                  <div className="flex items-center gap-1.5 truncate">
                    <User className="w-3 h-3 text-indigo-400" />
                    <span className="truncate">{vid.channelName || 'YouTube Creator'}</span>
                  </div>
                  {vid.publishedAt && (
                    <div className="flex items-center gap-1 font-mono text-[#71717A]">
                      <Clock className="w-3 h-3" />
                      <span>{vid.publishedAt}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Toolbar */}
              <div className="pt-3 border-t border-[#27272A]/60 flex items-center justify-between">
                <a
                  href={vid.videoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="text-[10px] font-mono text-indigo-400 hover:underline flex items-center gap-1"
                >
                  <span>YouTube</span>
                  <ExternalLink className="w-3 h-3" />
                </a>

                <div className="flex items-center gap-1">
                  <button
                    onClick={(e) => handleBookmarkVideo(e, vid)}
                    className={`p-1.5 rounded-lg transition-colors ${
                      bookmarkedIds[vid.id] ? 'bg-indigo-600 text-white' : 'text-[#71717A] hover:text-[#FAFAFA] hover:bg-[#18181B]'
                    }`}
                    title="Bookmark Video"
                  >
                    {bookmarkedIds[vid.id] ? <Check className="w-3 h-3" /> : <Bookmark className="w-3 h-3" />}
                  </button>
                  <button
                    onClick={(e) => handleAddToResearch(e, vid)}
                    className={`p-1.5 rounded-lg transition-colors ${
                      researchSavedIds[vid.id] ? 'bg-indigo-600 text-white' : 'text-[#71717A] hover:text-[#FAFAFA] hover:bg-[#18181B]'
                    }`}
                    title="Add to Research"
                  >
                    <FolderPlus className="w-3 h-3" />
                  </button>
                  <button
                    onClick={(e) => handleAddToNotes(e, vid)}
                    className={`p-1.5 rounded-lg transition-colors ${
                      noteSavedIds[vid.id] ? 'bg-indigo-600 text-white' : 'text-[#71717A] hover:text-[#FAFAFA] hover:bg-[#18181B]'
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
