export const dynamic = "force-dynamic";
export const revalidate = 0;

import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import SplashScreen from "@/components/layout/SplashScreen";
import FloatingEmergencyButton from "@/components/layout/FloatingEmergencyButton";
import Chatbot from "@/components/chat/Chatbot";
import InstallPrompt from "@/components/layout/InstallPrompt";
import { getSiteSettingsDB } from "@/lib/settings";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});


async function getSiteSettings() {
  return await getSiteSettingsDB();
}

function getFaviconVersion() {
  return Date.now().toString(); // dynamic cache buster since we moved to DB
}

export async function generateMetadata(): Promise<Metadata> {
  const s = await getSiteSettings();
  const titleVal = s.siteTitle || "M1G Arama Kurtarma Derneği | Resmi Web Sitesi";
  const descVal = s.siteDesc || "M1G Arama Kurtarma Derneği - 2023 yılında kurulan, tamamı gönüllülerden oluşan profesyonel arama kurtarma, ekoloji ve insani yardım derneği. Ulusal ve uluslararası operasyonlar.";
  const shortTitle = titleVal.split('|')[0]?.trim() || "M1G Arama Kurtarma";
  
  const version = getFaviconVersion();
  const favicon = `/api/settings/favicon?v=${version}`;

  return {
    title: {
      default: titleVal,
      template: `%s | ${shortTitle}`,
    },
    description: descVal,
    keywords: ["M1G", "arama kurtarma", "dernek", "gönüllü", "afet", "deprem", "insani yardım", "ekoloji", "İzmir"],
    authors: [{ name: "M1G Arama Kurtarma Derneği" }],
    icons: {
      icon: favicon,
    },
    openGraph: {
      type: "website",
      locale: "tr_TR",
      siteName: shortTitle,
      title: titleVal,
      description: descVal,
    },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const version = getFaviconVersion();
  const favicon = `/api/settings/favicon?v=${version}`;

  return (
    <html
      lang="tr"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased dark`}
      data-scroll-behavior="smooth"
      suppressHydrationWarning
    >
      <head>
        <link rel="icon" href={favicon} />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#dc2626" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="M1G" />
        <link rel="apple-touch-icon" href="/m1g-logo.png" />
      </head>
      <body className="min-h-full flex flex-col bg-background text-foreground selection:bg-red-600/50">
        <InstallPrompt />
        <SplashScreen />
        <AuthProvider>
          <Navbar />
          <main className="flex-grow pt-20">{children}</main>
          <Footer />
          <FloatingEmergencyButton />
          <Chatbot />
        </AuthProvider>

        {/* Gerçek kullanıcıları (izin verilen trafik) saymak için görünmez ping */}
        <script dangerouslySetInnerHTML={{
          __html: `
            setTimeout(function() {
              fetch('/api/security/track', { method: 'POST', keepalive: true }).catch(console.error);
            }, 500);
          `
        }} />
      </body>
    </html>
  );
}
