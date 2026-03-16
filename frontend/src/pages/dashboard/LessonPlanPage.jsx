import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  AlertCircle,
  BookOpen,
  ChevronDown,
  ChevronUp,
  Clock,
  Download,
  FileText,
  Gamepad2,
  Loader2,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import lessonPlanService from '../../services/lessonPlanService';

const STAGES = [
  { key: 'stage_organization', title: 'Ұйымдастыру кезеңі (5 мин.)' },
  { key: 'stage_knowledge', title: 'Білімді өзектендіру (15 мин.)' },
  { key: 'stage_new_skills', title: 'Жаңа білім мен дағдыларды қалыптастыру (40 мин.)' },
  { key: 'stage_consolidation', title: 'Өтілген тақырыпты бекіту (15 мин.)' },
  { key: 'stage_assessment', title: 'Бағалау (5 мин.)' },
  { key: 'stage_homework', title: 'Үй тапсырмасы (3 мин.)' },
  { key: 'stage_reflection', title: 'Рефлексия (7 мин.)' },
];

function saveBlob(blob, filename) {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename || 'lesson-plan.docx';
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

function StageItem({ title, content }) {
  return (
    <div className="bg-neutral-50 dark:bg-dark-bg rounded-lg p-3">
      <div className="font-medium text-primary-700 dark:text-primary-400 mb-1">{title}</div>
      <div className="text-neutral-700 dark:text-neutral-300 whitespace-pre-wrap">
        {content || 'Не заполнено'}
      </div>
    </div>
  );
}

function buildLessonGenerationPrompt(formData, generationMode) {
  const plansCount = generationMode === 'single'
    ? 1
    : Math.max(1, Math.ceil(Number(formData.semester_hours || 0) / 2));

  const generationInstruction = generationMode === 'single'
    ? 'Сгенерируй 1 план урока.'
    : `Сгенерируй ${plansCount} планов уроков по казахстанскому стандарту.`;

  return `${generationInstruction}

Предмет/модуль: ${formData.subject_name}
Дополнительный код модуля: ${formData.module_code || ''}
Группа: ${formData.group_name}
Курс: ${formData.course}
Педагог: ${formData.teacher_name}
Часы за семестр: ${formData.semester_hours}

Сделай каждый план более подробным и с акцентом на интерактивность.
В каждом уроке обязательно распиши:
- как провести урок интерактивнее;
- какие игровые активности, мини-игры или командные задания использовать;
- во что именно играть с группой на этапе объяснения, закрепления и рефлексии;
- понятные действия преподавателя по каждому этапу.

Для каждого урока используй структуру:
1. Ұйымдастыру кезеңі (5 мин.)
2. Білімді өзектендіру (15 мин.)
3. Жаңа білім мен дағдыларды қалыптастыру (40 мин.)
4. Өтілген тақырыпты бекіту (15 мин.)
5. Бағалау (5 мин.)
6. Үй тапсырмасы (3 мин.)
7. Рефлексия (7 мин.)

Ответ дай только в виде JSON массива без пояснений:
[{"lesson_number":1,"topic":"...","lesson_type":"...","goals":"...","objectives":"...","expected_results":"...","resources_methods":"...","resources_technical":"...","stage_organization":"...","stage_knowledge":"...","stage_new_skills":"...","stage_consolidation":"...","stage_assessment":"...","stage_homework":"...","stage_reflection":"..."}]`;
}

function buildGamePrompt(plan) {
  return `Создай интерактивную учебную игру по этому плану урока.

Предмет: ${plan.subject_name || ''}
Группа: ${plan.group_name || ''}
Урок №${plan.lesson_number || ''}
Тема: ${plan.topic || ''}
Тип урока: ${plan.lesson_type || ''}

Цели урока:
${plan.goals || '-'}

Задачи урока:
${plan.objectives || '-'}

Ожидаемые результаты:
${plan.expected_results || '-'}

Используй содержание этого плана:
- Организационный этап: ${plan.stage_organization || '-'}
- Актуализация знаний: ${plan.stage_knowledge || '-'}
- Новая тема и практика: ${plan.stage_new_skills || '-'}
- Закрепление: ${plan.stage_consolidation || '-'}
- Оценивание: ${plan.stage_assessment || '-'}
- Рефлексия: ${plan.stage_reflection || '-'}

Сделай игру именно под этот урок и под игровые активности, которые подходят к этому плану.`;
}

function formatGenerationError(err) {
  const rawMessage = err?.response?.data?.error || err?.message || 'Ошибка генерации планов';
  const normalized = rawMessage.toLowerCase();

  if (
    normalized.includes('free-models-per-day') ||
    normalized.includes('rate limit') ||
    normalized.includes('quota') ||
    normalized.includes('add 10 credits')
  ) {
    return 'Лимит бесплатных AI-запросов исчерпан. Пополните баланс в OpenRouter (минимум на 10 кредитов) или дождитесь сброса суточного лимита.';
  }

  return rawMessage;
}

export default function LessonPlanPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  const [expandedPlan, setExpandedPlan] = useState(null);
  const [downloadingPlanId, setDownloadingPlanId] = useState(null);
  const [downloadingSubject, setDownloadingSubject] = useState('');
  const [generationMode, setGenerationMode] = useState('semester');
  const [formData, setFormData] = useState({
    subject_name: '',
    module_code: '',
    group_name: '',
    course: 1,
    semester_hours: 36,
    teacher_name: user?.full_name || '',
  });

  useEffect(() => {
    loadPlans();
  }, []);

  useEffect(() => {
    const subject = searchParams.get('subject');
    const topic = searchParams.get('topic');

    if (!subject && !topic) {
      return;
    }

    setFormData((current) => ({
      ...current,
      subject_name: subject || current.subject_name,
      module_code: topic || current.module_code,
    }));
  }, [searchParams]);

  const loadPlans = async () => {
    try {
      setLoading(true);
      setError('');

      try {
        await lessonPlanService.initTable();
      } catch (initErr) {
        console.log('Table init:', initErr.message);
      }

      const data = await lessonPlanService.getAll();
      setPlans(data || []);
    } catch (err) {
      console.error('Error loading plans:', err);
      setPlans([]);
    } finally {
      setLoading(false);
    }
  };

  const generatePlans = async () => {
    if (!formData.subject_name || !formData.group_name) {
      setError('Укажите модуль/предмет и группу');
      return;
    }

    setGenerating(true);
    setError('');

    try {
      const prompt = buildLessonGenerationPrompt(formData, generationMode);
      const result = await lessonPlanService.generate(prompt);

      if (!result.success || !result.plans || result.plans.length === 0) {
        setError('AI не вернул данные. Попробуйте ещё раз.');
        return;
      }

      const plansWithMeta = result.plans.map((plan, index) => ({
        ...plan,
        subject_name: formData.subject_name,
        module_code: formData.module_code,
        group_name: formData.group_name,
        course: formData.course,
        teacher_name: formData.teacher_name,
        semester_hours: formData.semester_hours,
        lesson_number: plan.lesson_number || index + 1,
      }));

      await lessonPlanService.createMany(plansWithMeta);
      await loadPlans();
    } catch (err) {
      console.error('Generate error:', err);
      setError(formatGenerationError(err));
    } finally {
      setGenerating(false);
    }
  };

  const deletePlan = async (id) => {
    if (!window.confirm('Удалить этот план урока?')) {
      return;
    }

    try {
      await lessonPlanService.delete(id);
      setPlans((current) => current.filter((plan) => plan.id !== id));
    } catch (err) {
      console.error('Delete plan error:', err);
      setError('Ошибка удаления');
    }
  };

  const downloadPlanDocx = async (planId) => {
    try {
      setDownloadingPlanId(planId);
      setError('');
      const { blob, filename } = await lessonPlanService.exportDocx(planId);
      saveBlob(blob, filename);
    } catch (err) {
      console.error('DOCX export error:', err);
      setError(err.response?.data?.error || err.message || 'Ошибка выгрузки DOCX');
    } finally {
      setDownloadingPlanId(null);
    }
  };

  const downloadSubjectDocx = async (subjectName) => {
    try {
      setDownloadingSubject(subjectName);
      setError('');
      const { blob, filename } = await lessonPlanService.exportSubjectDocx(subjectName);
      saveBlob(blob, filename);
    } catch (err) {
      console.error('Subject DOCX export error:', err);
      setError(err.response?.data?.error || err.message || 'Ошибка выгрузки DOCX');
    } finally {
      setDownloadingSubject('');
    }
  };

  const openGameGenerator = (plan) => {
    const prompt = buildGamePrompt(plan);
    const title = `Игра к уроку ${plan.lesson_number || ''}`;
    navigate(
      `/interactive-games/ai-generator?prompt=${encodeURIComponent(prompt)}&title=${encodeURIComponent(title)}`,
    );
  };

  const groupedPlans = plans.reduce((acc, plan) => {
    const key = plan.subject_name || 'Без предмета';
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(plan);
    return acc;
  }, {});

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-dark-bg py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold gradient-text-primary flex items-center gap-3">
            <BookOpen className="w-8 h-8" />
            Оқу сабағының жоспары
          </h1>
          <p className="text-neutral-600 dark:text-neutral-400 mt-2">
            Генерация, хранение и выгрузка планов уроков в DOCX
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <span className="text-red-700 dark:text-red-400">{error}</span>
            <button onClick={() => setError('')} className="ml-auto" type="button">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        <div className="bg-white dark:bg-dark-card rounded-2xl shadow-lg p-6 mb-8 border border-neutral-200 dark:border-dark-border">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-500" />
            Генерация планов уроков
          </h2>

          <div className="flex flex-wrap gap-2 mb-4">
            <button
              type="button"
              onClick={() => setGenerationMode('semester')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                generationMode === 'semester'
                  ? 'bg-primary-600 text-white'
                  : 'bg-neutral-100 text-neutral-700 dark:bg-dark-bg dark:text-neutral-300'
              }`}
            >
              По часам
            </button>
            <button
              type="button"
              onClick={() => setGenerationMode('single')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                generationMode === 'single'
                  ? 'bg-primary-600 text-white'
                  : 'bg-neutral-100 text-neutral-700 dark:bg-dark-bg dark:text-neutral-300'
              }`}
            >
              Один урок
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-1">Модуль/Предмет *</label>
              <input
                type="text"
                value={formData.subject_name}
                onChange={(event) => setFormData((current) => ({ ...current, subject_name: event.target.value }))}
                className="w-full px-4 py-2 rounded-lg border border-neutral-300 dark:border-dark-border bg-white dark:bg-dark-bg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Топ (группа) *</label>
              <input
                type="text"
                value={formData.group_name}
                onChange={(event) => setFormData((current) => ({ ...current, group_name: event.target.value }))}
                className="w-full px-4 py-2 rounded-lg border border-neutral-300 dark:border-dark-border bg-white dark:bg-dark-bg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Курс</label>
              <select
                value={formData.course}
                onChange={(event) => setFormData((current) => ({ ...current, course: parseInt(event.target.value, 10) }))}
                className="w-full px-4 py-2 rounded-lg border border-neutral-300 dark:border-dark-border bg-white dark:bg-dark-bg focus:ring-2 focus:ring-primary-500"
              >
                <option value={1}>1 курс</option>
                <option value={2}>2 курс</option>
                <option value={3}>3 курс</option>
                <option value={4}>4 курс</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Педагог</label>
              <input
                type="text"
                value={formData.teacher_name}
                onChange={(event) => setFormData((current) => ({ ...current, teacher_name: event.target.value }))}
                className="w-full px-4 py-2 rounded-lg border border-neutral-300 dark:border-dark-border bg-white dark:bg-dark-bg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Часов за семестр</label>
              <input
                type="number"
                min="2"
                max="200"
                value={formData.semester_hours}
                onChange={(event) => setFormData((current) => ({
                  ...current,
                  semester_hours: parseInt(event.target.value, 10) || 36,
                }))}
                className="w-full px-4 py-2 rounded-lg border border-neutral-300 dark:border-dark-border bg-white dark:bg-dark-bg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
              <p className="text-xs text-neutral-500 mt-1">
                {generationMode === 'single'
                  ? 'Будет создан 1 урок'
                  : `≈ ${Math.ceil(formData.semester_hours / 2)} уроков`}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={generatePlans}
            disabled={generating}
            className="w-full md:w-auto mt-4 px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-lg rounded-xl font-semibold flex items-center justify-center gap-3 hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 transition-all shadow-lg"
          >
            {generating ? (
              <>
                <Loader2 className="w-6 h-6 animate-spin" />
                Генерация планов...
              </>
            ) : (
              <>
                <Sparkles className="w-6 h-6" />
                Сгенерировать планы
              </>
            )}
          </button>
        </div>

        {Object.keys(groupedPlans).length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-dark-card rounded-2xl border border-neutral-200 dark:border-dark-border">
            <FileText className="w-16 h-16 mx-auto text-neutral-400 mb-4" />
            <h3 className="text-xl font-medium text-neutral-600 dark:text-neutral-400">
              Нет планов уроков
            </h3>
            <p className="text-neutral-500 mt-2">
              Используйте форму выше для генерации планов
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedPlans).map(([subject, subjectPlans]) => (
              <div
                key={subject}
                className="bg-white dark:bg-dark-card rounded-2xl shadow-lg border border-neutral-200 dark:border-dark-border overflow-hidden"
              >
                <div className="p-4 bg-gradient-to-r from-primary-600 to-accent-500 text-white flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <h3 className="text-lg font-semibold">{subject}</h3>
                    <p className="text-sm opacity-90">
                      {subjectPlans.length} уроков • Группа: {subjectPlans[0]?.group_name}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => downloadSubjectDocx(subject)}
                    disabled={downloadingSubject === subject}
                    className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-white/15 hover:bg-white/25 disabled:opacity-60 transition-colors text-sm font-medium"
                  >
                    {downloadingSubject === subject ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Download className="w-4 h-4" />
                    )}
                    <span>Все в DOCX</span>
                  </button>
                </div>

                <div className="divide-y divide-neutral-200 dark:divide-dark-border">
                  {subjectPlans.map((plan) => (
                    <div key={plan.id} className="p-4">
                      <div
                        className="flex items-center justify-between cursor-pointer gap-4"
                        onClick={() => setExpandedPlan(expandedPlan === plan.id ? null : plan.id)}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center shrink-0">
                            <span className="text-primary-600 font-bold">{plan.lesson_number}</span>
                          </div>
                          <div className="min-w-0">
                            <h4 className="font-medium truncate">{plan.topic || 'Без темы'}</h4>
                            <p className="text-sm text-neutral-500">
                              {plan.lesson_type || 'Тип не указан'}
                              {' • '}
                              {plan.lesson_date
                                ? new Date(plan.lesson_date).toLocaleDateString('ru-RU')
                                : 'Дата не указана'}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              openGameGenerator(plan);
                            }}
                            className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-violet-600 bg-violet-50 hover:bg-violet-100 dark:text-violet-300 dark:bg-violet-900/20 dark:hover:bg-violet-900/40 rounded-lg transition-colors"
                          >
                            <Gamepad2 className="w-4 h-4" />
                            <span className="hidden sm:inline">Игра</span>
                          </button>

                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              downloadPlanDocx(plan.id);
                            }}
                            disabled={downloadingPlanId === plan.id}
                            className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 dark:text-blue-400 dark:bg-blue-900/20 dark:hover:bg-blue-900/40 rounded-lg transition-colors disabled:opacity-60"
                          >
                            {downloadingPlanId === plan.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Download className="w-4 h-4" />
                            )}
                            <span className="hidden sm:inline">В DOCX</span>
                          </button>

                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              deletePlan(plan.id);
                            }}
                            className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>

                          {expandedPlan === plan.id ? (
                            <ChevronUp className="w-5 h-5 text-neutral-400" />
                          ) : (
                            <ChevronDown className="w-5 h-5 text-neutral-400" />
                          )}
                        </div>
                      </div>

                      {expandedPlan === plan.id && (
                        <div className="mt-4 pt-4 border-t border-neutral-200 dark:border-dark-border">
                          <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                              <tbody className="divide-y divide-neutral-200 dark:divide-dark-border">
                                <tr>
                                  <td className="py-2 font-medium w-1/3">Мақсаты</td>
                                  <td className="py-2 whitespace-pre-wrap">{plan.goals || '-'}</td>
                                </tr>
                                <tr>
                                  <td className="py-2 font-medium">Міндеттері</td>
                                  <td className="py-2 whitespace-pre-wrap">{plan.objectives || '-'}</td>
                                </tr>
                                <tr>
                                  <td className="py-2 font-medium">Күтілетін нәтижелер</td>
                                  <td className="py-2 whitespace-pre-wrap">{plan.expected_results || '-'}</td>
                                </tr>
                              </tbody>
                            </table>
                          </div>

                          <div className="mt-4">
                            <h5 className="font-semibold mb-3 flex items-center gap-2">
                              <Clock className="w-4 h-4" />
                              Сабақтың барысы
                            </h5>
                            <div className="space-y-3">
                              {STAGES.map((stage) => (
                                <StageItem
                                  key={stage.key}
                                  title={stage.title}
                                  content={plan[stage.key]}
                                />
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
