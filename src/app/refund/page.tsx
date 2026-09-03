"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, RefreshCcw, Shield } from 'lucide-react';

export default function RefundPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-[#050B14] text-gray-300 font-sans p-6 md:p-12">
      <div className="max-w-3xl mx-auto">
        <button onClick={() => router.back()} className="flex items-center gap-2 text-gray-500 hover:text-yellow-500 mb-8 transition-colors font-semibold text-sm">
          <ArrowLeft className="w-4 h-4" /> Back to Arena
        </button>

        <div className="flex items-center gap-4 mb-8 pb-6 border-b border-gray-800">
          <div className="p-3 bg-yellow-500/10 rounded-xl border border-yellow-500/20">
            <RefreshCcw className="text-yellow-500 w-8 h-8" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-white">Refund Policy</h1>
            <p className="text-sm text-gray-500 mt-1">Last Updated: September 2026</p>
          </div>
        </div>

        <div className="space-y-8 text-sm leading-relaxed">
          <section>
            <h2 className="text-lg font-bold text-white mb-3 flex items-center gap-2"><Shield className="w-4 h-4 text-yellow-500"/> 1. Digital Goods & No Refund Policy</h2>
            <p>The NEUROCLASH Master Pass (priced at ₹9) grants immediate, irrevocable access to premium digital content (80 Master Levels). Because digital goods cannot be "returned" once accessed, <span className="text-red-400 font-bold">all payments made are strictly non-refundable.</span></p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3 flex items-center gap-2"><Shield className="w-4 h-4 text-yellow-500"/> 2. Failed Transactions</h2>
            <p>If your money was deducted from your bank account via UPI but your account was not unlocked, it is typically due to bank server delays. In such cases:</p>
            <ul className="list-disc pl-5 mt-2 space-y-2 text-gray-400">
              <li>Please wait 12-24 hours for the payment to settle.</li>
              <li>Submit your correct 12-digit UTR in the payment portal. Our team will manually verify and unlock your account.</li>
              <li>If the payment failed entirely, your bank will automatically reverse the ₹9 to your original payment method within 3 to 5 business days.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3 flex items-center gap-2"><Shield className="w-4 h-4 text-yellow-500"/> 3. Account Bans</h2>
            <p>If your account is suspended or banned due to a violation of our Terms of Battle (e.g., exploiting bugs, cheating on the leaderboard, or submitting fake UTRs), you will lose access to the platform and no refund will be provided.</p>
          </section>
        </div>
      </div>
    </div>
  );
}
