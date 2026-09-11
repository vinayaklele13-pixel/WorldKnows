'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import WorldKnowsSidebar from '@/components/layout/WorldKnowsSidebar';
import { BookOpen, Folder, Plus, Trash2, ArrowLeft, Sparkles, Layers, Network } from 'lucide-react';

interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: string;
}

interface ProjectDetail {
  id: string;
  title: string;
  description: string | null;
  createdAt: string;
  notes: Note[];
  topics: { id: string; name: string; slug: string }[];
  entities: { id: string; name: string; type: string }[];
}

export default function ResearchProjectPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params?.id as string;
  const [project, setProject] = useState<ProjectDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [addingNote, setAddingNote] = useState(false);

  useEffect(() => {
    if (!projectId) return;
    fetch(`/api/research/projects/${projectId}`)
      .then((res) => {
        if (res.status === 401) {
          router.push('/auth/signin');
          return null;
        }
        if (!res.ok) {
          throw new Error('Project not found');
        }
        return res.json();
      })
      .then((data) => {
        if (data && data.project) setProject(data.project);
      })
      .catch((err) => {
        console.error('Fetch project detail error:', err);
      })
      .finally(() => setLoading(false));
  }, [projectId, router]);

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteTitle.trim() || !noteContent.trim()) return;

    const res = await fetch(`/api/research/projects/${projectId}/notes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: noteTitle, content: noteContent }),
    });

    if (res.ok) {
      const { note } = await res.json();
      if (project) {
        setProject({ ...project, notes: [note, ...project.notes] });
      }
      setNoteTitle('');
      setNoteContent('');
      setAddingNote(false);
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    const res = await fetch(`/api/research/projects/${projectId}/notes?noteId=${noteId}`, {
      method: 'DELETE',
    });
    if (res.ok) {
      if (project) {
        setProject({
          ...project,
          notes: project.notes.filter((n) => n.id !== noteId),
        });
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#09090B] text-[#FAFAFA] flex flex-col selection:bg-indigo-500/30 selection:text-white">
      <WorldKnowsSidebar initialQuery="" />

      <div className="lg:pl-64 flex-1 flex flex-col min-h-screen">
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full space-y-8">
          {/* Back button & Header */}
          <div className="space-y-4">
            <button
              onClick={() => router.push('/research')}
              className="flex items-center gap-1.5 text-xs text-[#A1A1AA] hover:text-[#FAFAFA] transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Research Workspace</span>
            </button>

            {loading ? (
              <div className="text-center py-20 text-xs text-[#A1A1AA]">Loading project workspace...</div>
            ) : !project ? (
              <div className="text-center py-20 text-xs text-red-400">Project not found.</div>
            ) : (
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-[#27272A]/60">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 uppercase tracking-widest">
                      Research Workspace
                    </span>
                  </div>
                  <h1 className="text-3xl font-bold tracking-tight text-[#FAFAFA]">{project.title}</h1>
                  <p className="text-sm text-[#A1A1AA]">{project.description || 'Verified research project workspace.'}</p>
                </div>
                <button
                  onClick={() => setAddingNote(!addingNote)}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition-all shadow-md shadow-indigo-600/20"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Note</span>
                </button>
              </div>
            )}
          </div>

          {project && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Notes Column (Left / Center) */}
              <div className="lg:col-span-8 space-y-6">
                {addingNote && (
                  <form onSubmit={handleAddNote} className="p-6 rounded-2xl bg-[#111113] border border-indigo-500/40 space-y-4 shadow-xl">
                    <h3 className="text-sm font-bold text-[#FAFAFA]">Add New Note</h3>
                    <input
                      type="text"
                      placeholder="Note Title..."
                      value={noteTitle}
                      onChange={(e) => setNoteTitle(e.target.value)}
                      required
                      className="w-full bg-[#18181B] border border-[#27272A] rounded-xl px-4 py-2.5 text-sm text-[#FAFAFA] focus:outline-none focus:border-indigo-500 transition-all"
                    />
                    <textarea
                      placeholder="Note content / research findings..."
                      value={noteContent}
                      onChange={(e) => setNoteContent(e.target.value)}
                      rows={4}
                      required
                      className="w-full bg-[#18181B] border border-[#27272A] rounded-xl p-4 text-sm text-[#FAFAFA] focus:outline-none focus:border-indigo-500 transition-all resize-none"
                    />
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setAddingNote(false)}
                        className="px-3 py-1.5 rounded-lg text-xs text-[#A1A1AA] hover:text-[#FAFAFA]"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium"
                      >
                        Save Note
                      </button>
                    </div>
                  </form>
                )}

                <div className="space-y-4">
                  <h3 className="text-base font-bold text-[#FAFAFA] flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-indigo-400" />
                    <span>Project Notes ({project.notes.length})</span>
                  </h3>

                  {project.notes.length === 0 ? (
                    <div className="p-12 rounded-2xl border border-dashed border-[#27272A] bg-[#111113]/30 text-center space-y-2">
                      <p className="text-xs text-[#71717A]">No notes added to this project yet.</p>
                      <button
                        onClick={() => setAddingNote(true)}
                        className="text-xs text-indigo-400 hover:underline font-medium"
                      >
                        Create first note
                      </button>
                    </div>
                  ) : (
                    project.notes.map((note) => (
                      <div
                        key={note.id}
                        className="p-6 rounded-2xl bg-[#111113] border border-[#27272A] space-y-2 shadow-sm"
                      >
                        <div className="flex items-center justify-between">
                          <h4 className="font-bold text-sm text-[#FAFAFA]">{note.title}</h4>
                          <button
                            onClick={() => handleDeleteNote(note.id)}
                            className="p-1 text-[#71717A] hover:text-red-400 transition-colors"
                            title="Delete note"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        <p className="text-xs text-[#A1A1AA] leading-relaxed whitespace-pre-wrap">{note.content}</p>
                        <span className="text-[10px] font-mono text-[#71717A] block pt-2">
                          {new Date(note.createdAt).toLocaleString()}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Sidebar: Topics & Entities */}
              <div className="lg:col-span-4 space-y-6">
                <div className="p-5 rounded-2xl bg-[#111113] border border-[#27272A] space-y-4">
                  <h3 className="text-sm font-bold text-[#FAFAFA] flex items-center gap-2">
                    <Layers className="w-4 h-4 text-indigo-400" />
                    <span>Associated Topics ({project.topics.length})</span>
                  </h3>
                  {project.topics.length === 0 ? (
                    <p className="text-xs text-[#71717A]">No topics linked yet.</p>
                  ) : (
                    <div className="space-y-2">
                      {project.topics.map((t) => (
                        <div
                          key={t.id}
                          onClick={() => router.push(`/topics/${t.slug}`)}
                          className="p-3 rounded-xl bg-[#18181B] border border-[#27272A] hover:border-indigo-500/40 text-xs font-medium cursor-pointer transition-all flex items-center justify-between"
                        >
                          <span>{t.name}</span>
                          <span className="text-[10px] text-indigo-400">View</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="p-5 rounded-2xl bg-[#111113] border border-[#27272A] space-y-4">
                  <h3 className="text-sm font-bold text-[#FAFAFA] flex items-center gap-2">
                    <Network className="w-4 h-4 text-indigo-400" />
                    <span>Entities ({project.entities.length})</span>
                  </h3>
                  {project.entities.length === 0 ? (
                    <p className="text-xs text-[#71717A]">No entities linked yet.</p>
                  ) : (
                    <div className="space-y-2">
                      {project.entities.map((e) => (
                        <div
                          key={e.id}
                          className="p-3 rounded-xl bg-[#18181B] border border-[#27272A] text-xs space-y-1"
                        >
                          <span className="font-bold text-[#FAFAFA] block">{e.name}</span>
                          <span className="text-[10px] font-mono uppercase bg-indigo-500/10 text-indigo-400 px-1.5 py-0.5 rounded">
                            {e.type}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
