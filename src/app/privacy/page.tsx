"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Lock, Shield } from 'lucide-react';

export default function PrivacyPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-[#050B14] text-gray-300 font-sans p-6 md:p-12">
      <div className="max-w-3xl mx-auto">
        <button onClick={() => router.back()} className="flex items-center gap-2 text-gray-500 hover:text-yellow-500 mb-8 transition-colors font-semibold text-sm">
          <ArrowLeft className="w-4 h-4" /> Back to Arena
        </button>

        <div className="flex items-center gap-4 mb-8 pb-6 border-b border-gray-800">
          <div className="p-3 bg-yellow-500/10 rounded-xl border border-yellow-500/20">
            <Lock className="text-yellow-500 w-8 h-8" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-white">Privacy Policy</h1>
            <p className="text-sm text-gray-500 mt-1">Last Updated: September 2026</p>
          </div>
        </div>

        <div className="space-y-8 text-sm leading-relaxed">
          <section>
            <h2 className="text-lg font-bold text-white mb-3 flex items-center gap-2"><Shield className="w-4 h-4 text-yellow-500"/> 1. Information We Collect</h2>
            <ul className="list-disc pl-5 space-y-2 text-gray-400">
              <li><strong>Account Data:</strong> We collect your Player Name and Email Address during registration to secure your account and display your rank on the Global Leaderboard.</li>
              <li><strong>Payment Verification Data:</strong> For the ₹9 Master Pass, we only collect the 12-digit UTR number provided by you to verify the transaction. <span className="text-yellow-500 font-semibold">We do not collect, process, or store your credit card numbers, bank account details, or UPI PINs.</span></li>
              <li><strong>Gameplay Data:</strong> We track your quiz progress, XP earned, and completion times to facilitate the platform's core mechanics.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3 flex items-center gap-2"><Shield className="w-4 h-4 text-yellow-500"/> 2. How We Use Your Data</h2>
            <p>Your gameplay statistics and Player Name are publicly visible on the Global Leaderboard. Your email address is strictly used for authentication and critical account communications. UTR numbers are used temporarily to validate payments against our bank statements.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3 flex items-center gap-2"><Shield className="w-4 h-4 text-yellow-500"/> 3. Data Security</h2>
            <p>We utilize industry-standard security encrypted passwords to protect your data from unauthorized access or disclosure.</p>
          </section>
        </div>
      </div>
    </div>
  );
}
