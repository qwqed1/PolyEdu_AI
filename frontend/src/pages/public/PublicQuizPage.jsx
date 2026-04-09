import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, Loader2, PlayCircle, Trophy } from 'lucide-react';
import publicLibraryService from '../../services/publicLibraryService';

function shuffleArray(items) {
  const next = [...items];
  for (let index = next.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [next[index], next[swapIndex]] = [next[swapIndex], next[index]];
  }
  return next;
}

function prepareQuizData(quiz) {
  const questions = Array.isArray(quiz.questions) ? [...quiz.questions] : [];
  const questionList = quiz.settings?.shuffleQuestions ? shuffleArray(questions) : questions;

  return {
    ...quiz,
    questions: questionList.map((question) => ({
      ...question,
      answers: quiz.settings?.shuffleAnswers ? shuffleArray(question.answers || []) : question.answers || [],
    })),
  };
}

export default function PublicQuizPage() {
  const { id } = useParams();
  const [quiz, setQuiz] = useState(null);
  const [playerName, setPlayerName] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [started, setStarted] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [startedAt, setStartedAt] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function loadQuiz() {
      try {
        setLoading(true);
        setError('');
        const response = await publicLibraryService.getQuiz(id);
        if (!cancelled) {
          setQuiz(prepareQuizData(response.data));
        }
      } catch (loadError) {
        if (!cancelled) {
          console.error(loadError);
          setError('Публичная викторина не найдена');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadQuiz();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const totalQuestions = quiz?.questions?.length || 0;
  const currentQuestion = quiz?.questions?.[currentIndex];
  const answeredCount = useMemo(() => Object.keys(answers).length, [answers]);

  const startQuiz = () => {
    if (!playerName.trim()) {
      setError('Введите имя, чтобы начать');
      return;
    }

    setError('');
    setStarted(true);
    setStartedAt(Date.now());
  };

  const selectAnswer = (questionId, answerIndex) => {
    setAnswers((current) => ({
      ...current,
      [questionId]: answerIndex,
    }));
  };

  const goNext = () => {
    if (currentIndex < totalQuestions - 1) {
      setCurrentIndex((value) => value + 1);
    }
  };

  const goBack = () => {
    if (currentIndex > 0) {
      setCurrentIndex((value) => value - 1);
    }
  };

  const finishQuiz = async () => {
    try {
      setSubmitting(true);
      setError('');
      const payload = {
        player_name: playerName.trim(),
        time_spent: startedAt ? Math.round((Date.now() - startedAt) / 1000) : 0,
        answers: quiz.questions.map((question, index) => ({
          questionId: question.id || `q_${index}`,
          answerIndex: answers[question.id || `q_${index}`],
        })),
      };
      const response = await publicLibraryService.submitQuizResult(id, payload);
      setResult(response.data);
    } catch (submitError) {
      console.error(submitError);
      setError('Не удалось сохранить результат');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  if (error && !quiz) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="max-w-lg w-full bg-white dark:bg-dark-card rounded-2xl border border-neutral-200 dark:border-dark-border p-8 text-center">
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white mb-3">Материал недоступен</h1>
          <p className="text-neutral-500 mb-6">{error}</p>
          <Link to="/library" className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-primary-600 text-white font-semibold">
            <ArrowLeft className="w-4 h-4" />
            Вернуться в библиотеку
          </Link>
        </div>
      </div>
    );
  }

  if (!quiz) {
    return null;
  }

  if (result) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-dark-bg py-8 px-4">
        <div className="max-w-2xl mx-auto bg-white dark:bg-dark-card rounded-3xl border border-neutral-200 dark:border-dark-border p-8 shadow-sm">
          <div className="text-center">
            <div className="w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center mx-auto mb-4">
              <Trophy className="w-10 h-10 text-green-600" />
            </div>
            <h1 className="text-3xl font-black text-neutral-900 dark:text-white mb-3">Результат сохранён</h1>
            <p className="text-neutral-500 mb-8">{quiz.title}</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            <StatCard label="Очки" value={result.score} />
            <StatCard label="Правильных" value={`${result.correct_answers}/${result.total_questions}`} />
            <StatCard label="Точность" value={`${result.accuracy}%`} />
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={() => {
                setAnswers({});
                setStarted(false);
                setCurrentIndex(0);
                setResult(null);
                setStartedAt(null);
              }}
              className="flex-1 px-5 py-3 rounded-xl bg-primary-600 text-white font-semibold"
            >
              Пройти ещё раз
            </button>
            <Link
              to="/library"
              className="flex-1 px-5 py-3 rounded-xl border border-neutral-300 dark:border-dark-border text-center font-semibold text-neutral-700 dark:text-neutral-200"
            >
              Вернуться в библиотеку
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-dark-bg py-8 px-4">
      <div className="max-w-3xl mx-auto">
        <Link to="/library" className="inline-flex items-center gap-2 text-sm text-neutral-500 hover:text-primary-600 mb-4">
          <ArrowLeft className="w-4 h-4" />
          К библиотеке
        </Link>

        {!started ? (
          <div className="bg-white dark:bg-dark-card rounded-3xl border border-neutral-200 dark:border-dark-border p-8 shadow-sm">
            <div className="inline-flex items-center rounded-full bg-primary-50 dark:bg-primary-900/20 px-3 py-1 text-xs font-semibold text-primary-700 dark:text-primary-300 mb-4">
              Публичная викторина
            </div>
            <h1 className="text-3xl font-black text-neutral-900 dark:text-white mb-3">{quiz.title}</h1>
            {quiz.description && <p className="text-neutral-600 dark:text-neutral-400 mb-6">{quiz.description}</p>}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              <StatCard label="Вопросов" value={quiz.questions.length} />
              <StatCard label="Предмет" value={quiz.subject_name || '—'} />
              <StatCard label="Очков за вопрос" value={quiz.settings?.pointsPerQuestion || 100} />
            </div>

            <label className="block mb-4">
              <span className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">Ваше имя</span>
              <input
                type="text"
                value={playerName}
                onChange={(event) => setPlayerName(event.target.value)}
                className="w-full h-12 rounded-xl border border-neutral-300 dark:border-dark-border bg-white dark:bg-dark-bg px-4 text-neutral-900 dark:text-white"
                placeholder="Например: Айжан"
              />
            </label>

            {error && <div className="mb-4 rounded-xl bg-red-50 text-red-700 border border-red-200 p-3">{error}</div>}

            <button
              type="button"
              onClick={startQuiz}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary-600 text-white font-semibold"
            >
              <PlayCircle className="w-5 h-5" />
              Начать
            </button>
          </div>
        ) : (
          <div className="bg-white dark:bg-dark-card rounded-3xl border border-neutral-200 dark:border-dark-border p-8 shadow-sm">
            <div className="flex items-center justify-between mb-6 gap-4">
              <div>
                <p className="text-sm text-neutral-500">Прогресс</p>
                <h1 className="text-2xl font-black text-neutral-900 dark:text-white">
                  Вопрос {currentIndex + 1} из {totalQuestions}
                </h1>
              </div>
              <div className="text-right">
                <p className="text-sm text-neutral-500">Ответов</p>
                <p className="text-xl font-bold text-primary-600">{answeredCount}</p>
              </div>
            </div>

            <div className="w-full h-2 bg-neutral-100 dark:bg-dark-bg rounded-full overflow-hidden mb-8">
              <div
                className="h-full bg-primary-600 rounded-full transition-all"
                style={{ width: `${((currentIndex + 1) / totalQuestions) * 100}%` }}
              />
            </div>

            <h2 className="text-2xl font-bold text-neutral-900 dark:text-white mb-6">
              {currentQuestion?.question}
            </h2>

            <div className="space-y-3 mb-8">
              {currentQuestion?.answers?.map((answer) => {
                const questionId = currentQuestion.id || `q_${currentIndex}`;
                const selected = answers[questionId] === answer.index;
                return (
                  <button
                    key={answer.index}
                    type="button"
                    onClick={() => selectAnswer(questionId, answer.index)}
                    className={`w-full text-left rounded-2xl border p-4 transition-colors ${
                      selected
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                        : 'border-neutral-200 dark:border-dark-border hover:border-primary-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-6 h-6 rounded-full border flex items-center justify-center ${
                        selected ? 'border-primary-600 bg-primary-600 text-white' : 'border-neutral-300'
                      }`}>
                        {selected && <CheckCircle2 className="w-4 h-4" />}
                      </div>
                      <span className="text-neutral-800 dark:text-neutral-200">{answer.text}</span>
                    </div>
                  </button>
                );
              })}
            </div>

            {error && <div className="mb-4 rounded-xl bg-red-50 text-red-700 border border-red-200 p-3">{error}</div>}

            <div className="flex flex-col sm:flex-row gap-3 justify-between">
              <button
                type="button"
                onClick={goBack}
                disabled={currentIndex === 0}
                className="px-5 py-3 rounded-xl border border-neutral-300 dark:border-dark-border text-neutral-700 dark:text-neutral-200 disabled:opacity-50"
              >
                Назад
              </button>

              {currentIndex < totalQuestions - 1 ? (
                <button
                  type="button"
                  onClick={goNext}
                  disabled={!currentQuestion || answers[currentQuestion.id || `q_${currentIndex}`] === undefined}
                  className="px-5 py-3 rounded-xl bg-primary-600 text-white font-semibold disabled:opacity-50"
                >
                  Дальше
                </button>
              ) : (
                <button
                  type="button"
                  onClick={finishQuiz}
                  disabled={submitting || !currentQuestion || answers[currentQuestion.id || `q_${currentIndex}`] === undefined}
                  className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-green-600 text-white font-semibold disabled:opacity-50"
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  Завершить
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value }) {
  return (
    <div className="rounded-2xl bg-neutral-50 dark:bg-dark-bg p-4">
      <div className="text-xs uppercase tracking-wide text-neutral-400 mb-1">{label}</div>
      <div className="text-lg font-bold text-neutral-900 dark:text-white">{value}</div>
    </div>
  );
}
