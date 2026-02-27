import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { 
  Users, Copy, Check, Play, Square, Trophy, Clock, 
  Crown, Sparkles, ArrowLeft, 
  CheckCircle, Zap, BarChart3, RefreshCw
} from 'lucide-react';
import quizService from '../../services/quizService';

export default function TeacherLobbyPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  
  const quizData = location.state?.quiz;
  
  const [gameCode, setGameCode] = useState(quizData?.game_code || '');
  const [quizTitle, setQuizTitle] = useState(quizData?.title || 'Викторина');
  const [players, setPlayers] = useState([]);
  const [gameStarted, setGameStarted] = useState(false);
  const [copied, setCopied] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const intervalRef = useRef(null);

  const fetchLeaderboard = useCallback(async (showSpinner = false) => {
    if (!gameCode) return;
    if (showSpinner) setRefreshing(true);
    try {
      const res = await quizService.getLeaderboard(gameCode);
      if (res?.data?.leaderboard) {
        setPlayers(res.data.leaderboard.map(p => ({
          id: p.rank,
          name: p.name,
          score: p.score,
          accuracy: p.accuracy,
          finished: true,
        })));
      }
      setLastUpdated(new Date());
    } catch (err) {
      // Тихо игнорируем — возможно ещё никто не сыграл
    } finally {
      if (showSpinner) setRefreshing(false);
    }
  }, [gameCode]);

  // Автополлинг каждые 5 секунд
  useEffect(() => {
    if (!gameCode) return;
    fetchLeaderboard();
    intervalRef.current = setInterval(() => fetchLeaderboard(), 5000);
    return () => clearInterval(intervalRef.current);
  }, [gameCode, fetchLeaderboard]);

  const handleRefresh = () => fetchLeaderboard(true);

  const copyCode = () => {
    navigator.clipboard.writeText(gameCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const copyLink = () => {
    const url = `${window.location.origin}/play/${gameCode}`;
    navigator.clipboard.writeText(url);
  };

  const handleStartGame = () => {
    setGameStarted(true);
  };

  const handleEndGame = () => {
    clearInterval(intervalRef.current);
    navigate(`/interactive-games/${id}/results`);
  };

  const finishedPlayers = players.filter(p => p.finished);
  const avgScore = players.length > 0 
    ? Math.round(players.reduce((sum, p) => sum + (p.score || 0), 0) / players.length) 
    : 0;

  const formatTime = (date) => {
    if (!date) return null;
    return date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-500/10 rounded-full blur-3xl"></div>
      </div>

      {/* Top Bar */}
      <div className="relative z-10 flex items-center justify-between px-6 py-4">
        <button
          onClick={() => navigate('/interactive-games')}
          className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-white/80 hover:text-white transition-all backdrop-blur-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Назад
        </button>

        <div className="flex items-center gap-3">
          {/* Refresh button */}
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            title="Обновить список игроков"
            className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-white/70 hover:text-white transition-all backdrop-blur-sm disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            Обновить
          </button>

          {!gameStarted ? (
            <button
              onClick={handleStartGame}
              className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl font-bold hover:shadow-lg hover:shadow-green-500/30 hover:scale-105 transition-all duration-200"
            >
              <Play className="w-5 h-5" />
              Начать игру
            </button>
          ) : (
            <button
              onClick={handleEndGame}
              className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-red-500 to-rose-500 text-white rounded-xl font-bold hover:shadow-lg hover:shadow-red-500/30 hover:scale-105 transition-all duration-200"
            >
              <Square className="w-5 h-5" />
              Завершить
            </button>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 px-6 pb-8">
        {/* Game Code */}
        <div className="text-center mb-8">
          <p className="text-white/50 text-sm font-medium uppercase tracking-widest mb-2">
            {quizTitle}
          </p>
          <p className="text-white/70 text-lg mb-4">
            Код для подключения:
          </p>
          
          <div className="inline-flex items-center gap-4 bg-white/10 backdrop-blur-xl rounded-3xl px-10 py-6 border border-white/20 shadow-2xl">
            <div className="text-6xl md:text-8xl font-mono font-black tracking-[0.3em] text-white select-all">
              {gameCode}
            </div>
            <button
              onClick={copyCode}
              className="p-3 bg-white/20 hover:bg-white/30 rounded-xl transition-all group"
              title="Копировать код"
            >
              {copied ? (
                <Check className="w-7 h-7 text-green-400" />
              ) : (
                <Copy className="w-7 h-7 text-white/70 group-hover:text-white" />
              )}
            </button>
          </div>

          <div className="mt-4 flex items-center justify-center gap-4">
            <button
              onClick={copyLink}
              className="text-white/50 hover:text-white/80 text-sm underline underline-offset-4 transition-colors"
            >
              Скопировать ссылку для студентов
            </button>
          </div>

          <p className="text-white/40 text-sm mt-3">
            Студенты могут зайти на <span className="text-white/60 font-mono">{window.location.origin}/join</span> и ввести код
          </p>
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8 max-w-3xl mx-auto">
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/10 text-center">
            <div className="text-3xl font-bold text-white">{players.length}</div>
            <div className="text-white/50 text-sm flex items-center justify-center gap-1">
              <Users className="w-3.5 h-3.5" />
              Сыграли
            </div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/10 text-center">
            <div className="text-3xl font-bold text-yellow-400">{finishedPlayers.length}</div>
            <div className="text-white/50 text-sm flex items-center justify-center gap-1">
              <CheckCircle className="w-3.5 h-3.5" />
              Завершили
            </div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/10 text-center">
            <div className="text-3xl font-bold text-purple-400">{avgScore}</div>
            <div className="text-white/50 text-sm flex items-center justify-center gap-1">
              <BarChart3 className="w-3.5 h-3.5" />
              Средний балл
            </div>
          </div>
        </div>

        {/* Player List */}
        <div className="max-w-3xl mx-auto bg-white/10 backdrop-blur-sm rounded-2xl border border-white/10 overflow-hidden">
          <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
            <h3 className="text-white font-bold text-lg flex items-center gap-2">
              <Trophy className="w-5 h-5 text-yellow-400" />
              Таблица лидеров
            </h3>
            <div className="flex items-center gap-3">
              {lastUpdated && (
                <span className="text-white/30 text-xs">
                  <Clock className="w-3 h-3 inline mr-1" />
                  {formatTime(lastUpdated)}
                </span>
              )}
              <span className="text-white/40 text-sm">{players.length} игроков</span>
            </div>
          </div>

          {players.length === 0 ? (
            <div className="py-16 text-center">
              <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                <Users className="w-10 h-10 text-white/30" />
              </div>
              <p className="text-white/40 text-lg">Ожидание игроков...</p>
              <p className="text-white/30 text-sm mt-2">Студенты присоединятся по коду выше</p>
              <p className="text-white/20 text-xs mt-1">Список обновляется автоматически каждые 5 сек</p>
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {[...players]
                .sort((a, b) => (b.score || 0) - (a.score || 0))
                .map((player, index) => (
                <div
                  key={player.id || index}
                  className="flex items-center gap-4 px-6 py-3 hover:bg-white/5 transition-colors"
                >
                  {/* Rank */}
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm ${
                    index === 0 ? 'bg-yellow-500/30 text-yellow-300' :
                    index === 1 ? 'bg-gray-400/30 text-gray-300' :
                    index === 2 ? 'bg-amber-700/30 text-amber-400' :
                    'bg-white/10 text-white/50'
                  }`}>
                    {index === 0 ? <Crown className="w-4 h-4" /> : index + 1}
                  </div>

                  {/* Player info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-white truncate">{player.name}</span>
                      {player.finished && (
                        <CheckCircle className="w-3.5 h-3.5 text-green-400 flex-shrink-0" />
                      )}
                    </div>
                    {player.accuracy !== undefined && (
                      <div className="text-white/40 text-xs">Точность: {player.accuracy}%</div>
                    )}
                  </div>

                  {/* Score */}
                  <div className="text-right">
                    <span className="text-xl font-bold text-white">
                      {player.score || 0}
                    </span>
                    <span className="text-white/40 text-xs ml-1">очков</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Auto-refresh note */}
        <div className="text-center mt-4">
          <p className="text-white/20 text-xs flex items-center justify-center gap-1">
            <Zap className="w-3 h-3" />
            Авто-обновление каждые 5 сек · 
            <button onClick={handleRefresh} className="underline hover:text-white/40 transition-colors ml-1">
              Обновить сейчас
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
