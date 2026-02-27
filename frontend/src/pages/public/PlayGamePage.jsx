import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Play, Clock, CheckCircle, XCircle, Award, Users, Zap } from 'lucide-react';
import quizService from '../../services/quizService';

const PlayGamePage = () => {
  const { code } = useParams();
  const navigate = useNavigate();
  
  // Состояния игры
  const [gameState, setGameState] = useState('joining'); // joining, playing, result, finished
  const [quiz, setQuiz] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [score, setScore] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [playerName, setPlayerName] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCorrect, setShowCorrect] = useState(false);

  // Загрузка квиза по коду
  useEffect(() => {
    const loadQuiz = async () => {
      try {
        setLoading(true);
        const response = await quizService.getQuizByCode(code);
        if (response.data) {
          setQuiz(response.data);
          setQuestions(response.questions || []);
        }
      } catch (err) {
        setError('Игра не найдена или уже завершена');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (code) {
      loadQuiz();
    }
  }, [code]);

  // Таймер
  useEffect(() => {
    if (gameState !== 'playing' || timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          handleTimeUp();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [gameState, timeLeft]);

  const handleTimeUp = useCallback(() => {
    if (selectedAnswer === null) {
      // Время вышло без ответа
      setAnswers(prev => [...prev, { 
        questionIndex: currentQuestionIndex, 
        selected: null, 
        correct: false,
        timeSpent: quiz?.settings?.timePerQuestion || 30
      }]);
    }
    setShowCorrect(true);
    setTimeout(() => nextQuestion(), 2000);
  }, [selectedAnswer, currentQuestionIndex, quiz]);

  // Начать игру
  const startGame = async () => {
    if (!playerName.trim()) {
      setError('Введите ваше имя');
      return;
    }

    if (questions.length === 0) {
      setError('В игре нет вопросов');
      return;
    }

    setGameState('playing');
    setTimeLeft(quiz?.settings?.timePerQuestion || 30);
    setError('');
  };

  // Выбор ответа
  const selectAnswer = (answerIndex) => {
    if (selectedAnswer !== null || showCorrect) return;
    
    setSelectedAnswer(answerIndex);
    const question = questions[currentQuestionIndex];
    const isCorrect = question?.answers[answerIndex]?.isCorrect || false;
    const timeSpent = (quiz?.settings?.timePerQuestion || 30) - timeLeft;
    
    let newScore = score;
    // Начисляем очки (больше очков за быстрый ответ)
    if (isCorrect) {
      const basePoints = quiz?.settings?.pointsPerQuestion || 100;
      const timeBonus = Math.round((timeLeft / (quiz?.settings?.timePerQuestion || 30)) * basePoints);
      newScore = score + timeBonus;
      setScore(newScore);
    }

    const newAnswers = [...answers, {
      questionIndex: currentQuestionIndex,
      selected: answerIndex,
      correct: isCorrect,
      timeSpent
    }];
    setAnswers(newAnswers);

    setShowCorrect(true);
    setTimeout(() => nextQuestion(), 2000);
  };

  // Следующий вопрос
  const nextQuestion = async () => {
    setShowCorrect(false);
    setSelectedAnswer(null);
    
    if (currentQuestionIndex + 1 >= questions.length) {
      // Игра завершена — сохраняем результат
      const totalTimeSpent = answers.reduce((sum, a) => sum + (a.timeSpent || 0), 0);
      const correctCount = answers.filter(a => a.correct).length;
      
      try {
        await quizService.saveGameResult(code, {
          player_name: playerName,
          score: score,
          correct_answers: correctCount,
          total_questions: questions.length,
          answers: answers,
          time_spent: totalTimeSpent
        });
      } catch (err) {
        console.error('Error saving result:', err);
      }
      
      setGameState('finished');
    } else {
      setCurrentQuestionIndex(prev => prev + 1);
      setTimeLeft(quiz?.settings?.timePerQuestion || 30);
    }
  };

  // Рендер страницы присоединения
  const renderJoining = () => (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-indigo-600 to-blue-600 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-dark-card rounded-3xl shadow-2xl p-8 max-w-md w-full">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Play className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white mb-2">
            {quiz?.title || 'Загрузка...'}
          </h1>
          <p className="text-neutral-500 dark:text-neutral-400">
            Код игры: <span className="font-mono font-bold text-primary-600">{code}</span>
          </p>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-xl mb-6 text-center">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
              Ваше имя
            </label>
            <input
              type="text"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              placeholder="Введите имя..."
              className="w-full px-4 py-3 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-dark-bg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-lg"
              onKeyPress={(e) => e.key === 'Enter' && startGame()}
            />
          </div>

          <button
            onClick={startGame}
            disabled={!quiz || loading}
            className="w-full py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-bold text-lg hover:shadow-lg hover:scale-[1.02] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <Zap className="w-5 h-5" />
            Начать игру
          </button>
        </div>

        <div className="mt-6 flex items-center justify-center gap-4 text-sm text-neutral-500">
          <span className="flex items-center gap-1">
            <Users className="w-4 h-4" />
            {quiz?.questionsCount || '?'} вопросов
          </span>
          <span className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            {quiz?.settings?.timePerQuestion || 30} сек
          </span>
        </div>
      </div>
    </div>
  );

  // Рендер игрового процесса
  const renderPlaying = () => {
    const question = questions[currentQuestionIndex];
    if (!question) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center">
          <div className="text-white text-center">
            <p className="text-2xl">Загрузка вопроса...</p>
          </div>
        </div>
      );
    }

    const colors = [
      'from-red-500 to-rose-600',
      'from-blue-500 to-indigo-600',
      'from-yellow-500 to-orange-600',
      'from-green-500 to-emerald-600'
    ];

    const icons = ['🔺', '🔷', '🔶', '🟢'];

    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-700 via-indigo-700 to-blue-700 p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="bg-white/20 backdrop-blur-sm rounded-xl px-4 py-2 text-white">
            <span className="font-bold">{currentQuestionIndex + 1}</span>
            <span className="text-white/70">/{questions.length}</span>
          </div>
          
          {/* Timer */}
          <div className={`w-20 h-20 rounded-full flex items-center justify-center text-3xl font-bold transition-all duration-300 ${
            timeLeft <= 5 ? 'bg-red-500 animate-pulse' : 'bg-white/20 backdrop-blur-sm'
          } text-white`}>
            {timeLeft}
          </div>
          
          <div className="bg-white/20 backdrop-blur-sm rounded-xl px-4 py-2 text-white flex items-center gap-2">
            <Award className="w-5 h-5 text-yellow-400" />
            <span className="font-bold">{score}</span>
          </div>
        </div>

        {/* Question */}
        <div className="bg-white dark:bg-dark-card rounded-2xl p-6 mb-6 shadow-2xl">
          <h2 className="text-xl md:text-2xl font-bold text-neutral-900 dark:text-white text-center">
            {question.question}
          </h2>
        </div>

        {/* Answers Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {question.answers?.map((answer, index) => {
            const isSelected = selectedAnswer === index;
            const isCorrect = answer.isCorrect;
            const showResult = showCorrect;

            let bgClass = `bg-gradient-to-r ${colors[index % 4]}`;
            if (showResult) {
              if (isCorrect) {
                bgClass = 'bg-green-500 ring-4 ring-green-300';
              } else if (isSelected && !isCorrect) {
                bgClass = 'bg-red-500 ring-4 ring-red-300';
              } else {
                bgClass = 'bg-neutral-400 opacity-50';
              }
            }

            return (
              <button
                key={index}
                onClick={() => selectAnswer(index)}
                disabled={selectedAnswer !== null}
                className={`${bgClass} p-6 rounded-2xl text-white font-bold text-lg md:text-xl hover:scale-[1.02] hover:shadow-xl transition-all duration-200 disabled:cursor-not-allowed flex items-center gap-4`}
              >
                <span className="text-3xl">{icons[index % 4]}</span>
                <span className="flex-1 text-left">{answer.text}</span>
                {showResult && isCorrect && <CheckCircle className="w-8 h-8" />}
                {showResult && isSelected && !isCorrect && <XCircle className="w-8 h-8" />}
              </button>
            );
          })}
        </div>

        {/* Explanation */}
        {showCorrect && question.explanation && (
          <div className="mt-6 bg-white/10 backdrop-blur-sm rounded-xl p-4 text-white text-center animate-fade-in">
            <p className="text-lg">{question.explanation}</p>
          </div>
        )}
      </div>
    );
  };

  // Рендер результатов
  const renderFinished = () => {
    const correctCount = answers.filter(a => a.correct).length;
    const percentage = Math.round((correctCount / questions.length) * 100);
    
    let emoji = '🎉';
    let message = 'Отлично!';
    if (percentage < 50) {
      emoji = '📚';
      message = 'Нужно подучить!';
    } else if (percentage < 80) {
      emoji = '👍';
      message = 'Хороший результат!';
    }

    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-600 via-indigo-600 to-blue-600 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-dark-card rounded-3xl shadow-2xl p-8 max-w-md w-full text-center">
          <div className="text-6xl mb-4">{emoji}</div>
          <h1 className="text-3xl font-bold text-neutral-900 dark:text-white mb-2">
            {message}
          </h1>
          <p className="text-neutral-500 dark:text-neutral-400 mb-6">
            {playerName}, вы завершили игру!
          </p>

          <div className="bg-gradient-to-r from-primary-500 to-primary-600 rounded-2xl p-6 text-white mb-6">
            <div className="text-5xl font-bold mb-2">{score}</div>
            <div className="text-primary-100">очков</div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4">
              <div className="text-2xl font-bold text-green-600">{correctCount}</div>
              <div className="text-sm text-green-600/70">правильных</div>
            </div>
            <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-4">
              <div className="text-2xl font-bold text-red-600">{questions.length - correctCount}</div>
              <div className="text-sm text-red-600/70">неправильных</div>
            </div>
          </div>

          <div className="text-4xl font-bold text-neutral-900 dark:text-white mb-6">
            {percentage}%
          </div>

          <button
            onClick={() => navigate('/')}
            className="w-full py-3 bg-primary-500 hover:bg-primary-600 text-white rounded-xl font-semibold transition-colors"
          >
            Вернуться на главную
          </button>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center">
        <div className="text-white text-center">
          <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-xl">Загрузка игры...</p>
        </div>
      </div>
    );
  }

  if (error && gameState === 'joining' && !quiz) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-dark-card rounded-3xl shadow-2xl p-8 max-w-md w-full text-center">
          <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white mb-2">
            Игра не найдена
          </h1>
          <p className="text-neutral-500 mb-6">{error}</p>
          <button
            onClick={() => navigate('/join')}
            className="px-6 py-3 bg-primary-500 hover:bg-primary-600 text-white rounded-xl font-semibold transition-colors"
          >
            Попробовать другой код
          </button>
        </div>
      </div>
    );
  }

  switch (gameState) {
    case 'joining':
      return renderJoining();
    case 'playing':
      return renderPlaying();
    case 'finished':
      return renderFinished();
    default:
      return renderJoining();
  }
};

export default PlayGamePage;
