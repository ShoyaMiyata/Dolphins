import React from 'react';
import { ArrowRight, ChevronDown } from 'lucide-react';
import { IMAGES } from '../constants';

const Hero: React.FC = () => {
  return (
    <section id="hero" className="relative min-h-screen flex items-center justify-center overflow-hidden bg-dolphin-blue">
      
      {/* Background Overlay */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-dolphin-blue via-dolphin-dark to-black opacity-90"></div>
        {/* Subtle radial gradient for depth instead of external texture image */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.1)_0%,transparent_70%)]"></div>
      </div>

      <div className="container mx-auto px-4 z-10 pt-20 text-center text-white">

        {/* Main Logo */}
        <div className="mb-8 flex justify-center animate-fade-in-up">
          <div className="relative">
            <div className="absolute inset-0 bg-white/30 blur-3xl scale-110"></div>
            <img
              src={IMAGES.scriptLogo}
              alt="Dolphins B.B.C."
              className="relative h-40 md:h-56 lg:h-72 object-contain drop-shadow-2xl"
              style={{ filter: 'brightness(0) invert(1)' }}
            />
          </div>
        </div>
        <p className="text-base md:text-xl font-light mb-6 max-w-2xl mx-auto text-blue-100">
          東葛飾高校バスケットボール部<br />
          OB/OGのためのコミュニティプラットフォーム
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
          <a
            href="http://localhost:3002/login"
            className="w-full sm:w-auto px-6 py-3 bg-dolphin-orange hover:bg-orange-600 text-white rounded-full font-bold text-base transition-all transform hover:-translate-y-1 shadow-lg hover:shadow-orange-500/50 flex items-center justify-center gap-2"
          >
            コミュニティに参加する <ArrowRight size={18} />
          </a>
          <a
            href="#about"
            className="w-full sm:w-auto px-6 py-3 bg-white/10 hover:bg-white/20 backdrop-blur-md text-white border border-white/30 rounded-full font-bold text-base transition-all"
          >
            活動詳細を見る
          </a>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce text-white/50">
        <ChevronDown size={32} />
      </div>
    </section>
  );
};

export default Hero;