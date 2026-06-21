import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { Navbar } from "@/components/layout/navbar"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
})

export const metadata: Metadata = {
  title: "TailorCV — AI-Powered Resume Intelligence",
  description: "Upload your CV, analyse skill gaps, generate ATS-optimised resumes and cover letters tailored to any job description.",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} h-full`}>
      <body className="flex min-h-dvh flex-col bg-slate-50 antialiased">
        <Navbar />
        <main className="flex-1">{children}</main>
        <footer className="border-t border-slate-200 bg-white py-6">
          <div className="mx-auto max-w-7xl px-4 text-center text-sm text-slate-500">
            &copy; {new Date().getFullYear()} TailorCV — AI-Powered Resume Intelligence Platform
          </div>
        </footer>
      </body>
    </html>
  )
}
