import React, { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { IMAGES, NAV_LINKS } from '../constants';

interface NavbarProps {
  scrolled: boolean;
}

const Navbar: React.FC<NavbarProps> = ({ scrolled }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header 
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? 'bg-white shadow-md py-2' : 'bg-transparent py-4'
      }`}
    >
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <a href="#" className="flex items-center gap-3">
            <img
              src={IMAGES.circleLogo}
              alt="Dolphins B.B.C."
              className="h-10 w-10 md:h-12 md:w-12 rounded-full object-cover ring-2 ring-white/20 shadow-lg"
            />
            <span className={`font-display text-xl md:text-2xl font-bold tracking-wider ${scrolled ? 'text-dolphin-blue' : 'text-white'}`}>
              TOHKATSU
            </span>
          </a>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            {NAV_LINKS.map((link) => (
              <a 
                key={link.name} 
                href={link.href}
                className={`text-sm font-medium transition-colors hover:text-dolphin-orange ${
                  scrolled ? 'text-gray-700' : 'text-white/90'
                }`}
              >
                {link.name}
              </a>
            ))}
            <button className="bg-dolphin-orange hover:bg-orange-600 text-white px-5 py-2 rounded-full font-bold text-sm transition-transform transform hover:scale-105 shadow-lg">
              ログイン
            </button>
          </nav>

          {/* Mobile Menu Button */}
          <button 
            className="md:hidden p-2 text-current"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? (
              <X className={scrolled ? 'text-gray-800' : 'text-white'} />
            ) : (
              <Menu className={scrolled ? 'text-gray-800' : 'text-white'} />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {isOpen && (
        <div className="md:hidden absolute top-full left-0 right-0 bg-white shadow-xl border-t">
          <div className="flex flex-col p-4 gap-4">
            {NAV_LINKS.map((link) => (
              <a 
                key={link.name} 
                href={link.href}
                className="text-gray-700 font-medium py-2 border-b border-gray-100"
                onClick={() => setIsOpen(false)}
              >
                {link.name}
              </a>
            ))}
            <button className="bg-dolphin-blue text-white w-full py-3 rounded-lg font-bold">
              ログイン / 新規登録
            </button>
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;