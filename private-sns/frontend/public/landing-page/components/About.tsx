import React from 'react';
import { IMAGES } from '../constants';

const About: React.FC = () => {
  return (
    <section id="about" className="py-20 md:py-32 bg-white relative overflow-hidden">
      
      {/* Decorative background text */}
      <div className="absolute -right-20 top-20 opacity-5 pointer-events-none select-none">
        <span className="font-display text-[150px] md:text-[250px] leading-none text-dolphin-blue whitespace-nowrap">
          Dolphins
        </span>
      </div>

      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center gap-12 lg:gap-20">
          
          {/* Text Content */}
          <div className="w-full md:w-1/2 order-2 md:order-1">
            <div className="inline-block px-4 py-1 bg-dolphin-light/10 text-dolphin-blue rounded-full text-sm font-bold mb-4 border border-dolphin-light/20">
              OUR MISSION
            </div>
            <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-6 leading-tight">
              世代を超えて繋がる、<br />
              <span className="text-dolphin-blue">Dolphins</span>の絆。
            </h2>
            <p className="text-gray-600 text-lg mb-6 leading-relaxed">
              東葛飾高校バスケットボール部「Dolphins」は、長い歴史の中で多くの卒業生を輩出してきました。
              このアプリは、OB/OG同士が再び繋がり、現役生の活動を支援し、そしてバスケットボールを通じて
              新たな交流を生み出すための専用コミュニティです。
            </p>
            <p className="text-gray-600 text-lg mb-8 leading-relaxed">
              かつて同じコートで汗を流した仲間と再会し、新しい世代のDolphinsを共に応援しませんか？
            </p>

            <div className="flex gap-8 border-t border-gray-100 pt-8">
              <div>
                <span className="block text-4xl font-display text-dolphin-orange mb-1">500+</span>
                <span className="text-sm text-gray-500 font-medium">OB/OG会員数</span>
              </div>
              <div>
                <span className="block text-4xl font-display text-dolphin-blue mb-1">19xx</span>
                <span className="text-sm text-gray-500 font-medium">創部年</span>
              </div>
            </div>
          </div>

          {/* Image Content */}
          <div className="w-full md:w-1/2 order-1 md:order-2 flex justify-center relative">
             <div className="relative">
                {/* Colored Backdrop */}
                <div className="absolute top-10 -right-10 w-full h-full bg-dolphin-light rounded-3xl opacity-20 transform rotate-6"></div>
                <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-dolphin-orange rounded-full opacity-10 blur-2xl"></div>
                
                {/* Main Image - Jersey/Player */}
                <img 
                  src={IMAGES.jersey} 
                  alt="Tohkatsu Dolphins Player" 
                  className="relative z-10 w-full max-w-md mx-auto rounded-xl shadow-2xl transform transition hover:scale-105 duration-500 bg-gray-100 object-cover aspect-[3/4]"
                />

                {/* Floating Badge */}
                <div className="absolute -bottom-6 -right-6 z-20 bg-white p-4 rounded-xl shadow-xl border border-gray-100 max-w-xs">
                    <p className="font-display text-xl text-dolphin-dark">TOHKATSU PRIDE</p>
                    <p className="text-xs text-gray-500">Since formation</p>
                </div>
             </div>
          </div>

        </div>
      </div>
    </section>
  );
};

export default About;