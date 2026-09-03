"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Shield, Lock, Play, ArrowLeft, CheckCircle, Trophy } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface Level {
  levelNum: number;
  title: string;
  description: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  questionsCount: number;
  timeLimit: string;
}

export default function CategoryLevelsPage() {
  const params = useParams();
  const router = useRouter();
  const categoryId = params.id as string;

  const [subjectTitle, setSubjectTitle] = useState("Subject Arena");
  const [highestLevelCompleted, setHighestLevelCompleted] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);

  const levels: Level[] = [
    { levelNum: 1, title: "Foundations & Basics", description: "Core introduction and fundamental concepts.", difficulty: "Easy", questionsCount: 10, timeLimit: "30s / Q" },
    { levelNum: 2, title: "Core Principles", description: "Deep dive into standard operating procedures.", difficulty: "Easy", questionsCount: 10, timeLimit: "30s / Q" },
    { levelNum: 3, title: "Intermediate Logic", description: "Analyze conditional scenarios and basic execution.", difficulty: "Medium", questionsCount: 10, timeLimit: "30s / Q" },
    { levelNum: 4, title: "Pattern Recognition", description: "Identify structures and architectural frameworks.", difficulty: "Medium", questionsCount: 10, timeLimit: "30s / Q" },
    { levelNum: 5, title: "Mid-Term Challenge", description: "Comprehensive test covering first half modules.", difficulty: "Medium", questionsCount: 10, timeLimit: "30s / Q" },
    { levelNum: 6, title: "Advanced Modules", description: "Tackle complex structural patterns and rules.", difficulty: "Hard", questionsCount: 10, timeLimit: "30s / Q" },
    { levelNum: 7, title: "Stress & Edge Cases", description: "Performance handling under constrained states.", difficulty: "Hard", questionsCount: 10, timeLimit: "30s / Q" },
    { levelNum: 8, title: "Mastery Optimization", description: "Refining efficiency and eliminating bottlenecks.", difficulty: "Hard", questionsCount: 10, timeLimit: "30s / Q" },
    { levelNum: 9, title: "Grandmaster Trial", description: "High-difficulty multi-layered technical obstacles.", difficulty: "Hard", questionsCount: 10, timeLimit: "30s / Q" },
    { levelNum: 10, title: "The Ultimate Boss Level", description: "The final survival gauntlet for absolute supremacy.", difficulty: "Hard", questionsCount: 10, timeLimit: "30s / Q" },
  ];

  useEffect(() => {
    const fetchSubjectAndProgress = async () => {
      try {
        setIsLoading(true);
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          router.push('/auth');
          return;
        }

        const { data: subjectData } = await supabase.from('quizzes').select('title').eq('id', categoryId).single();
        if (subjectData) setSubjectTitle(subjectData.title);

        // Fetch User's Specific Progress from DB
        const { data: progressData } = await supabase
          .from('user_progress')
          .select('highest_level')
          .eq('user_id', session.user.id)
          .eq('subject_id', categoryId)
          .single();

        setHighestLevelCompleted(progressData?.highest_level || 0);
      } catch (err) {
        console.error("Error loading progress:", err);
      } finally {
        setIsLoading(false);
      }
    };

    if (categoryId) fetchSubjectAndProgress();
  }, [categoryId, router]);

  const handleStartLevel = (levelNum: number) => {
    const isUnlocked = levelNum <= highestLevelCompleted + 1;
    if (!isUnlocked) return;
    router.push(`/quiz/${categoryId}?level=${levelNum}`);
  };

  if (isLoading) return <div className="min-h-screen bg-[#050B14] text-yellow-500 font-bold flex items-center justify-center">Loading Data...</div>;

  return (
    <div className="min-h-screen bg-[#050B14] text-gray-100 font-sans flex flex-col p-4 md:p-8">
      <div className="max-w-4xl mx-auto w-full flex-grow">
        <div className="flex items-center justify-between mb-8 pb-4 border-b border-gray-800">
          <button onClick={() => router.push('/')} className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-sm font-semibold">
            <ArrowLeft className="w-4 h-4" /> Dashboard
          </button>
          <div className="flex items-center gap-2 text-yellow-500 font-extrabold tracking-widest text-xs uppercase bg-yellow-500/10 px-3 py-1.5 rounded-lg border border-yellow-500/20">
            <Trophy className="w-4 h-4" /> {subjectTitle}
          </div>
        </div>

        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-extrabold text-white mb-2">Campaign Levels (1 - 10)</h1>
          <p className="text-gray-400 text-xs md:text-sm">Progress sequentially. Clear each stage to unlock the next difficulty tier.</p>
        </div>

        <div className="grid gap-4 mb-10">
          {levels.map((lvl) => {
            // DB LOGIC: User ne agar level 2 complete kiya hai, toh level 3 tak unlock hoga
            const isUnlocked = lvl.levelNum <= highestLevelCompleted + 1;
            const isCompleted = lvl.levelNum <= highestLevelCompleted;

            const badgeColor = lvl.difficulty === 'Easy' ? 'bg-green-500/10 text-green-400' :
              lvl.difficulty === 'Medium' ? 'bg-yellow-500/10 text-yellow-400' : 'bg-red-500/10 text-red-400';

            return (
              <div key={lvl.levelNum} onClick={() => handleStartLevel(lvl.levelNum)}
                className={`group flex flex-col md:flex-row md:items-center justify-between p-5 rounded-xl border transition-all duration-300 ${
                  !isUnlocked ? 'bg-[#060913] border-gray-900 opacity-60 cursor-not-allowed' 
                    : isCompleted ? 'bg-[#0a1410] border-green-600/30 hover:border-green-500/50 cursor-pointer shadow-[0_0_15px_rgba(22,163,74,0.1)]'
                    : 'bg-[#0a0f1a] border-gray-800 hover:border-yellow-500/40 cursor-pointer shadow-[0_0_15px_rgba(234,179,8,0.1)]'
                }`}
              >
                <div className="flex items-start gap-4 mb-4 md:mb-0">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-extrabold text-lg shrink-0 border ${
                    isCompleted ? 'bg-green-600/20 text-green-400' : isUnlocked ? 'bg-yellow-500/10 text-yellow-500' : 'bg-gray-800 text-gray-600'
                  }`}>
                    {isCompleted ? <CheckCircle className="w-6 h-6" /> : isUnlocked ? lvl.levelNum : <Lock className="w-5 h-5" />}
                  </div>
                  <div>
                    <h3 className={`font-bold text-base ${isUnlocked ? 'text-gray-100' : 'text-gray-500'}`}>Level {lvl.levelNum}: {lvl.title}</h3>
                    <p className="text-xs text-gray-400 font-medium mb-2">{lvl.description}</p>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded border border-current ${badgeColor}`}>{lvl.difficulty}</span>
                  </div>
                </div>

                <div className="md:shrink-0">
                  {isCompleted ? (
                    <button className="w-full md:w-auto px-5 py-2 rounded-lg font-bold text-xs flex items-center justify-center gap-2 bg-green-600/20 text-green-400">Completed</button>
                  ) : isUnlocked ? (
                    <button className="w-full md:w-auto px-6 py-2.5 rounded-lg font-bold text-xs flex items-center justify-center gap-2 bg-yellow-500 text-black">Play Level</button>
                  ) : (
                    <button disabled className="w-full md:w-auto px-5 py-2 rounded-lg font-bold text-xs flex items-center justify-center gap-2 bg-gray-800/50 text-gray-500">Locked</button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
