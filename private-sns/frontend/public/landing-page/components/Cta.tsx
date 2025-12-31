import React from 'react';
import { IMAGES } from '../constants';

const Cta: React.FC = () => {
  return (
    <section id="support" className="relative py-24 overflow-hidden">
      {/* Background Image Parallax Effect */}
      <div className="absolute inset-0 z-0">
        <img 
          src="https://images.unsplash.com/photo-1505666287802-931dc83948e9?ixlib=rb-1.2.1&auto=format&fit=crop&w=1920&q=80"
          alt="Basketball Court"
          className="w-full h-full object-cover filter brightness-50"
        />
        <div className="absolute inset-0 bg-dolphin-blue/80 mix-blend-multiply"></div>
      </div>

      <div className="container mx-auto px-4 relative z-10 text-center">
        <div className="max-w-3xl mx-auto bg-white/10 backdrop-blur-md p-8 md:p-12 rounded-3xl border border-white/20 shadow-2xl">
          <img 
            src={IMAGES.scriptLogo} 
            alt="Dolphins" 
            className="h-16 md:h-20 mx-auto mb-8 rounded-lg shadow-sm"
          />
          
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
            チームの一員として、<br/>再び繋がりましょう。
          </h2>
          
          <p className="text-blue-100 text-lg mb-10 leading-relaxed">
            Dolphins OB/OGコミュニティアプリは、招待制・承認制となっています。<br/>
            登録申請を行い、事務局の承認をお待ちください。
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="px-8 py-4 bg-dolphin-orange hover:bg-orange-600 text-white rounded-xl font-bold text-lg shadow-lg shadow-orange-500/30 transition-all hover:-translate-y-1">
              会員登録申請（無料）
            </button>
            <button className="px-8 py-4 bg-white text-dolphin-blue hover:bg-gray-100 rounded-xl font-bold text-lg shadow-lg transition-all hover:-translate-y-1">
              ログインはこちら
            </button>
          </div>
          
          <p className="mt-6 text-sm text-blue-200">
            ※ 登録には卒業年度の確認が必要です。
          </p>
        </div>
      </div>
    </section>
  );
};

export default Cta;