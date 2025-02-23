import type { Metadata } from 'next'
import { ReactNode } from 'react'
import './globals.css'
import Navbar from '../Components/Navbar'

export const metadata: Metadata = {
  title: 'BYC - Build Your Clothes',
  description: 'Create custom apparel with AI-powered designs',
}

export default function RootLayout({
  children,
}: {
  children: ReactNode
}) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className="min-h-screen bg-black text-white antialiased">
        <div className="flex min-h-screen flex-col">
          <Navbar />
          {children}
        </div>
      </body>
    </html>
  )
}