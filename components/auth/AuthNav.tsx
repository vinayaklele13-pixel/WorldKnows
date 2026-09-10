'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { User, LogOut, LogIn, UserPlus } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function AuthNav() {
  const [user, setUser] = useState<{ id: string; email: string; name?: string | null } | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function checkSession() {
      try {
        const res = await fetch('/api/auth/session');
        const data = await res.json();
        if (data.user) {
          setUser(data.user);
        }
      } catch (err) {
        console.error('Failed to load session:', err);
      } finally {
        setLoading(false);
      }
    }
    checkSession();
  }, []);

  const handleSignOut = async () => {
    try {
      await fetch('/api/auth/signout', { method: 'POST' });
      setUser(null);
      router.push('/');
      router.refresh();
    } catch (err) {
      console.error('Failed to sign out:', err);
    }
  };

  if (loading) {
    return <div className="w-20 h-8 bg-[#18181B] rounded-lg animate-pulse"></div>;
  }

  if (user) {
    return (
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#111113] border border-[#27272A] text-xs font-medium text-[#FAFAFA]">
          <div className="w-6 h-6 rounded-full bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-300">
            {user.name ? user.name[0].toUpperCase() : user.email[0].toUpperCase()}
          </div>
          <span className="hidden sm:inline max-w-[120px] truncate">{user.name || user.email}</span>
        </div>
        <button
          onClick={handleSignOut}
          title="Sign Out"
          className="p-2 rounded-xl bg-[#111113] hover:bg-[#18181B] border border-[#27272A] text-[#A1A1AA] hover:text-[#FAFAFA] transition-all shadow-sm"
        >
          <LogOut className="w-4 h-4 text-red-400" />
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Link
        href="/auth/signin"
        className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-medium bg-[#111113] hover:bg-[#18181B] border border-[#27272A] text-[#FAFAFA] transition-all shadow-sm hover:border-[#3F3F46]"
      >
        <LogIn className="w-3.5 h-3.5 text-indigo-400" />
        <span>Sign In</span>
      </Link>
      <Link
        href="/auth/signup"
        className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-medium bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/20 transition-all"
      >
        <UserPlus className="w-3.5 h-3.5" />
        <span>Sign Up</span>
      </Link>
    </div>
  );
}
