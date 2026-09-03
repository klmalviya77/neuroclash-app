"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Shield, Trophy, ArrowRight, Brain, Coffee, TrendingDown, TrendingUp } from 'lucide-react';

const funnyQuotes = [
  "₹9 mein aajkal dhang ka momo nahi aata, hum poora tech sikhane baithe hain!",
  "Dosto pe ₹900 uda diye, khud ke career ke liye ₹9 toh nikal lo.",
  "Ek cutting chai kam piyo, aur yahan dimag ki batti jalao.",
  "₹9 mein dost udhaar nahi chukata, hum career bana rahe hain!"
];

const subjects = [
  { name: "Operating Systems", icon: "💻", levels: 10 },
  { name: "DBMS & SQL", icon: "🗄️", levels: 10 },
  { name: "Computer Networks", icon: "🌐", levels: 10 },
  { name: "Data Structures", icon: "🌳", levels: 10 },
  { name: "System Design", icon: "🏗️", levels: 10 },
  { name: "Full Stack Dev", icon: "⚡", levels: 10 },
  { name: "Cyber Security", icon: "🛡️", levels: 10 },
  { name: "Aptitude & Logic", icon: "🧠", levels: 10 },
];

export default function LandingPage() {
  const router = useRouter();
  const [quoteIndex, setQuoteIndex] = useState(0);
  const [fade, setFade] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setFade(false);
      setTimeout(() => {
        setQuoteIndex((prev) => (prev + 1) % funnyQuotes.length);
        setFade(true);
      }, 500);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-[#03060a] text-gray-100 font-sans selection:bg-yellow-500/30 overflow-x-hidden">
      
      <nav className="flex justify-between items-center px-4 md:px-8 py-4 border-b border-gray-800/50 bg-[#050B14]/80 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-2.5">
          <div className="w-12 h-12 rounded-lg overflow-hidden border border-yellow-500/30 shadow-[0_0_15px_rgba(234,179,8,0.2)] bg-yellow-500/10 flex items-center justify-center">
            <img src="/logo.png" alt="NeuroClash Logo" className="w-full h-full object-cover" />
          </div>
          <div>
            <h1 className="text-lg font-extrabold tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-yellow-600">
              NEUROCLASH
            </h1>
            <p className="text-[9px] text-gray-500 uppercase tracking-widest font-semibold">Live Battle Platform</p>
          </div>
        </div>
        {/* Router automatically handles the flow to Auth */}
        <button 
          onClick={() => router.push('/auth')}
          className="text-xs font-bold text-black bg-yellow-500 px-4 py-2 rounded-lg hover:bg-yellow-400 transition-colors"
        >
          Login
        </button>
      </nav>


      <div className="bg-gradient-to-r from-orange-900/40 via-red-900/40 to-orange-900/40 border-b border-orange-500/20 py-2.5 px-4 text-center h-10 flex items-center justify-center overflow-hidden relative">
        <p className={`text-xs md:text-sm font-bold text-orange-400 transition-opacity duration-500 w-full absolute ${fade ? 'opacity-100' : 'opacity-0'}`}>
          💸 {funnyQuotes[quoteIndex]}
        </p>
      </div>

      <main className="max-w-3xl mx-auto px-4 py-12 flex flex-col items-center">
        
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-yellow-600/30 bg-yellow-500/10 text-yellow-500 text-[10px] font-bold tracking-widest uppercase mb-6">
            <Brain className="w-3.5 h-3.5" /> THE LIVE QUIZ GAMING ARENA • 800+ QUESTIONS
          </div>
          <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-6 leading-tight tracking-tight">
            No More Boring Lessons. <br className="hidden md:block"/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500">Enter the Battle.</span>
          </h2>
          <p className="text-gray-400 text-sm md:text-base leading-relaxed mb-10 max-w-xl mx-auto">
            Master 8 core computer science domains across 80 master levels. Experience authentic sudden-death gameplay, earn XP, and climb the global ranks.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full sm:w-auto">
            {/* Directs to Auth first. Once logged in, Dashboard handles VIP Check */}
            <button 
              onClick={() => router.push('/auth')}
              className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-400 hover:to-orange-400 text-black font-extrabold text-sm rounded-xl shadow-[0_0_20px_rgba(245,158,11,0.4)] transition-all flex items-center justify-center gap-2"
            >
              Enter Arena (80 Levels) <ArrowRight className="w-4 h-4" />
            </button>
            <button 
              onClick={() => router.push('/leaderboard')}
              className="w-full sm:w-auto px-8 py-4 bg-[#0a0f1a] border border-gray-700 hover:border-gray-500 text-gray-300 font-bold text-sm rounded-xl transition-all flex items-center justify-center gap-2"
            >
              <Trophy className="w-4 h-4 text-yellow-500" /> Global Hall of Fame
            </button>
          </div>
        </div>

        {/* Desi Reality Check Section */}
        <div className="w-full bg-[#0a0f1a] border border-red-900/50 rounded-3xl p-6 md:p-8 mb-16 relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-1 bg-gradient-to-r from-transparent via-red-500/50 to-transparent"></div>
          
          <div className="flex flex-col items-center mb-8">
            <span className="bg-red-950/50 border border-red-900/50 text-red-400 text-xs font-extrabold px-4 py-1.5 rounded-full uppercase tracking-widest mb-3">
              The Brutal ₹9 Math 😂
            </span>
            <h3 className="text-2xl font-bold text-white text-center">
              Itne Mein Toh Chhoti Advance Bhi Nahi Aati!
            </h3>
            <p className="text-gray-400 text-xs mt-2 text-center">Let's calculate where your ₹9 is actually going vs daily tapri kharche:</p>
          </div>

          <div className="space-y-4">
            <div className="bg-[#110a0a] border border-red-950 rounded-2xl p-5">
              <h4 className="flex items-center gap-2 text-red-400 font-bold text-sm mb-4 border-b border-red-950/50 pb-2">
                <Coffee className="w-4 h-4" /> Typical Tapri Expenses
              </h4>
              <div className="space-y-3 text-sm text-gray-300">
                <div className="flex justify-between items-center">
                  <span>1 Packet Chips 🥔</span>
                  <span className="font-mono">₹10 - ₹15</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>1 Cutting Chai ☕</span>
                  <span className="font-mono">₹15</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>1 Samosa 🥟</span>
                  <span className="font-mono">₹20</span>
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-red-950/50 flex justify-between items-center bg-red-950/20 p-3 rounded-lg">
                <span className="text-xs text-gray-400 font-bold">Total Outcome:</span>
                <span className="text-red-400 font-bold text-xs flex items-center gap-1"><TrendingDown className="w-3 h-3"/> Gas, Acidity & Zero Brain Gains</span>
              </div>
            </div>

            <div className="bg-[#0a1410] border border-green-950 rounded-2xl p-5 relative overflow-hidden">
              <div className="absolute -right-10 -top-10 w-32 h-32 bg-green-500/10 rounded-full blur-3xl"></div>
              <h4 className="flex items-center gap-2 text-green-400 font-bold text-sm mb-4 border-b border-green-950/50 pb-2 relative z-10">
                <Shield className="w-4 h-4" /> NeuroClash Master Pass
              </h4>
              <div className="space-y-3 text-sm text-gray-300 relative z-10">
                <div className="flex justify-between items-center">
                  <span>Lifetime Platform Access 🔐</span>
                  <span className="text-yellow-500 font-extrabold text-lg">₹9 ONLY</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>80 Tech Master Levels ⚔️</span>
                  <span className="text-green-500 font-bold text-xs bg-green-500/10 px-2 py-1 rounded">Included</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Global Leaderboard Entry 🏆</span>
                  <span className="text-green-500 font-bold text-xs bg-green-500/10 px-2 py-1 rounded">Included</span>
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-green-950/50 flex justify-between items-center bg-green-950/30 p-3 rounded-lg relative z-10">
                <span className="text-xs text-gray-400 font-bold">Total Outcome:</span>
                <span className="text-green-400 font-bold text-xs flex items-center gap-1"><TrendingUp className="w-3 h-3"/> 100% CS Mastery & Top 1% Status</span>
              </div>
            </div>
          </div>
        </div>

        <div className="w-full mb-16">
          <div className="mb-8">
            <h3 className="text-2xl md:text-3xl font-extrabold text-white mb-2">The 8-Subject Curriculum</h3>
            <p className="text-gray-400 text-sm">80 rigorous technical levels designed to take you from novice to grandmaster.</p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            {subjects.map((sub, idx) => (
              <div key={idx} className="bg-[#0a0f1a] border border-gray-800 p-4 rounded-xl flex flex-col items-center justify-center text-center hover:border-yellow-500/40 transition-colors cursor-default group">
                <div className="text-2xl mb-2 group-hover:scale-110 transition-transform">{sub.icon}</div>
                <h4 className="font-bold text-gray-200 text-xs md:text-sm mb-1 leading-tight">{sub.name}</h4>
                <p className="text-[10px] text-yellow-600 font-bold uppercase tracking-wider">{sub.levels} Levels</p>
              </div>
            ))}
          </div>
        </div>

      </main>

      <footer className="w-full border-t border-gray-800 bg-[#020408] py-8 px-4 md:px-8">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-gray-400">
            <Shield className="w-5 h-5 text-gray-600" />
            <span className="text-xs font-bold tracking-widest uppercase">© 2026 NeuroClash Arena</span>
          </div>
          <div className="flex items-center gap-4 text-xs font-medium text-gray-500">
            <a href="#" className="hover:text-yellow-500 transition-colors">Terms of Battle</a>
            <a href="#" className="hover:text-yellow-500 transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-yellow-500 transition-colors">Refund Policy</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
