import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeft, Users, Award, Clock, Target, Trophy, 
  Trash2, RefreshCw, BarChart3, TrendingUp 
} from 'lucide-react';
import quizService from '../../services/quizService';

const QuizResultsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadResults = async () => {
    try {
      setLoading(true);
      const response = await quizService.getQuizResults(id);
      if (response.success) {
        setData(response.data);
      }
    } catch (err) {
      setError('Ошибка при загрузке результатов');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadResults();
  }, [id]);

  const handleClearResults = async () => {
    if (!confirm('Вы уверены? Все результаты будут удалены безвозвратно.')) return;
    
    try {
      await quizService.clearQuizResults(id);
      loadResults();
    } catch (err) {
      alert('Ошибка при очистке результатов');
    }
  };

  const formatTime = (seconds) => {
    if (!seconds) return '0 сек';
    if (seconds < 60) return `${seconds} сек`;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-dark-bg flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-neutral-500">Загрузка результатов...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-dark-bg flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error}</p>
          <button onClick={() => navigate(-1)} className="text-primary-500 hover:underline">
            Вернуться назад
          </button>
        </div>
      </div>
    );
  }

  const { quiz, stats, results } = data || {};

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-dark-bg py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/interactive-games')}
              className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-dark-card transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">
                Результаты: {quiz?.title}
              </h1>
              <p className="text-neutral-500">{quiz?.questionsCount} вопросов</p>
            </div>
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={loadResults}
              className="flex items-center gap-2 px-4 py-2 bg-neutral-100 dark:bg-dark-card rounded-lg hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Обновить
            </button>
            {results?.length > 0 && (
              <button
                onClick={handleClearResults}
                className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 dark:bg-red-900/20 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                Очистить
              </button>
            )}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <div className="bg-white dark:bg-dark-card rounded-xl p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-neutral-900 dark:text-white">
                  {stats?.totalPlayers || 0}
                </p>
                <p className="text-xs text-neutral-500">игроков</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-dark-card rounded-xl p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center">
                <Award className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-neutral-900 dark:text-white">
                  {stats?.avgScore || 0}
                </p>
                <p className="text-xs text-neutral-500">ср. очки</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-dark-card rounded-xl p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <Trophy className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-neutral-900 dark:text-white">
                  {stats?.maxScore || 0}
                </p>
                <p className="text-xs text-neutral-500">макс. очки</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-dark-card rounded-xl p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                <Target className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-neutral-900 dark:text-white">
                  {stats?.avgAccuracy || 0}%
                </p>
                <p className="text-xs text-neutral-500">точность</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-dark-card rounded-xl p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                <Clock className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-neutral-900 dark:text-white">
                  {formatTime(stats?.avgTime)}
                </p>
                <p className="text-xs text-neutral-500">ср. время</p>
              </div>
            </div>
          </div>
        </div>

        {/* Leaderboard */}
        <div className="bg-white dark:bg-dark-card rounded-2xl shadow-sm overflow-hidden">
          <div className="p-6 border-b border-neutral-100 dark:border-neutral-800">
            <h2 className="text-lg font-semibold text-neutral-900 dark:text-white flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-primary-500" />
              Таблица лидеров
            </h2>
          </div>

          {results?.length === 0 ? (
            <div className="p-12 text-center">
              <Users className="w-16 h-16 text-neutral-300 mx-auto mb-4" />
              <p className="text-neutral-500 text-lg">Пока никто не играл</p>
              <p className="text-neutral-400 text-sm mt-2">
                Результаты появятся после того, как студенты сыграют в игру
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-neutral-50 dark:bg-dark-bg">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                      #
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                      Игрок
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                      Очки
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                      Правильных
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                      Точность
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                      Время
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                      Дата
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                  {results?.map((result, index) => {
                    const accuracy = Math.round((result.correct_answers / result.total_questions) * 100);
                    const isTop3 = index < 3;
                    
                    return (
                      <tr key={result.id} className={isTop3 ? 'bg-yellow-50/50 dark:bg-yellow-900/10' : ''}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {index === 0 && <span className="text-2xl">🥇</span>}
                          {index === 1 && <span className="text-2xl">🥈</span>}
                          {index === 2 && <span className="text-2xl">🥉</span>}
                          {index > 2 && <span className="text-neutral-500 font-medium">{index + 1}</span>}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="font-medium text-neutral-900 dark:text-white">
                            {result.player_name}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="font-bold text-primary-600">{result.score}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-green-600">{result.correct_answers}</span>
                          <span className="text-neutral-400">/{result.total_questions}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <div className="w-16 h-2 bg-neutral-100 dark:bg-neutral-700 rounded-full overflow-hidden">
                              <div 
                                className={`h-full rounded-full ${
                                  accuracy >= 80 ? 'bg-green-500' : 
                                  accuracy >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                                }`}
                                style={{ width: `${accuracy}%` }}
                              ></div>
                            </div>
                            <span className={`text-sm font-medium ${
                              accuracy >= 80 ? 'text-green-600' : 
                              accuracy >= 50 ? 'text-yellow-600' : 'text-red-600'
                            }`}>
                              {accuracy}%
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-neutral-500">
                          {formatTime(result.time_spent)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-neutral-400 text-sm">
                          {new Date(result.completed_at).toLocaleDateString('ru-RU', {
                            day: 'numeric',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default QuizResultsPage;
