import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowRight,
  BookMarked,
  BrainCircuit,
  ChevronRight,
  Compass,
  Filter,
  FlaskConical,
  Gamepad2,
  GraduationCap,
  ListChecks,
  Map,
  Search,
  Sparkles,
  Zap,
} from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import {
  getLabSubjectByKey,
  getLocalizedText,
  getSubjectTitle,
  labCatalog,
  labFamilyLabels,
  labGradeLabels,
} from '../../data/labCatalog';
import SubjectWorkspace from '../../components/lab/SubjectWorkspace';

const TOOL_META = {
  globe: {
    label: { ru: '3D глобус', kk: '3D глобус' },
    description: {
      ru: 'Быстрый вход через карту, страны и пространственные связи.',
      kk: 'Карта, елдер және кеңістіктік байланыстар арқылы жылдам кіру.',
    },
    icon: Map,
  },
  capitals: {
    label: { ru: 'Столицы', kk: 'Астаналар' },
    description: {
      ru: 'Тренировка ориентирования через ключевые точки и сравнение.',
      kk: 'Негізгі нүктелер мен салыстыру арқылы бағдарлау жаттығуы.',
    },
    icon: Compass,
  },
  regions: {
    label: { ru: 'Регионы', kk: 'Өңірлер' },
    description: {
      ru: 'Работа с территориями, маршрутами и связями между объектами.',
      kk: 'Аумақтар, маршруттар және нысандар арасындағы байланыстармен жұмыс.',
    },
    icon: ListChecks,
  },
  board: {
    label: { ru: 'Доска', kk: 'Тақта' },
    description: {
      ru: 'Пошаговый разбор решения в одном рабочем поле.',
      kk: 'Бір жұмыс алаңында шешімді қадамдап талдау.',
    },
    icon: BookMarked,
  },
  air_board: {
    label: { ru: 'Виртуальная доска', kk: 'Виртуалды тақта' },
    description: {
      ru: 'Жестовая работа перед камерой для демонстрации хода мысли.',
      kk: 'Ой барысын көрсетуге арналған камера алдындағы ыммен жұмыс.',
    },
    icon: Sparkles,
  },
  formula: {
    label: { ru: 'Формула', kk: 'Формула' },
    description: {
      ru: 'Формулы и обозначения без перегруза лишними панелями.',
      kk: 'Артық панельдерсіз формула мен белгілеулермен жұмыс.',
    },
    icon: Zap,
  },
  graph: {
    label: { ru: 'График', kk: 'График' },
    description: {
      ru: 'Проверка гипотез через визуализацию и сравнение функций.',
      kk: 'Гипотезаны визуализация және функцияларды салыстыру арқылы тексеру.',
    },
    icon: Compass,
  },
  reader: {
    label: { ru: 'Чтение', kk: 'Оқу' },
    description: {
      ru: 'Текст, структура и фокус на понимании без отвлечений.',
      kk: 'Алаңдатусыз мәтін, құрылым және түсінуге назар.',
    },
    icon: BookMarked,
  },
  vocabulary: {
    label: { ru: 'Словарь', kk: 'Сөздік' },
    description: {
      ru: 'Ключевые слова и опоры для уверенного объяснения темы.',
      kk: 'Тақырыпты сенімді түсіндіруге арналған тірек сөздер.',
    },
    icon: GraduationCap,
  },
  speaking: {
    label: { ru: 'Говорение', kk: 'Сөйлеу' },
    description: {
      ru: 'Устная практика с быстрым заходом в ответ и рефлексию.',
      kk: 'Жауап пен рефлексияға жылдам кіретін ауызша практика.',
    },
    icon: BrainCircuit,
  },
  overview: {
    label: { ru: 'Обзор', kk: 'Шолу' },
    description: {
      ru: 'Спокойный обзор темы, чтобы быстро выстроить контекст урока.',
      kk: 'Сабақ контекстін тез құруға арналған тыныш шолу.',
    },
    icon: Compass,
  },
  ai: {
    label: { ru: 'AI', kk: 'AI' },
    description: {
      ru: 'Помощник для объяснений, идей и уточнения заданий.',
      kk: 'Түсіндіру, идея және тапсырманы нақтылауға арналған көмекші.',
    },
    icon: BrainCircuit,
  },
  tasks: {
    label: { ru: 'Задачи', kk: 'Тапсырмалар' },
    description: {
      ru: 'Мини-активности для запуска, практики и закрепления.',
      kk: 'Бастау, практика және бекітуге арналған шағын белсенділіктер.',
    },
    icon: ListChecks,
  },
  periodic: {
    label: { ru: 'Таблица Менделеева', kk: 'Менделеев кестесі' },
    description: {
      ru: 'Переход от элемента к свойствам и объяснению без лишних шагов.',
      kk: 'Элементтен қасиеттер мен түсіндіруге артық қадамсыз өту.',
    },
    icon: FlaskConical,
  },
  molecule: {
    label: { ru: '3D молекулы', kk: '3D молекулалар' },
    description: {
      ru: 'Вещество, связи и форма в одном понятном пространстве.',
      kk: 'Зат, байланыс және пішін бір түсінікті кеңістікте.',
    },
    icon: Sparkles,
  },
  reactions: {
    label: { ru: 'Реакции', kk: 'Реакциялар' },
    description: {
      ru: 'Сравнение реагентов и продуктов с акцентом на школьный сценарий.',
      kk: 'Мектептік сценарийге екпінмен реагенттер мен өнімдерді салыстыру.',
    },
    icon: Zap,
  },
  hand_molecule: {
    label: { ru: 'Hand molecule', kk: 'Hand molecule' },
    description: {
      ru: 'Управление молекулой жестами для вовлечения и демонстрации.',
      kk: 'Қызықтыру мен көрсетуге арналған молекуланы ыммен басқару.',
    },
    icon: Sparkles,
  },
  hand_circuit: {
    label: { ru: 'Hand circuit', kk: 'Hand circuit' },
    description: {
      ru: 'Интерактивная сборка цепи руками прямо перед камерой.',
      kk: 'Камера алдында тізбекті қолмен интерактивті құрастыру.',
    },
    icon: Sparkles,
  },
  current_flow: {
    label: { ru: 'Путь тока', kk: 'Ток жолы' },
    description: {
      ru: 'Наглядное объяснение, как работает замкнутый контур.',
      kk: 'Тұйық контурдың қалай жұмыс істейтінін көрнекі түсіндіру.',
    },
    icon: Zap,
  },
};

const SUBJECT_FAMILY_TONES = {
  stem: 'from-red-500/14 via-red-500/6 to-transparent text-red-700 dark:text-red-300',
  languages: 'from-amber-500/16 via-amber-500/6 to-transparent text-amber-700 dark:text-amber-300',
  social: 'from-sky-500/16 via-sky-500/6 to-transparent text-sky-700 dark:text-sky-300',
  science: 'from-emerald-500/16 via-emerald-500/6 to-transparent text-emerald-700 dark:text-emerald-300',
  arts: 'from-fuchsia-500/16 via-fuchsia-500/6 to-transparent text-fuchsia-700 dark:text-fuchsia-300',
  wellness: 'from-lime-500/16 via-lime-500/6 to-transparent text-lime-700 dark:text-lime-300',
  civic: 'from-violet-500/16 via-violet-500/6 to-transparent text-violet-700 dark:text-violet-300',
};

const STATUS_LABELS = {
  deep: { ru: 'Глубокий модуль', kk: 'Терең модуль' },
  catalog: { ru: 'Каталоговый сценарий', kk: 'Каталог сценарийі' },
};

const LAST_SUBJECT_KEY = 'lab:last-subject';
const ARENA_TOOLS = new Set(['hand_molecule', 'hand_circuit', 'air_board']);

function isArenaTool(toolKey) {
  return ARENA_TOOLS.has(toolKey);
}

function getStoredTool(subjectKey, fallbackTool) {
  return localStorage.getItem(`lab:selected-tool:${subjectKey}`) || fallbackTool;
}

function setStoredTool(subjectKey, toolKey) {
  localStorage.setItem(`lab:selected-tool:${subjectKey}`, toolKey);
}

function getToolMeta(toolKey, language) {
  const meta = TOOL_META[toolKey];

  if (!meta) {
    return {
      label: toolKey,
      description: language === 'kk' ? 'Құрал осы бөлімде ашылады.' : 'Инструмент откроется в этом разделе.',
      icon: Sparkles,
    };
  }

  return {
    label: getLocalizedText(meta.label, language),
    description: getLocalizedText(meta.description, language),
    icon: meta.icon,
  };
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
  const primaryPrompt = currentSubject.promptPresets[0];
  const currentTeacherMoves = language === 'kk' ? currentSubject.teacherMovesKk : currentSubject.teacherMovesRu;
  const selectedToolMeta = getToolMeta(selectedTool, language);

  useEffect(() => {
    if (!subjectKey) {
      navigate(`/lab/${localStorage.getItem(LAST_SUBJECT_KEY) || labCatalog[0].key}`, { replace: true });
      return;
    }

    localStorage.setItem(LAST_SUBJECT_KEY, currentSubject.key);
    const fallbackTool =
      currentSubject.enabledTools.find((tool) => !isArenaTool(tool)) ||
      currentSubject.enabledTools[0];
    const storedTool = getStoredTool(currentSubject.key, fallbackTool);
    const isStoredAllowed =
      currentSubject.enabledTools.includes(storedTool) &&
      (!isArenaTool(storedTool) || currentSubject.enabledTools.length === 1);
    const nextTool = isStoredAllowed ? storedTool : fallbackTool;
    const timerId = window.setTimeout(() => {
      setSelectedTool(nextTool);
    }, 0);

    return () => window.clearTimeout(timerId);
  }, [currentSubject.key, currentSubject.enabledTools, navigate, subjectKey]);

  useEffect(() => {
    if (
      currentSubject &&
      selectedTool &&
      (!isArenaTool(selectedTool) || currentSubject.enabledTools.length === 1)
    ) {
      setStoredTool(currentSubject.key, selectedTool);
    }
  }, [currentSubject, selectedTool]);

  const visibleSubjects = labCatalog.filter((subject) => {
    const title = getSubjectTitle(subject, language).toLowerCase();
    const summary = (language === 'kk' ? subject.summaryKk : subject.summaryRu).toLowerCase();
    const aliases = subject.curriculumAliases.join(' ').toLowerCase();
    const query = searchValue.trim().toLowerCase();
    const matchesSearch =
      !query || title.includes(query) || aliases.includes(query) || summary.includes(query);
    const matchesFamily = familyFilter === 'all' || subject.subjectFamily === familyFilter;
    const matchesGrade = gradeFilter === 'all' || subject.grades.includes(gradeFilter);
    return matchesSearch && matchesFamily && matchesGrade;
  });

  const quickActions = [
    {
      key: 'ai',
      label: language === 'kk' ? 'AI көмекшісін ашу' : 'Открыть AI-помощника',
      description: language === 'kk' ? 'Пәнге дайын промптпен бірден чатқа өту.' : 'Сразу перейти в чат с готовым предметным промптом.',
      icon: BrainCircuit,
      to: `/ai-chat?prompt=${encodeURIComponent(primaryPrompt?.aiPrompt || '')}`,
      emphasis: 'primary',
    },
    {
      key: 'lesson',
      label: language === 'kk' ? 'Сабақ жоспары' : 'План урока',
      description: language === 'kk' ? 'Тақырыпты lesson plan бетіне бірден беру.' : 'Передать тему прямо в lesson plans без повторного ввода.',
      icon: BookMarked,
      to: `/lesson-plans?subject=${encodeURIComponent(getSubjectTitle(currentSubject, language))}&topic=${encodeURIComponent(primaryPrompt?.lessonTopic || '')}`,
      emphasis: 'secondary',
    },
    {
      key: 'game',
      label: language === 'kk' ? 'Ойын генераторы' : 'Генератор игры',
      description: language === 'kk' ? 'Сабақтың соңына жылдам интерактив дайындау.' : 'Быстро подготовить интерактив под закрепление темы.',
      icon: Gamepad2,
      to: `/interactive-games/ai-generator?prompt=${encodeURIComponent(primaryPrompt?.gamePrompt || '')}&title=${encodeURIComponent(`${getSubjectTitle(currentSubject, language)} Lab`)}`,
      emphasis: 'secondary',
    },
  ];

  const summaryCards = [
    {
      key: 'tools',
      label: language === 'kk' ? 'Құрал' : 'Инструменты',
      value: currentSubject.enabledTools.length,
    },
    {
      key: 'presets',
      label: language === 'kk' ? 'Сценарий' : 'Сценарии',
      value: currentSubject.promptPresets.length,
    },
    {
      key: 'tasks',
      label: language === 'kk' ? 'Мини-тапсырма' : 'Мини-задачи',
      value: currentSubject.miniTaskTemplates.length,
    },
  ];

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#fff2ea_0%,#f8f5f1_38%,#f3f4f6_100%)] px-4 py-6 dark:bg-[radial-gradient(circle_at_top,#2b0d0d_0%,#10131a_38%,#090b10_100%)] sm:px-6 xl:px-8">
      <div className="mx-auto flex max-w-[1500px] flex-col gap-6">
        <div className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
          <aside className="lab-fade-up xl:sticky xl:top-24 xl:self-start">
            <div className="overflow-hidden rounded-[30px] border border-white/60 bg-white/85 p-5 shadow-[0_20px_50px_rgba(15,23,42,0.08)] backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/75">
              <div className="relative overflow-hidden rounded-[26px] border border-red-100 bg-gradient-to-br from-[#1e1110] via-[#351716] to-[#5d2416] p-5 text-white shadow-xl dark:border-red-900/40">
                <div className="lab-orb absolute -right-8 -top-8 h-24 w-24 rounded-full bg-red-400/25 blur-2xl" />
                <div className="lab-orb absolute bottom-0 left-0 h-20 w-20 rounded-full bg-amber-300/20 blur-2xl" style={{ animationDelay: '1.4s' }} />
                <div className="relative">
                  <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-white/90">
                    <FlaskConical className="h-3.5 w-3.5" />
                    {t.nav.lab}
                  </div>
                  <h1 className="mt-4 text-2xl font-semibold tracking-tight">
                    {language === 'kk' ? 'Пәндік лаборатория' : 'Предметная лаборатория'}
                  </h1>
                  <p className="mt-3 text-sm leading-6 text-white/72">
                    {language === 'kk'
                      ? 'Пәнді тауып, режимді бірден таңдап, сабаққа керек құралға кіру жеңіл болсын деп экран қайта жиналды.'
                      : 'Экран собран так, чтобы предмет, режим и следующий шаг читались сразу без лишнего поиска.'}
                  </p>
                </div>
              </div>

              <div className="mt-5 space-y-3">
                <label className="relative block">
                  <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                  <input
                    type="text"
                    value={searchValue}
                    onChange={(event) => setSearchValue(event.target.value)}
                    placeholder={language === 'kk' ? 'Пәнді іздеу...' : 'Найти предмет...'}
                    className="w-full rounded-2xl border border-neutral-200 bg-white px-11 py-3 text-sm text-neutral-800 outline-none transition focus:border-red-400 focus:ring-4 focus:ring-red-500/10 dark:border-white/10 dark:bg-slate-900 dark:text-white"
                  />
                </label>

                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                  <label className="space-y-2 text-sm font-medium text-neutral-500 dark:text-neutral-300">
                    <span className="inline-flex items-center gap-2">
                      <Filter className="h-4 w-4" />
                      {language === 'kk' ? 'Бағыт' : 'Направление'}
                    </span>
                    <select
                      value={familyFilter}
                      onChange={(event) => setFamilyFilter(event.target.value)}
                      className="w-full rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-800 outline-none transition focus:border-red-400 focus:ring-4 focus:ring-red-500/10 dark:border-white/10 dark:bg-slate-900 dark:text-white"
                    >
                      <option value="all">{language === 'kk' ? 'Барлығы' : 'Все'}</option>
                      {Object.entries(labFamilyLabels).map(([familyKey, label]) => (
                        <option key={familyKey} value={familyKey}>
                          {getLocalizedText(label, language)}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="space-y-2 text-sm font-medium text-neutral-500 dark:text-neutral-300">
                    <span>{language === 'kk' ? 'Саты' : 'Ступень'}</span>
                    <select
                      value={gradeFilter}
                      onChange={(event) => setGradeFilter(event.target.value)}
                      className="w-full rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-800 outline-none transition focus:border-red-400 focus:ring-4 focus:ring-red-500/10 dark:border-white/10 dark:bg-slate-900 dark:text-white"
                    >
                      <option value="all">{language === 'kk' ? 'Барлығы' : 'Все'}</option>
                      {Object.entries(labGradeLabels).map(([gradeKey, label]) => (
                        <option key={gradeKey} value={gradeKey}>
                          {getLocalizedText(label, language)}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
              </div>

              <div className="mt-5 flex items-center justify-between rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm text-neutral-600 dark:border-white/10 dark:bg-slate-900/80 dark:text-neutral-300">
                <span>{language === 'kk' ? 'Көрсетіліп тұр' : 'Показано'}</span>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-semibold text-neutral-900 dark:text-white">{visibleSubjects.length}</span>
                  {(searchValue || familyFilter !== 'all' || gradeFilter !== 'all') ? (
                    <button
                      type="button"
                      onClick={() => {
                        setSearchValue('');
                        setFamilyFilter('all');
                        setGradeFilter('all');
                      }}
                      className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-neutral-700 transition hover:bg-red-50 hover:text-red-600 dark:bg-slate-800 dark:text-neutral-200 dark:hover:bg-red-950/30 dark:hover:text-red-300"
                    >
                      {language === 'kk' ? 'Тазарту' : 'Сбросить'}
                    </button>
                  ) : null}
                </div>
              </div>

              <div className="mt-4 max-h-[58vh] space-y-3 overflow-y-auto pr-1">
                {visibleSubjects.length ? (
                  visibleSubjects.map((subject, index) => {
                    const isActive = subject.key === currentSubject.key;
                    const tone = SUBJECT_FAMILY_TONES[subject.subjectFamily] || SUBJECT_FAMILY_TONES.stem;

                    return (
                      <button
                        key={subject.key}
                        type="button"
                        aria-pressed={isActive}
                        onClick={() => navigate(`/lab/${subject.key}`)}
                        className={`lab-fade-up group relative w-full overflow-hidden rounded-[24px] border p-4 text-left transition duration-300 ${
                          isActive
                            ? 'border-red-200 bg-white shadow-[0_18px_40px_rgba(220,38,38,0.12)] dark:border-red-900/60 dark:bg-slate-900'
                            : 'border-neutral-200 bg-white/90 hover:-translate-y-0.5 hover:border-red-200 hover:shadow-[0_14px_30px_rgba(15,23,42,0.08)] dark:border-white/10 dark:bg-slate-950/80 dark:hover:border-red-900/60'
                        }`}
                        style={{ animationDelay: `${index * 60}ms` }}
                      >
                        <div className={`absolute inset-x-0 top-0 h-14 bg-gradient-to-r ${tone} opacity-90`} />
                        <div className="relative">
                          <div className="flex items-start justify-between gap-3">
                            <div className="space-y-1">
                              <div className="text-base font-semibold text-neutral-900 dark:text-white">
                                {getSubjectTitle(subject, language)}
                              </div>
                              <div className="text-xs uppercase tracking-[0.18em] text-neutral-500 dark:text-neutral-400">
                                {getLocalizedText(labFamilyLabels[subject.subjectFamily], language)}
                              </div>
                            </div>
                            <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] ${
                              subject.status === 'deep'
                                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300'
                                : 'bg-neutral-900/8 text-neutral-600 dark:bg-white/10 dark:text-neutral-300'
                            }`}>
                              {getLocalizedText(STATUS_LABELS[subject.status], language)}
                            </span>
                          </div>

                          <p className="mt-3 text-sm leading-6 text-neutral-600 dark:text-neutral-300">
                            {language === 'kk' ? subject.summaryKk : subject.summaryRu}
                          </p>

                          <div className="mt-4 flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400">
                            <span>
                              {language === 'kk' ? 'Режимдер' : 'Режимы'}: {subject.enabledTools.length}
                            </span>
                            <span className="inline-flex items-center gap-1 font-semibold text-neutral-700 transition group-hover:text-red-600 dark:text-neutral-200 dark:group-hover:text-red-300">
                              {isActive
                                ? (language === 'kk' ? 'Ашық' : 'Открыт')
                                : (language === 'kk' ? 'Ашу' : 'Открыть')}
                              <ChevronRight className="h-3.5 w-3.5" />
                            </span>
                          </div>
                        </div>
                      </button>
                    );
                  })
                ) : (
                  <div className="rounded-[24px] border border-dashed border-neutral-300 bg-neutral-50 p-6 text-sm leading-6 text-neutral-600 dark:border-white/10 dark:bg-slate-900 dark:text-neutral-300">
                    {language === 'kk'
                      ? 'Сүзгіге сай пән табылмады. Іздеуді немесе бағытты өзгертіп көріңіз.'
                      : 'По текущим фильтрам предметы не найдены. Попробуйте изменить поиск или направление.'}
                  </div>
                )}
              </div>
            </div>
          </aside>

          <main className="space-y-6">
            <section className="lab-fade-up relative overflow-hidden rounded-[34px] border border-white/60 bg-[#160f11] px-6 py-6 text-white shadow-[0_30px_80px_rgba(15,23,42,0.18)] dark:border-white/10 sm:px-8 sm:py-8">
              <div className="lab-grid absolute inset-0 opacity-40" />
              <div className="lab-orb absolute -left-10 top-0 h-40 w-40 rounded-full bg-red-500/20 blur-3xl" />
              <div className="lab-orb absolute right-10 top-10 h-28 w-28 rounded-full bg-amber-400/20 blur-3xl" style={{ animationDelay: '1.2s' }} />
              <div className="lab-orb absolute bottom-0 right-1/4 h-32 w-32 rounded-full bg-orange-300/10 blur-3xl" style={{ animationDelay: '2.1s' }} />

              <div className="relative grid gap-8 xl:grid-cols-[minmax(0,1.15fr)_360px]">
                <div>
                  <div className="flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-white/70">
                    <span className="rounded-full border border-white/10 bg-white/6 px-3 py-1">
                      {getLocalizedText(STATUS_LABELS[currentSubject.status], language)}
                    </span>
                    <span className="rounded-full border border-white/10 bg-white/6 px-3 py-1">
                      {getLocalizedText(labFamilyLabels[currentSubject.subjectFamily], language)}
                    </span>
                  </div>

                  <h2 className="mt-5 max-w-3xl text-4xl font-semibold tracking-tight sm:text-5xl">
                    {getSubjectTitle(currentSubject, language)}
                  </h2>

                  <p className="mt-4 max-w-3xl text-base leading-8 text-white/76">
                    {language === 'kk' ? currentSubject.summaryKk : currentSubject.summaryRu}
                  </p>

                  <div className="mt-6 flex flex-wrap gap-3">
                    {currentSubject.grades.map((grade) => (
                      <span
                        key={grade}
                        className="rounded-full border border-white/10 bg-white/8 px-3 py-1.5 text-sm text-white/82"
                      >
                        {getLocalizedText(labGradeLabels[grade], language)}
                      </span>
                    ))}
                  </div>

                  <div className="mt-8 grid gap-3 sm:grid-cols-3">
                    {summaryCards.map((card, index) => (
                      <div
                        key={card.key}
                        className="lab-fade-up rounded-[24px] border border-white/10 bg-white/8 p-4 backdrop-blur-sm"
                        style={{ animationDelay: `${120 + index * 80}ms` }}
                      >
                        <div className="text-sm text-white/60">{card.label}</div>
                        <div className="mt-2 text-3xl font-semibold">{card.value}</div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-8 space-y-3">
                    <div className="text-xs font-semibold uppercase tracking-[0.22em] text-white/58">
                      {language === 'kk' ? 'Бастау реті' : 'Как начать'}
                    </div>
                    <div className="grid gap-3 lg:grid-cols-3">
                      {currentTeacherMoves.slice(0, 3).map((move, index) => (
                        <div
                          key={`${currentSubject.key}-move-${index}`}
                          className="lab-fade-up rounded-[24px] border border-white/10 bg-black/10 p-4"
                          style={{ animationDelay: `${240 + index * 80}ms` }}
                        >
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-sm font-semibold">
                              {index + 1}
                            </div>
                            <p className="text-sm leading-6 text-white/82">{move}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="lab-fade-up rounded-[30px] border border-white/10 bg-white/8 p-5 backdrop-blur-md">
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-white/62">
                    <Sparkles className="h-4 w-4" />
                    {language === 'kk' ? 'Келесі қадам' : 'Следующий шаг'}
                  </div>
                  <h3 className="mt-4 text-2xl font-semibold">
                    {language === 'kk'
                      ? 'Сабаққа керекті сценарийді бірден ашыңыз'
                      : 'Откройте нужный сценарий для урока сразу'}
                  </h3>
                  <p className="mt-3 text-sm leading-6 text-white/72">
                    {language === 'kk'
                      ? 'Негізгі әрекеттерді бөлек панельге шығардым: чат, жоспар және ойын генераторы енді жоғалмайды.'
                      : 'Основные действия вынесены в отдельный блок, чтобы чат, план и игровой сценарий не терялись на странице.'}
                  </p>

                  <div className="mt-6 space-y-3">
                    {quickActions.map((action, index) => {
                      const Icon = action.icon;
                      const primaryClasses = action.emphasis === 'primary'
                        ? 'border-red-200/40 bg-gradient-to-br from-red-500 to-orange-500 text-white shadow-[0_16px_40px_rgba(239,68,68,0.28)]'
                        : 'border-white/10 bg-white/6 text-white/88 hover:bg-white/10';

                      return (
                        <Link
                          key={action.key}
                          to={action.to}
                          className={`lab-fade-up flex items-start justify-between gap-4 rounded-[24px] border p-4 transition duration-300 hover:-translate-y-0.5 ${primaryClasses}`}
                          style={{ animationDelay: `${160 + index * 80}ms` }}
                        >
                          <div className="flex gap-4">
                            <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${
                              action.emphasis === 'primary' ? 'bg-white/16' : 'bg-white/10'
                            }`}>
                              <Icon className="h-5 w-5" />
                            </div>
                            <div>
                              <div className="text-base font-semibold">{action.label}</div>
                              <div className={`mt-1 text-sm leading-6 ${
                                action.emphasis === 'primary' ? 'text-white/82' : 'text-white/68'
                              }`}>
                                {action.description}
                              </div>
                            </div>
                          </div>
                          <ArrowRight className="mt-1 h-5 w-5 shrink-0" />
                        </Link>
                      );
                    })}
                  </div>
                </div>
              </div>
            </section>

            <div className="grid gap-6 2xl:grid-cols-[minmax(0,1fr)_340px]">
              <section className="space-y-6">
                <div className="lab-fade-up overflow-hidden rounded-[30px] border border-white/60 bg-white/85 p-5 shadow-[0_16px_40px_rgba(15,23,42,0.08)] backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/75">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                      <div className="text-xs font-semibold uppercase tracking-[0.22em] text-neutral-500 dark:text-neutral-400">
                        {language === 'kk' ? 'Режим таңдау' : 'Выбор режима'}
                      </div>
                      <h3 className="mt-2 text-2xl font-semibold tracking-tight text-neutral-900 dark:text-white">
                        {language === 'kk'
                          ? 'Бірінші қадам: осы сабаққа лайық құралды ашыңыз'
                          : 'Первый шаг: откройте подходящий инструмент для урока'}
                      </h3>
                    </div>
                    <div className="rounded-full border border-neutral-200 bg-neutral-50 px-4 py-2 text-sm text-neutral-600 dark:border-white/10 dark:bg-slate-900 dark:text-neutral-300">
                      {selectedToolMeta.label}
                    </div>
                  </div>

                  <div className="mt-5 grid gap-3 lg:grid-cols-2">
                    {currentSubject.enabledTools.map((toolKey, index) => {
                      const toolMeta = getToolMeta(toolKey, language);
                      const Icon = toolMeta.icon;
                      const isActive = selectedTool === toolKey;

                      return (
                        <button
                          key={toolKey}
                          type="button"
                          aria-pressed={isActive}
                          onClick={() => setSelectedTool(toolKey)}
                          className={`lab-fade-up rounded-[24px] border p-4 text-left transition duration-300 ${
                            isActive
                              ? 'border-red-200 bg-red-50 shadow-[0_14px_30px_rgba(220,38,38,0.10)] dark:border-red-900/60 dark:bg-red-950/20'
                              : 'border-neutral-200 bg-white hover:-translate-y-0.5 hover:border-red-200 hover:bg-neutral-50 dark:border-white/10 dark:bg-slate-950 dark:hover:border-red-900/60 dark:hover:bg-slate-900'
                          }`}
                          style={{ animationDelay: `${index * 70}ms` }}
                        >
                          <div className="flex items-start gap-4">
                            <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${
                              isActive
                                ? 'bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-300'
                                : 'bg-neutral-100 text-neutral-600 dark:bg-slate-900 dark:text-neutral-300'
                            }`}>
                              <Icon className="h-5 w-5" />
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center justify-between gap-3">
                                <div className="text-base font-semibold text-neutral-900 dark:text-white">
                                  {toolMeta.label}
                                </div>
                                {isActive ? (
                                  <span className="rounded-full bg-red-600 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-white">
                                    {language === 'kk' ? 'Таңдалды' : 'Выбран'}
                                  </span>
                                ) : null}
                              </div>
                              <p className="mt-2 text-sm leading-6 text-neutral-600 dark:text-neutral-300">
                                {toolMeta.description}
                              </p>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="lab-fade-up overflow-hidden rounded-[30px] border border-white/60 bg-white/90 shadow-[0_20px_50px_rgba(15,23,42,0.08)] backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/80">
                  <div className="border-b border-neutral-200 px-5 py-4 dark:border-white/10">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <div className="text-xs font-semibold uppercase tracking-[0.22em] text-neutral-500 dark:text-neutral-400">
                          {language === 'kk' ? 'Жұмыс аймағы' : 'Рабочая зона'}
                        </div>
                        <div className="mt-1 text-lg font-semibold text-neutral-900 dark:text-white">
                          {selectedToolMeta.label}
                        </div>
                      </div>
                      <p className="max-w-xl text-sm leading-6 text-neutral-600 dark:text-neutral-300">
                        {selectedToolMeta.description}
                      </p>
                    </div>
                  </div>

                  <div className="p-4 sm:p-5">
                    <SubjectWorkspace
                      subject={currentSubject}
                      language={language}
                      selectedTool={selectedTool}
                    />
                  </div>
                </div>
              </section>

              <aside className="space-y-6">
                <div className="lab-fade-up overflow-hidden rounded-[30px] border border-white/60 bg-white/85 p-5 shadow-[0_16px_40px_rgba(15,23,42,0.08)] backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/75">
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-neutral-500 dark:text-neutral-400">
                    <Sparkles className="h-4 w-4" />
                    {language === 'kk' ? 'Промпт сценарийлері' : 'Сценарии промптов'}
                  </div>
                  <div className="mt-4 space-y-3">
                    {currentSubject.promptPresets.map((preset, index) => (
                      <div
                        key={preset.id}
                        className="lab-fade-up rounded-[24px] border border-neutral-200 bg-neutral-50 p-4 dark:border-white/10 dark:bg-slate-900"
                        style={{ animationDelay: `${index * 80}ms` }}
                      >
                        <div className="text-base font-semibold text-neutral-900 dark:text-white">
                          {getLocalizedText(preset.label, language)}
                        </div>
                        <div className="mt-4 flex flex-wrap gap-2">
                          <Link
                            to={`/ai-chat?prompt=${encodeURIComponent(preset.aiPrompt)}`}
                            className="rounded-full bg-blue-100 px-3 py-1.5 text-xs font-semibold text-blue-700 transition hover:bg-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:hover:bg-blue-950/70"
                          >
                            AI
                          </Link>
                          <Link
                            to={`/interactive-games/ai-generator?prompt=${encodeURIComponent(preset.gamePrompt)}&title=${encodeURIComponent(`${getSubjectTitle(currentSubject, language)} Game`)}`}
                            className="rounded-full bg-violet-100 px-3 py-1.5 text-xs font-semibold text-violet-700 transition hover:bg-violet-200 dark:bg-violet-950/40 dark:text-violet-300 dark:hover:bg-violet-950/70"
                          >
                            Game
                          </Link>
                          <Link
                            to={`/lesson-plans?subject=${encodeURIComponent(getSubjectTitle(currentSubject, language))}&topic=${encodeURIComponent(preset.lessonTopic)}`}
                            className="rounded-full bg-emerald-100 px-3 py-1.5 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:hover:bg-emerald-950/70"
                          >
                            Lesson
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="lab-fade-up overflow-hidden rounded-[30px] border border-white/60 bg-white/85 p-5 shadow-[0_16px_40px_rgba(15,23,42,0.08)] backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/75">
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-neutral-500 dark:text-neutral-400">
                    <ListChecks className="h-4 w-4" />
                    {language === 'kk' ? 'Мини-тапсырмалар' : 'Мини-задачи'}
                  </div>
                  <div className="mt-4 space-y-3">
                    {currentSubject.miniTaskTemplates.map((task, index) => (
                      <div
                        key={task.id}
                        className="lab-fade-up rounded-[24px] border border-neutral-200 bg-neutral-50 p-4 dark:border-white/10 dark:bg-slate-900"
                        style={{ animationDelay: `${index * 70}ms` }}
                      >
                        <div className="text-base font-semibold text-neutral-900 dark:text-white">
                          {getLocalizedText(task.title, language)}
                        </div>
                        <p className="mt-2 text-sm leading-6 text-neutral-600 dark:text-neutral-300">
                          {getLocalizedText(task.description, language)}
                        </p>
                        <div className="mt-4 rounded-2xl bg-white px-4 py-3 text-sm leading-6 text-neutral-700 shadow-sm dark:bg-slate-950 dark:text-neutral-200">
                          {getLocalizedText(task.challenge, language)}
                        </div>
                        <div className="mt-3 inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-500 dark:text-neutral-400">
                          <ChevronRight className="h-3.5 w-3.5" />
                          {language === 'kk' ? 'Нәтиже' : 'Результат'}
                        </div>
                        <p className="mt-1 text-sm leading-6 text-neutral-600 dark:text-neutral-300">
                          {getLocalizedText(task.outcome, language)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="lab-fade-up overflow-hidden rounded-[30px] border border-white/60 bg-white/85 p-5 shadow-[0_16px_40px_rgba(15,23,42,0.08)] backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/75">
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-neutral-500 dark:text-neutral-400">
                    <Map className="h-4 w-4" />
                    {language === 'kk' ? 'Оқу байланыстары' : 'Учебные связи'}
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {currentSubject.curriculumAliases.map((alias) => (
                      <span
                        key={alias}
                        className="rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1.5 text-xs font-medium text-neutral-700 dark:border-white/10 dark:bg-slate-900 dark:text-neutral-200"
                      >
                        {alias}
                      </span>
                    ))}
                  </div>
                </div>
              </aside>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
