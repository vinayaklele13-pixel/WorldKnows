'use client';

import React, { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft, BookOpen, Network, FileText, Trash2, Plus,
  ExternalLink, Sparkles, Folder, Calendar, CheckCircle2, X
} from 'lucide-react';
import SearchHeader from '@/components/search/SearchHeader';

interface ProjectDetail {
  id: string;
  title: string;
  description: string | null;
  createdAt: string;
  notes: Array<{
    id: string;
    title: string;
    content: string;
    createdAt: string;
  }>;
  topics: Array<{
    id: string;
    slug: string;
    name: string;
    description: string | null;
  }>;
  entities: Array<{
    id: string;
    name: string;
    type: string;
    description: string | null;
  }>;
}

export default function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const projectId = resolvedParams.id;
  const router = useRouter();

  const [project, setProject] = useState<ProjectDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Note creation modal/form state
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [submittingNote, setSubmittingNote] = useState(false);

  useEffect(() => {
    if (!projectId) return;

    fetch(`/api/research/projects/${projectId}`)
      .then(async (res) => {
        if (!res.ok) {
          if (res.status === 401) {
            router.push('/auth/signin');
            return;
          }
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || 'Failed to fetch project');
        }
        return res.json();
      })
      .then((data) => {
        setProject(data.project);
      })
      .catch((err) => {
        setError(err.message);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [projectId, router]);

  const handleDeleteProject = async () => {
    if (!confirm('Are you sure you want to delete this research project? This action cannot be undone.')) return;

    const res = await fetch(`/api/research/projects/${projectId}`, {
      method: 'DELETE',
    });

    if (res.ok) {
      router.push('/research');
    } else {
      alert('Failed to delete project.');
    }
  };

  const handleCreateNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteTitle.trim() || !noteContent.trim()) return;

    setSubmittingNote(true);
    try {
      const res = await fetch(`/api/research/projects/${projectId}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: noteTitle, content: noteContent }),
      });

      if (res.ok) {
        const { note } = await res.json();
        setProject((prev) => prev ? { ...prev, notes: [note, ...prev.notes] } : prev);
        setNoteTitle('');
        setNoteContent('');
        setShowNoteModal(false);
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to create note.');
      }
    } finally {
      setSubmittingNote(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#09090B] text-[#FAFAFA] flex flex-col">
        <SearchHeader initialQuery="" />
        <div className="flex-1 flex flex-col items-center justify-center py-24">
          <Sparkles className="w-6 h-6 text-indigo-400 animate-spin mb-4" />
          <span className="text-xs font-mono text-[#A1A1AA] uppercase tracking-widest">Loading research workspace...</span>
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="min-h-screen bg-[#09090B] text-[#FAFAFA] flex flex-col">
        <SearchHeader initialQuery="" />
        <div className="flex-1 flex flex-col items-center justify-center max-w-md mx-auto px-4 text-center py-24">
          <h2 className="text-2xl font-bold mb-2">Project Not Found</h2>
          <p className="text-sm text-[#A1A1AA] mb-6">{error || 'The requested project could not be found or you do not have permission to access it.'}</p>
          <button
            onClick={() => router.push('/research')}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#111113] border border-[#27272A] text-sm text-[#FAFAFA] hover:border-[#3F3F46] transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Research Workspace
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#09090B] text-[#FAFAFA] flex flex-col selection:bg-indigo-500/30 selection:text-white">
      <SearchHeader initialQuery="" />

      {/* Project Header */}
      <section className="border-b border-[#27272A]/40 bg-gradient-to-b from-[#111113]/50 to-transparent py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <button
            onClick={() => router.push('/research')}
            className="inline-flex items-center gap-1.5 text-xs text-[#71717A] hover:text-[#FAFAFA] transition-colors mb-6 group"
          >
            <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
            Workspace Projects
          </button>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono tracking-widest uppercase bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2 py-0.5 rounded">
                  Research Project
                </span>
                <span className="text-xs text-[#71717A] flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  {new Date(project.createdAt).toLocaleDateString()}
                </span>
              </div>
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-[#FAFAFA]">{project.title}</h1>
              <p className="text-sm text-[#A1A1AA] max-w-2xl">
                {project.description || 'Secure private research collection and knowledge workspace.'}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowNoteModal(true)}
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-all shadow-lg shadow-indigo-600/20"
              >
                <Plus className="w-4 h-4" />
                New Note
              </button>
              <button
                onClick={handleDeleteProject}
                className="flex items-center gap-2 bg-[#18181B] hover:bg-red-500/10 text-[#71717A] hover:text-red-400 border border-[#27272A] hover:border-red-500/20 px-3 py-2.5 rounded-xl text-sm transition-all"
                title="Delete Project"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Main Workspace Content Grid */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-12 flex-1 w-full space-y-12">
        {/* Research Notes Section */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold tracking-tight text-[#FAFAFA] flex items-center gap-2">
              <FileText className="w-5 h-5 text-indigo-400" />
              Research Notes ({project.notes.length})
            </h2>
          </div>

          {project.notes.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[#27272A] bg-[#111113]/30 p-12 text-center space-y-3">
              <FileText className="w-10 h-10 text-[#27272A] mx-auto" />
              <h3 className="text-base font-medium text-[#FAFAFA]">No research notes yet</h3>
              <p className="text-xs text-[#71717A] max-w-sm mx-auto">
                Capture your findings, hypotheses, and summaries by adding notes to this project.
              </p>
              <button
                onClick={() => setShowNoteModal(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                Add First Note
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {project.notes.map((note) => (
                <div
                  key={note.id}
                  className="rounded-2xl border border-[#27272A] bg-[#111113] p-6 space-y-4 hover:border-indigo-500/30 transition-all flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono text-[#71717A]">
                        {new Date(note.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <h3 className="font-bold text-lg text-[#FAFAFA]">{note.title}</h3>
                    <p className="text-sm text-[#A1A1AA] whitespace-pre-wrap leading-relaxed">
                      {note.content}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Attached Topics & Entities Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-6 border-t border-[#27272A]/40">
          {/* Topics */}
          <div className="space-y-4">
            <h2 className="text-xl font-bold tracking-tight text-[#FAFAFA] flex items-center gap-2">
              <Network className="w-5 h-5 text-indigo-400" />
              Pinned Topics ({project.topics.length})
            </h2>
            {project.topics.length === 0 ? (
              <div className="rounded-xl border border-[#27272A] bg-[#111113]/30 p-6 text-center text-xs text-[#71717A]">
                No topics pinned to this project yet. Explore topics and save them to your workspace.
              </div>
            ) : (
              <div className="space-y-3">
                {project.topics.map((t) => (
                  <div
                    key={t.id}
                    onClick={() => router.push(`/topics/${t.slug}`)}
                    className="rounded-xl border border-[#27272A] bg-[#111113] hover:border-indigo-500/30 p-4 cursor-pointer transition-all flex items-center justify-between group"
                  >
                    <div>
                      <h4 className="font-bold text-sm text-[#FAFAFA] group-hover:text-indigo-400 transition-colors">
                        {t.name}
                      </h4>
                      <p className="text-xs text-[#71717A] line-clamp-1 mt-0.5">{t.description || 'Public Knowledge Topic'}</p>
                    </div>
                    <ExternalLink className="w-4 h-4 text-[#71717A] group-hover:text-indigo-400 transition-colors shrink-0" />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Entities */}
          <div className="space-y-4">
            <h2 className="text-xl font-bold tracking-tight text-[#FAFAFA] flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-indigo-400" />
              Referenced Entities ({project.entities.length})
            </h2>
            {project.entities.length === 0 ? (
              <div className="rounded-xl border border-[#27272A] bg-[#111113]/30 p-6 text-center text-xs text-[#71717A]">
                No entities referenced in this project yet.
              </div>
            ) : (
              <div className="space-y-3">
                {project.entities.map((e) => (
                  <div
                    key={e.id}
                    className="rounded-xl border border-[#27272A] bg-[#111113] p-4 space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-mono uppercase bg-[#18181B] text-[#71717A] px-2 py-0.5 rounded border border-[#27272A]">
                        {e.type}
                      </span>
                    </div>
                    <h4 className="font-bold text-sm text-[#FAFAFA]">{e.name}</h4>
                    <p className="text-xs text-[#71717A] line-clamp-1">{e.description || 'Public Entity Node'}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Note Creation Modal */}
      {showNoteModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#111113] border border-[#27272A] rounded-2xl w-full max-w-xl p-6 space-y-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-[#27272A] pb-4">
              <h3 className="text-lg font-bold">Add Research Note</h3>
              <button
                onClick={() => setShowNoteModal(false)}
                className="text-[#71717A] hover:text-[#FAFAFA] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateNote} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-mono text-[#A1A1AA] uppercase tracking-wider">Note Title</label>
                <input
                  type="text"
                  required
                  value={noteTitle}
                  onChange={(e) => setNoteTitle(e.target.value)}
                  placeholder="e.g. Key findings on architectural scalability..."
                  className="w-full bg-[#18181B] border border-[#27272A] rounded-xl px-4 py-2.5 text-sm focus:border-indigo-500 focus:outline-none transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-mono text-[#A1A1AA] uppercase tracking-wider">Content & Evidence</label>
                <textarea
                  required
                  rows={6}
                  value={noteContent}
                  onChange={(e) => setNoteContent(e.target.value)}
                  placeholder="Enter detailed observations, extracted knowledge, or synthesis notes..."
                  className="w-full bg-[#18181B] border border-[#27272A] rounded-xl p-4 text-sm focus:border-indigo-500 focus:outline-none transition-all resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2 border-t border-[#27272A]">
                <button
                  type="button"
                  onClick={() => setShowNoteModal(false)}
                  className="px-4 py-2 rounded-xl text-sm font-medium text-[#71717A] hover:text-[#FAFAFA] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingNote || !noteTitle.trim() || !noteContent.trim()}
                  className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2 rounded-xl text-sm font-medium transition-all disabled:opacity-50"
                >
                  {submittingNote ? <Sparkles className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  Save Note
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
