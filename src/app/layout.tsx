import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import Header from "@/app/components/Header";
import { AuthProvider } from "./contexts/AuthContext";
import Chatbot from "./components/Chatbot";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: 'AITIMAAD.PK - Pakistan\'s Most Trusted Review Platform',
  description: 'Discover honest reviews from real people. Share your experience and help others make informed decisions.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
                <AuthProvider>
        <Header/>
        {children}
        <Chatbot/>
                </AuthProvider>
      </body>
    </html>
  );
}
