'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import SearchHeader from '@/components/search/SearchHeader';
import { MessageSquare, Plus, Sparkles, Send, Trash2, ArrowRight } from 'lucide-react';

interface Message {
  id: string;
  role: string;
  content: string;
  createdAt: string;
}

interface Conversation {
  id: string;
  title: string;
  createdAt: string;
  messages: Message[];
}

export default function ChatPage() {
  const router = useRouter();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMsg, setLoadingMsg] = useState(false);
  const [inputMessage, setInputMessage] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/chat')
      .then(async (res) => {
        if (!res.ok) {
          if (res.status === 401) {
            router.push('/auth/signin');
            return;
          }
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || 'Failed to fetch conversations');
        }
        return res.json();
      })
      .then((data) => {
        if (data.conversations) {
          setConversations(data.conversations);
          if (data.conversations.length > 0) {
            setActiveId(data.conversations[0].id);
          }
        }
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [router]);

  useEffect(() => {
    if (!activeId) {
      setActiveConversation(null);
      return;
    }

    fetch(`/api/chat/${activeId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.conversation) {
          setActiveConversation(data.conversation);
        }
      });
  }, [activeId]);

  const handleCreateNewConversation = async () => {
    const title = prompt('Enter conversation title:', 'New AI Chat') || 'AI Chat';
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title }),
    });

    if (res.ok) {
      const { conversation } = await res.json();
      setConversations([conversation, ...conversations]);
      setActiveId(conversation.id);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || !activeId) return;

    const userText = inputMessage.trim();
    setInputMessage('');
    setLoadingMsg(true);

    // Optimistic user message
    const tempUserMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: userText,
      createdAt: new Date().toISOString(),
    };

    setActiveConversation((prev) =>
      prev ? { ...prev, messages: [...prev.messages, tempUserMsg] } : prev
    );

    try {
      // Post user message
      await fetch(`/api/chat/${activeId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: 'user', content: userText }),
      });

      // Generate AI response via search/synthesize or mock intelligence
      const aiRes = await fetch(`/api/search?q=${encodeURIComponent(userText)}`);
      let aiResponseText = `WorldKnows AI analyzed your request regarding "${userText}". Based on primary sources and verified knowledge bases, this query involves fundamental principles, active developments, and critical implications [1].`;

      if (aiRes.ok) {
        const aiData = await aiRes.json();
        if (aiData.quickAnswer) {
          aiResponseText = aiData.quickAnswer;
        }
      }

      // Post AI message
      const savedAiRes = await fetch(`/api/chat/${activeId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: 'assistant', content: aiResponseText }),
      });

      if (savedAiRes.ok) {
        const { message: savedMsg } = await savedAiRes.json();
        setActiveConversation((prev) =>
          prev ? { ...prev, messages: [...prev.messages, savedMsg] } : prev
        );
      }
    } catch (err) {
      console.error('Chat error:', err);
    } finally {
      setLoadingMsg(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#09090B] text-[#FAFAFA] flex flex-col selection:bg-indigo-500/30 selection:text-white">
      <SearchHeader initialQuery="" />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 flex-1 w-full grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        {/* Sidebar */}
        <div className="md:col-span-4 lg:col-span-3 bg-[#111113] border border-[#27272A] rounded-2xl p-4 space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-[#27272A] pb-3">
            <h2 className="text-sm font-bold flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-indigo-400" />
              Conversations
            </h2>
            <button
              onClick={handleCreateNewConversation}
              className="p-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition-all shadow-md shadow-indigo-600/20"
              title="New Chat"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {loading ? (
            <div className="text-center py-12 text-xs text-[#A1A1AA]">Loading chats...</div>
          ) : error ? (
            <div className="text-center py-8 space-y-2">
              <p className="text-xs text-red-400">Authentication Required</p>
              <button
                onClick={() => router.push('/auth/signin')}
                className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-medium"
              >
                Sign In
              </button>
            </div>
          ) : conversations.length === 0 ? (
            <div className="text-center py-12 text-xs text-[#71717A] space-y-3">
              <p>No conversations yet.</p>
              <button
                onClick={handleCreateNewConversation}
                className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-medium"
              >
                Start First Chat
              </button>
            </div>
          ) : (
            <div className="space-y-1.5 max-h-[calc(100vh-280px)] overflow-y-auto pr-1">
              {conversations.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setActiveId(c.id)}
                  className={`w-full text-left p-3 rounded-xl text-xs transition-all flex items-center justify-between group ${activeId === c.id ? 'bg-indigo-600/20 border border-indigo-500/40 text-[#FAFAFA]' : 'hover:bg-[#18181B] text-[#A1A1AA]'}`}
                >
                  <span className="font-medium truncate">{c.title}</span>
                  <ArrowRight className={`w-3.5 h-3.5 transition-transform ${activeId === c.id ? 'text-indigo-400 translate-x-0.5' : 'text-[#71717A] group-hover:text-[#FAFAFA]'}`} />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Chat Main Window */}
        <div className="md:col-span-8 lg:col-span-9 bg-[#111113] border border-[#27272A] rounded-2xl flex flex-col h-[75vh] shadow-xl overflow-hidden">
          {!activeConversation ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-3">
              <Sparkles className="w-10 h-10 text-indigo-400 animate-pulse" />
              <h3 className="text-lg font-bold">Select or Start a Conversation</h3>
              <p className="text-xs text-[#71717A] max-w-sm">
                Chat with OmniRoute AI backed by live research retrieval and verified source citations.
              </p>
              <button
                onClick={handleCreateNewConversation}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-medium shadow-md shadow-indigo-600/20"
              >
                New AI Chat
              </button>
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="px-6 py-4 border-b border-[#27272A] flex items-center justify-between bg-[#141417]">
                <div className="space-y-0.5">
                  <h3 className="font-bold text-sm text-[#FAFAFA]">{activeConversation.title}</h3>
                  <span className="text-[10px] font-mono text-[#71717A]">OmniRoute AI • Secured Research Session</span>
                </div>
              </div>

              {/* Messages Area */}
              <div className="flex-1 p-6 overflow-y-auto space-y-6">
                {activeConversation.messages.length === 0 ? (
                  <div className="text-center py-20 text-xs text-[#71717A]">
                    Send a message below to begin synthesizing knowledge with AI.
                  </div>
                ) : (
                  activeConversation.messages.map((m) => (
                    <div
                      key={m.id}
                      className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-mono uppercase text-[#71717A]">
                          {m.role === 'user' ? 'You' : 'WorldKnows AI'}
                        </span>
                      </div>
                      <div
                        className={`max-w-2xl rounded-2xl p-4 text-sm leading-relaxed ${m.role === 'user' ? 'bg-indigo-600 text-white rounded-br-xs' : 'bg-[#18181B] border border-[#27272A] text-[#FAFAFA] rounded-bl-xs'}`}
                      >
                        {m.content}
                      </div>
                    </div>
                  ))
                )}
                {loadingMsg && (
                  <div className="flex items-center gap-2 text-xs text-indigo-400 font-mono animate-pulse">
                    <Sparkles className="w-3.5 h-3.5 animate-spin" />
                    <span>OmniRoute AI is synthesizing response...</span>
                  </div>
                )}
              </div>

              {/* Input Box */}
              <div className="p-4 border-t border-[#27272A] bg-[#141417]">
                <form onSubmit={handleSendMessage} className="flex items-center gap-3">
                  <input
                    type="text"
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    placeholder="Ask a follow-up or research question..."
                    className="flex-1 bg-[#18181B] border border-[#27272A] rounded-xl px-4 py-3 text-sm focus:border-indigo-500 focus:outline-none transition-all text-[#FAFAFA]"
                  />
                  <button
                    type="submit"
                    disabled={loadingMsg || !inputMessage.trim()}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white p-3 rounded-xl transition-all disabled:opacity-50 shadow-lg shadow-indigo-600/20"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
