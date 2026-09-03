"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Trophy, Medal, Loader2, Flame, Clock, Target } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface Player {
  id: string;
  full_name: string;
  total_xp: number;
  fastest_time_seconds: number;
}

export default function LeaderboardPage() {
  const router = useRouter();
  const [players, setPlayers] = useState<Player[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
        const fetchLeaderboard = async () => {
      try {
        setIsLoading(true);
        
        const { data: { session } } = await supabase.auth.getSession();
        if (session) setCurrentUserId(session.user.id);

        const { data, error } = await supabase
          .from('profiles')
          .select('id, full_name, total_xp, fastest_time_seconds')
          .order('total_xp', { ascending: false })
          .order('fastest_time_seconds', { ascending: true })
          .limit(50);

        if (error) {
          console.error("Supabase Error:", error.message);
          return;
        }
        
        if (data) setPlayers(data);

      } catch (err: any) {
        console.error("Error fetching leaderboard:", err.message || err);
      } finally {
        setIsLoading(false);
      }
    };


    fetchLeaderboard();
  }, []);

  // Helper to format time (e.g., 65s -> 1m 5s)
  const formatTime = (seconds: number) => {
    if (seconds === 999999 || seconds === 0) return "--";
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return m > 0 ? `${m}m ${s}s` : `${s}s`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#050B14] flex flex-col items-center justify-center text-yellow-500">
        <Loader2 className="w-12 h-12 animate-spin mb-4" />
        <p className="font-bold tracking-widest text-xs uppercase">Fetching Global Ranks...</p>
      </div>
    );
  }

  // Find current user's rank
  const currentUserRankIndex = players.findIndex(p => p.id === currentUserId);
  const currentUserData = currentUserRankIndex !== -1 ? players[currentUserRankIndex] : null;

  return (
    <div className="min-h-screen bg-[#050B14] text-gray-100 font-sans flex flex-col selection:bg-yellow-500/30">
      
      <div className="flex-grow p-4 md:p-8 max-w-3xl mx-auto w-full flex flex-col">
        
        {/* Navigation & Header */}
        <div className="flex items-center justify-between mb-8 pb-4 border-b border-gray-800">
          <button 
            onClick={() => router.push('/')} 
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-sm font-semibold"
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-extrabold tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-yellow-600">
              NEUROCLASH
            </h1>
          </div>
        </div>

        {/* Title Area */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center p-4 bg-yellow-500/10 rounded-full border border-yellow-500/20 mb-4 shadow-[0_0_30px_rgba(234,179,8,0.15)]">
            <Trophy className="w-10 h-10 text-yellow-500" />
          </div>
          <h2 className="text-3xl font-extrabold text-white mb-2 tracking-tight">Global Leaderboard</h2>
          <p className="text-gray-400 text-sm">Rankings are calculated by Total XP. Ties are broken by Fastest Clear Time.</p>
        </div>

        {/* Leaderboard List */}
        <div className="bg-[#0a0f1a] border border-gray-800 rounded-2xl overflow-hidden shadow-2xl flex-grow mb-20">
          
          {/* Table Header */}
          <div className="grid grid-cols-12 gap-4 p-4 border-b border-gray-800 bg-[#111827] text-xs font-bold text-gray-500 uppercase tracking-wider">
            <div className="col-span-2 text-center">Rank</div>
            <div className="col-span-5">Player</div>
            <div className="col-span-3 text-right">Total XP</div>
            <div className="col-span-2 text-right">Time</div>
          </div>

          {/* Players Rows */}
          <div className="divide-y divide-gray-800/50">
            {players.length > 0 ? players.map((player, index) => {
              const rank = index + 1;
              const isCurrentUser = player.id === currentUserId;
              
              // Top 3 Styling Logic
              let rowStyle = "hover:bg-gray-800/30 transition-colors";
              let rankBadge = <span className="font-bold text-gray-400">#{rank}</span>;
              
              if (rank === 1) {
                rowStyle = "bg-yellow-500/5 hover:bg-yellow-500/10";
                rankBadge = <Medal className="w-6 h-6 text-yellow-400 mx-auto drop-shadow-[0_0_8px_rgba(250,204,21,0.8)]" />;
              } else if (rank === 2) {
                rowStyle = "bg-gray-300/5 hover:bg-gray-300/10";
                rankBadge = <Medal className="w-6 h-6 text-gray-300 mx-auto" />;
              } else if (rank === 3) {
                rowStyle = "bg-orange-700/5 hover:bg-orange-700/10";
                rankBadge = <Medal className="w-6 h-6 text-orange-600 mx-auto" />;
              }

              return (
                <div 
                  key={player.id} 
                  className={`grid grid-cols-12 gap-4 p-4 items-center ${rowStyle} ${isCurrentUser ? 'border-l-4 border-yellow-500 bg-yellow-500/5' : 'border-l-4 border-transparent'}`}
                >
                  <div className="col-span-2 flex justify-center items-center">
                    {rankBadge}
                  </div>
                  <div className="col-span-5 flex items-center gap-2 truncate">
                    <span className={`font-bold truncate ${isCurrentUser ? 'text-yellow-500' : 'text-gray-200'}`}>
                      {player.full_name}
                    </span>
                    {isCurrentUser && <span className="text-[9px] bg-yellow-500 text-black px-1.5 py-0.5 rounded font-extrabold uppercase ml-2 hidden sm:inline-block">You</span>}
                  </div>
                  <div className="col-span-3 text-right font-mono font-bold text-orange-400 flex items-center justify-end gap-1.5">
                    {player.total_xp.toLocaleString()} <Flame className="w-3.5 h-3.5 hidden sm:block" />
                  </div>
                  <div className="col-span-2 text-right text-xs font-mono text-gray-400 flex items-center justify-end gap-1">
                    {formatTime(player.fastest_time_seconds)}
                  </div>
                </div>
              );
            }) : (
              <div className="p-10 text-center text-gray-500">
                <Target className="w-10 h-10 mx-auto mb-3 opacity-20" />
                No players have secured a rank yet. Be the first!
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Sticky Current User Rank Bar at Bottom */}
      {currentUserId && currentUserData && (
        <div className="fixed bottom-0 left-0 w-full bg-gradient-to-t from-black via-[#0a0f1a] to-transparent pt-10 pb-6 px-4 z-50 pointer-events-none">
          <div className="max-w-2xl mx-auto bg-[#111827] border border-yellow-500/30 rounded-xl p-4 shadow-[0_0_30px_rgba(234,179,8,0.15)] flex items-center justify-between pointer-events-auto backdrop-blur-md">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-yellow-500 flex items-center justify-center text-black font-extrabold">
                #{currentUserRankIndex + 1}
              </div>
              <div>
                <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-0.5">Your Position</p>
                <p className="text-sm font-bold text-white truncate max-w-[120px] sm:max-w-[200px]">{currentUserData.full_name}</p>
              </div>
            </div>
            
            <div className="flex gap-4 sm:gap-6 text-right">
              <div>
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-0.5">Total XP</p>
                <p className="text-sm font-bold font-mono text-orange-400 flex items-center justify-end gap-1">
                  {currentUserData.total_xp.toLocaleString()} <Flame className="w-3 h-3" />
                </p>
              </div>
              <div className="hidden sm:block">
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-0.5">Best Time</p>
                <p className="text-sm font-bold font-mono text-gray-300 flex items-center justify-end gap-1">
                  {formatTime(currentUserData.fastest_time_seconds)} <Clock className="w-3 h-3" />
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
