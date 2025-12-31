import React from 'react';
import Link from 'next/link';
import { ArrowRight, ChevronDown } from 'lucide-react';
import { IMAGES } from './constants';

const Hero: React.FC = () => {
  return (
    <section id="hero" className="relative h-screen flex items-center justify-center overflow-hidden bg-dolphin-blue">

      {/* Background Overlay */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-dolphin-blue via-dolphin-dark to-black opacity-90"></div>
        {/* Subtle radial gradient for depth instead of external texture image */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.1)_0%,transparent_70%)]"></div>
      </div>

      <div className="container mx-auto px-4 z-10 pt-20 text-center text-white">

        {/* Main Logo with Backlight */}
        <div className="mb-12 flex justify-center animate-fade-in-up">
          <div className="relative">
            {/* White glow effect from behind - reduced opacity */}
            <div className="absolute inset-0 bg-white/20 blur-3xl scale-110"></div>
            <div className="absolute inset-0 bg-gradient-radial from-white/30 via-white/10 to-transparent blur-2xl"></div>
            <img
              src={IMAGES.scriptLogo}
              alt="Dolphins Text Logo"
              className="relative w-[400px] md:w-[600px] h-auto drop-shadow-2xl mx-auto object-contain brightness-0 invert"
              style={{ filter: 'drop-shadow(0 0 30px rgba(255, 255, 255, 0.4)) brightness(0) invert(1)' }}
            />
          </div>
        </div>
        <p className="text-lg md:text-2xl font-light mb-12 max-w-2xl mx-auto text-blue-100">
          東葛飾高校バスケットボール部<br />
          OB/OGのためのコミュニティプラットフォーム
        </p>

        {/* CTAs */}
        <div className="flex justify-center items-center">
          <Link href="/login" className="w-full sm:w-auto">
            <button className="w-full px-6 py-3 bg-dolphin-orange hover:bg-orange-600 text-white rounded-full font-bold text-base transition-all transform hover:-translate-y-1 shadow-lg hover:shadow-orange-500/50 flex items-center justify-center gap-2">
              コミュニティに参加する <ArrowRight size={18} />
            </button>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default Hero;
