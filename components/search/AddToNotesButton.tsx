'use client';

import React, { useState } from 'react';
import { BookOpen, Sparkles, X } from 'lucide-react';

interface AddToNotesButtonProps {
  query: string;
  summary: string;
}

export default function AddToNotesButton({ query, summary }: AddToNotesButtonProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [noteTitle, setNoteTitle] = useState(`Research Note: ${query}`);
  const [noteContent, setNoteContent] = useState(summary);
  const [saved, setSaved] = useState(false);

  const handleOpen = async () => {
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteTitle.trim() || !noteContent.trim()) return;
    setLoading(true);
    try {
      // First get or create default research project
      const projRes = await fetch('/api/research/projects');
      let projectId = '';
      if (projRes.ok) {
        const data = await projRes.json();
        if (data.projects && data.projects.length > 0) {
          projectId = data.projects[0].id;
        } else {
          // Create default project
          const createProj = await fetch('/api/research/projects', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title: 'General Research', description: 'Default research workspace for saved searches and notes.' }),
          });
          if (createProj.ok) {
            const newProjData = await createProj.json();
            projectId = newProjData.project.id;
          }
        }
      }

      if (!projectId) {
        alert('Please create a research project first.');
        window.location.href = '/research';
        return;
      }

      const res = await fetch(`/api/research/projects/${projectId}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: noteTitle.trim(),
          content: noteContent.trim(),
        }),
      });

      if (res.ok) {
        setSaved(true);
        setModalOpen(false);
        setTimeout(() => setSaved(false), 4000);
      } else {
        const data = await res.json();
        if (res.status === 401) {
          alert('Please sign in to save notes.');
          window.location.href = '/auth/signin';
        } else {
          alert(data.error || 'Failed to save note.');
        }
      }
    } catch (err) {
      console.error('Note save error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={handleOpen}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all shadow-sm ${
          saved
            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
            : 'bg-[#111113] border-[#27272A] hover:border-indigo-500/50 text-[#A1A1AA] hover:text-[#FAFAFA]'
        }`}
      >
        <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
        <span>{saved ? 'Added to Notes' : 'Add to Notes'}</span>
      </button>

      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-[#09090B]/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-[#111113] border border-[#27272A] rounded-2xl p-6 space-y-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-indigo-400" />
                <h3 className="text-lg font-bold text-[#FAFAFA]">Add Search to Notes</h3>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1.5 rounded-lg text-[#71717A] hover:text-[#FAFAFA] hover:bg-[#18181B]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-medium text-[#A1A1AA]">Note Title</label>
                <input
                  type="text"
                  value={noteTitle}
                  onChange={(e) => setNoteTitle(e.target.value)}
                  required
                  className="w-full bg-[#18181B] border border-[#27272A] rounded-xl px-4 py-3 text-sm text-[#FAFAFA] focus:outline-none focus:border-indigo-500 transition-all"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-medium text-[#A1A1AA]">Notes / Summary Content</label>
                <textarea
                  value={noteContent}
                  onChange={(e) => setNoteContent(e.target.value)}
                  rows={5}
                  required
                  className="w-full bg-[#18181B] border border-[#27272A] rounded-xl p-4 text-sm text-[#FAFAFA] focus:outline-none focus:border-indigo-500 transition-all resize-none"
                />
                <p className="text-[11px] text-[#71717A]">
                  This note will be saved into your active research project.
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-[#A1A1AA] hover:text-[#FAFAFA] hover:bg-[#18181B] transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || !noteTitle.trim()}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition-all shadow-md shadow-indigo-600/20 disabled:opacity-50 flex items-center gap-2"
                >
                  {loading && <Sparkles className="w-3.5 h-3.5 animate-spin" />}
                  <span>Save Note</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
