import { BookOpen, BrainCircuit, ListChecks, Sparkles } from 'lucide-react';
import { getLocalizedText } from '../../data/labCatalog';

export default function GenericSubjectLab({ subject, language, selectedTool }) {
  const cards = {
    overview: {
      icon: BookOpen,
      title: language === 'kk' ? 'Пән фокусы' : 'Фокус предмета',
      body: getLocalizedText(
        {
          ru: 'Используйте правую колонку для мини-задач и быстрых AI-связок по теме урока.',
          kk: 'Оң жақ бағанды шағын тапсырмалар мен жылдам AI байланыстары үшін пайдаланыңыз.',
        },
        language
      ),
    },
    ai: {
      icon: BrainCircuit,
      title: language === 'kk' ? 'AI сценарийі' : 'AI сценарий',
      body: getLocalizedText(
        {
          ru: 'Готовые промпты уже адаптированы под предмет и подходят для объяснения и закрепления.',
          kk: 'Дайын промптар пәнге бейімделген және түсіндіру мен бекітуге жарайды.',
        },
        language
      ),
    },
    tasks: {
      icon: ListChecks,
      title: language === 'kk' ? 'Сабақ ішіндегі жұмыс' : 'Работа внутри урока',
      body: getLocalizedText(
        {
          ru: 'Выберите мини-задачу справа и превратите её в обсуждение, экспресс-проверку или игровое задание.',
          kk: 'Оң жақтан шағын тапсырманы таңдап, оны талқылауға, жедел тексеруге немесе ойын тапсырмасына айналдырыңыз.',
        },
        language
      ),
    },
  };

  const activeCard = cards[selectedTool] || cards.overview;
  const Icon = activeCard.icon;

  return (
    <div className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-dark-border dark:bg-dark-surface">
      <div className="flex items-start gap-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-neutral-100 text-neutral-700 dark:bg-slate-800 dark:text-neutral-100">
          <Icon className="h-7 w-7" />
        </div>
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 rounded-full bg-neutral-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500 dark:bg-slate-800 dark:text-neutral-300">
            <Sparkles className="h-3.5 w-3.5" />
            {subject.status === 'deep' ? (language === 'kk' ? 'Терең модуль' : 'Deep module') : (language === 'kk' ? 'Пәндік шаблон' : 'Subject template')}
          </div>
          <h2 className="text-2xl font-bold text-neutral-900 dark:text-white">{activeCard.title}</h2>
          <p className="max-w-3xl text-sm leading-6 text-neutral-600 dark:text-neutral-300">{activeCard.body}</p>
        </div>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        {subject.teacherMovesRu.map((_, index) => (
          <div key={`${subject.key}-move-${index}`} className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4 dark:border-dark-border dark:bg-dark-bg">
            <div className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-400">
              {language === 'kk' ? `Қадам ${index + 1}` : `Шаг ${index + 1}`}
            </div>
            <p className="mt-2 text-sm font-medium text-neutral-800 dark:text-neutral-100">
              {language === 'kk' ? subject.teacherMovesKk[index] : subject.teacherMovesRu[index]}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-6 rounded-2xl border border-dashed border-neutral-300 p-4 text-sm text-neutral-600 dark:border-slate-600 dark:text-neutral-300">
        {getLocalizedText(
          {
            ru: 'В первой версии этот предмет использует универсальный шаблон лаборатории: каталог, мини-задачи и переходы в AI, планы уроков и игровые инструменты.',
            kk: 'Бірінші нұсқада бұл пән зертхананың әмбебап шаблонын пайдаланады: каталог, шағын тапсырмалар және AI, сабақ жоспары мен ойын құралдарына өтулер.',
          },
          language
        )}
      </div>
    </div>
  );
}
