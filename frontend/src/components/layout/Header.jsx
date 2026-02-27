import { Link } from 'react-router-dom';
import { Moon, Sun, LogOut, User, Menu, X, BookOpen, Share2, Bot, Calendar } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { useState } from 'react';

export default function Header() {
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="glass-effect sticky top-0 z-50 border-b border-neutral-200 dark:border-dark-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 bg-gradient-primary rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">P</span>
            </div>
            <span className="text-xl font-bold gradient-text-primary">PolyEduAI</span>
          </Link>

          {/* Desktop Navigation */}
          {user && (
            <nav className="hidden md:flex items-center gap-6">
              <Link to="/dashboard" className="text-neutral-700 dark:text-neutral-300 hover:text-primary-600 dark:hover:text-primary-400 transition-default font-medium">
                Главная
              </Link>
              <Link to="/materials" className="text-neutral-700 dark:text-neutral-300 hover:text-primary-600 dark:hover:text-primary-400 transition-default font-medium flex items-center gap-1">
                <BookOpen className="w-4 h-4" />
                Материалы
              </Link>
              <Link to="/exchange" className="text-neutral-700 dark:text-neutral-300 hover:text-primary-600 dark:hover:text-primary-400 transition-default font-medium flex items-center gap-1">
                <Share2 className="w-4 h-4" />
                Обмен
              </Link>
              <Link to="/schedule" className="text-neutral-700 dark:text-neutral-300 hover:text-primary-600 dark:hover:text-primary-400 transition-default font-medium">
                Расписание
              </Link>
              <Link to="/ai-chat" className="text-neutral-700 dark:text-neutral-300 hover:text-primary-600 dark:hover:text-primary-400 transition-default font-medium flex items-center gap-1">
                <Bot className="w-4 h-4" />
                Чат с ИИ
              </Link>
            </nav>
          )}

          {/* Right side buttons */}
          <div className="flex items-center gap-3">
            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-default"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? (
                <Sun className="w-5 h-5 text-neutral-700 dark:text-neutral-300" />
              ) : (
                <Moon className="w-5 h-5 text-neutral-700 dark:text-neutral-300" />
              )}
            </button>

            {user ? (
              <>
                <Link 
                  to="/profile"
                  className="hidden md:flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-default"
                >
                  <User className="w-5 h-5" />
                  <span className="text-sm font-medium">{user.full_name}</span>
                </Link>
                <button
                  onClick={logout}
                  className="hidden md:flex items-center gap-2 px-3 py-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-default"
                >
                  <LogOut className="w-5 h-5" />
                  <span className="text-sm font-medium">Выход</span>
                </button>
              </>
            ) : (
              <Link to="/login" className="hidden md:block">
                <button className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-default">
                  Войти
                </button>
              </Link>
            )}

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-default"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-neutral-200 dark:border-dark-border">
            {user ? (
              <div className="flex flex-col gap-3">
                <Link to="/dashboard" className="px-3 py-2 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-default">
                  Главная
                </Link>
                <Link to="/materials" className="px-3 py-2 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-default flex items-center gap-2">
                  <BookOpen className="w-4 h-4" />
                  Материалы
                </Link>
                <Link to="/exchange" className="px-3 py-2 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-default flex items-center gap-2">
                  <Share2 className="w-4 h-4" />
                  Обмен материалами
                </Link>
                <Link to="/schedule" className="px-3 py-2 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-default">
                  Расписание
                </Link>
                <Link to="/ai-chat" className="px-3 py-2 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-default flex items-center gap-2">
                  <Bot className="w-4 h-4" />
                  Чат с ИИ
                </Link>
                <Link to="/profile" className="px-3 py-2 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-default">
                  Профиль
                </Link>
                <button
                  onClick={logout}
                  className="px-3 py-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-default text-left"
                >
                  Выход
                </button>
              </div>
            ) : (
              <Link to="/login">
                <button className="w-full px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-default">
                  Войти
                </button>
              </Link>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
