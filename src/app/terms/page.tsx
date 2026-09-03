"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, FileText, Shield } from 'lucide-react';

export default function TermsPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-[#050B14] text-gray-300 font-sans p-6 md:p-12">
      <div className="max-w-3xl mx-auto">
        <button onClick={() => router.back()} className="flex items-center gap-2 text-gray-500 hover:text-yellow-500 mb-8 transition-colors font-semibold text-sm">
          <ArrowLeft className="w-4 h-4" /> Back to Arena
        </button>

        <div className="flex items-center gap-4 mb-8 pb-6 border-b border-gray-800">
          <div className="p-3 bg-yellow-500/10 rounded-xl border border-yellow-500/20">
            <FileText className="text-yellow-500 w-8 h-8" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-white">Terms of Battle</h1>
            <p className="text-sm text-gray-500 mt-1">Last Updated: September 2026</p>
          </div>
        </div>

        <div className="space-y-8 text-sm leading-relaxed">
          <section>
            <h2 className="text-lg font-bold text-white mb-3 flex items-center gap-2"><Shield className="w-4 h-4 text-yellow-500"/> 1. Acceptance of Terms</h2>
            <p>By accessing and registering on NEUROCLASH ("Platform", "we", "our"), you agree to abide by these Terms of Battle. If you do not agree with any part of these terms, you are prohibited from using the platform.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3 flex items-center gap-2"><Shield className="w-4 h-4 text-yellow-500"/> 2. The Master Pass & Payments</h2>
            <ul className="list-disc pl-5 space-y-2 text-gray-400">
              <li>The NEUROCLASH Master Pass is a digital unlock requiring a one-time payment of ₹9 via Direct UPI.</li>
              <li>Activation requires manual or automated verification of the 12-digit UTR/Reference number provided by your bank.</li>
              <li>Submitting fake or invalid UTR numbers may result in a permanent ban of your account.</li>
              <li>"Lifetime Access" refers to the lifetime of the platform. We reserve the right to modify or discontinue the service with prior notice.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3 flex items-center gap-2"><Shield className="w-4 h-4 text-yellow-500"/> 3. Viral Vanguard Challenge</h2>
            <p>Users participating in the Viral Vanguard Challenge to obtain free access must meet the strictly enforced criteria of 10,000 genuine views. The use of bots, paid views, or fake engagement will lead to disqualification and account termination.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3 flex items-center gap-2"><Shield className="w-4 h-4 text-yellow-500"/> 4. Fair Play & Leaderboard Integrity</h2>
            <p>The Global Leaderboard is strictly monitored. Exploiting bugs, using unauthorized scripts, or manipulating the timer to gain unfair XP or faster completion times will result in immediate removal from the Hall of Fame and account suspension.</p>
          </section>
        </div>
      </div>
    </div>
  );
}
