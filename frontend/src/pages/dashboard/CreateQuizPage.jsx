import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft, Save, Sparkles, Plus, Trash2, GripVertical,
  Image, Clock, Shuffle, Eye, Award, Loader2, CheckCircle2
} from 'lucide-react';
import quizService from '../../services/quizService';
import subjectService from '../../services/subjectService';

export default function CreateQuizPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = Boolean(id);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [subjects, setSubjects] = useState([]);
  
  const [quiz, setQuiz] = useState({
    title: '',
    description: '',
    type: 'kahoot',
    subject_id: '',
    questions: [],
    settings: {
      timePerQuestion: 30,
      shuffleQuestions: false,
      shuffleAnswers: false,
      showCorrectAnswers: true,
      pointsPerQuestion: 100
    }
  });

  // AI Generator State
  const [aiTopic, setAiTopic] = useState('');
  const [aiCount, setAiCount] = useState(5);
  const [aiDifficulty, setAiDifficulty] = useState('medium');

  useEffect(() => {
    loadSubjects();
    if (isEditing) {
      loadQuiz();
    }
  }, [id]);

  const loadSubjects = async () => {
    try {
      const res = await subjectService.getSubjects();
      setSubjects(res.data || []);
    } catch (err) {
      console.error('Error loading subjects:', err);
    }
  };

  const loadQuiz = async () => {
    try {
      setLoading(true);
      const res = await quizService.getQuizById(id);
      if (res.success) {
        setQuiz(res.data);
      }
    } catch (err) {
      console.error('Error loading quiz:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!quiz.title.trim()) {
      alert('Введите название игры');
      return;
    }
    if (quiz.questions.length === 0) {
      alert('Добавьте хотя бы один вопрос');
      return;
    }

    try {
      setSaving(true);
      if (isEditing) {
        await quizService.updateQuiz(id, quiz);
      } else {
        await quizService.createQuiz(quiz);
      }
      navigate('/interactive-games');
    } catch (err) {
      console.error('Error saving quiz:', err);
      alert('Ошибка при сохранении');
    } finally {
      setSaving(false);
    }
  };

  const handleGenerateQuestions = async () => {
    if (!aiTopic.trim()) {
      alert('Введите тему для генерации');
      return;
    }

    try {
      setGenerating(true);
      const res = await quizService.generateQuestions(aiTopic, aiCount, aiDifficulty);
      if (res.success && res.data.questions) {
        setQuiz(prev => ({
          ...prev,
          questions: [...prev.questions, ...res.data.questions]
        }));
        setAiTopic('');
      }
    } catch (err) {
      console.error('Error generating questions:', err);
      alert('Ошибка при генерации вопросов');
    } finally {
      setGenerating(false);
    }
  };

  const addQuestion = () => {
    const newQuestion = {
      id: `q_${Date.now()}`,
      question: '',
      answers: [
        { text: '', isCorrect: true },
        { text: '', isCorrect: false },
        { text: '', isCorrect: false },
        { text: '', isCorrect: false }
      ],
      explanation: ''
    };
    setQuiz(prev => ({
      ...prev,
      questions: [...prev.questions, newQuestion]
    }));
  };

  const updateQuestion = (index, field, value) => {
    setQuiz(prev => ({
      ...prev,
      questions: prev.questions.map((q, i) =>
        i === index ? { ...q, [field]: value } : q
      )
    }));
  };

  const updateAnswer = (qIndex, aIndex, field, value) => {
    setQuiz(prev => ({
      ...prev,
      questions: prev.questions.map((q, qI) =>
        qI === qIndex
          ? {
              ...q,
              answers: q.answers.map((a, aI) =>
                aI === aIndex
                  ? { ...a, [field]: value }
                  : field === 'isCorrect' && value === true
                    ? { ...a, isCorrect: false }
                    : a
              )
            }
          : q
      )
    }));
  };

  const removeQuestion = (index) => {
    setQuiz(prev => ({
      ...prev,
      questions: prev.questions.filter((_, i) => i !== index)
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-dark-bg py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => navigate('/interactive-games')}
            className="p-2 hover:bg-neutral-200 dark:hover:bg-dark-surface rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-neutral-600 dark:text-neutral-400" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">
              {isEditing ? 'Редактировать игру' : 'Создать новую игру'}
            </h1>
            <p className="text-neutral-500">
              Заполните информацию и добавьте вопросы
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Info */}
          <div className="card">
            <h2 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4">
              Основная информация
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                  Название игры *
                </label>
                <input
                  type="text"
                  value={quiz.title}
                  onChange={(e) => setQuiz(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Например: Викторина по истории Казахстана"
                  className="w-full px-4 py-3 border border-neutral-300 dark:border-dark-border rounded-xl bg-white dark:bg-dark-surface text-neutral-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                  Описание
                </label>
                <textarea
                  value={quiz.description}
                  onChange={(e) => setQuiz(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Краткое описание игры..."
                  rows={2}
                  className="w-full px-4 py-3 border border-neutral-300 dark:border-dark-border rounded-xl bg-white dark:bg-dark-surface text-neutral-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                    Тип игры
                  </label>
                  <select
                    value={quiz.type}
                    onChange={(e) => setQuiz(prev => ({ ...prev, type: e.target.value }))}
                    className="w-full px-4 py-3 border border-neutral-300 dark:border-dark-border rounded-xl bg-white dark:bg-dark-surface text-neutral-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="kahoot">Kahoot стиль (соревнование)</option>
                    <option value="quizizz">Quizizz стиль (свой темп)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                    Предмет
                  </label>
                  <select
                    value={quiz.subject_id || ''}
                    onChange={(e) => setQuiz(prev => ({ ...prev, subject_id: e.target.value || null }))}
                    className="w-full px-4 py-3 border border-neutral-300 dark:border-dark-border rounded-xl bg-white dark:bg-dark-surface text-neutral-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="">Без предмета</option>
                    {subjects.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Settings */}
          <div className="card">
            <h2 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4">
              Настройки игры
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                  <Clock className="w-4 h-4" />
                  Время на вопрос (сек)
                </label>
                <input
                  type="number"
                  min="5"
                  max="120"
                  value={quiz.settings.timePerQuestion}
                  onChange={(e) => setQuiz(prev => ({
                    ...prev,
                    settings: { ...prev.settings, timePerQuestion: parseInt(e.target.value) }
                  }))}
                  className="w-full px-4 py-2 border border-neutral-300 dark:border-dark-border rounded-xl bg-white dark:bg-dark-surface text-neutral-900 dark:text-white"
                />
              </div>
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                  <Award className="w-4 h-4" />
                  Очки за вопрос
                </label>
                <input
                  type="number"
                  min="10"
                  max="1000"
                  step="10"
                  value={quiz.settings.pointsPerQuestion}
                  onChange={(e) => setQuiz(prev => ({
                    ...prev,
                    settings: { ...prev.settings, pointsPerQuestion: parseInt(e.target.value) }
                  }))}
                  className="w-full px-4 py-2 border border-neutral-300 dark:border-dark-border rounded-xl bg-white dark:bg-dark-surface text-neutral-900 dark:text-white"
                />
              </div>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={quiz.settings.shuffleQuestions}
                  onChange={(e) => setQuiz(prev => ({
                    ...prev,
                    settings: { ...prev.settings, shuffleQuestions: e.target.checked }
                  }))}
                  className="w-5 h-5 rounded border-neutral-300 text-primary-500 focus:ring-primary-500"
                />
                <span className="flex items-center gap-2 text-sm text-neutral-700 dark:text-neutral-300">
                  <Shuffle className="w-4 h-4" />
                  Перемешивать вопросы
                </span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={quiz.settings.shuffleAnswers}
                  onChange={(e) => setQuiz(prev => ({
                    ...prev,
                    settings: { ...prev.settings, shuffleAnswers: e.target.checked }
                  }))}
                  className="w-5 h-5 rounded border-neutral-300 text-primary-500 focus:ring-primary-500"
                />
                <span className="flex items-center gap-2 text-sm text-neutral-700 dark:text-neutral-300">
                  <Shuffle className="w-4 h-4" />
                  Перемешивать ответы
                </span>
              </label>
            </div>
          </div>

          {/* AI Generator */}
          <div className="card bg-gradient-to-br from-primary-50 to-purple-50 dark:from-primary-900/20 dark:to-purple-900/20 border-primary-200 dark:border-primary-800">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-purple-500 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">
                  ИИ-Генератор вопросов
                </h2>
                <p className="text-sm text-neutral-500">
                  Автоматически создайте вопросы на любую тему
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div className="sm:col-span-2">
                <input
                  type="text"
                  value={aiTopic}
                  onChange={(e) => setAiTopic(e.target.value)}
                  placeholder="Введите тему (например: Великий шёлковый путь)"
                  className="w-full px-4 py-3 border border-primary-200 dark:border-primary-800 rounded-xl bg-white dark:bg-dark-surface text-neutral-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <select
                value={aiCount}
                onChange={(e) => setAiCount(parseInt(e.target.value))}
                className="px-4 py-3 border border-primary-200 dark:border-primary-800 rounded-xl bg-white dark:bg-dark-surface text-neutral-900 dark:text-white"
              >
                <option value={3}>3 вопроса</option>
                <option value={5}>5 вопросов</option>
                <option value={10}>10 вопросов</option>
              </select>
              <button
                type="button"
                onClick={handleGenerateQuestions}
                disabled={generating || !aiTopic.trim()}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-primary-500 to-purple-500 text-white rounded-xl font-semibold hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {generating ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Генерация...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    Сгенерировать
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Questions */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">
                Вопросы ({quiz.questions.length})
              </h2>
              <button
                type="button"
                onClick={addQuestion}
                className="inline-flex items-center gap-2 px-4 py-2 text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg font-medium transition-colors"
              >
                <Plus className="w-5 h-5" />
                Добавить вопрос
              </button>
            </div>

            {quiz.questions.length === 0 ? (
              <div className="text-center py-12 text-neutral-500">
                <p className="mb-4">Нет вопросов. Добавьте вручную или сгенерируйте с помощью ИИ.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {quiz.questions.map((q, qIndex) => (
                  <div
                    key={q.id}
                    className="p-4 bg-neutral-50 dark:bg-dark-surface rounded-xl border border-neutral-200 dark:border-dark-border"
                  >
                    <div className="flex items-start gap-3 mb-4">
                      <div className="flex items-center gap-2 text-neutral-400">
                        <GripVertical className="w-5 h-5 cursor-grab" />
                        <span className="font-bold">{qIndex + 1}</span>
                      </div>
                      <div className="flex-1">
                        <textarea
                          value={q.question}
                          onChange={(e) => updateQuestion(qIndex, 'question', e.target.value)}
                          placeholder="Введите текст вопроса..."
                          rows={2}
                          className="w-full px-4 py-2 border border-neutral-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg text-neutral-900 dark:text-white resize-none"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => removeQuestion(qIndex)}
                        className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>

                    {/* Answers */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 ml-2 sm:ml-10">
                      {q.answers.map((a, aIndex) => (
                        <div
                          key={aIndex}
                          className={`flex items-center gap-2 p-3 rounded-lg border-2 transition-colors ${
                            a.isCorrect
                              ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                              : 'border-neutral-200 dark:border-dark-border'
                          }`}
                        >
                          <button
                            type="button"
                            onClick={() => updateAnswer(qIndex, aIndex, 'isCorrect', true)}
                            className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                              a.isCorrect
                                ? 'bg-green-500 text-white'
                                : 'border-2 border-neutral-300 dark:border-dark-border'
                            }`}
                          >
                            {a.isCorrect && <CheckCircle2 className="w-4 h-4" />}
                          </button>
                          <input
                            type="text"
                            value={a.text}
                            onChange={(e) => updateAnswer(qIndex, aIndex, 'text', e.target.value)}
                            placeholder={`Вариант ${aIndex + 1}`}
                            className="flex-1 px-2 py-1 bg-transparent text-neutral-900 dark:text-white border-none focus:outline-none"
                          />
                        </div>
                      ))}
                    </div>

                    {q.explanation && (
                      <div className="mt-3 ml-2 sm:ml-10 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-sm text-blue-700 dark:text-blue-300">
                        💡 {q.explanation}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-4 mt-8">
            <button
              type="button"
              onClick={() => navigate('/interactive-games')}
              className="w-full sm:w-auto px-6 py-3 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-dark-surface rounded-xl font-medium transition-colors"
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={saving}
              className="w-full sm:w-auto inline-flex justify-center items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl disabled:opacity-50 transition-all"
            >
              {saving ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Сохранение...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  {isEditing ? 'Сохранить' : 'Создать игру'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
