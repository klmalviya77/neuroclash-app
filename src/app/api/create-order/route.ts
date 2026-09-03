import { NextResponse } from 'next/server';
import Razorpay from 'razorpay';

export async function POST() {
  try {
    // Sanity check: fail loudly if env vars are missing/not loaded, instead of
    // letting the Razorpay SDK throw a confusing auth error further down.
    if (!process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      console.error(
        "Razorpay env vars missing — NEXT_PUBLIC_RAZORPAY_KEY_ID:",
        !!process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        "RAZORPAY_KEY_SECRET:",
        !!process.env.RAZORPAY_KEY_SECRET
      );
      return NextResponse.json(
        { success: false, error: "Server misconfiguration: Razorpay keys not set." },
        { status: 500 }
      );
    }

    const razorpay = new Razorpay({
      key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
      key_secret: process.env.RAZORPAY_KEY_SECRET!,
    });

    const options = {
      amount: 900, // Razorpay paise mein count karta hai (900 paise = ₹9)
      currency: "INR",
      receipt: "rcpt_" + Math.random().toString(36).substring(2, 10),
    };

    const order = await razorpay.orders.create(options);
    
    return NextResponse.json({ 
      success: true, 
      orderId: order.id,
      amount: order.amount,
      currency: order.currency
    });

  } catch (error: any) {
    // FIX: this log only ever shows up in your TERMINAL (this route runs on the
    // server), never in the browser console — check the terminal running
    // `npm run dev` / `next dev` after clicking the pay button.
    console.error("Razorpay Order Error:", error);

    // Razorpay SDK errors usually have a nested structure like
    // error.error.description with the real reason (e.g. "key_id or
    // key_secret is invalid"). Surface that in dev so it's actually visible
    // in the browser too, without leaking anything in production.
    const detail =
      error?.error?.description || error?.message || "Unknown error";

    return NextResponse.json(
      {
        success: false,
        error:
          process.env.NODE_ENV === "development"
            ? `Failed to create order: ${detail}`
            : "Failed to create order",
      },
      { status: 500 }
    );
  }
}
