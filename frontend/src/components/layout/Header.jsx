import { Link } from 'react-router-dom';
import {
  Sun,
  Moon,
  Menu,
  X,
  User,
  LogOut,
  ChevronDown,
  BookOpen,
  Globe,
  Gamepad2,
  BarChart3,
  Bot,
  Users,
  FileText,
  Shuffle,
  FlaskConical,
  Sparkles,
} from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useState, useRef, useEffect } from 'react';

export default function Header() {
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const { language, toggleLanguage, t } = useLanguage();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [toolsDropdownOpen, setToolsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setToolsDropdownOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="glass-effect sticky top-0 z-50 border-b border-neutral-200 dark:border-dark-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/landing" className="flex items-center gap-2 group">
            <div className="w-10 h-10 bg-gradient-primary rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">A</span>
            </div>
            <span className="text-xl font-bold gradient-text-primary">AIZERT</span>
          </Link>

          {user && (
            <nav className="hidden lg:flex items-center gap-5">
              <Link to="/dashboard" className="text-neutral-700 dark:text-neutral-300 hover:text-primary-600 dark:hover:text-primary-400 transition-default font-medium">
                {t.nav.home}
              </Link>

              <Link to="/groups" className="text-neutral-700 dark:text-neutral-300 hover:text-primary-600 dark:hover:text-primary-400 transition-default font-medium flex items-center gap-1.5">
                <Users className="w-4 h-4" />
                {t.nav.groups}
              </Link>

              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setToolsDropdownOpen(!toolsDropdownOpen)}
                  className={`flex items-center gap-1.5 font-medium transition-default ${
                    toolsDropdownOpen
                      ? 'text-primary-600 dark:text-primary-400'
                      : 'text-neutral-700 dark:text-neutral-300 hover:text-primary-600 dark:hover:text-primary-400'
                  }`}
                >
                  <BookOpen className="w-4 h-4" />
                  {t.nav.tools || 'РРЅСЃС‚СЂСѓРјРµРЅС‚С‹'}
                  <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${toolsDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {toolsDropdownOpen && (
                  <div className="absolute top-full left-0 mt-2 w-56 bg-white dark:bg-dark-surface rounded-xl shadow-xl border border-neutral-100 dark:border-dark-border py-2 z-50 animate-in fade-in slide-in-from-top-2">
                    <Link
                      to="/lesson-plans"
                      onClick={() => setToolsDropdownOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-default"
                    >
                      <FileText className="w-4 h-4 text-primary-500" />
                      {t.nav.lessonPlans}
                    </Link>
                    <Link
                      to="/interactive-games"
                      onClick={() => setToolsDropdownOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-default"
                    >
                      <Gamepad2 className="w-4 h-4 text-emerald-500" />
                      {t.nav.games}
                    </Link>
                    <Link
                      to="/lab"
                      onClick={() => setToolsDropdownOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-default"
                    >
                      <FlaskConical className="w-4 h-4 text-orange-500" />
                      {t.nav.lab}
                    </Link>
                    <Link
                      to="/statistics"
                      onClick={() => setToolsDropdownOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-default"
                    >
                      <BarChart3 className="w-4 h-4 text-purple-500" />
                      {t.nav.statistics}
                    </Link>
                    <Link
                      to="/group-splitter"
                      onClick={() => setToolsDropdownOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-default"
                    >
                      <Shuffle className="w-4 h-4 text-cyan-500" />
                      {t.nav.groupSplitter || 'Р”РµР»РµРЅРёРµ РЅР° РіСЂСѓРїРїС‹'}
                    </Link>
                    <Link
                      to="/brain-break"
                      onClick={() => setToolsDropdownOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-default"
                    >
                      <Sparkles className="w-4 h-4 text-emerald-500" />
                      {t.nav.brainBreak}
                    </Link>
                  </div>
                )}
              </div>

              <Link to="/ai-chat" className="text-neutral-700 dark:text-neutral-300 hover:text-primary-600 dark:hover:text-primary-400 transition-default font-medium flex items-center gap-1.5">
                <Bot className="w-4 h-4" />
                {t.nav.aiChat}
              </Link>
            </nav>
          )}

          <div className="flex items-center gap-3">
            <button
              onClick={toggleLanguage}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-default text-sm font-medium text-neutral-700 dark:text-neutral-300"
              aria-label="Toggle language"
            >
              <Globe className="w-4 h-4" />
              {language === 'ru' ? t.lang.kk : t.lang.ru}
            </button>

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
                  className="hidden lg:flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-default"
                >
                  <User className="w-5 h-5" />
                  <span className="text-sm font-medium">{user.full_name}</span>
                </Link>
                <button
                  onClick={logout}
                  className="hidden lg:flex items-center gap-2 px-3 py-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-default"
                >
                  <LogOut className="w-5 h-5" />
                  <span className="text-sm font-medium">{t.nav.logout}</span>
                </button>
              </>
            ) : (
              <Link to="/login" className="hidden md:block">
                <button className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-default">
                  {t.nav.login}
                </button>
              </Link>
            )}

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-default"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="lg:hidden py-4 border-t border-neutral-200 dark:border-dark-border">
            {user ? (
              <div className="flex flex-col gap-3">
                <Link to="/dashboard" className="px-3 py-2 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-default">
                  {t.nav.home}
                </Link>
                <Link to="/groups" className="px-3 py-2 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-default flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  {t.nav.groups}
                </Link>
                <Link to="/lesson-plans" className="px-3 py-2 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-default flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  {t.nav.lessonPlans}
                </Link>
                <Link to="/interactive-games" className="px-3 py-2 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-default flex items-center gap-2">
                  <Gamepad2 className="w-4 h-4" />
                  {t.nav.games}
                </Link>
                <Link to="/lab" className="px-3 py-2 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-default flex items-center gap-2">
                  <FlaskConical className="w-4 h-4" />
                  {t.nav.lab}
                </Link>
                <Link to="/statistics" className="px-3 py-2 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-default flex items-center gap-2">
                  <BarChart3 className="w-4 h-4" />
                  {t.nav.statistics}
                </Link>
                <Link to="/group-splitter" className="px-3 py-2 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-default flex items-center gap-2">
                  <Shuffle className="w-4 h-4" />
                  {t.nav.groupSplitter || 'Р”РµР»РµРЅРёРµ РЅР° РіСЂСѓРїРїС‹'}
                </Link>
                <Link to="/brain-break" className="px-3 py-2 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-default flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  {t.nav.brainBreak}
                </Link>
                <Link to="/ai-chat" className="px-3 py-2 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-default flex items-center gap-2">
                  <Bot className="w-4 h-4" />
                  {t.nav.aiChat}
                </Link>
                <Link to="/profile" className="px-3 py-2 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-default">
                  {t.nav.profile}
                </Link>
                <button
                  onClick={logout}
                  className="px-3 py-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-default text-left"
                >
                  {t.nav.logout}
                </button>
              </div>
            ) : (
              <Link to="/login">
                <button className="w-full px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium transition-default">
                  {t.nav.login}
                </button>
              </Link>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
