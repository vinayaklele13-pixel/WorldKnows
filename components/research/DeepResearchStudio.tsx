'use client';

import React, { useState } from 'react';
import { Sparkles, Loader2, Bookmark, FolderPlus, ExternalLink, BookOpen, AlertTriangle } from 'lucide-react';
import { ResearchReport } from '@/lib/research/types';

export default function DeepResearchStudio() {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<ResearchReport | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleResearch = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/research/deep', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });
      const data = await res.json();
      if (res.ok) {
        setReport(data.result);
      } else {
        if (res.status === 502 || res.status === 500) {
            setError(data.error || 'Provider configuration or availability error.');
        } else {
            setError(data.error || 'Failed to complete research.');
        }
      }
    } catch {
      setError('An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveToProject = async () => {
    if (!report) return;
    try {
      const res = await fetch('/api/research', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: report.title,
          description: `Deep Research generated report for: ${prompt}`,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        const projId = data.project?.id;
        if (projId) {
          await fetch(`/api/research/${projId}/notes`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              title: 'Full Research Report',
              content: report.report,
            }),
          });
          alert('Research saved to your Projects!');
        }
      } else {
        alert('Failed to save project. Please sign in.');
      }
    } catch {
      alert('Failed to save to projects.');
    }
  };

  return (
    <div className="space-y-6 my-6 p-6 rounded-2xl bg-[#111113] border border-[#27272A]">
      <div className="space-y-3">
        <h3 className="text-base font-bold text-[#FAFAFA] flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-indigo-400" />
          AI Deep Research Studio
        </h3>
        <p className="text-xs text-[#A1A1AA]">
          Conduct deep multi-step web research with automatic planning and grounded citation synthesis.
        </p>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Enter a research topic..."
          className="w-full p-3 rounded-xl bg-[#18181B] border border-[#27272A] text-sm text-[#FAFAFA] placeholder-[#71717A] focus:outline-none focus:border-indigo-500/50"
          rows={3}
        />
        <button
          onClick={handleResearch}
          disabled={loading || !prompt.trim()}
          className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold flex items-center gap-2 transition-all shadow-lg shadow-indigo-600/20"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Researching...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              <span>Start Deep Research</span>
            </>
          )}
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
            <div className="space-y-1">
                <p className="text-xs font-semibold text-red-400">Research Error</p>
                <p className="text-xs text-red-400/80">{error}</p>
            </div>
        </div>
      )}

      {report && (
        <div className="space-y-6 pt-6 border-t border-[#27272A]">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-[#FAFAFA]">{report.title}</h4>
            <button
              onClick={handleSaveToProject}
              className="px-3 py-1.5 bg-[#18181B] border border-[#27272A] hover:border-indigo-500/50 text-xs font-medium text-[#FAFAFA] rounded-lg flex items-center gap-1.5 transition-all"
            >
              <FolderPlus className="w-3.5 h-3.5 text-indigo-400" />
              Save to Projects
            </button>
          </div>

          <div className="p-4 rounded-xl bg-[#18181B] border border-[#27272A] text-xs text-[#D4D4D8] leading-relaxed whitespace-pre-wrap font-sans">
            {report.report}
          </div>

          <div className="space-y-3">
            <h5 className="text-xs font-bold text-[#A1A1AA] uppercase tracking-wider">References</h5>
            <div className="grid grid-cols-1 gap-3">
              {report.sources.map((source) => (
                <a
                  key={source.id}
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-3 rounded-xl bg-[#18181B] border border-[#27272A] hover:border-indigo-500/40 flex items-center justify-between group transition-all"
                >
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-mono text-indigo-400 block">[{source.id}]</span>
                    <h6 className="text-xs font-semibold text-[#FAFAFA] group-hover:text-indigo-400 line-clamp-1">
                      {source.title}
                    </h6>
                  </div>
                  <ExternalLink className="w-3.5 h-3.5 text-[#71717A]" />
                </a>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
