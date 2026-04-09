import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Download, FileText, Loader2 } from 'lucide-react';
import publicLibraryService from '../../services/publicLibraryService';
import { getPublicResourcePath } from '../../utils/publicLinks';

const STAGES = [
  { key: 'stage_organization', title: 'Ұйымдастыру кезеңі' },
  { key: 'stage_knowledge', title: 'Білімді өзектендіру' },
  { key: 'stage_new_skills', title: 'Жаңа білім мен дағдыларды қалыптастыру' },
  { key: 'stage_consolidation', title: 'Өтілген тақырыпты бекіту' },
  { key: 'stage_assessment', title: 'Бағалау' },
  { key: 'stage_homework', title: 'Үй тапсырмасы' },
  { key: 'stage_reflection', title: 'Рефлексия' },
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

export default function PublicLessonPlanPage() {
  const { id } = useParams();
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function loadPlan() {
      try {
        setLoading(true);
        setError('');
        const response = await publicLibraryService.getLessonPlan(id);
        if (!cancelled) {
          setPlan(response.data);
        }
      } catch (loadError) {
        if (!cancelled) {
          console.error(loadError);
          setError('Публичный план не найден');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadPlan();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const handleDownload = async () => {
    try {
      setDownloading(true);
      const { blob, filename } = await publicLibraryService.downloadLessonPlanDocx(id);
      saveBlob(blob, filename);
    } catch (downloadError) {
      console.error(downloadError);
      setError('Не удалось скачать DOCX');
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  if (error || !plan) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="max-w-lg w-full bg-white dark:bg-dark-card rounded-2xl border border-neutral-200 dark:border-dark-border p-8 text-center">
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white mb-3">Материал недоступен</h1>
          <p className="text-neutral-500 mb-6">{error || 'План не найден'}</p>
          <Link to="/library" className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-primary-600 text-white font-semibold">
            <ArrowLeft className="w-4 h-4" />
            Вернуться в библиотеку
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-dark-bg py-8 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="mb-6">
          <Link to="/library" className="inline-flex items-center gap-2 text-sm text-neutral-500 hover:text-primary-600 mb-4">
            <ArrowLeft className="w-4 h-4" />
            К библиотеке
          </Link>

          <div className="bg-white dark:bg-dark-card rounded-2xl border border-neutral-200 dark:border-dark-border p-6 shadow-sm">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div>
                <div className="inline-flex items-center rounded-full bg-primary-50 dark:bg-primary-900/20 px-3 py-1 text-xs font-semibold text-primary-700 dark:text-primary-300 mb-3">
                  План урока
                </div>
                <h1 className="text-3xl font-black text-neutral-900 dark:text-white mb-2">
                  {plan.topic || 'План урока'}
                </h1>
                <p className="text-neutral-600 dark:text-neutral-400">
                  {plan.subject_name} {plan.group_name ? `• ${plan.group_name}` : ''}
                </p>
              </div>

              <button
                type="button"
                onClick={handleDownload}
                disabled={downloading}
                className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-primary-600 text-white font-semibold disabled:opacity-60"
              >
                {downloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                Скачать DOCX
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6 text-sm">
              <MetaCard label="Тип урока" value={plan.lesson_type || 'Не указан'} />
              <MetaCard label="Номер урока" value={plan.lesson_number || '—'} />
              <MetaCard label="Педагог" value={plan.teacher_name || 'Не указан'} />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[2fr,1fr] gap-6">
          <div className="space-y-6">
            <InfoSection title="Цели" content={plan.goals} />
            <InfoSection title="Задачи" content={plan.objectives} />
            <InfoSection title="Ожидаемые результаты" content={plan.expected_results} />

            <section className="bg-white dark:bg-dark-card rounded-2xl border border-neutral-200 dark:border-dark-border p-6 shadow-sm">
              <h2 className="text-xl font-bold text-neutral-900 dark:text-white mb-4">Ход урока</h2>
              <div className="space-y-3">
                {STAGES.map((stage) => (
                  <div key={stage.key} className="rounded-xl bg-neutral-50 dark:bg-dark-bg p-4">
                    <h3 className="font-semibold text-primary-700 dark:text-primary-300 mb-2">{stage.title}</h3>
                    <p className="text-sm whitespace-pre-wrap text-neutral-700 dark:text-neutral-300">
                      {plan[stage.key] || 'Не заполнено'}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          </div>

          <aside className="space-y-6">
            <section className="bg-white dark:bg-dark-card rounded-2xl border border-neutral-200 dark:border-dark-border p-6 shadow-sm">
              <h2 className="text-xl font-bold text-neutral-900 dark:text-white mb-4">Готовые материалы</h2>
              <div className="space-y-3">
                {plan.related?.quizzes?.map((quiz) => (
                  <RelatedCard
                    key={`quiz-${quiz.id}`}
                    title={quiz.title}
                    subtitle={`${quiz.questions_count || 0} вопросов`}
                    to={getPublicResourcePath('quiz', quiz.id)}
                  />
                ))}
                {plan.related?.games?.map((game) => (
                  <RelatedCard
                    key={`game-${game.id}`}
                    title={game.title}
                    subtitle="Мини-игра"
                    to={getPublicResourcePath('game', game.id)}
                  />
                ))}
                {(!plan.related?.quizzes?.length && !plan.related?.games?.length) && (
                  <p className="text-sm text-neutral-500">Связанных опубликованных материалов пока нет.</p>
                )}
              </div>
            </section>

            <section className="bg-white dark:bg-dark-card rounded-2xl border border-neutral-200 dark:border-dark-border p-6 shadow-sm">
              <h2 className="text-xl font-bold text-neutral-900 dark:text-white mb-4">Материал</h2>
              <div className="space-y-3 text-sm text-neutral-600 dark:text-neutral-400">
                <p>Предмет: {plan.subject_name || '—'}</p>
                <p>Группа: {plan.group_name || '—'}</p>
                <p>Семестр: {plan.semester_hours || '—'} часов</p>
                <p>
                  Опубликован:{' '}
                  {plan.published_at ? new Date(plan.published_at).toLocaleDateString('ru-RU') : '—'}
                </p>
              </div>
            </section>
          </aside>
        </div>
      </div>
    </div>
  );
}

function MetaCard({ label, value }) {
  return (
    <div className="rounded-xl bg-neutral-50 dark:bg-dark-bg p-4">
      <div className="text-xs uppercase tracking-wide text-neutral-400 mb-1">{label}</div>
      <div className="font-semibold text-neutral-900 dark:text-white">{value}</div>
    </div>
  );
}

function InfoSection({ title, content }) {
  return (
    <section className="bg-white dark:bg-dark-card rounded-2xl border border-neutral-200 dark:border-dark-border p-6 shadow-sm">
      <h2 className="text-xl font-bold text-neutral-900 dark:text-white mb-3">{title}</h2>
      <p className="whitespace-pre-wrap text-neutral-700 dark:text-neutral-300">{content || 'Не заполнено'}</p>
    </section>
  );
}

function RelatedCard({ title, subtitle, to }) {
  return (
    <Link
      to={to}
      className="block rounded-xl border border-neutral-200 dark:border-dark-border p-4 hover:border-primary-300 hover:shadow-sm transition-all"
    >
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center">
          <FileText className="w-5 h-5 text-primary-600" />
        </div>
        <div>
          <h3 className="font-semibold text-neutral-900 dark:text-white">{title}</h3>
          <p className="text-sm text-neutral-500">{subtitle}</p>
        </div>
      </div>
    </Link>
  );
}
