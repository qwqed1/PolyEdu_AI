import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { BookMarked, BrainCircuit, ChevronRight, Compass, Filter, FlaskConical, Gamepad2, ListChecks, Map, Search, Sparkles } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { getLabSubjectByKey, getLocalizedText, getSubjectTitle, labCatalog, labFamilyLabels, labGradeLabels } from '../../data/labCatalog';
import SubjectWorkspace from '../../components/lab/SubjectWorkspace';

const TOOL_LABELS = {
  globe: { ru: '3D глобус', kk: '3D глобус' },
  capitals: { ru: 'Столицы', kk: 'Астаналар' },
  regions: { ru: 'Регионы', kk: 'Өңірлер' },
  board: { ru: 'Доска', kk: 'Тақта' },
  formula: { ru: 'Формула', kk: 'Формула' },
  graph: { ru: 'График', kk: 'График' },
  reader: { ru: 'Чтение', kk: 'Оқу' },
  vocabulary: { ru: 'Словарь', kk: 'Сөздік' },
  speaking: { ru: 'Говорение', kk: 'Сөйлеу' },
  overview: { ru: 'Обзор', kk: 'Шолу' },
  ai: { ru: 'AI', kk: 'AI' },
  tasks: { ru: 'Задачи', kk: 'Тапсырмалар' },
};

const LAST_SUBJECT_KEY = 'lab:last-subject';

function getStoredTool(subjectKey, fallbackTool) {
  return localStorage.getItem(`lab:selected-tool:${subjectKey}`) || fallbackTool;
}

function setStoredTool(subjectKey, toolKey) {
  localStorage.setItem(`lab:selected-tool:${subjectKey}`, toolKey);
}

export default function LabPage() {
  const { subjectKey } = useParams();
  const navigate = useNavigate();
  const { language, t } = useLanguage();
  const [searchValue, setSearchValue] = useState('');
  const [familyFilter, setFamilyFilter] = useState('all');
  const [gradeFilter, setGradeFilter] = useState('all');
  const [selectedTool, setSelectedTool] = useState('');

  const currentSubject = getLabSubjectByKey(subjectKey) || labCatalog[0];

  useEffect(() => {
    if (!subjectKey) {
      navigate(`/lab/${localStorage.getItem(LAST_SUBJECT_KEY) || labCatalog[0].key}`, { replace: true });
      return;
    }

    localStorage.setItem(LAST_SUBJECT_KEY, currentSubject.key);
    const fallbackTool = currentSubject.enabledTools[0];
    const storedTool = getStoredTool(currentSubject.key, fallbackTool);
    setSelectedTool(currentSubject.enabledTools.includes(storedTool) ? storedTool : fallbackTool);
  }, [currentSubject.key, currentSubject.enabledTools, navigate, subjectKey]);

  useEffect(() => {
    if (currentSubject && selectedTool) {
      setStoredTool(currentSubject.key, selectedTool);
    }
  }, [currentSubject, selectedTool]);

  const visibleSubjects = labCatalog.filter((subject) => {
    const title = getSubjectTitle(subject, language).toLowerCase();
    const aliases = subject.curriculumAliases.join(' ').toLowerCase();
    const matchesSearch = !searchValue || title.includes(searchValue.toLowerCase()) || aliases.includes(searchValue.toLowerCase());
    const matchesFamily = familyFilter === 'all' || subject.subjectFamily === familyFilter;
    const matchesGrade = gradeFilter === 'all' || subject.grades.includes(gradeFilter);
    return matchesSearch && matchesFamily && matchesGrade;
  });

  const primaryPrompt = currentSubject.promptPresets[0];
  const quickActions = [
    { key: 'ai', label: language === 'kk' ? 'AI көмекшісі' : 'AI-помощник', description: language === 'kk' ? 'Пәндік промптпен чат ашу' : 'Открыть чат с предметным промптом', icon: BrainCircuit, to: `/ai-chat?prompt=${encodeURIComponent(primaryPrompt?.aiPrompt || '')}`, accent: 'from-blue-500 to-cyan-500' },
    { key: 'lesson', label: language === 'kk' ? 'Сабақ жоспары' : 'План урока', description: language === 'kk' ? 'Тақырыпты lesson plans бетіне жіберу' : 'Передать тему в lesson plans', icon: BookMarked, to: `/lesson-plans?subject=${encodeURIComponent(getSubjectTitle(currentSubject, language))}&topic=${encodeURIComponent(primaryPrompt?.lessonTopic || '')}`, accent: 'from-emerald-500 to-teal-500' },
    { key: 'game', label: language === 'kk' ? 'Ойын генераторы' : 'Генератор игры', description: language === 'kk' ? 'Дайын сценариймен ашу' : 'Открыть с готовым сценарием', icon: Gamepad2, to: `/interactive-games/ai-generator?prompt=${encodeURIComponent(primaryPrompt?.gamePrompt || '')}&title=${encodeURIComponent(`${getSubjectTitle(currentSubject, language)} Lab`)}`, accent: 'from-fuchsia-500 to-violet-500' },
  ];

  return (
    <div className="min-h-screen bg-neutral-50 px-4 py-8 dark:bg-dark-bg">
      <div className="mx-auto grid max-w-7xl gap-6 xl:grid-cols-[280px_minmax(0,1fr)_320px]">
        <aside className="space-y-5 rounded-3xl border border-neutral-200 bg-white p-5 shadow-sm dark:border-dark-border dark:bg-dark-surface">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-red-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-red-700 dark:bg-red-950/40 dark:text-red-300">
              <FlaskConical className="h-3.5 w-3.5" />
              {t.nav.lab}
            </div>
            <h1 className="mt-3 text-2xl font-bold text-neutral-900 dark:text-white">
              {language === 'kk' ? 'Пәндік лаборатория' : 'Предметная лаборатория'}
            </h1>
            <p className="mt-2 text-sm leading-6 text-neutral-600 dark:text-neutral-300">
              {language === 'kk' ? 'Қазақстан мектеп пәндері үшін бір каталог: deep модульдер, AI байланыстары және сабақ құралдары.' : 'Единый каталог школьных предметов Казахстана: deep-модули, AI-связки и инструменты для урока.'}
            </p>
          </div>

          <div className="space-y-3">
            <label className="relative block">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
              <input
                type="text"
                value={searchValue}
                onChange={(event) => setSearchValue(event.target.value)}
                placeholder={language === 'kk' ? 'Пән іздеу...' : 'Найти предмет...'}
                className="w-full rounded-2xl border border-neutral-300 bg-neutral-50 py-3 pl-11 pr-4 text-sm text-neutral-800 focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/20 dark:border-dark-border dark:bg-dark-bg dark:text-white"
              />
            </label>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
              <label className="space-y-2 text-sm font-medium text-neutral-500 dark:text-neutral-300">
                <span className="inline-flex items-center gap-2"><Filter className="h-4 w-4" />{language === 'kk' ? 'Бағыт' : 'Направление'}</span>
                <select value={familyFilter} onChange={(event) => setFamilyFilter(event.target.value)} className="w-full rounded-2xl border border-neutral-300 bg-neutral-50 px-4 py-3 text-sm text-neutral-800 focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/20 dark:border-dark-border dark:bg-dark-bg dark:text-white">
                  <option value="all">{language === 'kk' ? 'Барлығы' : 'Все'}</option>
                  {Object.entries(labFamilyLabels).map(([familyKey, label]) => (
                    <option key={familyKey} value={familyKey}>{getLocalizedText(label, language)}</option>
                  ))}
                </select>
              </label>

              <label className="space-y-2 text-sm font-medium text-neutral-500 dark:text-neutral-300">
                <span>{language === 'kk' ? 'Саты' : 'Ступень'}</span>
                <select value={gradeFilter} onChange={(event) => setGradeFilter(event.target.value)} className="w-full rounded-2xl border border-neutral-300 bg-neutral-50 px-4 py-3 text-sm text-neutral-800 focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/20 dark:border-dark-border dark:bg-dark-bg dark:text-white">
                  <option value="all">{language === 'kk' ? 'Барлығы' : 'Все'}</option>
                  {Object.entries(labGradeLabels).map(([gradeKey, label]) => (
                    <option key={gradeKey} value={gradeKey}>{getLocalizedText(label, language)}</option>
                  ))}
                </select>
              </label>
            </div>
          </div>

          <div className="space-y-2">
            {visibleSubjects.map((subject) => {
              const isActive = subject.key === currentSubject.key;
              return (
                <button
                  key={subject.key}
                  type="button"
                  onClick={() => navigate(`/lab/${subject.key}`)}
                  className={`w-full rounded-2xl border px-4 py-4 text-left transition ${isActive ? 'border-red-200 bg-red-50 shadow-sm dark:border-red-900 dark:bg-red-950/30' : 'border-neutral-200 bg-neutral-50 hover:border-red-200 hover:bg-red-50/60 dark:border-dark-border dark:bg-dark-bg dark:hover:border-red-900'}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold text-neutral-900 dark:text-white">{getSubjectTitle(subject, language)}</div>
                      <div className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">{getLocalizedText(labFamilyLabels[subject.subjectFamily], language)}</div>
                    </div>
                    <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.2em] ${subject.status === 'deep' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300' : 'bg-neutral-200 text-neutral-600 dark:bg-slate-800 dark:text-neutral-300'}`}>{subject.status}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </aside>

        <main className="space-y-6">
          <section className="overflow-hidden rounded-[2rem] bg-gradient-to-br from-slate-900 via-red-950 to-orange-900 px-6 py-8 text-white shadow-xl">
            <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
              <div className="max-w-3xl">
                <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em]">
                  <Compass className="h-3.5 w-3.5" />
                  {currentSubject.status === 'deep' ? (language === 'kk' ? 'Терең модуль' : 'Deep subject module') : (language === 'kk' ? 'Каталог + шаблон' : 'Catalog + template')}
                </div>
                <h2 className="mt-4 text-4xl font-bold">{getSubjectTitle(currentSubject, language)}</h2>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-white/80">{language === 'kk' ? currentSubject.summaryKk : currentSubject.summaryRu}</p>
                <div className="mt-5 flex flex-wrap gap-2">
                  {currentSubject.grades.map((grade) => (
                    <span key={grade} className="rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white/85">{getLocalizedText(labGradeLabels[grade], language)}</span>
                  ))}
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-3 xl:min-w-[420px]">
                {quickActions.map((action) => {
                  const Icon = action.icon;
                  return (
                    <Link key={action.key} to={action.to} className={`rounded-3xl bg-gradient-to-br ${action.accent} p-4 text-white shadow-lg transition hover:scale-[1.02]`}>
                      <Icon className="h-6 w-6" />
                      <div className="mt-4 text-sm font-semibold">{action.label}</div>
                      <div className="mt-1 text-xs leading-5 text-white/80">{action.description}</div>
                    </Link>
                  );
                })}
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {currentSubject.enabledTools.map((toolKey) => (
                <button
                  key={toolKey}
                  type="button"
                  onClick={() => setSelectedTool(toolKey)}
                  className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${selectedTool === toolKey ? 'bg-red-600 text-white' : 'bg-white text-neutral-600 shadow-sm ring-1 ring-neutral-200 dark:bg-dark-surface dark:text-neutral-300 dark:ring-dark-border'}`}
                >
                  {getLocalizedText(TOOL_LABELS[toolKey], language)}
                </button>
              ))}
            </div>

            <SubjectWorkspace subject={currentSubject} language={language} selectedTool={selectedTool} />
          </section>
        </main>

        <aside className="space-y-5">
          <div className="rounded-3xl border border-neutral-200 bg-white p-5 shadow-sm dark:border-dark-border dark:bg-dark-surface">
            <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.2em] text-neutral-400">
              <Sparkles className="h-4 w-4" />
              {language === 'kk' ? 'Промпт пресеттері' : 'Prompt presets'}
            </div>
            <div className="mt-4 space-y-3">
              {currentSubject.promptPresets.map((preset) => (
                <div key={preset.id} className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4 dark:border-dark-border dark:bg-dark-bg">
                  <div className="text-sm font-semibold text-neutral-900 dark:text-white">{getLocalizedText(preset.label, language)}</div>
                  <div className="mt-3 flex flex-wrap gap-2 text-xs font-medium">
                    <Link to={`/ai-chat?prompt=${encodeURIComponent(preset.aiPrompt)}`} className="rounded-full bg-blue-100 px-3 py-1.5 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300">AI</Link>
                    <Link to={`/interactive-games/ai-generator?prompt=${encodeURIComponent(preset.gamePrompt)}&title=${encodeURIComponent(`${getSubjectTitle(currentSubject, language)} Game`)}`} className="rounded-full bg-violet-100 px-3 py-1.5 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300">Game</Link>
                    <Link to={`/lesson-plans?subject=${encodeURIComponent(getSubjectTitle(currentSubject, language))}&topic=${encodeURIComponent(preset.lessonTopic)}`} className="rounded-full bg-emerald-100 px-3 py-1.5 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">Lesson</Link>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-neutral-200 bg-white p-5 shadow-sm dark:border-dark-border dark:bg-dark-surface">
            <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.2em] text-neutral-400">
              <ListChecks className="h-4 w-4" />
              {language === 'kk' ? 'Мини-тапсырмалар' : 'Мини-задачи'}
            </div>
            <div className="mt-4 space-y-3">
              {currentSubject.miniTaskTemplates.map((task) => (
                <div key={task.id} className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4 dark:border-dark-border dark:bg-dark-bg">
                  <div className="text-sm font-semibold text-neutral-900 dark:text-white">{getLocalizedText(task.title, language)}</div>
                  <p className="mt-2 text-sm leading-6 text-neutral-600 dark:text-neutral-300">{getLocalizedText(task.description, language)}</p>
                  <div className="mt-3 rounded-2xl bg-white px-3 py-3 text-sm text-neutral-700 shadow-sm dark:bg-slate-900 dark:text-neutral-200">{getLocalizedText(task.challenge, language)}</div>
                  <div className="mt-3 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-neutral-400">
                    <ChevronRight className="h-3.5 w-3.5" />
                    {language === 'kk' ? 'Нәтиже' : 'Результат'}
                  </div>
                  <p className="mt-1 text-sm leading-6 text-neutral-600 dark:text-neutral-300">{getLocalizedText(task.outcome, language)}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-neutral-200 bg-white p-5 shadow-sm dark:border-dark-border dark:bg-dark-surface">
            <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.2em] text-neutral-400">
              <Map className="h-4 w-4" />
              Curriculum aliases
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {currentSubject.curriculumAliases.map((alias) => (
                <span key={alias} className="rounded-full bg-neutral-100 px-3 py-1.5 text-xs font-medium text-neutral-600 dark:bg-dark-bg dark:text-neutral-300">{alias}</span>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
