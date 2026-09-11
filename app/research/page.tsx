'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, BookOpen, Clock, Folder, ArrowRight, Sparkles, AlertCircle, BookMarked } from 'lucide-react';
import SearchHeader from '@/components/search/SearchHeader';
import DeepResearchStudio from '@/components/research/DeepResearchStudio';

interface Project {
  id: string;
  title: string;
  description: string | null;
  createdAt: string;
  _count: {
    topics: number;
    entities: number;
    notes: number;
  };
}

export default function ResearchDashboard() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [showDeepResearch, setShowDeepResearch] = useState(false);

  useEffect(() => {
    fetch('/api/research/projects')
      .then((res) => {
        if (res.status === 401) router.push('/auth/signin');
        return res.json();
      })
      .then((data) => {
        if (data.projects) setProjects(data.projects);
      })
      .finally(() => setLoading(false));
  }, [router]);

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    setCreating(true);
    const res = await fetch('/api/research/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: newTitle }),
    });

    if (res.ok) {
      const { project } = await res.json();
      setProjects([project, ...projects]);
      setNewTitle('');
    }
    setCreating(false);
  };

  return (
    <div className="min-h-screen bg-[#09090B] text-[#FAFAFA]">
      <SearchHeader initialQuery="" />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="flex items-center justify-between mb-10">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Research Workspace</h1>
            <p className="text-[#A1A1AA] mt-1">Manage your knowledge projects and research notes.</p>
          </div>
          <div className="flex items-center gap-3">
             <button
                onClick={() => setShowDeepResearch(!showDeepResearch)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all border ${showDeepResearch ? 'bg-indigo-600/10 border-indigo-500/50 text-indigo-400' : 'bg-[#111113] border-[#27272A] hover:border-indigo-500'}`}
             >
                <BookMarked className="w-4 h-4" />
                {showDeepResearch ? 'Close Deep Research' : 'New Deep Research'}
             </button>
             <form onSubmit={handleCreateProject} className="flex gap-2">
                <input
                    type="text"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="New project title..."
                    className="bg-[#111113] border border-[#27272A] rounded-lg px-4 py-2 text-sm focus:border-indigo-500 transition-all w-48 focus:outline-none"
                />
                <button
                    disabled={creating || !newTitle.trim()}
                    className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 px-4 py-2 rounded-lg text-sm font-medium transition-all disabled:opacity-50"
                >
                    {creating ? <Sparkles className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                    Create Project
                </button>
            </form>
          </div>
        </div>

        {showDeepResearch && <DeepResearchStudio />}

        {loading ? (
          <div className="text-center py-20 text-[#A1A1AA]">Loading projects...</div>
        ) : projects.length === 0 ? (
          <div className="text-center py-20 border border-dashed border-[#27272A] rounded-2xl bg-[#111113]/30">
            <Folder className="w-12 h-12 text-[#27272A] mx-auto mb-4" />
            <h3 className="text-lg font-medium">No projects yet</h3>
            <p className="text-[#71717A] text-sm">Create your first research project to get started.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((p) => (
              <div
                key={p.id}
                onClick={() => router.push(`/research/${p.id}`)}
                className="bg-[#111113] border border-[#27272A] hover:border-indigo-500/30 p-6 rounded-xl cursor-pointer transition-all group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="w-10 h-10 rounded-lg bg-indigo-500/10 flex items-center justify-center">
                    <BookOpen className="w-5 h-5 text-indigo-400" />
                  </div>
                  <ArrowRight className="w-5 h-5 text-[#27272A] group-hover:text-indigo-400 transition-colors" />
                </div>
                <h3 className="font-bold text-lg mb-2">{p.title}</h3>
                <p className="text-sm text-[#71717A] mb-4 line-clamp-2">{p.description || 'No description provided.'}</p>
                <div className="flex items-center gap-4 text-xs text-[#71717A]">
                  <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> {new Date(p.createdAt).toLocaleDateString()}</span>
                  <span>{p._count.topics + p._count.entities} Items</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
