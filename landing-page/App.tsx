import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import About from './components/About';
import Features from './components/Features';
import Gallery from './components/Gallery';
import Cta from './components/Cta';
import Footer from './components/Footer';

const App: React.FC = () => {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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
  );
};

export default App;