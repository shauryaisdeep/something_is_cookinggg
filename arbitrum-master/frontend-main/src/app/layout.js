import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { WalletProvider } from '../contexts/WalletContext';
import { RealtimeProvider } from '../contexts/RealtimeContext';
import { ArbitrageProvider } from '../contexts/ArbitrageContext';
import ErrorBoundary from '../components/ErrorBoundary';
import NotificationProvider from '../components/NotificationSystem';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Stellar Arbitrage Bot - Advanced Trading System",
  description: "Complete end-to-end Stellar arbitrage bot with real-time analysis and Soroban smart contract execution",
  keywords: ["stellar", "arbitrage", "trading", "bot", "defi", "cryptocurrency", "blockchain", "nextjs", "react"],
  authors: [{ name: "Stellar Arbitrage Bot Team" }],
  openGraph: {
    type: "website",
    url: "https://stellar-arbitrage-bot.com/",
    title: "Stellar Arbitrage Bot",
    description: "Advanced arbitrage trading system for Stellar DEX with real-time analysis and smart contract execution",
    images: ["/og-image.png"],
  },
  twitter: {
    card: "summary_large_image",
    url: "https://stellar-arbitrage-bot.com/",
    title: "Stellar Arbitrage Bot",
    description: "Advanced arbitrage trading system for Stellar DEX with real-time analysis and smart contract execution",
    images: ["/og-image.png"],
  },
  viewport: "width=device-width, initial-scale=1",
  themeColor: "#7c3aed",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="manifest" href="/site.webmanifest" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="true" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Prevent flash of unstyled content
              document.documentElement.classList.add('dark');
              
              // Initialize theme
              if (localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                document.documentElement.classList.add('dark');
              } else {
                document.documentElement.classList.remove('dark');
              }
            `,
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ErrorBoundary>
          <NotificationProvider>
            <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
              <WalletProvider>
                <RealtimeProvider>
                  <ArbitrageProvider>
                    {children}
                  </ArbitrageProvider>
                </RealtimeProvider>
              </WalletProvider>
            </div>
          </NotificationProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
