import { NextResponse } from 'next/server';
import Razorpay from 'razorpay';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: Request) {
  try {
    if (
      !process.env.NEXT_PUBLIC_SUPABASE_URL ||
      !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
      !process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ||
      !process.env.RAZORPAY_KEY_SECRET
    ) {
      console.error('Missing env vars for create-tournament-order:', {
        NEXT_PUBLIC_SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        NEXT_PUBLIC_SUPABASE_ANON_KEY: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        NEXT_PUBLIC_RAZORPAY_KEY_ID: !!process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        RAZORPAY_KEY_SECRET: !!process.env.RAZORPAY_KEY_SECRET,
      });
      return NextResponse.json(
        { success: false, error: 'Server misconfiguration: required env vars not set.' },
        { status: 500 }
      );
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { tournamentId, couponCode } = await req.json();

    const baseAmount = 9; // ₹9 base tournament entry — keep in sync with the page
    let finalAmount = baseAmount;

    if (couponCode) {
      const { data: coupon, error: couponError } = await supabaseAdmin
        .from('coupons')
        .select('*')
        .eq('code', String(couponCode).toUpperCase())
        .single();

      if (!couponError && coupon && coupon.is_active && coupon.used_count < coupon.max_uses) {
        finalAmount = Math.max(0, baseAmount - coupon.discount_amount);
      }
      // If the coupon is invalid/expired/exhausted, we silently fall back to
      // the full baseAmount rather than trusting the client's claim.
    }

    if (finalAmount <= 0) {
      return NextResponse.json(
        { success: false, error: 'This entry is fully covered by your coupon — no payment needed.' },
        { status: 400 }
      );
    }

    const razorpay = new Razorpay({
      key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
      key_secret: process.env.RAZORPAY_KEY_SECRET!,
    });

    const order = await razorpay.orders.create({
      amount: finalAmount * 100, // Razorpay counts in paise
      currency: 'INR',
      receipt: 'trn_' + Math.random().toString(36).substring(2, 10),
      notes: { tournament_id: tournamentId || '' },
    });

    return NextResponse.json({
      success: true,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
    });
  } catch (error: any) {
    // Check your terminal (this route runs server-side) for the full error.
    console.error('Tournament Razorpay Order Error:', error);

    const detail = error?.error?.description || error?.message || 'Unknown error';

    return NextResponse.json(
      {
        success: false,
        error:
          process.env.NODE_ENV === 'development'
            ? `Failed to create order: ${detail}`
            : 'Failed to create order',
      },
      { status: 500 }
    );
  }
}
