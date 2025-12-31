import React from 'react';
import { IMAGES, NAV_LINKS } from './constants';
import { Instagram, Twitter, Facebook, Mail } from 'lucide-react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-gray-900 text-gray-300 py-12 border-t border-gray-800">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          
          {/* Brand */}
          <div className="col-span-1 md:col-span-1">
            <div className="flex items-center gap-3 mb-4">
              <img src={IMAGES.circleLogo} alt="Logo" className="w-10 h-10 rounded-full border border-gray-700" />
              <span className="text-xl font-display text-white tracking-wider">TOHKATSU</span>
            </div>
            <p className="text-sm text-gray-500 leading-relaxed">
              東葛飾高校バスケットボール部<br/>
              OBOG会事務局
            </p>
          </div>

          {/* Links */}
          <div className="col-span-1 md:col-span-2 flex flex-col sm:flex-row gap-8 sm:gap-16">
            <div>
              <h4 className="text-white font-bold mb-4 uppercase text-sm tracking-wider">Menu</h4>
              <ul className="space-y-2">
                {NAV_LINKS.map(link => (
                  <li key={link.name}>
                    <a href={link.href} className="text-sm hover:text-dolphin-orange transition-colors">{link.name}</a>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-white font-bold mb-4 uppercase text-sm tracking-wider">Legal</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-sm hover:text-dolphin-orange transition-colors">利用規約</a></li>
                <li><a href="#" className="text-sm hover:text-dolphin-orange transition-colors">プライバシーポリシー</a></li>
                <li><a href="#" className="text-sm hover:text-dolphin-orange transition-colors">お問い合わせ</a></li>
              </ul>
            </div>
          </div>

          {/* Social */}
          <div className="col-span-1 md:col-span-1">
             <h4 className="text-white font-bold mb-4 uppercase text-sm tracking-wider">Follow Us</h4>
             <div className="flex gap-4">
               <a href="#" className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-dolphin-blue hover:text-white transition-all">
                 <Instagram size={18} />
               </a>
               <a href="#" className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-dolphin-blue hover:text-white transition-all">
                 <Twitter size={18} />
               </a>
               <a href="#" className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-dolphin-blue hover:text-white transition-all">
                 <Facebook size={18} />
               </a>
             </div>
             <div className="mt-6">
                <a href="mailto:info@dolphins-obog.jp" className="flex items-center gap-2 text-sm hover:text-white transition-colors">
                  <Mail size={16} />
                  info@dolphins-obog.jp
                </a>
             </div>
          </div>
        </div>

        <div className="border-t border-gray-800 pt-8 text-center text-xs text-gray-600">
          <p>&copy; {new Date().getFullYear()} Tohkatsu High School Basketball Club Dolphins OB/OG Association. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;