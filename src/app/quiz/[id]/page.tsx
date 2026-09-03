"use client";

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Trophy, ArrowRight, Loader2, Volume2, VolumeX, Flame, Skull } from 'lucide-react';

interface Question {
  id: string;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_option: string;
}

// FIX: same useSearchParams()-needs-Suspense build issue as tournament/arena.
// All original logic is unchanged — just renamed and wrapped below.
function BattleArenaContent() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const quizId = params.id as string;
  const levelParam = searchParams.get('level') || '1';

  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [xpEarned, setXpEarned] = useState(0);
  
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isRevealed, setIsRevealed] = useState(false);
  const [timeLeft, setTimeLeft] = useState(30); 
  
  const [isLoading, setIsLoading] = useState(true);
  const [isFinished, setIsFinished] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  
  const [isMuted, setIsMuted] = useState(false);
  
  const timerAudioRef = useRef<HTMLAudioElement | null>(null);
  const effectAudioRef = useRef<HTMLAudioElement | null>(null);
  const [xpSaved, setXpSaved] = useState(false);
  const [totalTimeTaken, setTotalTimeTaken] = useState(0);

  // DATABASE UPDATE LOGIC
  useEffect(() => {
    const saveProgressToDB = async () => {
      if (xpEarned <= 0) return; 
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        const { data: profile } = await supabase
          .from('profiles')
          .select('total_xp, fastest_time_seconds')
          .eq('id', session.user.id)
          .single();

        if (profile) {
          const newTotalXp = (profile.total_xp || 0) + xpEarned;
          const currentBestTime = profile.fastest_time_seconds || 999999;
          
          const newBestTime = (totalTimeTaken > 0 && totalTimeTaken < currentBestTime) 
            ? totalTimeTaken 
            : currentBestTime;

          await supabase
            .from('profiles')
            .update({ 
              total_xp: newTotalXp,
              fastest_time_seconds: newBestTime
            })
            .eq('id', session.user.id);
        }
      } catch (err) {
        console.error("Failed to update XP in Database:", err);
      }
    };

    if ((isGameOver || isFinished) && !xpSaved) {
      saveProgressToDB();
      setXpSaved(true);
    }
  }, [isGameOver, isFinished, xpEarned, xpSaved, totalTimeTaken]);

  // Timer Sync
  useEffect(() => {
    if (isLoading || isFinished || isGameOver || isRevealed) {
      if (timerAudioRef.current) timerAudioRef.current.pause();
      return;
    }

    if (!timerAudioRef.current) {
      timerAudioRef.current = new Audio('/sounds/timer.mp3');
      timerAudioRef.current.loop = true;
    }
    
    if (!isMuted && timerAudioRef.current.paused) {
      timerAudioRef.current.play().catch(() => {});
    }

    if (timeLeft === 0) {
      handleTimeOut();
      return;
    }

    const timerInterval = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
      setTotalTimeTaken((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timerInterval);
  }, [timeLeft, isLoading, isFinished, isGameOver, isRevealed, isMuted]);

  // Unmount Cleanup
  useEffect(() => {
    const savedMute = localStorage.getItem('quiz_muted') === 'true';
    setIsMuted(savedMute);

    return () => {
      if (timerAudioRef.current) {
        timerAudioRef.current.pause();
        timerAudioRef.current.currentTime = 0;
      }
      if (effectAudioRef.current) {
        effectAudioRef.current.pause();
        effectAudioRef.current.currentTime = 0;
      }
    };
  }, []);

  const toggleMute = () => {
    const newState = !isMuted;
    setIsMuted(newState);
    localStorage.setItem('quiz_muted', String(newState));
    
    if (newState && timerAudioRef.current) {
      timerAudioRef.current.pause();
    } else if (!newState && timerAudioRef.current && !isRevealed && !isFinished && !isGameOver) {
      timerAudioRef.current.play().catch(() => {});
    }
  };

  const playSound = (src: string, loop = false) => {
    if (isMuted) return null;
    try {
      if (effectAudioRef.current) effectAudioRef.current.pause();
      const audio = new Audio(src);
      audio.loop = loop;
      effectAudioRef.current = audio;
      audio.play().catch(() => {});
      return audio;
    } catch (e) {
      return null;
    }
  };

  const loadGameData = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase.from('questions').select('*').eq('quiz_id', quizId);
      if (error) throw error;
      
      if (data && data.length > 0) {
        // Local storage here is ONLY used so we don't ask the same questions repeatedly! This is a good feature.
        const storageKey = `played_qs_${quizId}_lvl${levelParam}`;
        let playedIds: string[] = JSON.parse(localStorage.getItem(storageKey) || '[]');
        let availableQuestions = data.filter(q => !playedIds.includes(q.id));

        if (availableQuestions.length === 0) {
          playedIds = [];
          availableQuestions = [...data];
        }

        const shuffled = availableQuestions.sort(() => Math.random() - 0.5);
        const selectedQuestions = shuffled.slice(0, 10);
        
        const newPlayedIds = [...playedIds, ...selectedQuestions.map(q => q.id)];
        localStorage.setItem(storageKey, JSON.stringify(newPlayedIds));
        setQuestions(selectedQuestions);
      }
    } catch (error) {
      console.error("Error fetching questions:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (quizId) loadGameData();
  }, [quizId]);

  const handleTimeOut = () => {
    setIsRevealed(true);
    if (timerAudioRef.current) timerAudioRef.current.pause();
    playSound('/sounds/wrong.mp3');
    setTimeout(() => {
      setIsGameOver(true);
      playSound('/sounds/lose.mp3');
    }, 3000);
  };

  const handleOptionClick = (optionKey: string) => {
    if (selectedOption || isRevealed || isGameOver) return;
    setSelectedOption(optionKey);
    if (timerAudioRef.current) timerAudioRef.current.pause();
    playSound('/sounds/lock.mp3');
    
    setTimeout(() => {
      setIsRevealed(true);
      const isCorrect = optionKey === questions[currentIdx].correct_option;
      
      if (isCorrect) {
        setScore((prev) => prev + 1);
        setXpEarned((prev) => prev + 500); 
        playSound('/sounds/correct.mp3');
        setTimeout(nextQuestion, 2500);
      } else {
        playSound('/sounds/wrong.mp3');
        setTimeout(() => {
          setIsGameOver(true);
          playSound('/sounds/lose.mp3');
        }, 2500);
      }
    }, 2000);
  };

  const nextQuestion = async () => {
    if (currentIdx < questions.length - 1) {
      setCurrentIdx((prev) => prev + 1);
      setSelectedOption(null);
      setIsRevealed(false);
      setTimeLeft(30); 
      if (timerAudioRef.current) timerAudioRef.current.currentTime = 0; 
    } else {
      setIsFinished(true);
      playSound('/sounds/win.mp3');

      // ✅ 100% FOOLPROOF DATABASE SAVE LOGIC
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          const currentLvlNum = parseInt(levelParam);
          
          // 1. Array check (Bypasses maybeSingle bug completely)
          const { data: existing, error: fetchError } = await supabase
            .from('user_progress')
            .select('*')
            .eq('user_id', session.user.id)
            .eq('subject_id', quizId);

          if (fetchError) {
            // FIX: Next.js dev overlay fails to render plain object args properly
            // (shows "{}" even when the object has real values). Stringify first
            // so the actual message/details/hint/code always show up as text.
            console.error(
              "Fetch Error: " +
                JSON.stringify(
                  {
                    message: fetchError.message,
                    details: fetchError.details,
                    hint: fetchError.hint,
                    code: fetchError.code,
                  },
                  null,
                  2
                )
            );
          }

          if (existing && existing.length > 0) {
            // 2. Data already exists, just update it if level is higher
            const dbHighest = existing[0].highest_level || 0;
            if (currentLvlNum > dbHighest) {
              const { error: updateError } = await supabase
                .from('user_progress')
                .update({ highest_level: currentLvlNum })
                .eq('user_id', session.user.id)
                .eq('subject_id', quizId);
                
              if (updateError) {
                // FIX: stringify so the Next.js overlay can't collapse it to "{}"
                console.error(
                  "Update Error: " +
                    JSON.stringify(
                      {
                        message: updateError.message,
                        details: updateError.details,
                        hint: updateError.hint,
                        code: updateError.code,
                      },
                      null,
                      2
                    )
                );
              }
            }
          } else {
            // 3. User is playing for the first time, safely insert!
            const { error: insertError } = await supabase
              .from('user_progress')
              .insert([{
                user_id: session.user.id,
                subject_id: quizId,
                highest_level: currentLvlNum
              }]);
              
            if (insertError) {
              // FIX: console.error(obj) on a PostgrestError prints "{}" in the
              // Next.js dev overlay because the overlay can't render plain object
              // args properly. Stringify to text FIRST so it always renders,
              // and fall back to the raw object + Object.keys in case every
              // field really is empty (e.g. a network-level failure rather
              // than a Postgres/RLS error).
              console.error(
                "Insert Error: " +
                  JSON.stringify(
                    {
                      message: insertError.message,
                      details: insertError.details,
                      hint: insertError.hint,
                      code: insertError.code,
                    },
                    null,
                    2
                  )
              );
              console.error("Insert Error (raw object):", insertError);
              console.error("Insert Error (keys):", Object.keys(insertError));
            }
          }
        }
      } catch (err) {
        console.error("Error saving level progress:", err);
      }
    }
  };

  const restartGame = () => {
    setIsGameOver(false);
    setIsFinished(false);
    setCurrentIdx(0);
    setScore(0);
    setXpEarned(0);
    setXpSaved(false); 
    setSelectedOption(null);
    setIsRevealed(false);
    setTimeLeft(30);
    loadGameData();
  };

  const handleExit = () => {
    if (timerAudioRef.current) timerAudioRef.current.pause();
    if (effectAudioRef.current) effectAudioRef.current.pause();
    router.push(`/category/${quizId}`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#050B14] flex flex-col items-center justify-center text-yellow-500">
        <Loader2 className="w-10 h-10 animate-spin mb-4" />
        <p className="font-bold tracking-widest text-xs uppercase">Loading Random Set...</p>
      </div>
    );
  }

  // --- GAME OVER SCREEN ---
  if (isGameOver) {
    return (
      <div className="min-h-screen bg-[#050B14] flex items-center justify-center p-4 text-white text-center">
        <div className="bg-red-950/40 border border-red-500/50 p-8 rounded-2xl shadow-[0_0_50px_rgba(239,68,68,0.2)] max-w-sm w-full">
          <Skull className="w-20 h-20 text-red-500 mx-auto mb-4 animate-pulse" />
          <h2 className="text-3xl font-extrabold mb-1 text-red-500">Eliminated!</h2>
          <p className="text-gray-400 text-sm mb-6">Incorrect answer. You survived {currentIdx} questions.</p>
          
          <div className="bg-black/50 rounded-xl p-4 mb-6 border border-red-900/50 flex items-center justify-center gap-3">
            <Flame className="w-6 h-6 text-orange-500" />
            <div className="text-left">
              <p className="text-[10px] text-gray-500 uppercase tracking-widest">XP Secured to DB</p>
              <p className="text-xl font-bold text-orange-400">+{xpEarned} XP</p>
            </div>
          </div>

          <div className="space-y-3">
            <button onClick={restartGame} className="w-full py-3.5 bg-red-600 hover:bg-red-500 text-white font-bold text-sm rounded-xl transition-all shadow-[0_0_15px_rgba(239,68,68,0.4)]">
              Restart Battle
            </button>
            <button onClick={handleExit} className="w-full py-3.5 bg-gray-800 hover:bg-gray-700 text-gray-300 font-bold text-sm rounded-xl transition-all">
              Exit to Levels
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --- VICTORY SCREEN ---
  if (isFinished) {
    return (
      <div className="min-h-screen bg-[#050B14] flex items-center justify-center p-4 text-white text-center">
        <div className="bg-[#0a1128] border border-yellow-500/30 p-8 rounded-2xl shadow-[0_0_40px_rgba(202,138,4,0.15)] max-w-sm w-full">
          <Trophy className="w-20 h-20 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-2xl font-extrabold mb-1 text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-yellow-600">
            Flawless Victory!
          </h2>
          <p className="text-gray-400 text-sm mb-6">You answered all {questions.length} questions correctly.</p>
          
          <div className="bg-black/50 rounded-xl p-4 mb-6 border border-yellow-900/50 flex items-center justify-center gap-3">
            <Flame className="w-6 h-6 text-orange-500" />
            <div className="text-left">
              <p className="text-[10px] text-gray-500 uppercase tracking-widest">XP Secured to DB</p>
              <p className="text-xl font-bold text-orange-400">+{xpEarned} XP</p>
            </div>
          </div>

          <div className="space-y-3">
            <button onClick={handleExit} className="w-full py-3.5 bg-yellow-500 hover:bg-yellow-400 text-black font-bold text-sm rounded-xl transition-all shadow-[0_0_15px_rgba(234,179,8,0.3)]">
              Return to Levels
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (questions.length === 0) return <div className="text-white p-10 text-center">No questions found.</div>;
  const currentQ = questions[currentIdx];
  const getOptionStyle = (optKey: string) => {
    const isSelected = selectedOption === optKey;
    const isCorrect = currentQ.correct_option === optKey;
    if (!isRevealed) {
      return isSelected 
        ? "bg-yellow-500/20 border-yellow-500 shadow-[0_0_15px_rgba(234,179,8,0.4)]" 
        : "bg-[#0a0f1a] border-yellow-600/30 hover:bg-yellow-500/10 hover:border-yellow-500/50";
    }
    if (isCorrect) return "bg-green-600/20 border-green-500 shadow-[0_0_20px_rgba(34,197,94,0.4)]";
    if (isSelected && !isCorrect) return "bg-red-600/20 border-red-500 shadow-[0_0_20px_rgba(239,68,68,0.4)]";
    return "bg-[#0a0f1a] border-gray-800 opacity-40";
  };

  return (
    <div className="min-h-screen h-screen overflow-hidden bg-[#050B14] text-white font-sans flex flex-col p-4 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#0a1128] via-[#050B14] to-black">
      
      <header className="flex justify-between items-center mb-6 pt-2">
        <button onClick={handleExit} className="text-gray-400 hover:text-white transition flex items-center gap-1.5 text-xs font-semibold">
          <ArrowRight className="w-4 h-4 rotate-180" /> Surrender
        </button>
        <div className="flex items-center gap-3">
          <button onClick={toggleMute} className="p-2 bg-gray-800/50 border border-gray-700 rounded-full text-gray-300 hover:text-yellow-500 transition">
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
          <div className="px-3 py-1 bg-yellow-500/10 border border-yellow-600/30 rounded-full text-yellow-500 font-bold tracking-wider text-[10px] uppercase">
            Q {currentIdx + 1} / {questions.length}
          </div>
        </div>
      </header>

      <div className="w-full max-w-lg mx-auto flex-grow flex flex-col justify-center">
        <div className="flex justify-center mb-6">
          <div className="relative w-16 h-16 md:w-20 md:h-20 flex items-center justify-center bg-[#0a0f1a] rounded-full border-2 border-[#1a2342] shadow-[0_0_20px_rgba(0,0,0,0.5)]">
            <svg className="absolute top-0 left-0 w-full h-full -rotate-90">
              <circle cx="50%" cy="50%" r="45%" fill="none" stroke={timeLeft <= 10 ? '#ef4444' : '#eab308'} strokeWidth="3" 
                strokeDasharray="283" strokeDashoffset={283 - (283 * timeLeft) / 30} className="transition-all duration-1000 ease-linear" />
            </svg>
            <span className={`text-xl md:text-2xl font-extrabold ${timeLeft <= 10 ? 'text-red-500 animate-pulse' : 'text-yellow-500'}`}>{timeLeft}</span>
          </div>
        </div>

        <div className="relative bg-[#070b1a] border border-yellow-500/40 rounded-xl p-5 md:p-6 mb-6 text-center shadow-[0_0_20px_rgba(202,138,4,0.1)]">
          <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-1/3 h-px bg-gradient-to-r from-transparent via-yellow-400 to-transparent"></div>
          <h1 className="text-base md:text-xl font-medium leading-relaxed tracking-wide text-gray-100">{currentQ.question_text}</h1>
          <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-1/3 h-px bg-gradient-to-r from-transparent via-yellow-400 to-transparent"></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pb-4">
          {[{ key: 'A', text: currentQ.option_a }, { key: 'B', text: currentQ.option_b }, { key: 'C', text: currentQ.option_c }, { key: 'D', text: currentQ.option_d }].map((opt) => (
            <button key={opt.key} onClick={() => handleOptionClick(opt.key)} disabled={selectedOption !== null || isRevealed || isGameOver}
              className={`relative group flex items-center p-3 md:p-4 rounded-lg border-2 transition-all duration-300 text-left overflow-hidden ${getOptionStyle(opt.key)}`}>
              <div className="flex items-center justify-center w-8 h-8 md:w-9 md:h-9 rounded-full border border-yellow-600/50 text-yellow-500 font-bold text-sm mr-3 shrink-0 bg-[#050813]">{opt.key}</div>
              <span className="text-sm md:text-base font-medium text-gray-200">{opt.text}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function BattleArena() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#050B14] flex items-center justify-center text-yellow-500">
          <Loader2 className="w-10 h-10 animate-spin" />
        </div>
      }
    >
      <BattleArenaContent />
    </Suspense>
  );
}
