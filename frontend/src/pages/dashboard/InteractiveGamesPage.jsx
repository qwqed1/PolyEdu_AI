import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Gamepad2, Plus, Play, Pause, Trash2, Edit, Copy, 
  Users, HelpCircle, Sparkles, Clock, Award, BarChart3,
  ListChecks, Wand2, Monitor
} from 'lucide-react';
import quizService from '../../services/quizService';

export default function InteractiveGamesPage() {
  const [activeTab, setActiveTab] = useState('quizzes');
  const [quizzes, setQuizzes] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [quizzesRes, statsRes] = await Promise.all([
        quizService.getQuizzes(),
        quizService.getStats()
      ]);
      setQuizzes(quizzesRes.data || []);
      setStats(statsRes.data);
    } catch (err) {
      setError('Ошибка при загрузке данных');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleActivate = async (id) => {
    try {
      const result = await quizService.activateQuiz(id);
      if (result.success) {
        // After activation, navigate to lobby
        navigate(`/interactive-games/${id}/lobby`, {
          state: { quiz: result.data }
        });
      }
    } catch (err) {
      console.error('Error activating quiz:', err);
    }
  };

  const handleDeactivate = async (id) => {
    try {
      await quizService.deactivateQuiz(id);
      loadData();
    } catch (err) {
      console.error('Error deactivating quiz:', err);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Вы уверены, что хотите удалить этот квиз?')) return;
    try {
      await quizService.deleteQuiz(id);
      loadData();
    } catch (err) {
      console.error('Error deleting quiz:', err);
    }
  };

  const copyGameCode = (code) => {
    navigator.clipboard.writeText(code);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-dark-bg flex">
      {/* Left Sidebar */}
      <div className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col flex-shrink-0">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Gamepad2 className="w-5 h-5 text-primary-500" />
            Игры
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Интерактивные активности</p>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          <button
            onClick={() => setActiveTab('quizzes')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
              activeTab === 'quizzes'
                ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            <ListChecks className="w-5 h-5" />
            <div className="text-left">
              <div>Викторины</div>
              <div className="text-xs opacity-70">{quizzes.length} создано</div>
            </div>
          </button>

          <button
            onClick={() => navigate('/interactive-games/ai-generator')}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gradient-to-r hover:from-violet-50 hover:to-fuchsia-50 dark:hover:from-violet-900/20 dark:hover:to-fuchsia-900/20 hover:text-violet-700 dark:hover:text-violet-300 transition-all"
          >
            <Wand2 className="w-5 h-5" />
            <div className="text-left">
              <div>Создать игру</div>
              <div className="text-xs opacity-70">AI генератор</div>
            </div>
          </button>
        </nav>

        <div className="p-3 border-t border-gray-200 dark:border-gray-700">
          <Link
            to="/interactive-games/create"
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-xl text-sm font-semibold hover:shadow-lg hover:scale-[1.02] transition-all"
          >
            <Plus className="w-4 h-4" />
            Новая викторина
          </Link>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 py-8 px-6 lg:px-8 overflow-y-auto">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-neutral-900 dark:text-white flex items-center gap-3">
                <Gamepad2 className="w-8 h-8 text-primary-500" />
                Интерактивные игры
              </h1>
              <p className="mt-2 text-neutral-600 dark:text-neutral-400">
                Создавайте увлекательные тесты и викторины для студентов
              </p>
            </div>
            <Link
              to="/interactive-games/create"
              className="mt-4 sm:mt-0 inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200"
            >
              <Plus className="w-5 h-5" />
              Создать викторину
            </Link>
          </div>

          {/* Stats Cards */}
          {stats && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
              <div className="card flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                  <Gamepad2 className="w-6 h-6 text-primary-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-neutral-900 dark:text-white">
                    {stats.total_quizzes || 0}
                  </p>
                  <p className="text-sm text-neutral-500">Всего игр</p>
                </div>
              </div>
              <div className="card flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                  <Play className="w-6 h-6 text-green-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-neutral-900 dark:text-white">
                    {stats.active_quizzes || 0}
                  </p>
                  <p className="text-sm text-neutral-500">Активных</p>
                </div>
              </div>
              <div className="card flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <HelpCircle className="w-6 h-6 text-blue-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-neutral-900 dark:text-white">
                    {stats.total_questions || 0}
                  </p>
                  <p className="text-sm text-neutral-500">Вопросов</p>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="mb-6 p-4 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-xl">
              {error}
            </div>
          )}

          {/* Quizzes Grid */}
          {quizzes.length === 0 ? (
            <div className="card text-center py-16">
              <Sparkles className="w-16 h-16 mx-auto text-primary-400 mb-4" />
              <h3 className="text-xl font-semibold text-neutral-900 dark:text-white mb-2">
                У вас пока нет игр
              </h3>
              <p className="text-neutral-500 mb-6">
                Создайте первую интерактивную игру для ваших студентов
              </p>
              <div className="flex items-center justify-center gap-3">
                <Link
                  to="/interactive-games/create"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-primary-500 text-white rounded-xl font-semibold hover:bg-primary-600 transition-colors"
                >
                  <Plus className="w-5 h-5" />
                  Создать викторину
                </Link>
                <button
                  onClick={() => navigate('/interactive-games/ai-generator')}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white rounded-xl font-semibold hover:from-violet-600 hover:to-fuchsia-600 transition-all"
                >
                  <Wand2 className="w-5 h-5" />
                  AI Генератор
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {quizzes.map((quiz) => (
                <div
                  key={quiz.id}
                  className="card hover:shadow-lg transition-shadow duration-200 overflow-hidden"
                >
                  {/* Type Badge */}
                  <div className="flex items-center justify-between mb-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      quiz.type === 'kahoot'
                        ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300'
                        : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                    }`}>
                      {quiz.type === 'kahoot' ? 'Kahoot стиль' : 'Quizizz стиль'}
                    </span>
                    {quiz.is_active && (
                      <span className="flex items-center gap-1 px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full text-xs font-semibold">
                        <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                        Активна
                      </span>
                    )}
                  </div>

                  {/* Title & Description */}
                  <h3 className="text-lg font-bold text-neutral-900 dark:text-white mb-2 line-clamp-2">
                    {quiz.title}
                  </h3>
                  {quiz.description && (
                    <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-4 line-clamp-2">
                      {quiz.description}
                    </p>
                  )}

                  {/* Meta Info */}
                  <div className="flex items-center gap-4 text-sm text-neutral-500 mb-4">
                    <span className="flex items-center gap-1">
                      <HelpCircle className="w-4 h-4" />
                      {quiz.questions_count || 0} вопросов
                    </span>
                    {quiz.subject_name && (
                      <span className="flex items-center gap-1">
                        <Award className="w-4 h-4" />
                        {quiz.subject_name}
                      </span>
                    )}
                  </div>

                  {/* Game Code (if active) */}
                  {quiz.is_active && quiz.game_code && (
                    <div className="mb-4 p-3 bg-neutral-100 dark:bg-dark-surface rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs text-neutral-500 mb-1">Код игры</p>
                          <p className="text-2xl font-mono font-bold text-primary-500 tracking-wider">
                            {quiz.game_code}
                          </p>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => copyGameCode(quiz.game_code)}
                            className="p-2 hover:bg-neutral-200 dark:hover:bg-dark-border rounded-lg transition-colors"
                            title="Копировать код"
                          >
                            <Copy className="w-5 h-5 text-neutral-500" />
                          </button>
                          <button
                            onClick={() => navigate(`/interactive-games/${quiz.id}/lobby`, { state: { quiz } })}
                            className="p-2 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 rounded-lg transition-colors"
                            title="Открыть лобби"
                          >
                            <Monitor className="w-5 h-5 text-indigo-500" />
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center justify-between pt-4 border-t border-neutral-200 dark:border-dark-border">
                    <div className="flex items-center gap-2">
                      {quiz.is_active ? (
                        <>
                          <button
                            onClick={() => handleDeactivate(quiz.id)}
                            className="p-2 text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded-lg transition-colors"
                            title="Остановить игру"
                          >
                            <Pause className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => navigate(`/interactive-games/${quiz.id}/lobby`, { state: { quiz } })}
                            className="p-2 text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors"
                            title="Открыть лобби"
                          >
                            <Monitor className="w-5 h-5" />
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => handleActivate(quiz.id)}
                          className="p-2 text-green-500 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
                          title="Запустить игру"
                        >
                          <Play className="w-5 h-5" />
                        </button>
                      )}
                      <Link
                        to={`/interactive-games/${quiz.id}/results`}
                        className="p-2 text-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg transition-colors"
                        title="Статистика"
                      >
                        <BarChart3 className="w-5 h-5" />
                      </Link>
                      <Link
                        to={`/interactive-games/${quiz.id}/edit`}
                        className="p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                        title="Редактировать"
                      >
                        <Edit className="w-5 h-5" />
                      </Link>
                      <button
                        onClick={() => handleDelete(quiz.id)}
                        className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                        title="Удалить"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                    <span className="text-xs text-neutral-400">
                      {new Date(quiz.created_at).toLocaleDateString('ru-RU')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
