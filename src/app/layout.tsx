import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from 'next/script';
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Real App Metadata (Browser tab aur SEO me yahi show hoga)
export const metadata: Metadata = {
  title: "NEUROCLASH | Master Curriculum Arena",
  description: "An 80-level competitive tech arena. Master subjects, clear quizzes, earn XP, and climb the Global Leaderboard.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        {/* OneSignal Setup */}
        <Script src="https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js" strategy="beforeInteractive" />
        <Script id="c21ed6b1-7b8a-48c8-8690-8bb5df7ddc02" strategy="afterInteractive">
          {`
            window.OneSignalDeferred = window.OneSignalDeferred || [];
            OneSignalDeferred.push(async function(OneSignal) {
              await OneSignal.init({
                appId: "${process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID}",
              });
            });
          `}
        </Script>
      </head>
      <body className="min-h-full flex flex-col bg-[#050B14] text-white">

        {/* Razorpay Checkout Script loaded before user interaction */}
        <Script 
          src="https://checkout.razorpay.com/v1/checkout.js" 
          strategy="beforeInteractive" 
        />
        
        {children}
      </body>
    </html>
  );
}
