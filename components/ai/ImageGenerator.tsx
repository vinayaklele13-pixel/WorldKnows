'use client';

import React, { useState } from 'react';
import { Sparkles, Loader2, Bookmark, FolderPlus, FileText, Check, ExternalLink, Maximize2 } from 'lucide-react';

interface GeneratedImage {
  id: string;
  url: string;
  revisedPrompt?: string;
  isMock: boolean;
  provider: string;
  createdAt: string;
}

export default function ImageGenerator() {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [images, setImages] = useState<GeneratedImage[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleBookmark = async (img: GeneratedImage) => {
    try {
      const res = await fetch('/api/bookmarks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: `[AI Image] ${prompt.substring(0, 30)}...`,
          url: img.url,
          notes: `Generated using ${img.provider} at ${img.createdAt}`,
        }),
      });
      if (res.ok) alert('Bookmarked!');
      else alert('Failed to bookmark.');
    } catch {
      alert('Error bookmarking.');
    }
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/ai/images/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to generate image');
      setImages([data.image, ...images]);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToResearch = async (img: GeneratedImage) => {
    const title = window.prompt('Research Project Title:', 'AI Generated Image Research');
    if (!title) return;
    try {
        const res = await fetch('/api/research/projects', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title, description: 'AI Image generation research' }),
        });
        if (res.ok) {
            const data = await res.json();
            const projId = data.project?.id;
            await fetch(`/api/research/projects/${projId}/notes`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: 'Generated Image',
                    content: `Prompt: ${prompt}\nURL: ${img.url}`
                }),
            });
            alert('Added to Research!');
        }
    } catch {
        alert('Error adding to research.');
    }
  };

  return (
    <div className="space-y-6 my-6 p-6 rounded-2xl bg-[#111113] border border-[#27272A]">
      <div className="space-y-2">
        <h3 className="text-sm font-bold text-[#FAFAFA] flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-indigo-400" />
          AI Image Generator
        </h3>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Enter an image generation prompt..."
          className="w-full p-3 rounded-xl bg-[#18181B] border border-[#27272A] text-sm text-[#FAFAFA] placeholder-[#71717A] focus:outline-none focus:border-indigo-500/50"
          rows={3}
        />
        <button
          onClick={handleGenerate}
          disabled={loading || !prompt.trim()}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-xs font-medium transition-all"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Generate'}
        </button>
      </div>

      {error && <p className="text-xs text-red-400">{error}</p>}

      {images.map((img) => (
        <div key={img.id} className="relative rounded-2xl overflow-hidden border border-[#27272A] bg-[#18181B]">
          <img src={img.url} alt={prompt} className="w-full h-auto" />
          <div className="absolute top-3 left-3 flex gap-2">
             <span className={`px-2 py-1 rounded text-[10px] font-semibold uppercase tracking-widest ${img.isMock ? 'bg-yellow-500/10 text-yellow-400' : 'bg-indigo-500/10 text-indigo-400'}`}>
               {img.isMock ? 'DEVELOPMENT MOCK (AI)' : 'AI GENERATED'}
             </span>
          </div>
          <div className="absolute top-3 right-3 flex gap-2 bg-black/60 p-1.5 rounded-lg backdrop-blur">
             <button onClick={() => handleBookmark(img)} className="text-white hover:text-indigo-400"><Bookmark className="w-4 h-4" /></button>
             <button onClick={() => handleAddToResearch(img)} className="text-white hover:text-indigo-400"><FolderPlus className="w-4 h-4" /></button>
          </div>
        </div>
      ))}
    </div>
  );
}
