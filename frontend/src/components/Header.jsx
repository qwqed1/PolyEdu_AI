import { useState } from 'react';

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 glass-effect">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <nav className="flex items-center justify-between">
          {/* Logo */}
          <a href="#" className="flex items-center gap-2">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-xl">U</span>
            </div>
            <span className="text-xl font-bold text-gray-800">Uchi-IT</span>
          </a>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            <a href="#courses" className="text-gray-600 hover:text-blue-600 transition-colors font-medium">
              Обучение
            </a>
            <a href="#benefits" className="text-gray-600 hover:text-blue-600 transition-colors font-medium">
              Преимущества
            </a>
            <a href="#gift" className="text-gray-600 hover:text-blue-600 transition-colors font-medium">
              Подарки
            </a>
            <a href="#contact" className="text-gray-600 hover:text-blue-600 transition-colors font-medium">
              Контакты
            </a>
          </div>

          {/* CTA Button */}
          <button className="hidden md:block bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-full font-medium transition-all hover:shadow-lg hover:shadow-blue-500/30">
            Записаться
          </button>

          {/* Mobile Menu Button */}
          <button 
            className="md:hidden p-2"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {isMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </nav>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden mt-4 pb-4 border-t border-gray-200 pt-4">
            <div className="flex flex-col gap-4">
              <a href="#courses" className="text-gray-600 hover:text-blue-600 transition-colors font-medium">
                Обучение
              </a>
              <a href="#benefits" className="text-gray-600 hover:text-blue-600 transition-colors font-medium">
                Преимущества
              </a>
              <a href="#gift" className="text-gray-600 hover:text-blue-600 transition-colors font-medium">
                Подарки
              </a>
              <a href="#contact" className="text-gray-600 hover:text-blue-600 transition-colors font-medium">
                Контакты
              </a>
              <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-full font-medium transition-all w-full">
                Записаться
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
