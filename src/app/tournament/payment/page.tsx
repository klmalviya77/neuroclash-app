"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Shield, Loader2, AlertCircle, CheckCircle2, QrCode, Copy, Smartphone, ArrowLeft, Tag, CreditCard } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function TournamentPaymentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tournamentId = searchParams.get('id');
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  const [utrNumber, setUtrNumber] = useState('');
  const [userId, setUserId] = useState<string | null>(null);

  // Coupon States
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const [discount, setDiscount] = useState(0);
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState<string | null>(null);

  const baseAmount = 9;
  const finalAmount = Math.max(0, baseAmount - discount);
  const upiId = "coderzstudio@airtel";

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/auth');
      } else {
        setUserId(session.user.id);
      }
    };
    checkAuth();
  }, [router]);

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setCouponLoading(true);
    setCouponError(null);
    try {
      const { data, error: dbError } = await supabase
        .from('coupons')
        .select('*')
        .eq('code', couponCode.toUpperCase())
        .single();

      if (dbError || !data) throw new Error("Invalid coupon code.");
      if (!data.is_active) throw new Error("This coupon is no longer active.");
      if (data.used_count >= data.max_uses) throw new Error("Coupon usage limit reached.");

      setAppliedCoupon(data);
      setDiscount(data.discount_amount);
      setSuccessMessage(`Coupon Applied! You saved ₹${data.discount_amount}`);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      setCouponError(err.message);
      setDiscount(0);
      setAppliedCoupon(null);
    } finally {
      setCouponLoading(false);
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setDiscount(0);
    setCouponCode('');
    setCouponError(null);
  };

  const processRegistration = async () => {
    if (!userId || !tournamentId) return;
    setIsProcessing(true);
    setError(null);

    try {
      // 1. Insert Seat
      const { error: insertError } = await supabase
        .from('tournament_players')
        .insert([{ tournament_id: tournamentId, user_id: userId }]);

      if (insertError) {
        if (insertError.code === '23505') throw new Error("You have already secured a seat!");
        throw insertError;
      }

      // 2. Update Coupon Usage (If a coupon was applied)
      if (appliedCoupon) {
        await supabase
          .from('coupons')
          .update({ used_count: appliedCoupon.used_count + 1 })
          .eq('id', appliedCoupon.id);
      }

      setSuccessMessage("Seat Confirmed! Redirecting to Lobby...");
      
      // Push Notification Permission
            if (typeof window !== 'undefined' && (window as any).OneSignalDeferred) {
        (window as any).OneSignalDeferred.push(async function(OneSignal: any) {
           await OneSignal.Slidedown.promptPush();
        });
      }


      setTimeout(() => {
        router.push('/tournament/lobby');
      }, 2000);
      
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to secure seat. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUtrSubmit = async () => {
    if (utrNumber.length !== 12 || isNaN(Number(utrNumber))) {
      setError("Please enter a valid 12-digit UTR / Reference Number.");
      setTimeout(() => setError(null), 3000);
      return;
    }
    await processRegistration();
  };

  // NEW: Razorpay payment option, added alongside the existing Direct UPI / UTR
  // flow above — that flow is untouched. Amount is recalculated SERVER-SIDE in
  // /api/create-tournament-order (re-validating the coupon there too), so a
  // tampered client-side finalAmount can't be used to pay less than owed.
  const handleRazorpayPayment = async () => {
    if (!userId || !tournamentId) return;
    setIsProcessing(true);
    setError(null);

    try {
      const response = await fetch('/api/create-tournament-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tournamentId,
          couponCode: appliedCoupon ? appliedCoupon.code : null,
        }),
      });
      const data = await response.json();

      if (!data.success) {
        console.error('create-tournament-order failed:', data);
        throw new Error(data.error || 'Could not initialize secure payment.');
      }

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: data.amount,
        currency: data.currency,
        name: "NEUROCLASH",
        description: "Tournament Entry Ticket",
        order_id: data.orderId,
        theme: { color: "#3b82f6" },
        handler: function (response: any) {
          // Payment succeeded — secure the seat the same way the UTR flow does.
          // (Same trust level as the existing UTR path; for stronger guarantees
          // later, this can be moved to confirm via a webhook instead.)
          processRegistration();
        },
        modal: {
          ondismiss: function () { setIsProcessing(false); }
        }
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.on('payment.failed', function (response: any) {
        setError("Payment Failed: " + response.error.description);
        setIsProcessing(false);
      });
      rzp.open();

    } catch (err) {
      console.error('Razorpay tournament payment error:', err);
      setError(
        err instanceof Error ? err.message : "Payment gateway is temporarily unavailable."
      );
      setIsProcessing(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(upiId);
    setSuccessMessage("UPI ID Copied!");
    setTimeout(() => setSuccessMessage(null), 2000);
  };

  return (
    <div className="min-h-screen bg-[#050B14] text-gray-100 font-sans p-4 flex flex-col items-center justify-center py-10">
      <div className="max-w-md w-full">
        <button onClick={() => router.back()} className="flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors font-semibold text-sm">
          <ArrowLeft className="w-4 h-4" /> Cancel Registration
        </button>

        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/50 rounded-lg flex items-center gap-3 text-red-400 text-sm font-medium">
            <AlertCircle className="w-5 h-5 flex-shrink-0" /> {error}
          </div>
        )}
        {successMessage && (
          <div className="mb-4 p-3 bg-green-500/10 border border-green-500/50 rounded-lg flex items-center gap-3 text-green-400 text-sm font-medium">
            <CheckCircle2 className="w-5 h-5 flex-shrink-0" /> {successMessage}
          </div>
        )}

        <div className="bg-[#0a0f1a] border border-gray-800 rounded-2xl overflow-hidden shadow-2xl">
          <div className="p-6 bg-gradient-to-b from-[#111827] to-[#0a0f1a] border-b border-gray-800 text-center relative">
            <Shield className="w-12 h-12 text-blue-500 mx-auto mb-3" />
            <h2 className="text-xl font-bold text-white mb-1">Tournament Entry Ticket</h2>
            <p className="text-gray-400 text-sm mb-4">Secure 1 of the 64 seats for the upcoming event.</p>
            
            <div className="flex items-center justify-center gap-3">
              {discount > 0 && (
                <span className="text-gray-500 line-through text-lg">₹{baseAmount}</span>
              )}
              <div className="inline-block bg-blue-500/10 border border-blue-500/30 text-blue-400 px-4 py-2 rounded-lg font-bold text-2xl">
                ₹{finalAmount}
              </div>
            </div>
          </div>

          <div className="p-5 space-y-5">
            
            {/* Coupon Section */}
            <div className="bg-[#0f1629] border border-gray-700 rounded-xl p-4">
              <span className="font-bold text-gray-200 text-sm flex items-center gap-2 mb-2">
                <Tag className="w-4 h-4 text-blue-400" /> Have a Promo Code?
              </span>
              <div className="flex gap-2">
                <input 
                  type="text" value={couponCode} onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                  disabled={appliedCoupon !== null || isProcessing}
                  placeholder="ENTER CODE" 
                  className="flex-1 bg-[#0a0f1a] border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500 uppercase disabled:opacity-50"
                />
                {!appliedCoupon ? (
                  <button 
                    onClick={handleApplyCoupon} disabled={couponLoading || !couponCode}
                    className="px-4 bg-gray-700 hover:bg-gray-600 text-white font-bold text-sm rounded-lg transition-all disabled:opacity-50 min-w-[80px] flex justify-center items-center"
                  >
                    {couponLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Apply"}
                  </button>
                ) : (
                  <button onClick={removeCoupon} disabled={isProcessing} className="px-4 bg-red-900/50 hover:bg-red-900/80 text-red-400 font-bold text-sm rounded-lg border border-red-900/50 transition-all disabled:opacity-50">
                    Remove
                  </button>
                )}
              </div>
              {couponError && <p className="text-red-400 text-xs mt-2">{couponError}</p>}
            </div>

            {/* Dynamic Payment / Free Claim Section */}
            {finalAmount === 0 ? (
              <div className="bg-green-900/20 border border-green-900/50 rounded-xl p-5 text-center">
                <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-3" />
                <h3 className="text-lg font-bold text-white mb-1">100% Free Entry</h3>
                <p className="text-gray-400 text-xs mb-4">Your promo code covers the complete entry fee!</p>
                <button 
                  onClick={processRegistration} disabled={isProcessing}
                  className="w-full py-4 bg-green-600 hover:bg-green-500 text-white font-extrabold text-sm rounded-xl transition-all shadow-[0_0_20px_rgba(34,197,94,0.3)] flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : "CLAIM FREE SEAT NOW"}
                </button>
              </div>
            ) : (
              <>
                <div className="bg-[#0f1629] border border-gray-700 rounded-xl p-5 text-center">
                  <div className="relative w-40 h-40 bg-white rounded-xl mx-auto mb-4 flex items-center justify-center overflow-hidden border-2 border-blue-500/50 p-2">
                    <img src="/my-qr.png" alt="Scan to Pay" className="w-full h-full object-contain relative z-10" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                    <QrCode className="absolute w-12 h-12 text-gray-300" />
                  </div>
                  <p className="text-gray-400 text-xs mb-3">Scan & Pay exactly ₹{finalAmount}</p>
                  
                  <a href={`upi://pay?pa=${upiId}&pn=NEUROCLASH&am=${finalAmount}.00&cu=INR`} className="w-full py-3 bg-green-600 hover:bg-green-500 text-white font-bold rounded-lg flex items-center justify-center gap-2 transition-all mb-4">
                    <Smartphone className="w-5 h-5" /> Pay ₹{finalAmount} via UPI
                  </a>
                  
                  <div className="flex items-center justify-between bg-[#0a0f1a] border border-gray-700 rounded-lg p-3">
                    <span className="text-gray-400 text-xs truncate mr-2">{upiId}</span>
                    <button onClick={copyToClipboard} className="text-blue-500 text-xs font-bold bg-blue-500/10 px-2 py-1 rounded">
                      <Copy className="w-3 h-3 inline mr-1" /> Copy
                    </button>
                  </div>
                </div>

                <div className="bg-[#0f1629] border border-gray-700 rounded-xl p-4">
                  <span className="font-bold text-gray-200 text-sm block mb-2">Enter 12-Digit UTR to Confirm</span>
                  <div className="flex gap-2">
                    <input 
                      type="text" maxLength={12} value={utrNumber} onChange={(e) => setUtrNumber(e.target.value.replace(/\D/g, ''))}
                      placeholder="e.g. 423589123456" 
                      className="flex-1 bg-[#0a0f1a] border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
                    />
                    <button 
                      onClick={handleUtrSubmit} disabled={isProcessing || utrNumber.length !== 12}
                      className="px-4 bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm rounded-lg transition-all disabled:opacity-50 flex items-center justify-center min-w-[80px]"
                    >
                      {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : "Verify"}
                    </button>
                  </div>
                </div>

                {/* NEW: Razorpay alternative — Direct UPI + UTR flow above stays exactly as is */}
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-px bg-gray-800" />
                  <span className="text-gray-600 text-xs font-bold uppercase">Or</span>
                  <div className="flex-1 h-px bg-gray-800" />
                </div>

                <button
                  onClick={handleRazorpayPayment}
                  disabled={isProcessing}
                  className="w-full py-3.5 bg-[#0f1629] border border-gray-700 hover:border-blue-500 text-white font-bold text-sm rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isProcessing ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <CreditCard className="w-4 h-4 text-blue-400" /> Pay ₹{finalAmount} via Card / Net Banking
                    </>
                  )}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
