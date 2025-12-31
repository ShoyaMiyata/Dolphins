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
        
        {/* Main Badge */}
        <div className="mb-8 flex justify-center animate-fade-in-up">
          <div className="relative">
            <div className="absolute inset-0 bg-white/20 rounded-full blur-xl animate-pulse"></div>
            <img 
              src={IMAGES.circleLogo} 
              alt="Dolphins Official Emblem" 
              className="relative w-48 h-48 md:w-64 md:h-64 rounded-full border-4 border-white shadow-2xl mx-auto object-cover bg-white"
            />
          </div>
        </div>

        {/* Headlines */}
        <h1 className="text-4xl md:text-6xl lg:text-7xl font-display uppercase tracking-tight mb-4 drop-shadow-lg">
          Tohkatsu Dolphins
        </h1>
        <p className="text-lg md:text-2xl font-light mb-8 max-w-2xl mx-auto text-blue-100">
          東葛飾高校バスケットボール部<br />
          OB/OGのためのコミュニティプラットフォーム
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <button className="w-full sm:w-auto px-8 py-4 bg-dolphin-orange hover:bg-orange-600 text-white rounded-full font-bold text-lg transition-all transform hover:-translate-y-1 shadow-lg hover:shadow-orange-500/50 flex items-center justify-center gap-2">
            コミュニティに参加する <ArrowRight size={20} />
          </button>
          <button className="w-full sm:w-auto px-8 py-4 bg-white/10 hover:bg-white/20 backdrop-blur-md text-white border border-white/30 rounded-full font-bold text-lg transition-all">
            活動詳細を見る
          </button>
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