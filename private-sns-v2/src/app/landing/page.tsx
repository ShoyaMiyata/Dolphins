'use client'

import React, { useState, useEffect } from 'react'
import Hero from '@/components/landing/hero'
import Navbar from '@/components/landing/navbar'
import About from '@/components/landing/about'
import Features from '@/components/landing/features'
import Cta from '@/components/landing/cta'
import Gallery from '@/components/landing/gallery'
import Footer from '@/components/landing/footer'

export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <div className="min-h-screen">
      <Navbar scrolled={scrolled} />
      <Hero />
      <About />
      <Features />
      <Gallery />
      <Cta />
      <Footer />
    </div>
  )
}
