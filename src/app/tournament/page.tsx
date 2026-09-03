"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Trophy, Users, Clock, ArrowRight, Shield, Zap, AlertCircle, Loader2 } from 'lucide-react';

export default function TournamentHub() {
  const router = useRouter();
  const [tournament, setTournament] = useState<any>(null);
  const [registeredCount, setRegisteredCount] = useState(0);
  const [isRegistered, setIsRegistered] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  
  // Naya State: Real-time countdown store karne ke liye
  const [countdownText, setCountdownText] = useState<string>("--");

  useEffect(() => {
    const fetchTournamentData = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) setUserId(session.user.id);

        const { data: tourneyData } = await supabase
          .from('tournaments')
          .select('*')
          .eq('status', 'upcoming')
          .order('start_time', { ascending: true })
          .limit(1)
          .single();

        if (tourneyData) {
          setTournament(tourneyData);
          
          const { count } = await supabase
            .from('tournament_players')
            .select('*', { count: 'exact', head: true })
            .eq('tournament_id', tourneyData.id);
            
          setRegisteredCount(count || 0);

          if (session) {
            const { data: myReg } = await supabase
              .from('tournament_players')
              .select('*')
              .eq('tournament_id', tourneyData.id)
              .eq('user_id', session.user.id)
              .single();
              
            if (myReg) setIsRegistered(true);
          }
        }
      } catch (err) {
        console.error("Failed to load tournament:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTournamentData();
  }, []);

  // REAL-TIME COUNTDOWN LOGIC (Database ke start_time se synced)
  useEffect(() => {
    if (!tournament?.start_time) return;

    const timer = setInterval(() => {
      const now = new Date().getTime();
      const start = new Date(tournament.start_time).getTime();
      const diff = start - now;

      if (diff <= 0) {
        setCountdownText("LIVE");
        clearInterval(timer);
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      if (days > 0) {
        setCountdownText(`${days}d ${hours}h`);
      } else if (hours > 0) {
        setCountdownText(`${hours}h ${minutes}m`);
      } else {
        setCountdownText(`${minutes}m ${seconds}s`);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [tournament]);

  const handleJoinTournament = () => {
    if (!userId) {
      router.push('/auth');
      return;
    }
    router.push(`/tournament/payment?id=${tournament.id}`);
  };

  if (isLoading) {
    return <div className="min-h-screen bg-[#050B14] flex justify-center items-center"><Loader2 className="w-8 h-8 text-yellow-500 animate-spin" /></div>;
  }

  return (
    <div className="min-h-screen bg-[#050B14] text-gray-100 font-sans flex flex-col p-4 md:p-8 selection:bg-yellow-500/30">
      <div className="max-w-3xl mx-auto w-full">
        
        <header className="flex justify-between items-center mb-8">
          <button onClick={() => router.push('/')} className="text-gray-400 hover:text-white text-sm font-bold transition flex items-center gap-1">
             Dashboard
          </button>
          <div className="flex items-center gap-2 bg-yellow-500/10 border border-yellow-500/30 px-3 py-1.5 rounded-lg">
            <Trophy className="w-4 h-4 text-yellow-500" />
            <span className="text-xs font-bold text-yellow-500 tracking-wider">LIVE EVENTS</span>
          </div>
        </header>

        {tournament ? (
          <div className="bg-[#0a0f1a] border border-gray-800 rounded-3xl overflow-hidden shadow-2xl relative">
            <div className="absolute top-0 right-0 w-64 h-64 bg-yellow-600/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
            
            <div className="p-6 md:p-10 text-center border-b border-gray-800 bg-gradient-to-b from-[#111827] to-[#0a0f1a]">
              <h1 className="text-3xl md:text-5xl font-extrabold text-white mb-4 tracking-tight uppercase">
                {tournament.title}
              </h1>
              <p className="text-gray-400 text-sm md:text-base max-w-xl mx-auto">
                64-Player 1v1 Elimination Tournament. Sync battles, auto-walkovers, and high-stakes coding trivia. Only one Grandmaster will survive.
              </p>
            </div>

            <div className="p-6 md:p-10">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
                <div className="bg-[#050813] border border-gray-800 rounded-xl p-4 text-center">
                  <Users className="w-6 h-6 text-blue-400 mx-auto mb-2" />
                  <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Seats Left</p>
                  <p className="text-xl font-extrabold text-white">{tournament.max_seats - registeredCount}</p>
                </div>
                
                {/* DYNAMIC TIMER ADDED HERE */}
                <div className="bg-[#050813] border border-gray-800 rounded-xl p-4 text-center">
                  <Clock className={`w-6 h-6 mx-auto mb-2 ${countdownText === 'LIVE' ? 'text-red-500 animate-pulse' : 'text-orange-400'}`} />
                  <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Starts In</p>
                  <p className={`text-xl font-extrabold ${countdownText === 'LIVE' ? 'text-red-500' : 'text-white'}`}>
                    {countdownText}
                  </p>
                </div>
                
                <div className="bg-[#050813] border border-gray-800 rounded-xl p-4 text-center">
                  <Trophy className="w-6 h-6 text-yellow-400 mx-auto mb-2" />
                  <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">1st Prize</p>
                  <p className="text-xl font-extrabold text-yellow-500">₹150</p>
                </div>
                <div className="bg-[#050813] border border-gray-800 rounded-xl p-4 text-center">
                  <Zap className="w-6 h-6 text-green-400 mx-auto mb-2" />
                  <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Entry Fee</p>
                  <p className="text-xl font-extrabold text-green-500">₹{tournament.entry_fee}</p>
                </div>
              </div>

              {/*  <div className="bg-[#111524] border border-yellow-900/30 rounded-2xl p-5 mb-8 flex justify-between items-center text-sm">
                 <div>
                    <p className="text-gray-400">2nd Prize: <span className="text-white font-bold">₹100</span></p>
                 </div>
                 <div>
                    <p className="text-gray-400">3rd Prize: <span className="text-white font-bold">₹50</span></p>
                 </div>
              </div> */}

              <div className="bg-[#111524] border border-blue-900/30 rounded-2xl p-6 mb-8">
                <h3 className="font-bold text-white mb-4 flex items-center gap-2">
                  <Shield className="w-4 h-4 text-blue-400" /> Tournament Rules
                </h3>
                <ul className="space-y-3 text-sm text-gray-400">
                  <li className="flex items-start gap-2">
                    <span className="text-blue-500 mt-0.5">•</span>
                    Live 1v1 Sync Matches. Both players get 10 questions simultaneously.
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-500 mt-0.5">•</span>
                    Wrong answers do not eliminate you. Play till the 10th question.
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-500 mt-0.5">•</span>
                    Tie-breaker: If scores match, the player with the lowest total time wins.
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-500 mt-0.5">•</span>
                    No Shows: Failing to click 'Ready' in the lobby gives an instant Walkover to the opponent.
                  </li>
                </ul>
              </div>

              {isRegistered ? (
                <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-5 text-center">
                  <p className="text-green-400 font-bold mb-2">Seat Confirmed! You are in.</p>
                  <button onClick={() => router.push('/tournament/lobby')} className="mt-3 px-6 py-2 bg-green-600 hover:bg-green-500 text-white font-bold rounded-lg transition-colors text-sm">
                    Enter Tournament Lobby
                  </button>
                </div>
              ) : (
                <button 
                  onClick={handleJoinTournament}
                  disabled={registeredCount >= tournament.max_seats}
                  className="w-full py-4 bg-yellow-500 hover:bg-yellow-400 text-black font-extrabold text-sm rounded-xl transition-all shadow-[0_0_20px_rgba(234,179,8,0.3)] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {registeredCount >= tournament.max_seats ? 'TOURNAMENT FULL' : 'PAY ₹9 & SECURE SEAT'} <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center py-20 bg-[#0a0f1a] rounded-2xl border border-gray-800">
            <AlertCircle className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-white mb-2">No Upcoming Tournaments</h2>
            <p className="text-gray-500 text-sm">We are preparing the next Grandmaster Cup. Stay tuned!</p>
          </div>
        )}
      </div>
    </div>
  );
}
