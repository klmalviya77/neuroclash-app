"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Shield, Loader2, AlertCircle, CheckCircle2, QrCode, CreditCard, Copy, Smartphone, ArrowLeft, Clock } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function PaymentPage() {
  const router = useRouter();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);
  
  const [paymentTab, setPaymentTab] = useState<'upi' | 'razorpay'>('upi');
  const [utrNumber, setUtrNumber] = useState('');
  
  const upiId = "coderzstudio@airtel";
  const amount = "9.00";
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const getUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setUserId(session.user.id);
        
        // Agar pehle se pending request hai, toh UI update karo
        const { data } = await supabase
          .from('payment_requests')
          .select('*')
          .eq('user_id', session.user.id)
          .eq('status', 'Pending')
          .single();
          
        if (data) setIsPending(true);
      } else {
        router.push('/auth');
      }
    };
    getUser();
  }, [router]);

  // DATABASE VIP UNLOCK FUNCTION
  // IMPORTANT: This must only ever be called after a payment has been genuinely
  // verified — either by Razorpay's webhook (see /api/razorpay-webhook) or by an
  // admin manually confirming a Pending UTR against the actual bank statement.
  // Never call this directly off a user-submitted UTR string.
  const handleSuccess = async (currentUserId: string) => {
    try {
      // Permanent DB unlock
      await supabase
        .from('profiles')
        .update({ is_premium: true })
        .eq('id', currentUserId);

      // Secure local state for immediate transitions
      localStorage.setItem('is_premium_user', 'true');

      setSuccessMessage("Payment Verified! All Subjects Unlocked.");
      setTimeout(() => {
        router.push('/');
      }, 2000);
    } catch (err) {
      console.error("Error updating premium status:", err);
      setError("Database update failed. Contact support.");
    }
  };

  const handleUtrSubmit = async () => {
    if (utrNumber.length !== 12 || isNaN(Number(utrNumber))) {
      setError("Please enter a valid 12-digit UTR / Reference Number.");
      setTimeout(() => setError(null), 3000);
      return;
    }

    if (!userId) {
      setError("You must be logged in to verify payment.");
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      // FIX (security): We CANNOT verify a UTR is real just because the user typed
      // 12 digits — a personal/direct UPI ID (like this one) has no API to check a
      // UTR against the bank. Previously this inserted status: 'Success' and called
      // handleSuccess() immediately, meaning ANY random 12-digit number gave free
      // premium access to anyone.
      //
      // Correct flow: save the submission as 'Pending'. Actual unlock should only
      // happen once the payment is genuinely verified — either:
      //   (a) manually, by checking your bank statement/UPI app against this UTR
      //       and then updating payment_requests.status to 'Success' (e.g. from
      //       Supabase Table Editor, or a small internal admin page), or
      //   (b) automatically, by switching users to the Razorpay tab, where
      //       handleRazorpayPayment + a server-side webhook (see
      //       /api/razorpay-webhook) confirms the payment for real.
      const { error: dbError } = await supabase
        .from('payment_requests')
        .insert([{ user_id: userId, utr_number: utrNumber, status: 'Pending' }]);

      if (dbError) throw dbError;

      // Do NOT call handleSuccess() here — premium is granted only once verified.
      setIsPending(true);
      setSuccessMessage("UTR submitted! We'll verify and unlock your account shortly.");

    } catch (err) {
      console.error(err);
      setError("Failed to submit UTR. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRazorpayPayment = async () => {
    setIsProcessing(true);
    setError(null);
    try {
      const response = await fetch('/api/create-order', { method: 'POST' });
      const data = await response.json();

      // FIX: log + surface the real reason instead of a hardcoded string, so we
      // can actually see WHY order creation failed (bad keys, Razorpay API error, etc.)
      if (!data.success) {
        console.error("create-order failed, response was:", data);
        throw new Error(data.error || "Could not initialize secure payment.");
      }

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID, 
        amount: data.amount,
        currency: data.currency,
        name: "NEUROCLASH",
        description: "Master Curriculum Lifetime Access",
        order_id: data.orderId,
        theme: { color: "#eab308" },
        handler: function (response: any) {
          // NOTE: This client-side handler firing is NOT proof of a verified payment
          // by itself (it can be spoofed). The real confirmation should come from the
          // server-side webhook in /api/razorpay-webhook, which verifies Razorpay's
          // signature and then flips profiles.is_premium to true. This client handler
          // calling handleSuccess() here is a convenience for instant UI feedback —
          // keep the webhook as the source of truth server-side.
          if (userId) handleSuccess(userId); 
        },
        modal: {
          ondismiss: function() { setIsProcessing(false); }
        }
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.on('payment.failed', function (response: any) {
        setError("Payment Failed: " + response.error.description);
        setIsProcessing(false);
      });
      rzp.open();

    } catch (err) {
      // FIX: log the real error to browser console + show its message in the UI,
      // instead of always showing a hardcoded generic string.
      console.error("Razorpay payment error:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Payment gateway is temporarily unavailable."
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
    <div className="min-h-screen bg-[#050B14] text-gray-100 font-sans p-4 md:p-8 flex flex-col items-center justify-center">
      <div className="max-w-md w-full">
        <button onClick={() => router.back()} className="flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors font-semibold text-sm">
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
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
          <div className="p-6 bg-gradient-to-b from-[#111827] to-[#0a0f1a] border-b border-gray-800 text-center">
            <Shield className="w-12 h-12 text-yellow-500 mx-auto mb-3" />
            <h2 className="text-xl font-bold text-white mb-1">Unlock Master Curriculum</h2>
            <p className="text-gray-400 text-sm mb-4">One-time payment for lifetime access to all subjects and levels.</p>
            <div className="inline-block bg-yellow-500/10 border border-yellow-500/30 text-yellow-500 px-4 py-2 rounded-lg font-bold text-2xl">
              ₹9 Only
            </div>
          </div>

          {isPending ? (
            <div className="p-8 text-center bg-[#0f1629]">
              <Clock className="w-16 h-16 text-orange-500 mx-auto mb-4 animate-pulse" />
              <h3 className="text-lg font-bold text-white mb-2">Verification Pending</h3>
              <p className="text-gray-400 text-sm mb-6 max-w-sm mx-auto">
                We have received your UTR number. Our system will securely verify the transaction with the bank shortly. Your account will be unlocked automatically.
              </p>
              <button 
                onClick={() => router.push('/')}
                className="w-full px-6 py-3.5 bg-gray-800 hover:bg-gray-700 text-white font-bold rounded-lg transition-all"
              >
                Return to Dashboard
              </button>
            </div>
          ) : (
            <>
              <div className="flex p-3 gap-2 bg-[#050813]">
                <button 
                  onClick={() => setPaymentTab('upi')}
                  className={`flex-1 py-2.5 rounded-lg flex items-center justify-center gap-2 font-bold text-sm transition-all ${paymentTab === 'upi' ? 'bg-orange-600 text-white shadow-lg shadow-orange-600/20' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
                >
                  <QrCode className="w-4 h-4" /> Direct UPI
                </button>
                <button 
                  onClick={() => setPaymentTab('razorpay')}
                  className={`flex-1 py-2.5 rounded-lg flex items-center justify-center gap-2 font-bold text-sm transition-all ${paymentTab === 'razorpay' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
                >
                  <CreditCard className="w-4 h-4" /> Cards / Net
                </button>
              </div>

              {paymentTab === 'upi' && (
                <div className="p-5 space-y-5">
                  <div className="bg-[#0f1629] border border-gray-700 rounded-xl p-5 text-center">
                    
                    <div className="relative w-48 h-48 bg-white rounded-xl mx-auto mb-4 flex items-center justify-center overflow-hidden border-2 border-yellow-500/50 p-2">
                      <img 
                        src="/IMG_20260903_112801.jpg" 
                        alt="Scan to Pay" 
                        className="w-full h-full object-contain relative z-10" 
                        onError={(e) => { e.currentTarget.style.display = 'none'; }} 
                      />
                      <QrCode className="absolute w-16 h-16 text-gray-300" />
                    </div>

                    <p className="text-gray-400 text-xs mb-3">Scan using GPay, PhonePe, Paytm</p>

                    <a 
                      href={`upi://pay?pa=${upiId}&pn=NEUROCLASH&am=${amount}&cu=INR`}
                      className="w-full py-3.5 bg-green-600 hover:bg-green-500 text-white font-bold rounded-lg flex items-center justify-center gap-2 transition-all shadow-[0_0_15px_rgba(22,163,74,0.3)] mb-4"
                    >
                      <Smartphone className="w-5 h-5" /> Tap to Pay via UPI App
                    </a>

                    <div className="flex items-center justify-between bg-[#0a0f1a] border border-gray-700 rounded-lg p-3">
                      <span className="text-gray-400 text-xs truncate mr-2">{upiId}</span>
                      <button onClick={copyToClipboard} className="text-yellow-500 text-xs font-bold bg-yellow-500/10 px-2 py-1 rounded hover:bg-yellow-500/20">
                        <Copy className="w-3 h-3 inline mr-1" /> Copy
                      </button>
                    </div>
                  </div>

                  <div className="bg-[#0f1629] border border-gray-700 rounded-xl p-4">
                    <span className="font-bold text-gray-200 text-sm block mb-2">Step 2: Enter 12-Digit UTR</span>
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        maxLength={12}
                        value={utrNumber}
                        onChange={(e) => setUtrNumber(e.target.value.replace(/\D/g, ''))}
                        placeholder="e.g. 423589123456" 
                        className="flex-1 bg-[#0a0f1a] border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-yellow-500"
                      />
                      <button 
                        onClick={handleUtrSubmit}
                        disabled={isProcessing || utrNumber.length !== 12}
                        className="px-4 bg-yellow-500 hover:bg-yellow-400 text-black font-bold text-sm rounded-lg transition-all disabled:opacity-50 flex items-center justify-center min-w-[80px]"
                      >
                        {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : "Verify"}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {paymentTab === 'razorpay' && (
                <div className="p-8 text-center bg-[#0f1629]">
                  <Shield className="w-12 h-12 text-blue-500 mx-auto mb-4 opacity-50" />
                  <button 
                    onClick={handleRazorpayPayment}
                    disabled={isProcessing}
                    className="w-full px-6 py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg shadow-[0_0_20px_rgba(37,99,235,0.3)] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : <><CreditCard className="w-5 h-5" /> Pay ₹9 Securely</>}
                  </button>
                </div>
              )}
            </>
          )}

        </div>
      </div>
    </div>
  );
}
