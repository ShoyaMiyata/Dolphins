'use client'

import { useState, useEffect } from 'react'
import Navbar from './navbar'
import Hero from './hero'
import About from './about'
import Features from './features'
import Gallery from './gallery'
import Cta from './cta'
import Footer from './footer'

export function LandingPage() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 selection:bg-dolphin-blue selection:text-white">
      <Navbar scrolled={scrolled} />
      <main>
        <Hero />
        <About />
        <Features />
        <Gallery />
        <Cta />
      </main>
      <Footer />
    </div>
  )
}
