"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Users, Clock, Shield, Loader2, AlertCircle, Swords, Play, Skull, Trophy } from 'lucide-react';

export default function TournamentLobby() {
  const router = useRouter();
  const [tournament, setTournament] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [isMatchReady, setIsMatchReady] = useState(false);
  const [currentRoundName, setCurrentRoundName] = useState("Round of 64");
  
  const [playerData, setPlayerData] = useState<any>(null);
  const [allPlayers, setAllPlayers] = useState<any[]>([]);

  // 7 Minutes interval between rounds
  const ROUND_INTERVAL_MS = 7 * 60 * 1000; 

  const roundNames = ['Round of 64', 'Round of 32', 'Round of 16', 'Quarter-Finals', 'Semi-Finals', 'Grand Final'];

  useEffect(() => {
    const fetchLobbyData = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          router.push('/auth'); return;
        }

        const { data: tourneyData } = await supabase
          .from('tournaments')
          .select('*')
          .in('status', ['upcoming', 'live'])
          .order('start_time', { ascending: true })
          .limit(1)
          .single();

        if (tourneyData) {
          setTournament(tourneyData);
          
          const { data: myReg } = await supabase
            .from('tournament_players')
            .select('*, profiles(full_name)')
            .eq('tournament_id', tourneyData.id)
            .eq('user_id', session.user.id)
            .single();

          if (!myReg) {
            router.push('/tournament'); return;
          }
          setPlayerData(myReg);

          const { data: participants } = await supabase
            .from('tournament_players')
            .select('status, profiles(full_name)')
            .eq('tournament_id', tourneyData.id);
            
          if (participants) setAllPlayers(participants);

          // ✅ AUTOMATIC ROUND DETECTION LOGIC
          const { data: myMatches } = await supabase
            .from('tournament_matches')
            .select('id')
            .eq('tournament_id', tourneyData.id)
            .eq('status', 'completed')
            .or(`player1_id.eq.${session.user.id},player2_id.eq.${session.user.id}`);

          const matchesPlayed = myMatches ? myMatches.length : 0;
          const nextRoundStr = roundNames[matchesPlayed] || 'Champion';
          setCurrentRoundName(nextRoundStr);

          const startTime = new Date(tourneyData.start_time).getTime();
          const myNextMatchTime = startTime + (matchesPlayed * ROUND_INTERVAL_MS);
          const diff = myNextMatchTime - new Date().getTime();
          
          if (diff <= 0) {
            setIsMatchReady(true);
            setTimeLeft(0);
          } else {
            setIsMatchReady(false);
            setTimeLeft(diff);
          }
        }
      } catch (err) {
        console.error("Lobby Error:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLobbyData();
    const interval = setInterval(fetchLobbyData, 10000);
    return () => clearInterval(interval);
  }, [router]);

  useEffect(() => {
    if (timeLeft === null || timeLeft <= 0 || isMatchReady) return;
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev !== null && prev <= 1000) {
          clearInterval(interval);
          setIsMatchReady(true);
          return 0;
        }
        return prev !== null ? prev - 1000 : null;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [timeLeft, isMatchReady]);

  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    return {
      hours: Math.floor(totalSeconds / 3600).toString().padStart(2, '0'),
      minutes: Math.floor((totalSeconds % 3600) / 60).toString().padStart(2, '0'),
      seconds: (totalSeconds % 60).toString().padStart(2, '0')
    };
  };

  if (isLoading) return <div className="min-h-screen bg-[#050B14] flex justify-center items-center"><Loader2 className="w-8 h-8 text-blue-500 animate-spin" /></div>;

  const timer = timeLeft !== null ? formatTime(timeLeft) : { hours: '00', minutes: '00', seconds: '00' };
  const isEliminated = playerData?.status === 'eliminated';
  const activeCount = allPlayers.filter(p => p.status === 'active').length;

  return (
    <div className="min-h-screen bg-[#050B14] text-gray-100 font-sans flex flex-col p-4 md:p-8">
      <div className="max-w-4xl mx-auto w-full mt-4 flex flex-col md:flex-row gap-6">
        
        {/* Main Waiting Room */}
        <div className="flex-1 bg-[#0a0f1a] border border-blue-900/40 rounded-3xl overflow-hidden shadow-2xl relative flex flex-col">
          <div className="p-6 border-b border-gray-800 bg-gradient-to-b from-[#0f172a] to-[#0a0f1a] text-center">
            {isEliminated ? (
               <Skull className="w-12 h-12 text-red-500 mx-auto mb-2" />
            ) : (
               <Swords className="w-12 h-12 text-blue-400 mx-auto mb-2" />
            )}
            <h1 className="text-xl font-extrabold text-white mb-1 uppercase">Waiting Room</h1>
            <p className="text-gray-400 text-xs">Player: <span className="text-blue-400 font-bold">{playerData?.profiles?.full_name}</span></p>
          </div>

          <div className="p-6 flex-grow flex flex-col justify-center">
            <h2 className="text-center text-lg font-bold text-gray-300 mb-2">{tournament?.title}</h2>
            
            {!isEliminated && (
               <p className="text-center text-blue-400 font-bold mb-6 tracking-widest uppercase">UPCOMING: {currentRoundName}</p>
            )}

            {isEliminated ? (
              <div className="text-center bg-red-950/20 border border-red-900/50 p-6 rounded-2xl mb-8">
                <h3 className="text-2xl font-bold text-red-500 mb-2">You are Eliminated</h3>
                <p className="text-sm text-gray-400">You lost your match. You can still watch the tournament standings on the right.</p>
              </div>
            ) : (
              <>
                <div className="flex justify-center gap-4 mb-8">
                  <div className="bg-[#050813] border border-gray-800 rounded-xl w-16 h-16 flex flex-col items-center justify-center">
                    <span className="text-2xl font-extrabold text-white">{timer.hours}</span>
                    <span className="text-[9px] text-gray-500 uppercase mt-1">HRS</span>
                  </div>
                  <div className="text-2xl font-bold text-gray-600 mt-3">:</div>
                  <div className="bg-[#050813] border border-gray-800 rounded-xl w-16 h-16 flex flex-col items-center justify-center">
                    <span className="text-2xl font-extrabold text-white">{timer.minutes}</span>
                    <span className="text-[9px] text-gray-500 uppercase mt-1">MIN</span>
                  </div>
                  <div className="text-2xl font-bold text-gray-600 mt-3">:</div>
                  <div className="bg-[#050813] border border-blue-900/50 rounded-xl w-16 h-16 flex flex-col items-center justify-center relative overflow-hidden">
                    <span className={`text-2xl font-extrabold relative z-10 ${isMatchReady ? 'text-green-500' : 'text-blue-400'}`}>{timer.seconds}</span>
                    <span className="text-[9px] text-gray-400 uppercase mt-1 relative z-10">SEC</span>
                  </div>
                </div>

                {isMatchReady ? (
                  <button 
                    onClick={() => router.push(`/tournament/arena?tourneyId=${tournament.id}`)}
                    className="w-full py-4 bg-green-600 hover:bg-green-500 text-white font-extrabold text-sm rounded-xl transition-all shadow-[0_0_30px_rgba(34,197,94,0.4)] flex items-center justify-center gap-2 animate-bounce"
                  >
                    <Play className="w-5 h-5" fill="currentColor" /> ENTER LIVE MATCH NOW
                  </button>
                ) : (
                  <button disabled className="w-full py-4 bg-gray-800 text-gray-500 font-extrabold text-sm rounded-xl flex items-center justify-center gap-2 cursor-not-allowed">
                    <Clock className="w-5 h-5" /> WAITING FOR ROUND...
                  </button>
                )}
              </>
            )}
          </div>
        </div>

        {/* Live Tournament Standings */}
        <div className="w-full md:w-72 bg-[#0a0f1a] border border-gray-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[600px]">
           <div className="p-4 bg-gray-900/80 border-b border-gray-800 flex justify-between items-center">
             <h3 className="font-bold text-sm text-white flex items-center gap-2"><Trophy className="w-4 h-4 text-yellow-500"/> Live Standings</h3>
             <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded font-bold">{activeCount} Alive</span>
           </div>
           <div className="p-2 overflow-y-auto flex-grow">
              {allPlayers.map((p, idx) => (
                <div key={idx} className={`p-3 rounded-lg mb-2 flex justify-between items-center text-sm ${p.status === 'eliminated' ? 'bg-red-950/10 border border-red-900/20 opacity-50' : 'bg-blue-900/10 border border-blue-900/30'}`}>
                  <span className={`font-semibold ${p.status === 'eliminated' ? 'text-gray-500 line-through' : 'text-gray-200'}`}>
                    {p.profiles?.full_name}
                  </span>
                  {p.status === 'eliminated' ? <Skull className="w-4 h-4 text-red-500"/> : <Swords className="w-4 h-4 text-blue-400"/>}
                </div>
              ))}
           </div>
        </div>

      </div>
    </div>
  );
}
