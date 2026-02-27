import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Gamepad2, ArrowRight, Sparkles, Clock, Users, Search,
  HelpCircle, Zap, Trophy, Play
} from 'lucide-react';
import quizService from '../../services/quizService';

export default function StudentGamesPage() {
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [code, setCode] = useState('');
  const [codeError, setCodeError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    loadActiveQuizzes();
  }, []);

  const loadActiveQuizzes = async () => {
    try {
      setLoading(true);
      const response = await quizService.getActiveQuizzes();
      setQuizzes(response.data || []);
    } catch (err) {
      setError('Не удалось загрузить список игр');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCodeSubmit = (e) => {
    e.preventDefault();
    const cleanCode = code.trim().toUpperCase();
    
    if (cleanCode.length !== 6) {
      setCodeError('Код должен состоять из 6 символов');
      return;
    }

    navigate(`/play/${cleanCode}`);
  };

  const handleCodeChange = (e) => {
    const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
    setCode(value);
    setCodeError('');
  };

  const filteredQuizzes = quizzes.filter(q => 
    q.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    q.teacherName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-dark-bg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-neutral-900 dark:text-white flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
              <Gamepad2 className="w-6 h-6 text-white" />
            </div>
            Игры
          </h1>
          <p className="mt-2 text-neutral-600 dark:text-neutral-400">
            Присоединяйся к интерактивным викторинам от преподавателей
          </p>
        </div>

        {/* Join by Code — Hero Section */}
        <div className="relative overflow-hidden bg-gradient-to-br from-purple-600 via-indigo-600 to-blue-600 rounded-2xl p-8 mb-8 shadow-xl">
          {/* Background decorations */}
          <div className="absolute -top-20 -right-20 w-60 h-60 bg-white/10 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-white/10 rounded-full blur-3xl"></div>
          
          <div className="relative flex flex-col md:flex-row items-center gap-8">
            <div className="flex-1 text-center md:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/20 rounded-full text-white text-sm font-medium mb-4">
                <Zap className="w-4 h-4" />
                Быстрый вход
              </div>
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
                Введите код игры
              </h2>
              <p className="text-white/70">
                Получите код от преподавателя и начните играть
              </p>
            </div>

            <form onSubmit={handleCodeSubmit} className="flex-shrink-0 w-full md:w-auto">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative">
                  <input
                    type="text"
                    value={code}
                    onChange={handleCodeChange}
                    placeholder="XXXXXX"
                    className="w-full sm:w-64 text-center text-3xl font-mono font-bold tracking-[0.4em] px-6 py-4 rounded-xl bg-white/20 border-2 border-white/30 text-white placeholder:text-white/40 focus:bg-white/30 focus:border-white/60 focus:outline-none focus:ring-0 transition-all backdrop-blur-sm"
                  />
                  {codeError && (
                    <p className="absolute -bottom-6 left-0 text-yellow-200 text-xs">{codeError}</p>
                  )}
                </div>
                <button
                  type="submit"
                  disabled={code.length !== 6}
                  className="px-8 py-4 bg-white text-indigo-600 rounded-xl font-bold text-lg hover:bg-white/90 hover:shadow-xl hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2"
                >
                  <span>Войти</span>
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Active Quizzes Section */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-neutral-900 dark:text-white flex items-center gap-2">
              <Play className="w-5 h-5 text-green-500" />
              Доступные викторины
              <span className="ml-2 px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full text-sm font-medium">
                {quizzes.length}
              </span>
            </h2>
          </div>

          {quizzes.length > 0 && (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Поиск..."
                className="pl-10 pr-4 py-2 border border-neutral-200 dark:border-neutral-700 rounded-xl bg-white dark:bg-dark-card focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all text-sm"
              />
            </div>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-red-500 mb-4">{error}</p>
            <button
              onClick={loadActiveQuizzes}
              className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
            >
              Повторить
            </button>
          </div>
        ) : filteredQuizzes.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-neutral-100 dark:bg-neutral-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-10 h-10 text-neutral-400" />
            </div>
            <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-2">
              {searchTerm ? 'Ничего не найдено' : 'Сейчас нет активных игр'}
            </h3>
            <p className="text-neutral-500 dark:text-neutral-400">
              {searchTerm 
                ? 'Попробуйте другой запрос' 
                : 'Попросите преподавателя запустить викторину или введите код выше'
              }
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredQuizzes.map((quiz) => (
              <div
                key={quiz.id}
                className="group bg-white dark:bg-dark-card rounded-2xl border border-neutral-200 dark:border-neutral-700 p-6 hover:shadow-xl hover:border-primary-200 dark:hover:border-primary-500/30 transition-all duration-300 hover:-translate-y-1"
              >
                {/* Status Indicator */}
                <div className="flex items-center justify-between mb-4">
                  <span className="flex items-center gap-1.5 px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full text-xs font-semibold">
                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                    Активна
                  </span>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                    quiz.type === 'kahoot'
                      ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300'
                      : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                  }`}>
                    {quiz.type === 'kahoot' ? '🎯 Kahoot' : '⚡ Quizizz'}
                  </span>
                </div>

                {/* Content */}
                <h3 className="text-lg font-bold text-neutral-900 dark:text-white mb-2 line-clamp-2 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                  {quiz.title}
                </h3>
                {quiz.description && (
                  <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-4 line-clamp-2">
                    {quiz.description}
                  </p>
                )}

                {/* Meta */}
                <div className="flex items-center gap-3 text-xs text-neutral-500 dark:text-neutral-400 mb-4">
                  <span className="flex items-center gap-1">
                    <Users className="w-3.5 h-3.5" />
                    {quiz.teacherName}
                  </span>
                  <span className="flex items-center gap-1">
                    <HelpCircle className="w-3.5 h-3.5" />
                    {quiz.questionsCount} вопросов
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {quiz.settings?.timePerQuestion}с
                  </span>
                </div>

                {/* Divider + Info */}
                <div className="pt-4 border-t border-neutral-100 dark:border-neutral-800">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-neutral-500">
                      <Trophy className="w-4 h-4 text-yellow-500" />
                      <span>{quiz.settings?.pointsPerQuestion} очков/вопрос</span>
                    </div>
                    <div className="text-xs text-neutral-400">
                      Нужен код для входа
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
