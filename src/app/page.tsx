"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Shield, Lock, Play, Trophy, Loader2, Zap, LayoutGrid, 
  ArrowRight, Sparkles, User, Camera, ExternalLink, BarChart3, 
  MoreVertical, LogOut, Bell, X
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

const getSubjectDescription = (title: string) => {
  const descriptions: Record<string, string> = {
    'Operating Systems': 'Dive into kernel mechanics, memory management, and process synchronization.',
    'Database Management (DBMS)': 'Master SQL queries, normalization, ACID properties, and transaction controls.',
    'Data Structures & Algorithms': 'Conquer arrays, trees, dynamic programming, and algorithmic efficiency.',
    'System Design': 'Architect scalable systems, load balancers, and distributed microservices.',
    'Computer Networks': 'Explore OSI layers, TCP/IP protocols, and network security routing.',
    'Full Stack Development': 'Build responsive frontends and robust backends with modern frameworks.',
    'Aptitude & Reasoning': 'Sharpen logical thinking, quantitative skills, and problem-solving speed.',
    'Cyber Security Basics': 'Learn cryptography, network defense, and ethical hacking fundamentals.'
  };
  return descriptions[title] || 'Complete the challenging levels to master this specific module.';
};

const getSubjectIcon = (title: string) => {
  const icons: Record<string, string> = {
    'Operating Systems': '/icons/driver.png', 
    'Database Management (DBMS)': '/icons/database-management.png',
    'Data Structures & Algorithms': '/icons/complexity.png',
    'System Design': '/icons/settings.png',
    'Computer Networks': '/icons/computer.png',
    'Full Stack Development': 'icons/web-developer.png',
    'Aptitude & Reasoning': '/icons/girl.png',
    'Cyber Security Basics': '/icons/cyber-criminal.png'
  };
  return icons[title] || '/logo.png'; // Agar naam match na ho toh yeh default icon dikhega
};

export default function HomeDashboard() {
  const router = useRouter();
  const [subjects, setSubjects] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isPremium, setIsPremium] = useState<boolean>(false);
  
  const [playerName, setPlayerName] = useState<string>("Player");
  const [playerRank, setPlayerRank] = useState<number | string>("Unranked");
  const [completedStages, setCompletedStages] = useState<number>(0);
  
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [showNotifPrompt, setShowNotifPrompt] = useState(false);

  useEffect(() => {
    const checkAuthAndFetchData = async () => {
      try {
        setIsLoading(true);
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError || !session) {
          router.push('/landing'); 
          return;
        }

        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name, total_xp, is_premium')
          .eq('id', session.user.id)
          .single();
        
        setPlayerName(profile?.full_name || session.user.user_metadata?.full_name || "Player");
        setIsPremium(profile?.is_premium || false); 

        // TOTAL STAGES LOGIC - Fixed to read safely
        const { data: progressData } = await supabase
          .from('user_progress')
          .select('highest_level')
          .eq('user_id', session.user.id);
          
        if (progressData && progressData.length > 0) {
          const totalCompleted = progressData.reduce((acc, curr) => acc + (curr.highest_level || 0), 0);
          setCompletedStages(totalCompleted);
        } else {
          setCompletedStages(0);
        }

        if (profile && profile.total_xp > 0) {
          const { count } = await supabase
            .from('profiles')
            .select('*', { count: 'exact', head: true })
            .gt('total_xp', profile.total_xp);
          setPlayerRank(count !== null ? count + 1 : "Unranked");
        } else {
          setPlayerRank("Unranked");
        }

        const { data, error } = await supabase.from('quizzes').select('*');
        if (data) setSubjects(data);
        
      } catch (err) {
        console.error("Initialization failed:", err);
      } finally {
        setIsLoading(false);
      }
    };
    checkAuthAndFetchData();
  }, [router]);

  const handleSubjectClick = (subjectId: string) => {
    if (isPremium) router.push(`/category/${subjectId}`);
    else router.push('/payment');
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem('is_premium_user'); 
    router.push('/auth');
  };
  

    // Custom Notification Popup Logic
  useEffect(() => {
    const checkNotification = async () => {
      // Agar user ne "Later" click kiya tha, toh wapas pareshan mat karo
      if (localStorage.getItem('hide_notif_prompt')) return;

      setTimeout(() => {
        if (typeof window !== 'undefined' && (window as any).OneSignalDeferred) {
          (window as any).OneSignalDeferred.push(async function(OneSignal: any) {
             const permission = await OneSignal.Notifications.permission;
             // Agar permission abhi maangi hi nahi gayi hai (default), tabhi apna custom popup dikhao
             if (permission === "default" || permission !== "granted") {
                setShowNotifPrompt(true);
             }
          });
        }
      }, 4000); // 4 second ka wait
    };
    
    checkNotification();
  }, []);

    const handleAllowNotifications = async () => {
    setShowNotifPrompt(false);
    
    try {
      // Check if OneSignal is directly available
      if (typeof window !== 'undefined' && (window as any).OneSignal) {
        await (window as any).OneSignal.Notifications.requestPermission();
      } 
      // Fallback to Deferred array
      else if (typeof window !== 'undefined' && (window as any).OneSignalDeferred) {
        (window as any).OneSignalDeferred.push(async function(OneSignal: any) {
           await OneSignal.Notifications.requestPermission();
        });
      } else {
        console.error("OneSignal SDK abhi tak load nahi hua hai ya block ho gaya hai.");
        alert("Notification system loading. Please wait a second and try again.");
      }
    } catch (error) {
      console.error("Permission request me error aaya:", error);
    }
  };

  const handleDismissNotif = () => {
    setShowNotifPrompt(false);
    localStorage.setItem('hide_notif_prompt', 'true'); // Save kar lo taaki baar-baar na aaye
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#050B14] flex flex-col items-center justify-center text-yellow-500">
        <Loader2 className="w-10 h-10 animate-spin mb-4" />
        <p className="font-semibold tracking-widest text-xs uppercase">Loading Curriculum...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050B14] text-gray-100 font-sans flex flex-col selection:bg-yellow-500/30 relative">
      
      <button 
        onClick={() => router.push('/leaderboard')}
        className="fixed bottom-6 right-6 z-50 bg-yellow-500 hover:bg-yellow-400 text-black p-4 rounded-full shadow-[0_0_20px_rgba(234,179,8,0.5)] transition-transform hover:scale-110 flex items-center justify-center group"
      >
        <BarChart3 className="w-6 h-6" />
        <span className="absolute right-full mr-4 bg-black text-yellow-500 border border-yellow-500/30 px-3 py-1.5 rounded-lg text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
          Live Rankings
        </span>
      </button>

      <div className="flex-grow p-4 md:p-8 max-w-4xl mx-auto w-full">
        
        <header className="flex justify-between items-center mb-4 pb-4 border-b border-gray-800">
          <div className="flex items-center gap-2.5">
            <div className="w-12 h-12 rounded-lg overflow-hidden border border-yellow-500/30 shadow-[0_0_15px_rgba(234,179,8,0.2)] bg-yellow-500/10 flex items-center justify-center">
              <img src="/logo.png" alt="NeuroClash Logo" className="w-full h-full object-cover" />
            </div>
            <div>
              <h1 className="text-lg font-extrabold tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-yellow-600">
                NEUROCLASH
              </h1>
              <p className="text-[9px] text-gray-500 uppercase tracking-widest font-semibold">Master Curriculum</p>
            </div>
          </div>
          <div className="text-xs bg-gray-900/80 px-3 py-1.5 rounded-md border border-gray-800 shadow-inner flex items-center gap-2">
            Global Rank: <span className="text-yellow-500 font-bold">#{playerRank}</span>
          </div>
        </header>

        {!isPremium && (
          <div className="bg-gradient-to-r from-purple-900/40 to-pink-900/40 border border-purple-500/30 rounded-lg p-2.5 mb-6 flex items-center justify-between shadow-inner">
            <div className="flex items-center gap-3">
              <div className="p-1.5 bg-purple-500/20 rounded-md"><Camera className="w-4 h-4 text-purple-400" /></div>
              <p className="text-xs text-gray-300 font-medium hidden sm:block">
                <span className="text-white font-bold">Want it Free?</span> Join the <span className="text-purple-400 font-bold">Viral Vanguard Challenge</span>.
              </p>
              <p className="text-xs text-gray-300 font-medium sm:hidden">
                <span className="text-purple-400 font-bold">Viral Vanguard Challenge</span>
              </p>
            </div>
            <a href="#viral-challenge" className="text-xs font-bold text-purple-400 hover:text-purple-300 flex items-center gap-1">View <ArrowRight className="w-3 h-3"/></a>
          </div>
        )}

                <div className="mb-10">
  <div className="flex items-center justify-center gap-2 mb-4">
    <span className="w-1.5 h-1.5 rounded-full bg-yellow-500 shadow-[0_0_8px_rgba(234,179,8,0.8)]"></span>
    <div className="inline-block px-2.5 py-1 rounded-md border border-gray-800 bg-gray-900/60 text-gray-300 text-[10px] font-bold tracking-widest uppercase">
      80-Level Tech Arena
    </div>
  </div>

          
          <h2 className="text-3xl md:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-500 mb-4 tracking-tight">
            Challenge Curriculum
          </h2>
          
          <div className="pl-4 border-l-2 border-yellow-500/40 mb-6">
            <p className="text-gray-400 text-sm md:text-base leading-relaxed max-w-2xl">
              Level 1 of every module is open to all! Dominate all <span className="text-yellow-600 font-bold text-lg">
80 stages</span> to claim the Ultimate Developer Crown and secure your spot on the Global Leaderboard.
            </p>
          </div>

          {/* Player Profile Card (Should be inside the same mb-10 div) */}
          <div className="relative bg-[#0a0f1a] border border-gray-800 rounded-2xl p-5 md:p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-5 shadow-lg">
            
            <div className="absolute top-4 right-4 z-20">
              <button 
                onClick={() => setIsDropdownOpen(!isDropdownOpen)} 
                className="text-gray-500 hover:text-white p-1 rounded-md transition-colors"
              >
                <MoreVertical className="w-5 h-5" />
              </button>
              
              {isDropdownOpen && (
                <div className="absolute right-0 mt-2 w-40 bg-[#0f1629] border border-gray-700 rounded-lg shadow-2xl overflow-hidden">
                  <button 
                    onClick={handleLogout} 
                    className="w-full text-left px-4 py-3 text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300 flex items-center gap-2 transition-colors font-semibold"
                  >
                    <LogOut className="w-4 h-4" /> Log Out
                  </button>
                </div>
              )}
            </div>

            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-[#2a1a08] border border-yellow-700/50 flex items-center justify-center text-yellow-500 shrink-0">
                <User className="w-7 h-7" />
              </div>
              <div className="pr-6">
                <p className="text-[13px] text-gray-500 font-medium mb-1">Player Profile</p>
                <p className="text-xl font-bold text-white leading-none">{playerName}</p>
              </div>
            </div>
            
            <div className="hidden md:block w-px h-12 bg-gray-800"></div>
            
            <div className="w-full md:w-auto border-t md:border-t-0 border-gray-800 pt-4 md:pt-0 flex flex-col gap-2">
              <p className="text-sm font-medium text-gray-400">
                Unlocked: <span className="text-yellow-500 font-bold ml-1">{isPremium ? '8 / 8 Subjects' : '0 / 8 Subjects'}</span>
              </p>
              <p className="text-sm font-medium text-gray-400">
                Completed: <span className="text-green-500 font-bold ml-1">{completedStages} / 80 Stages</span>
              </p>
            </div>
          </div>
        </div>


        {!isPremium && (
          <div className="bg-gradient-to-r from-yellow-600 to-amber-500 rounded-xl p-1 mb-10 shadow-[0_0_20px_rgba(234,179,8,0.2)]">
            <div className="bg-[#050B14] rounded-lg p-5 flex flex-col md:flex-row items-center justify-between gap-4">
              <div>
                <h3 className="text-yellow-500 font-bold text-lg mb-1">Begin Your Journey</h3>
                <p className="text-gray-400 text-xs">Unlock 80+ Master Levels across all subjects. Play anytime, anywhere.</p>
              </div>
              <button 
                onClick={() => router.push('/payment')}
                className="w-full md:w-auto px-8 py-3 bg-yellow-500 hover:bg-yellow-400 text-black font-extrabold text-sm rounded-lg shadow-[0_0_15px_rgba(234,179,8,0.4)] transition-all flex items-center justify-center gap-2"
              >
                START NOW <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        <div className="mb-14">
          <div className="flex items-center gap-2 mb-5 border-b border-gray-800 pb-2">
            <LayoutGrid className="text-yellow-600 w-5 h-5" />
            <h3 className="text-lg font-bold text-gray-200">Select Subject Category</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {subjects.map((subject) => (
              <div 
                key={subject.id} 
                onClick={() => handleSubjectClick(subject.id)}
                className={`group cursor-pointer flex flex-col p-5 rounded-xl border transition-all duration-300 ${
                  !isPremium 
                    ? 'bg-[#0a0f1a] border-gray-800 hover:border-gray-700' 
                    : 'bg-[#0d1627] border-gray-700 hover:border-yellow-500/40 hover:shadow-[0_0_15px_rgba(234,179,8,0.1)]'
                }`}
              >
                <div className="flex justify-between items-start mb-3">
                  <div className={`p-2.5 rounded-lg ${!isPremium ? 'bg-gray-800/50 text-gray-500' : 'bg-yellow-500/10 text-yellow-500'}`}>
                    {/* YAHAN ICONS KA LOGIC UPDATE HUA HAI ⬇️ */}
                    {!isPremium ? (
                      <Lock className="w-5 h-5" />
                    ) : (
                      <img src={getSubjectIcon(subject.title)} alt={subject.title} className="w-6 h-6 object-contain" />
                    )}
                  </div>
                  {!isPremium && (
                    <span className="text-[10px] uppercase font-bold tracking-wider bg-red-500/10 text-red-500 px-2 py-1 rounded border border-red-500/20">
                      Locked
                    </span>
                  )}
                </div>
                
                <h4 className={`font-bold text-lg mb-1.5 ${!isPremium ? 'text-gray-400' : 'text-gray-100'}`}>
                  {subject.title}
                </h4>
                
                <p className="text-[11px] text-gray-500 font-medium line-clamp-2 mb-4 h-8">
                  {getSubjectDescription(subject.title)}
                </p>

                <div className="mt-auto pt-3 border-t border-gray-800/50 flex justify-between items-center">
                  <span className="text-[11px] text-gray-500 font-semibold">10 Levels Inside</span>
                  {!isPremium ? (
                    <span className="text-xs font-bold text-yellow-600 flex items-center gap-1">
                      Unlock <ArrowRight className="w-3 h-3" />
                    </span>
                  ) : (
                    <span className="text-xs font-bold text-green-500 flex items-center gap-1">
                      Play Now <Play className="w-3 h-3" />
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {!isPremium && (
          <div id="viral-challenge" className="mb-10 bg-gradient-to-br from-[#120a1c] to-[#0a0f1a] border border-purple-500/30 rounded-2xl p-6 md:p-8 relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 right-0 w-64 h-64 bg-purple-600/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>
            
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-purple-500/20 rounded-lg"><Camera className="w-6 h-6 text-purple-400" /></div>
              <h3 className="text-2xl font-extrabold text-white">Viral Vanguard Challenge</h3>
            </div>
            
            <p className="text-gray-400 text-sm leading-relaxed mb-6 max-w-2xl relative z-10">
              Don't want to pay ₹9? No problem. Create a reel showcasing NEUROCLASH on Instagram or YouTube Shorts. Hit <span className="text-purple-400 font-bold">10,000 genuine views</span>, submit your link, and we'll grant you a lifetime Master Curriculum pass absolutely free.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 relative z-10">
              <div className="bg-black/40 border border-purple-900/50 rounded-xl p-4">
                <div className="text-purple-500 font-extrabold text-xl mb-1">01</div>
                <p className="text-xs text-gray-300 font-medium">Record yourself playing or explaining NEUROCLASH.</p>
              </div>
              <div className="bg-black/40 border border-purple-900/50 rounded-xl p-4">
                <div className="text-purple-500 font-extrabold text-xl mb-1">02</div>
                <p className="text-xs text-gray-300 font-medium">Post it and cross the 10,000 views milestone.</p>
              </div>
              <div className="bg-black/40 border border-purple-900/50 rounded-xl p-4">
                <div className="text-purple-500 font-extrabold text-xl mb-1">03</div>
                <p className="text-xs text-gray-300 font-medium">Submit the link below to unlock your account instantly.</p>
              </div>
            </div>

            <button 
              onClick={() => router.push('/submit-bounty')}
              className="relative z-10 px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white font-bold text-sm rounded-lg transition-all flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(147,51,234,0.3)]"
            >
              Submit Reel Link <ExternalLink className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      <footer className="w-full border-t border-gray-800 bg-[#03060a] py-5 px-4 md:px-8 mt-auto relative z-10">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 text-gray-500">
            <Shield className="w-3.5 h-3.5" />
            <span className="text-[11px] font-semibold">© 2026 NEUROCLASH Technologies</span>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3 text-[11px] font-medium text-gray-400">
            <a href="/terms" className="hover:text-yellow-500 transition-colors">Terms of Battle</a>
            <a href="/privacy" className="hover:text-yellow-500 transition-colors">Privacy Policy</a>
            <a href="/refund" className="hover:text-yellow-500 transition-colors">Refund Policy</a>
            <span className="w-1 h-1 rounded-full bg-gray-700 hidden md:block"></span>
          </div>
        </div>
      </footer>
            {/* CUSTOM NOTIFICATION UI MODAL */}
      {showNotifPrompt && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-[#0a0f1a] border border-yellow-500/30 rounded-2xl p-6 max-w-sm w-full relative shadow-[0_0_30px_rgba(234,179,8,0.15)] animate-in fade-in zoom-in duration-300">
            
            {/* Close Button */}
            <button 
              onClick={handleDismissNotif}
              className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Icon */}
            <div className="w-14 h-14 bg-yellow-500/10 border border-yellow-500/30 rounded-xl flex items-center justify-center mb-5 shadow-inner">
              <Bell className="w-7 h-7 text-yellow-500 animate-pulse" />
            </div>

            {/* Text */}
            <h3 className="text-xl font-extrabold text-white mb-2 tracking-wide">
              Never Miss a Battle!
            </h3>
            <p className="text-sm text-gray-400 mb-6 leading-relaxed">
              Enable notifications to get instant alerts when new <span className="text-yellow-500 font-bold">Tournaments</span> go live or when your match is about to start.
            </p>

            {/* Actions */}
            <div className="flex flex-col gap-3">
              <button 
                onClick={handleAllowNotifications}
                className="w-full py-3 bg-yellow-500 hover:bg-yellow-400 text-black font-extrabold text-sm rounded-lg transition-all shadow-[0_0_15px_rgba(234,179,8,0.3)] flex items-center justify-center gap-2"
              >
                <Bell className="w-4 h-4" /> ALLOW NOTIFICATIONS
              </button>
              <button 
                onClick={handleDismissNotif}
                className="w-full py-3 bg-transparent text-gray-500 hover:text-gray-300 font-bold text-sm rounded-lg transition-colors"
              >
                Maybe Later
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
