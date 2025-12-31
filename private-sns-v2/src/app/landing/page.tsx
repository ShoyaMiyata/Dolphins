'use client'

import React, { useState, useEffect } from 'react'
import Hero from '@/components/landing/hero'
import Navbar from '@/components/landing/navbar'

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
    </div>
  )
}
