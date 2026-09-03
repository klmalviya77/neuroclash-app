"use client";

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Trophy, Loader2, Swords, Skull, User, AlertCircle } from 'lucide-react';

interface Question {
  id: string;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_option: string;
}

// FIX: all the original logic/JSX now lives in this inner component. The
// build error happened because `useSearchParams()` needs a <Suspense>
// boundary around it during static prerendering — without one, Vercel's
// `npm run build` fails with "Error occurred prerendering page". Nothing in
// this component's logic has changed, it's just moved out of the default export.
function TournamentArenaContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tournamentId = searchParams.get('tourneyId');

  const [userId, setUserId] = useState<string | null>(null);
  const [userName, setUserName] = useState<string>("Player");
  const [opponentName, setOpponentName] = useState<string>("Searching...");
  const [currentRoundName, setCurrentRoundName] = useState("Round of 64");
  
  const [matchStatus, _setMatchStatus] = useState<'searching' | 'playing' | 'waiting_for_opponent' | 'results'>('searching');
  const statusRef = useRef(matchStatus);
  const setMatchStatus = (val: 'searching' | 'playing' | 'waiting_for_opponent' | 'results') => {
    statusRef.current = val;
    _setMatchStatus(val);
  };

  const matchIdRef = useRef<string | null>(null);
  const playerNumRef = useRef<'p1' | 'p2' | null>(null);
  const scoreRef = useRef(0);
  const timeRef = useRef(0);

  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [score, setScore] = useState(0); 
  const [timeLeft, setTimeLeft] = useState(45);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isRevealed, setIsRevealed] = useState(false);

  const [myFinalScore, setMyFinalScore] = useState(0);
  const [myFinalTime, setMyFinalTime] = useState(0);
  const [oppFinalScore, setOppFinalScore] = useState<number | null>(null);
  const [oppFinalTime, setOppFinalTime] = useState<number | null>(null);
  const [matchWinnerId, setMatchWinnerId] = useState<string | null>(null);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const msTimerRef = useRef<NodeJS.Timeout | null>(null);

  const fetchQuestions = async () => {
    const { data } = await supabase.from('questions').select('*').limit(10).order('id', { ascending: true });
    if (data) setQuestions(data);
  };

  // 1. Initial Matchmaking (STRICT ROUND CHECK)
  useEffect(() => {
    const initMatchmaking = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session || !tournamentId) {
        router.push('/tournament'); return;
      }
      setUserId(session.user.id);
      
      const { data: profile } = await supabase.from('profiles').select('full_name').eq('id', session.user.id).single();
      if (profile) setUserName(profile.full_name);

      const { data: myStatus } = await supabase.from('tournament_players').select('status').eq('user_id', session.user.id).eq('tournament_id', tournamentId).single();
      if (myStatus?.status === 'eliminated') {
        alert("You are eliminated! You cannot join matches anymore.");
        router.push('/tournament/lobby');
        return;
      }

      // ✅ GET CURRENT ROUND FOR THIS PLAYER
      const { data: myMatches } = await supabase
        .from('tournament_matches')
        .select('id')
        .eq('tournament_id', tournamentId)
        .eq('status', 'completed')
        .or(`player1_id.eq.${session.user.id},player2_id.eq.${session.user.id}`);

      const matchesPlayed = myMatches ? myMatches.length : 0;
      const roundNames = ['Round of 64', 'Round of 32', 'Round of 16', 'Quarter-Finals', 'Semi-Finals', 'Grand Final'];
      const myRoundName = roundNames[matchesPlayed] || 'Champion';
      setCurrentRoundName(myRoundName);

      const { data: existingMatch } = await supabase
        .from('tournament_matches')
        .select('*')
        .eq('tournament_id', tournamentId)
        .in('status', ['scheduled', 'live'])
        .or(`player1_id.eq.${session.user.id},player2_id.eq.${session.user.id}`)
        .order('scheduled_time', { ascending: false })
        .limit(1)
        .single();

      if (existingMatch) {
        matchIdRef.current = existingMatch.id;
        playerNumRef.current = existingMatch.player1_id === session.user.id ? 'p1' : 'p2';
        if (existingMatch.status === 'live') {
          fetchQuestions();
          setMatchStatus('playing');
        }
        return;
      }

      // Find open room ONLY FOR CURRENT ROUND
      const { data: openMatches } = await supabase
        .from('tournament_matches')
        .select('*')
        .eq('tournament_id', tournamentId)
        .eq('status', 'scheduled')
        .eq('round_name', myRoundName) // ✅ STRICT MATCHING
        .is('player2_id', null)
        .neq('player1_id', session.user.id)
        .limit(1);

      if (openMatches && openMatches.length > 0) {
        const match = openMatches[0];
        const { error } = await supabase.from('tournament_matches').update({ player2_id: session.user.id, status: 'live' }).eq('id', match.id);
        if (!error) {
           matchIdRef.current = match.id;
           playerNumRef.current = 'p2';
           fetchQuestions();
           setMatchStatus('playing'); 
        }
      } else {
        const { data: newMatch } = await supabase.from('tournament_matches').insert([{ 
            tournament_id: tournamentId, 
            player1_id: session.user.id, 
            round_name: myRoundName, // ✅ SET CORRECT ROUND
            p1_time_ms: -1 
        }]).select().single();
          
        if (newMatch) { 
          matchIdRef.current = newMatch.id;
          playerNumRef.current = 'p1';
          setMatchStatus('searching');
        }
      }
    };

    initMatchmaking();
  }, [tournamentId, router]);

  // ✅ 30-SECOND WALKOVER RULE
  useEffect(() => {
    let walkoverTimer: NodeJS.Timeout;
    
    if (matchStatus === 'searching' && playerNumRef.current === 'p1' && matchIdRef.current) {
      walkoverTimer = setTimeout(async () => {
        const { data: matchCheck } = await supabase.from('tournament_matches').select('player2_id, status').eq('id', matchIdRef.current).single();
        
        if (matchCheck && !matchCheck.player2_id && matchCheck.status !== 'completed') {
          await supabase.from('tournament_matches').update({ 
            status: 'completed', 
            winner_id: userId,
            p1_score: 10,
            p2_score: 0,
            p1_time_ms: 1, 
            p2_time_ms: 999999 
          }).eq('id', matchIdRef.current);
          
          setMyFinalScore(10);
          setMyFinalTime(1);
          setOpponentName("NO SHOW (Eliminated)");
          setOppFinalScore(0);
          setOppFinalTime(999999);
          setMatchWinnerId(userId);
          setMatchStatus('results');
        }
      }, 30000); 
    }
    return () => clearTimeout(walkoverTimer);
  }, [matchStatus, userId]);

  // 2. Real-time Subscription + Polling Auto-Heal
  useEffect(() => {
    const interval = setInterval(async () => {
      if (!matchIdRef.current || !userId) return;
      const { data: match } = await supabase.from('tournament_matches').select('*').eq('id', matchIdRef.current).single();
      if (match) updateMatchUI(match);
    }, 3000);

    const channel = supabase.channel(`match_updates`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'tournament_matches' }, 
      (payload) => { 
        if (payload.new.id === matchIdRef.current) updateMatchUI(payload.new); 
      })
      .subscribe();

    return () => { clearInterval(interval); supabase.removeChannel(channel); };
  }, [userId]); 

  const updateMatchUI = async (matchData: any) => {
    const isP1 = matchData.player1_id === userId;

    if (matchData.status === 'live' && matchData.player2_id) {
      const oppId = isP1 ? matchData.player2_id : matchData.player1_id;
      if (oppId) {
        const { data: pProfile } = await supabase.from('profiles').select('full_name').eq('id', oppId).single();
        if (pProfile) setOpponentName(pProfile.full_name);
      }
      if (statusRef.current === 'searching') {
        fetchQuestions(); 
        setMatchStatus('playing');
      }
    }

    const p1Done = matchData.p1_time_ms > 0;
    const p2Done = matchData.p2_time_ms > 0;

    if (matchData.status === 'completed' || (p1Done && p2Done)) {
      if (statusRef.current !== 'results') {
        const p1Win = matchData.p1_score > matchData.p2_score || (matchData.p1_score === matchData.p2_score && matchData.p1_time_ms < matchData.p2_time_ms);
        const winnerId = p1Win ? matchData.player1_id : matchData.player2_id;
        const loserId = p1Win ? matchData.player2_id : matchData.player1_id;

        if (isP1 && matchData.status !== 'completed') {
          try {
            await supabase.from('tournament_matches').update({ status: 'completed', winner_id: winnerId }).eq('id', matchData.id);
            if (loserId) {
              await supabase.from('tournament_players').update({ status: 'eliminated' }).eq('user_id', loserId).eq('tournament_id', matchData.tournament_id);
            }
          } catch (e) { console.error(e); }
        }

        setMyFinalScore(isP1 ? matchData.p1_score : matchData.p2_score);
        setMyFinalTime(isP1 ? matchData.p1_time_ms : matchData.p2_time_ms);
        setOppFinalScore(isP1 ? matchData.p2_score : matchData.p1_score);
        setOppFinalTime(isP1 ? matchData.p2_time_ms : matchData.p1_time_ms);
        
        setMatchWinnerId(winnerId);
        setMatchStatus('results');
      }
    }
  };

  // 3. Gameplay Timer
  useEffect(() => {
    if (statusRef.current !== 'playing' || isRevealed) return;
    if (timeLeft === 0) { handleOptionClick("TIMEOUT"); return; }

    timerRef.current = setInterval(() => { setTimeLeft(prev => prev - 1); }, 1000);
    msTimerRef.current = setInterval(() => { timeRef.current += 100; }, 100);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (msTimerRef.current) clearInterval(msTimerRef.current);
    };
  }, [matchStatus, timeLeft, isRevealed]);

  const handleOptionClick = (optionKey: string) => {
    if (isRevealed || !questions[currentIdx]) return;
    if (timerRef.current) clearInterval(timerRef.current);
    if (msTimerRef.current) clearInterval(msTimerRef.current);
    setSelectedOption(optionKey);
    setIsRevealed(true);

    if (optionKey === questions[currentIdx].correct_option) {
      scoreRef.current += 1;
      setScore(scoreRef.current); 
    }

    setTimeout(() => {
      if (currentIdx < questions.length - 1) {
        setCurrentIdx(prev => prev + 1);
        setSelectedOption(null); 
        setIsRevealed(false); 
        setTimeLeft(45); 
      } else {
        finishMatch();
      }
    }, 2000);
  };

  const finishMatch = async () => {
    setMatchStatus('waiting_for_opponent');
    const myTime = timeRef.current || 1; 
    const finalScore = scoreRef.current;
    const matchId = matchIdRef.current;
    const pNum = playerNumRef.current;

    if (!matchId || !pNum) return;

    const updatePayload = pNum === 'p1' ? { p1_score: finalScore, p1_time_ms: myTime } : { p2_score: finalScore, p2_time_ms: myTime };
    await supabase.from('tournament_matches').update(updatePayload).eq('id', matchId);
    
    const { data: match } = await supabase.from('tournament_matches').select('*').eq('id', matchId).single();
    if (match) updateMatchUI(match);
  };

  if (matchStatus === 'searching') {
    return (
      <div className="min-h-screen bg-[#050B14] flex flex-col items-center justify-center text-white">
        <Swords className="w-20 h-20 text-blue-500 animate-bounce mb-6" />
        <h2 className="text-2xl font-extrabold uppercase text-blue-400 mb-2">Matchmaking ({currentRoundName})</h2>
        <p className="text-gray-400 text-sm mb-6">Waiting for opponent to join...</p>
        
        <div className="bg-red-950/30 border border-red-900/50 p-4 rounded-xl flex items-start gap-3 max-w-sm">
          <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
          <p className="text-xs text-red-300">If no opponent joins within 30 seconds, you will be awarded an automatic Walkover Victory!</p>
        </div>
      </div>
    );
  }

  if (matchStatus === 'waiting_for_opponent') {
    return (
      <div className="min-h-screen bg-[#050B14] flex flex-col items-center justify-center text-white">
        <Loader2 className="w-16 h-16 text-yellow-500 animate-spin mb-6" />
        <h2 className="text-2xl font-bold mb-2">You Finished!</h2>
        <p className="text-gray-400">Waiting for opponent to finish...</p>
      </div>
    );
  }

  if (matchStatus === 'results') {
    const isWinner = matchWinnerId === userId;
    return (
      <div className="min-h-screen bg-[#050B14] flex flex-col items-center justify-center p-4 text-white text-center">
        <div className={`p-8 rounded-3xl border shadow-2xl max-w-md w-full ${isWinner ? 'bg-[#0a1128] border-yellow-500/30 shadow-[0_0_50px_rgba(202,138,4,0.2)]' : 'bg-[#1a0b0b] border-red-500/30 shadow-[0_0_50px_rgba(239,68,68,0.2)]'}`}>
          {isWinner ? <Trophy className="w-24 h-24 text-yellow-500 mx-auto mb-4" /> : <Skull className="w-24 h-24 text-red-500 mx-auto mb-4" />}
          <h1 className={`text-4xl font-extrabold mb-2 ${isWinner ? 'text-yellow-500' : 'text-red-500'}`}>{isWinner ? 'VICTORY' : 'ELIMINATED'}</h1>
          <p className="text-gray-400 text-sm mb-8">{isWinner ? 'You advance to the next round!' : 'You are out of the tournament.'}</p>

          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="bg-black/50 border border-gray-800 rounded-xl p-4">
              <p className="text-xs text-gray-500 font-bold uppercase mb-1">You</p>
              <p className="text-2xl font-bold text-white">{myFinalScore} <span className="text-sm text-gray-500">/ 10</span></p>
              <p className="text-xs text-gray-500 mt-1">{(myFinalTime / 1000).toFixed(1)}s</p>
            </div>
            <div className="bg-black/50 border border-gray-800 rounded-xl p-4">
              <p className="text-xs text-gray-500 font-bold uppercase mb-1">{opponentName || "Opponent"}</p>
              <p className="text-2xl font-bold text-gray-300">{oppFinalScore} <span className="text-sm text-gray-500">/ 10</span></p>
              <p className="text-xs text-gray-500 mt-1">{(oppFinalTime! / 1000).toFixed(1)}s</p>
            </div>
          </div>
          <button onClick={() => router.push('/tournament/lobby')} className="w-full py-4 bg-gray-800 hover:bg-gray-700 text-white font-bold rounded-xl transition-all">Back to Lobby</button>
        </div>
      </div>
    );
  }

  const currentQ = questions[currentIdx];
  if (!currentQ) return <div className="text-white p-10 text-center">Loading Arena...</div>;

  return (
    <div className="min-h-screen bg-[#050B14] text-white p-4">
      <header className="flex justify-between items-center mb-6 bg-black/40 border border-gray-800 rounded-2xl p-3 max-w-lg mx-auto">
        <div className="text-left"><p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">You</p><p className="text-sm font-bold text-white">{userName}</p></div>
        <div className="px-4 py-1 bg-yellow-500/10 border border-yellow-600/30 rounded-full text-yellow-500 font-extrabold text-xs">Q {currentIdx + 1} / 10</div>
        <div className="text-right"><p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">Opponent</p><p className="text-sm font-bold text-red-400">{opponentName}</p></div>
      </header>

      <div className="w-full max-w-lg mx-auto">
        <div className="flex justify-center mb-6">
          <div className="relative w-16 h-16 flex items-center justify-center bg-[#0a0f1a] rounded-full border-2 border-blue-500 shadow-[0_0_20px_rgba(0,0,0,0.5)]">
            <svg className="absolute top-0 left-0 w-full h-full -rotate-90">
              <circle cx="50%" cy="50%" r="45%" fill="none" stroke={timeLeft <= 10 ? '#ef4444' : '#3b82f6'} strokeWidth="3" 
                strokeDasharray="283" strokeDashoffset={283 - (283 * timeLeft) / 45} className="transition-all duration-1000 ease-linear" />
            </svg>
            <span className={`text-2xl font-extrabold ${timeLeft <= 10 ? 'text-red-500 animate-pulse' : 'text-blue-500'}`}>{timeLeft}</span>
          </div>
        </div>

        <div className="bg-[#070b1a] border border-blue-900/40 rounded-xl p-6 mb-6 text-center shadow-lg">
          <h1 className="text-lg font-medium text-gray-100">{currentQ.question_text}</h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[{ key: 'A', text: currentQ.option_a }, { key: 'B', text: currentQ.option_b }, { key: 'C', text: currentQ.option_c }, { key: 'D', text: currentQ.option_d }].map((opt) => {
            const isCorrect = currentQ.correct_option === opt.key;
            let bg = "bg-[#0a0f1a] border-gray-800";
            if (isRevealed) {
              if (isCorrect) bg = "bg-green-600/20 border-green-500 text-green-400";
              else if (selectedOption === opt.key) bg = "bg-red-600/20 border-red-500 text-red-400";
            } else if (selectedOption === opt.key) bg = "bg-blue-500/20 border-blue-500 text-blue-400";

            return (
              <button key={opt.key} onClick={() => handleOptionClick(opt.key)} disabled={selectedOption !== null || isRevealed} className={`p-4 rounded-lg border-2 text-left ${bg}`}>
                <span className="font-bold text-gray-500 mr-3">{opt.key}</span>{opt.text}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  );
}

// FIX: default export now just wraps the real component in <Suspense>. This
// is what satisfies Next.js's requirement for useSearchParams() during
// static prerendering — without this wrapper, `npm run build` on Vercel
// fails with "Error occurred prerendering page /tournament/arena".
export default function TournamentArena() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#050B14] flex items-center justify-center text-white">
          <Loader2 className="w-10 h-10 animate-spin" />
        </div>
      }
    >
      <TournamentArenaContent />
    </Suspense>
  );
}
