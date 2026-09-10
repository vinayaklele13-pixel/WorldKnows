'use client';

import React, { useState, useEffect } from 'react';
import { FolderPlus, Sparkles, X, Plus, Check } from 'lucide-react';

interface Project {
  id: string;
  title: string;
}

interface AddToResearchButtonProps {
  query: string;
}

export default function AddToResearchButton({ query }: AddToResearchButtonProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [newProjectTitle, setNewProjectTitle] = useState(`Research: ${query}`);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleOpen = async () => {
    setModalOpen(true);
    try {
      const res = await fetch('/api/research');
      if (res.ok) {
        const data = await res.json();
        if (data.projects) {
          setProjects(data.projects);
          if (data.projects.length > 0) {
            setSelectedProjectId(data.projects[0].id);
          } else {
            setIsCreatingNew(true);
          }
        }
      } else if (res.status === 401) {
        alert('Please sign in to add searches to research.');
        window.location.href = '/auth/signin';
      }
    } catch (err) {
      console.error('Fetch projects error:', err);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      let targetProjectId = selectedProjectId;

      if (isCreatingNew || !targetProjectId) {
        if (!newProjectTitle.trim()) return;
        const createRes = await fetch('/api/research', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: newProjectTitle.trim(),
            description: `Research project initialized from search: ${query}`,
          }),
        });
        if (createRes.ok) {
          const createData = await createRes.json();
          targetProjectId = createData.project.id;
        } else {
          throw new Error('Failed to create research project');
        }
      }

      // Add a note or reference associated with this search query to the project
      if (targetProjectId) {
        await fetch(`/api/research/${targetProjectId}/notes`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: `Saved Search: ${query}`,
            content: `Saved knowledge search regarding "${query}". Access full query via WorldKnows search index.`,
          }),
        });
      }

      setSaved(true);
      setModalOpen(false);
      setTimeout(() => setSaved(false), 4000);
    } catch (err) {
      console.error('Add to research error:', err);
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
        <FolderPlus className="w-3.5 h-3.5 text-indigo-400" />
        <span>{saved ? 'Added to Research' : 'Add to Research'}</span>
      </button>

      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-[#09090B]/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#111113] border border-[#27272A] rounded-2xl p-6 space-y-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FolderPlus className="w-5 h-5 text-indigo-400" />
                <h3 className="text-lg font-bold text-[#FAFAFA]">Add to Research Project</h3>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1.5 rounded-lg text-[#71717A] hover:text-[#FAFAFA] hover:bg-[#18181B]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              {!isCreatingNew && projects.length > 0 ? (
                <div className="space-y-2">
                  <label className="text-xs font-medium text-[#A1A1AA]">Existing Projects</label>
                  <select
                    value={selectedProjectId}
                    onChange={(e) => setSelectedProjectId(e.target.value)}
                    className="w-full bg-[#18181B] border border-[#27272A] rounded-xl px-4 py-3 text-sm text-[#FAFAFA] focus:outline-none focus:border-indigo-500 transition-all"
                  >
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.title}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => setIsCreatingNew(true)}
                    className="text-xs text-indigo-400 hover:text-indigo-300 font-medium pt-1 block"
                  >
                    + Create New Research Project instead
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <label className="text-xs font-medium text-[#A1A1AA]">New Project Title</label>
                  <input
                    type="text"
                    value={newProjectTitle}
                    onChange={(e) => setNewProjectTitle(e.target.value)}
                    required
                    className="w-full bg-[#18181B] border border-[#27272A] rounded-xl px-4 py-3 text-sm text-[#FAFAFA] focus:outline-none focus:border-indigo-500 transition-all"
                  />
                  {projects.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setIsCreatingNew(false)}
                      className="text-xs text-indigo-400 hover:text-indigo-300 font-medium pt-1 block"
                    >
                      ← Select existing project instead
                    </button>
                  )}
                </div>
              )}

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
                  disabled={loading}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition-all shadow-md shadow-indigo-600/20 disabled:opacity-50 flex items-center gap-2"
                >
                  {loading && <Sparkles className="w-3.5 h-3.5 animate-spin" />}
                  <span>Add to Project</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
