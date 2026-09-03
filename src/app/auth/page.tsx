"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Shield, Loader2, AlertCircle, Mail, Lock, User } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function AuthPage() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      if (isLogin) {
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
        if (signInError) throw signInError;
      } else {
        if (!name.trim()) throw new Error("Name is required for the Leaderboard.");
        
        // Register User (Database Trigger automatically creates the profile now)
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: { 
            data: { full_name: name } 
          }
        });
        if (signUpError) throw signUpError;
      }
      
      router.push('/');
    } catch (err: any) {
      setError(err.message || "Authentication failed.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050B14] flex flex-col items-center justify-center p-4 selection:bg-yellow-500/30">
      <div className="w-full max-w-md bg-[#0a0f1a] border border-gray-800 rounded-2xl p-8 shadow-2xl">
        <div className="flex flex-col items-center mb-8">
          <div className="p-3 bg-yellow-500/10 rounded-xl border border-yellow-500/20 mb-4">
            <Shield className="text-yellow-500 w-8 h-8" />
          </div>
          <h1 className="text-2xl font-extrabold tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-yellow-600">
            NEUROCLASH
          </h1>
          <p className="text-gray-500 text-xs mt-1 uppercase tracking-widest font-bold">
            {isLogin ? 'Access Your Account' : 'Create New Account'}
          </p>
        </div>

        {error && (
          <div className="mb-6 p-3 bg-red-500/10 border border-red-500/50 rounded-lg flex items-center gap-3 text-red-400 text-sm">
            <AlertCircle className="w-5 h-5 flex-shrink-0" /> {error}
          </div>
        )}

        <form onSubmit={handleAuth} className="space-y-5">
          {!isLogin && (
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Player Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input 
                  type="text" required value={name} onChange={(e) => setName(e.target.value)}
                  className="w-full bg-[#050813] border border-gray-700 text-white rounded-lg pl-10 pr-4 py-3 focus:outline-none focus:border-yellow-500 transition-colors"
                  placeholder="Enter your name"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input 
                type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#050813] border border-gray-700 text-white rounded-lg pl-10 pr-4 py-3 focus:outline-none focus:border-yellow-500 transition-colors"
                placeholder="player@arena.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input 
                type="password" required value={password} onChange={(e) => setPassword(e.target.value)} minLength={6}
                className="w-full bg-[#050813] border border-gray-700 text-white rounded-lg pl-10 pr-4 py-3 focus:outline-none focus:border-yellow-500 transition-colors"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button 
            type="submit" disabled={isLoading}
            className="w-full py-3.5 bg-yellow-500 hover:bg-yellow-400 text-black font-extrabold text-sm rounded-lg shadow-[0_0_15px_rgba(234,179,8,0.3)] transition-all flex items-center justify-center gap-2 mt-4 disabled:opacity-70"
          >
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : (isLogin ? 'ENTER ARENA' : 'REGISTER NOW')}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button type="button" onClick={() => { setIsLogin(!isLogin); setError(null); }} className="text-gray-400 text-sm hover:text-yellow-500 transition-colors">
            {isLogin ? "Don't have an account? Register" : "Already have an account? Login"}
          </button>
        </div>
      </div>
    </div>
  );
}
