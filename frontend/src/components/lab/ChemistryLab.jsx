import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import OCL from 'openchemlib';
import {
  Atom,
  Beaker,
  CircleHelp,
  Loader2,
  Orbit,
  Search,
  Sparkles,
  TestTubeDiagonal,
} from 'lucide-react';
import { chemistryCategoryLabels, chemistryElements } from '../../data/chemistry/elements';
import { chemistryMoleculeExamples, chemistryReactionOptions } from '../../data/chemistry/commonCompounds';
import chemistryService from '../../services/chemistryService';
import { getLocalizedText } from '../../data/labCatalog';
import { loadExternalScript } from '../../utils/loadExternalScript';

let viewerLibraryPromise;

function text(ru, kk) {
  return { ru, kk };
}

function getLocalizedLabel(value, language) {
  if (!value) {
    return '';
  }

  return typeof value === 'string' ? value : getLocalizedText(value, language);
}

function getElementName(element, language) {
  if (!element) {
    return '';
  }

  return language === 'kk' ? element.nameKk : element.nameRu;
}

function getPhaseLabel(phase, language) {
  const labels = {
    gas: text('Газ', 'Газ'),
    liquid: text('Жидкость', 'Сұйық'),
    solid: text('Твёрдое', 'Қатты'),
    unknown: text('Не указано', 'Көрсетілмеген'),
  };

  return getLocalizedLabel(labels[phase] || labels.unknown, language);
}

function getPanelCopy(language) {
  return {
    periodicBadge: getLocalizedLabel(text('Периодическая система', 'Периодтық жүйе'), language),
    periodicTitle: getLocalizedLabel(text('Выберите элемент сверху, изучите его строение снизу', 'Жоғарыдан элементті таңдап, төменнен құрылымын зерттеңіз'), language),
    periodicDescription: getLocalizedLabel(text('Сначала выберите элемент в панели выбора, затем ниже откроется крупная карточка с моделью атома, оболочками и ключевыми свойствами.', 'Алдымен таңдау панелінен элементті таңдаңыз, содан кейін төменде атом моделі, қабаттары және негізгі қасиеттері бар ірі карточка ашылады.'), language),
    moleculeBadge: '3D Molecules',
    moleculeTitle: getLocalizedLabel(text('Сначала найдите вещество, затем ниже откроется 3D-модель', 'Алдымен затты табыңыз, содан кейін төменде 3D-модель ашылады'), language),
    moleculeDescription: getLocalizedLabel(text('Поиск и выбор находятся наверху. После выбора вещества показываем большую сцену 3D отдельно, без сплющенной боковой колонки.', 'Іздеу мен таңдау жоғарыда орналасқан. Затты таңдағаннан кейін 3D сахнасы бөлек, қыспай көрсетіледі.'), language),
    reactionBadge: getLocalizedLabel(text('Школьные реакции', 'Мектеп реакциялары'), language),
    reactionTitle: getLocalizedLabel(text('Выберите реагенты сверху, результат и модель появятся ниже', 'Реагенттерді жоғарыдан таңдаңыз, нәтиже мен модель төменде пайда болады'), language),
    reactionDescription: getLocalizedLabel(text('Сначала подберите пару веществ или нажмите готовый пример. Ниже покажем уравнение, объяснение и 3D-продукт, если он доступен.', 'Алдымен заттар жұбын таңдаңыз немесе дайын мысалды басыңыз. Төменде теңдеу, түсіндірме және қолжетімді болса 3D өнім көрсетіледі.'), language),
    searchPlaceholder: getLocalizedLabel(text('Например: H2O, methane, sodium chloride', 'Мысалы: H2O, methane, sodium chloride'), language),
    searchButton: getLocalizedLabel(text('Найти модель', 'Модельді табу'), language),
    emptyMoleculeTitle: getLocalizedLabel(text('Выберите вещество для просмотра 3D-модели', '3D-модельді көру үшін затты таңдаңыз'), language),
    emptyMoleculeDescription: getLocalizedLabel(text('Сверху можно ввести формулу или нажать на готовый пример. После выбора снизу откроется большая сцена молекулы.', 'Жоғарыдан формуланы енгізуге немесе дайын мысалды басуға болады. Таңдағаннан кейін төменде молекуланың үлкен сахнасы ашылады.'), language),
    modelLoading: getLocalizedLabel(text('Загружаем 3D-модель...', '3D-модель жүктеліп жатыр...'), language),
    modelUnavailable: getLocalizedLabel(text('Для этого вещества 3D-модель не найдена. Остаются формула, состав и свойства.', 'Бұл зат үшін 3D-модель табылмады. Формула, құрамы және қасиеттері ғана қолжетімді.'), language),
    modelViewerError: getLocalizedLabel(text('3D-модель не удалось отрисовать. Попробуйте выбрать другое вещество или повторить запрос.', '3D-модельді көрсету мүмкін болмады. Басқа затты таңдап көріңіз немесе сұранысты қайталаңыз.'), language),
    reactionLoading: getLocalizedLabel(text('Ищем реакцию...', 'Реакция ізделіп жатыр...'), language),
    emptyReactionTitle: getLocalizedLabel(text('Выберите вещества, чтобы посмотреть реакцию', 'Реакцияны көру үшін заттарды таңдаңыз'), language),
    emptyReactionDescription: getLocalizedLabel(text('Сверху можно ввести реагенты вручную или нажать на готовый школьный пример.', 'Жоғарыдан реагенттерді қолмен енгізуге немесе дайын мектеп мысалын таңдауға болады.'), language),
  };
}

async function getMoleculeViewerLibrary() {
  if (typeof window === 'undefined') {
    return null;
  }

  if (window.$3Dmol?.createViewer) {
    return window.$3Dmol;
  }

  if (!viewerLibraryPromise) {
    viewerLibraryPromise = loadExternalScript('https://3dmol.org/build/3Dmol-min.js', '$3Dmol')
      .then(() => window.$3Dmol);
  }

  return viewerLibraryPromise;
}

function buildStructureInsights(compound, modelText) {
  try {
    let molecule = null;

    if (modelText) {
      molecule = OCL.Molecule.fromMolfile(modelText);
    } else if (compound?.properties?.connectivitySmiles) {
      molecule = OCL.Molecule.fromSmiles(compound.properties.connectivitySmiles);
    }

    if (!molecule) {
      return null;
    }

    return {
      formula: molecule.getMolecularFormula().formula,
      atomCount: molecule.getAllAtoms(),
      bondCount: molecule.getAllBonds(),
    };
  } catch {
    return null;
  }
}

function SectionHero({ badge, title, description, accentClass, icon }) {
  const IconComponent = icon;

  return (
    <div className={`overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br ${accentClass} p-6 text-white shadow-lg`}>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em]">
            <IconComponent className="h-3.5 w-3.5" />
            {badge}
          </div>
          <h2 className="mt-4 text-3xl font-bold leading-tight">{title}</h2>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-white/80">{description}</p>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, accent = 'sky' }) {
  const tone = {
    sky: 'from-sky-50 to-cyan-50 text-sky-900 dark:from-sky-950/40 dark:to-cyan-950/20 dark:text-sky-100',
    emerald: 'from-emerald-50 to-teal-50 text-emerald-900 dark:from-emerald-950/40 dark:to-teal-950/20 dark:text-emerald-100',
    orange: 'from-orange-50 to-amber-50 text-orange-900 dark:from-orange-950/40 dark:to-amber-950/20 dark:text-orange-100',
    slate: 'from-neutral-50 to-slate-50 text-neutral-900 dark:from-slate-900 dark:to-slate-800 dark:text-white',
  };

  return (
    <div className={`rounded-3xl bg-gradient-to-br p-4 shadow-sm ${tone[accent] || tone.slate}`}>
      <div className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500 dark:text-neutral-400">{label}</div>
      <div className="mt-3 text-xl font-semibold">{value || '—'}</div>
    </div>
  );
}

function InfoCard({ title, children }) {
  return (
    <div className="rounded-3xl border border-neutral-200 bg-white p-5 shadow-sm dark:border-dark-border dark:bg-dark-surface">
      <div className="text-sm font-semibold text-neutral-900 dark:text-white">{title}</div>
      <div className="mt-4">{children}</div>
    </div>
  );
}

function EmptyStateCard({ icon, title, description }) {
  const IconComponent = icon;

  return (
    <div className="rounded-[2rem] border border-dashed border-neutral-300 bg-white p-8 text-center shadow-sm dark:border-slate-600 dark:bg-dark-surface">
      <div className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-neutral-100 text-neutral-700 dark:bg-slate-800 dark:text-neutral-200">
        <IconComponent className="h-6 w-6" />
      </div>
      <h3 className="mt-5 text-xl font-semibold text-neutral-900 dark:text-white">{title}</h3>
      <p className="mt-3 text-sm leading-7 text-neutral-600 dark:text-neutral-300">{description}</p>
    </div>
  );
}

function StageCard({ language, title, subtitle, modelText, loading, emptyTitle, emptyDescription }) {
  const viewerRef = useRef(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    const viewerNode = viewerRef.current;

    if (!viewerNode) {
      return undefined;
    }

    async function renderModel() {
      if (loading || !modelText) {
        viewerNode.innerHTML = '';
        setError('');
        return;
      }

      try {
        const library = await getMoleculeViewerLibrary();

        if (!library?.createViewer) {
          throw new Error('3Dmol viewer is unavailable');
        }

        if (cancelled) {
          return;
        }

        viewerNode.innerHTML = '';

        const viewer = library.createViewer(viewerNode, {
          backgroundColor: '#07111f',
        });

        viewer.addModel(modelText, 'sdf');
        viewer.setStyle({}, {
          stick: { radius: 0.2, colorscheme: 'Jmol' },
          sphere: { scale: 0.33, colorscheme: 'Jmol' },
        });
        viewer.zoomTo();
        viewer.resize();
        viewer.render();

        if (!cancelled) {
          setError('');
        }
      } catch {
        if (!cancelled) {
          setError(getPanelCopy(language).modelViewerError);
        }
      }
    }

    renderModel();

    return () => {
      cancelled = true;
      if (viewerNode) {
        viewerNode.innerHTML = '';
      }
    };
  }, [language, loading, modelText]);

  return (
    <div className="overflow-hidden rounded-[2rem] border border-slate-800 bg-gradient-to-br from-slate-950 via-slate-900 to-sky-950 shadow-sm">
      <div className="flex flex-col gap-3 border-b border-white/10 px-6 py-5 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-200/80">3D stage</div>
          <h3 className="mt-2 text-2xl font-bold text-white">{title}</h3>
          <p className="mt-1 text-sm text-sky-100/70">{subtitle}</p>
        </div>
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-sky-200">
          <Orbit className="h-6 w-6" />
        </div>
      </div>

      <div className="relative h-[420px] w-full">
        {loading ? (
          <div className="flex h-full items-center justify-center gap-3 text-sm text-slate-200">
            <Loader2 className="h-5 w-5 animate-spin" />
            {getPanelCopy(language).modelLoading}
          </div>
        ) : null}

        {!loading && !modelText && !error ? (
          <div className="flex h-full flex-col items-center justify-center px-6 text-center">
            <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 text-sky-200">
              <Sparkles className="h-6 w-6" />
            </div>
            <h4 className="mt-5 text-xl font-semibold text-white">{emptyTitle}</h4>
            <p className="mt-3 max-w-xl text-sm leading-7 text-slate-300">{emptyDescription}</p>
          </div>
        ) : null}

        {!loading && error ? (
          <div className="flex h-full items-center justify-center px-6 text-center text-sm leading-7 text-slate-200">
            {error}
          </div>
        ) : null}

        <div
          ref={viewerRef}
          className={`h-full w-full ${!modelText || error ? 'hidden' : 'block'}`}
          style={{ visibility: loading ? 'hidden' : 'visible' }}
        />
      </div>
    </div>
  );
}

function BohrAtomModel({ element }) {
  const shellBase = 70;

  return (
    <div className="relative mx-auto h-80 w-80 max-w-full">
      <div className="absolute left-1/2 top-1/2 flex h-20 w-20 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-gradient-to-br from-amber-300 via-orange-400 to-orange-600 text-center text-sm font-bold uppercase tracking-[0.18em] text-slate-950 shadow-[0_0_40px_rgba(251,191,36,0.45)]">
        {element.symbol}
      </div>

      {element.electronShells.map((count, shellIndex) => {
        const shellSize = shellBase + shellIndex * 38;

        return (
          <div
            key={`${element.symbol}-shell-${shellIndex}`}
            className="absolute left-1/2 top-1/2 rounded-full border border-sky-300/35"
            style={{
              width: `${shellSize}px`,
              height: `${shellSize}px`,
              marginLeft: `${shellSize / -2}px`,
              marginTop: `${shellSize / -2}px`,
            }}
          >
            {Array.from({ length: count }).map((_, electronIndex) => {
              const angle = (360 / count) * electronIndex;
              const radius = shellSize / 2;

              return (
                <span
                  key={`${element.symbol}-${shellIndex}-${electronIndex}`}
                  className="absolute left-1/2 top-1/2 block h-3.5 w-3.5 rounded-full bg-cyan-300 shadow-[0_0_14px_rgba(103,232,249,0.9)]"
                  style={{
                    transform: `rotate(${angle}deg) translateY(-${radius}px) translateX(-50%)`,
                    transformOrigin: 'center center',
                  }}
                />
              );
            })}
          </div>
        );
      })}
    </div>
  );
}

function PeriodicTablePanel({ language }) {
  const copy = getPanelCopy(language);
  const [searchValue, setSearchValue] = useState('');
  const [groupFilter, setGroupFilter] = useState('all');
  const [periodFilter, setPeriodFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [selectedSymbol, setSelectedSymbol] = useState(chemistryElements[0].symbol);

  const filteredElements = useMemo(() => chemistryElements.filter((element) => {
    const search = searchValue.trim().toLowerCase();
    const bySearch = !search
      || element.symbol.toLowerCase().includes(search)
      || element.nameEn.toLowerCase().includes(search)
      || element.nameRu.toLowerCase().includes(search)
      || element.nameKk.toLowerCase().includes(search);
    const byGroup = groupFilter === 'all' || String(element.group) === groupFilter;
    const byPeriod = periodFilter === 'all' || String(element.period) === periodFilter;
    const byCategory = categoryFilter === 'all' || element.category === categoryFilter;
    return bySearch && byGroup && byPeriod && byCategory;
  }), [categoryFilter, groupFilter, periodFilter, searchValue]);

  const selectedElement = filteredElements.find((element) => element.symbol === selectedSymbol)
    || chemistryElements.find((element) => element.symbol === selectedSymbol)
    || filteredElements[0]
    || chemistryElements[0];

  return (
    <div className="space-y-6">
      <SectionHero
        badge={copy.periodicBadge}
        title={copy.periodicTitle}
        description={copy.periodicDescription}
        accentClass="from-sky-950 via-cyan-950 to-slate-900"
        icon={Atom}
      />

      <div className="rounded-[2rem] border border-neutral-200 bg-white p-5 shadow-sm dark:border-dark-border dark:bg-dark-surface">
        <div className="grid gap-3 lg:grid-cols-[minmax(0,1.4fr)_140px_140px_220px]">
          <label className="relative block">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              value={searchValue}
              onChange={(event) => setSearchValue(event.target.value)}
              placeholder={language === 'kk' ? 'Элемент іздеу...' : 'Поиск элемента...'}
              className="w-full rounded-2xl border border-neutral-300 bg-neutral-50 py-3 pl-11 pr-4 text-sm text-neutral-800 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20 dark:border-dark-border dark:bg-dark-bg dark:text-white"
            />
          </label>

          <select
            value={groupFilter}
            onChange={(event) => setGroupFilter(event.target.value)}
            className="rounded-2xl border border-neutral-300 bg-neutral-50 px-4 py-3 text-sm text-neutral-800 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20 dark:border-dark-border dark:bg-dark-bg dark:text-white"
          >
            <option value="all">{language === 'kk' ? 'Барлық топ' : 'Все группы'}</option>
            {Array.from({ length: 18 }).map((_, index) => (
              <option key={`group-${index + 1}`} value={String(index + 1)}>
                {language === 'kk' ? `Топ ${index + 1}` : `Группа ${index + 1}`}
              </option>
            ))}
          </select>

          <select
            value={periodFilter}
            onChange={(event) => setPeriodFilter(event.target.value)}
            className="rounded-2xl border border-neutral-300 bg-neutral-50 px-4 py-3 text-sm text-neutral-800 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20 dark:border-dark-border dark:bg-dark-bg dark:text-white"
          >
            <option value="all">{language === 'kk' ? 'Барлық период' : 'Все периоды'}</option>
            {Array.from({ length: 7 }).map((_, index) => (
              <option key={`period-${index + 1}`} value={String(index + 1)}>
                {language === 'kk' ? `Период ${index + 1}` : `Период ${index + 1}`}
              </option>
            ))}
          </select>

          <select
            value={categoryFilter}
            onChange={(event) => setCategoryFilter(event.target.value)}
            className="rounded-2xl border border-neutral-300 bg-neutral-50 px-4 py-3 text-sm text-neutral-800 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20 dark:border-dark-border dark:bg-dark-bg dark:text-white"
          >
            <option value="all">{language === 'kk' ? 'Барлық санат' : 'Все категории'}</option>
            {Object.entries(chemistryCategoryLabels).map(([key, label]) => (
              <option key={key} value={key}>
                {getLocalizedLabel(label, language)}
              </option>
            ))}
          </select>
        </div>

        <div className="mt-4 flex items-center justify-between gap-4">
          <div className="text-sm text-neutral-500 dark:text-neutral-300">
            {language === 'kk'
              ? `Таңдауға қолжетімді элементтер: ${filteredElements.length}`
              : `Элементов для выбора: ${filteredElements.length}`}
          </div>
          <div className="text-xs uppercase tracking-[0.2em] text-neutral-400">
            {language === 'kk' ? 'Таңдау панелі' : 'Панель выбора'}
          </div>
        </div>

        <div className="mt-5 overflow-x-auto pb-1">
          <div className="flex min-w-max gap-3">
            {filteredElements.map((element) => {
              const active = selectedElement.symbol === element.symbol;

              return (
                <button
                  key={element.symbol}
                  type="button"
                  onClick={() => setSelectedSymbol(element.symbol)}
                  className={`w-[150px] rounded-3xl border p-4 text-left transition ${active ? 'border-sky-500 shadow-lg shadow-sky-500/20' : 'border-neutral-200 hover:border-sky-200 dark:border-slate-700 dark:hover:border-sky-900'}`}
                  style={{
                    background: `linear-gradient(160deg, ${element.color}20, ${element.colorDark}22)`,
                  }}
                >
                  <div className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500 dark:text-neutral-300">
                    {element.atomicNumber}
                  </div>
                  <div className="mt-2 text-2xl font-bold text-neutral-900 dark:text-white">{element.symbol}</div>
                  <div className="mt-2 text-sm font-medium text-neutral-700 dark:text-neutral-200">
                    {getElementName(element, language)}
                  </div>
                  <div className="mt-3 text-xs text-neutral-500 dark:text-neutral-300">
                    {getLocalizedLabel(chemistryCategoryLabels[element.category], language)}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[420px_minmax(0,1fr)]">
        <div className="overflow-hidden rounded-[2rem] border border-slate-800 bg-gradient-to-br from-slate-950 via-slate-900 to-sky-950 p-6 shadow-sm">
          <div className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-200/80">
            {language === 'kk' ? 'Атом моделі' : 'Модель атома'}
          </div>
          <h3 className="mt-3 text-3xl font-bold text-white">{selectedElement.symbol}</h3>
          <p className="mt-2 text-sm text-sky-100/75">{getElementName(selectedElement, language)}</p>
          <div className="mt-6">
            <BohrAtomModel element={selectedElement} />
          </div>
        </div>

        <div className="space-y-5">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <StatCard label={language === 'kk' ? 'Атом нөмірі' : 'Атомный номер'} value={selectedElement.atomicNumber} accent="sky" />
            <StatCard label={language === 'kk' ? 'Атом массасы' : 'Атомная масса'} value={selectedElement.atomicMass} accent="emerald" />
            <StatCard label={language === 'kk' ? 'Күйі' : 'Состояние'} value={getPhaseLabel(selectedElement.phase, language)} accent="orange" />
            <StatCard label={language === 'kk' ? 'Топ / период' : 'Группа / период'} value={`${selectedElement.group} / ${selectedElement.period}`} accent="slate" />
          </div>

          <InfoCard title={language === 'kk' ? 'Элемент туралы' : 'О элементе'}>
            <p className="text-sm leading-7 text-neutral-700 dark:text-neutral-200">
              {getLocalizedLabel(selectedElement.summary, language)}
            </p>
          </InfoCard>

          <div className="grid gap-5 lg:grid-cols-2">
            <InfoCard title={language === 'kk' ? 'Электрон қабаттары' : 'Электронные оболочки'}>
              <div className="flex flex-wrap gap-2">
                {selectedElement.electronShells.map((count, index) => (
                  <span
                    key={`${selectedElement.symbol}-shell-${index}`}
                    className="rounded-full bg-sky-100 px-3 py-1.5 text-xs font-semibold text-sky-700 dark:bg-sky-950/40 dark:text-sky-300"
                  >
                    {language === 'kk' ? `Қабат ${index + 1}: ${count}` : `Оболочка ${index + 1}: ${count}`}
                  </span>
                ))}
              </div>
            </InfoCard>

            <InfoCard title={language === 'kk' ? 'Тотығу дәрежелері' : 'Степени окисления'}>
              <div className="flex flex-wrap gap-2">
                {selectedElement.oxidationStates.map((state) => (
                  <span
                    key={`${selectedElement.symbol}-${state}`}
                    className="rounded-full bg-neutral-100 px-3 py-1.5 text-xs font-semibold text-neutral-700 dark:bg-slate-800 dark:text-neutral-200"
                  >
                    {state}
                  </span>
                ))}
              </div>
            </InfoCard>
          </div>
        </div>
      </div>
    </div>
  );
}

function MoleculePanel({ language }) {
  const copy = getPanelCopy(language);
  const [query, setQuery] = useState('');
  const [compound, setCompound] = useState(null);
  const [modelText, setModelText] = useState('');
  const [loading, setLoading] = useState(false);
  const [modelLoading, setModelLoading] = useState(false);
  const [error, setError] = useState('');

  const structureInsights = compound ? buildStructureInsights(compound, modelText) : null;

  const runSearch = async (nextQuery) => {
    const normalizedQuery = String(nextQuery || '').trim();

    if (!normalizedQuery) {
      return;
    }

    setLoading(true);
    setError('');
    setCompound(null);
    setModelText('');

    try {
      const response = await chemistryService.searchCompound(normalizedQuery);
      setCompound(response.data);
    } catch (compoundError) {
      setError(compoundError.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;

    async function loadModel() {
      if (!compound?.has3dModel) {
        setModelText('');
        setModelLoading(false);
        return;
      }

      setModelLoading(true);

      try {
        const textValue = await chemistryService.getCompoundModel(compound.id);

        if (!cancelled) {
          setModelText(textValue);
        }
      } catch {
        if (!cancelled) {
          setModelText('');
        }
      } finally {
        if (!cancelled) {
          setModelLoading(false);
        }
      }
    }

    loadModel();

    return () => {
      cancelled = true;
    };
  }, [compound?.has3dModel, compound?.id]);

  return (
    <div className="space-y-6">
      <SectionHero
        badge={copy.moleculeBadge}
        title={copy.moleculeTitle}
        description={copy.moleculeDescription}
        accentClass="from-emerald-950 via-teal-950 to-slate-900"
        icon={Beaker}
      />

      <div className="rounded-[2rem] border border-neutral-200 bg-white p-5 shadow-sm dark:border-dark-border dark:bg-dark-surface">
        <form
          onSubmit={(event) => {
            event.preventDefault();
            runSearch(query);
          }}
          className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_180px]"
        >
          <label className="relative block">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={copy.searchPlaceholder}
              className="w-full rounded-2xl border border-neutral-300 bg-neutral-50 py-3 pl-11 pr-4 text-sm text-neutral-800 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-dark-border dark:bg-dark-bg dark:text-white"
            />
          </label>
          <button
            type="submit"
            className="rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700"
          >
            {copy.searchButton}
          </button>
        </form>

        <div className="mt-4 flex flex-wrap gap-2">
          {chemistryMoleculeExamples.map((example) => (
            <button
              key={example.query}
              type="button"
              onClick={() => {
                setQuery(example.query);
                runSearch(example.query);
              }}
              className="rounded-full bg-neutral-100 px-3 py-1.5 text-xs font-semibold text-neutral-700 transition hover:bg-neutral-200 dark:bg-slate-800 dark:text-neutral-200"
            >
              {getLocalizedLabel(example.label, language)} · {example.formula}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="mt-4 flex items-center gap-3 rounded-2xl bg-neutral-50 px-4 py-4 text-sm text-neutral-600 dark:bg-dark-bg dark:text-neutral-300">
            <Loader2 className="h-4 w-4 animate-spin" />
            {language === 'kk' ? 'Зат ізделіп жатыр...' : 'Ищем вещество...'}
          </div>
        ) : null}

        {error ? (
          <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-200">
            {error}
          </div>
        ) : null}
      </div>

      <StageCard
        language={language}
        title={compound?.name || (language === 'kk' ? '3D молекула сахнасы' : '3D сцена молекулы')}
        subtitle={compound ? compound.formula : (language === 'kk' ? 'Алдымен затты таңдаңыз' : 'Сначала выберите вещество')}
        modelText={modelText}
        loading={modelLoading}
        emptyTitle={copy.emptyMoleculeTitle}
        emptyDescription={compound && !compound.has3dModel ? copy.modelUnavailable : copy.emptyMoleculeDescription}
      />

      {compound ? (
        <div className="space-y-5">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Formula" value={compound.formula} accent="emerald" />
            <StatCard label="IUPAC" value={compound.properties?.iupacName || compound.name} accent="slate" />
            <StatCard label={language === 'kk' ? 'Молекулалық масса' : 'Молекулярная масса'} value={compound.properties?.molecularWeight} accent="sky" />
            <StatCard label="3D" value={compound.has3dModel ? (language === 'kk' ? 'Қолжетімді' : 'Доступна') : (language === 'kk' ? 'Жоқ' : 'Нет')} accent="orange" />
          </div>

          <div className="grid gap-5 xl:grid-cols-[minmax(0,1.15fr)_420px]">
            <div className="space-y-5">
              <InfoCard title={language === 'kk' ? 'Молекула туралы' : 'О молекуле'}>
                <p className="text-sm leading-7 text-neutral-700 dark:text-neutral-200">
                  {language === 'kk'
                    ? 'Іздеу нәтижесі PubChem деректеріне сүйенеді. Төменде формула, құрам және атаулар көрсетілген.'
                    : 'Результат поиска собран из PubChem. Ниже показаны формула, состав и ключевые названия вещества.'}
                </p>
              </InfoCard>

              <InfoCard title={language === 'kk' ? 'Атомдық құрамы' : 'Атомный состав'}>
                <div className="flex flex-wrap gap-2">
                  {compound.atomsSummary.map((atom) => (
                    <span
                      key={`${compound.id}-${atom.symbol}`}
                      className="rounded-full bg-emerald-100 px-3 py-1.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
                    >
                      {atom.symbol} × {atom.count}
                    </span>
                  ))}
                </div>
              </InfoCard>

              {compound.synonyms?.length ? (
                <InfoCard title={language === 'kk' ? 'Атаулар мен синонимдер' : 'Названия и синонимы'}>
                  <div className="flex flex-wrap gap-2">
                    {compound.synonyms.slice(0, 10).map((synonym) => (
                      <span
                        key={`${compound.id}-${synonym}`}
                        className="rounded-full bg-neutral-100 px-3 py-1.5 text-xs font-medium text-neutral-700 dark:bg-slate-800 dark:text-neutral-200"
                      >
                        {synonym}
                      </span>
                    ))}
                  </div>
                </InfoCard>
              ) : null}
            </div>

            <InfoCard title={language === 'kk' ? 'Құрылым талдауы' : 'Разбор структуры'}>
              <ul className="space-y-3 text-sm leading-7 text-neutral-700 dark:text-neutral-200">
                <li>{language === 'kk' ? `Формула: ${structureInsights?.formula || compound.formula}` : `Формула: ${structureInsights?.formula || compound.formula}`}</li>
                <li>{language === 'kk' ? `Атом саны: ${structureInsights?.atomCount || '—'}` : `Количество атомов: ${structureInsights?.atomCount || '—'}`}</li>
                <li>{language === 'kk' ? `Байланыс саны: ${structureInsights?.bondCount || '—'}` : `Количество связей: ${structureInsights?.bondCount || '—'}`}</li>
              </ul>
              <div className="mt-4 rounded-2xl border border-dashed border-neutral-300 px-4 py-3 text-sm leading-6 text-neutral-600 dark:border-slate-600 dark:text-neutral-300">
                {language === 'kk'
                  ? 'OpenChemLib формула мен байланыстар санын талдау үшін қолданылады.'
                  : 'OpenChemLib используется для разбора формулы и количества связей.'}
              </div>
            </InfoCard>
          </div>
        </div>
      ) : (
        <EmptyStateCard
          icon={Beaker}
          title={copy.emptyMoleculeTitle}
          description={copy.emptyMoleculeDescription}
        />
      )}
    </div>
  );
}

function ReactionsPanel({ language }) {
  const copy = getPanelCopy(language);
  const [leftCompound, setLeftCompound] = useState('');
  const [rightCompound, setRightCompound] = useState('');
  const [reaction, setReaction] = useState(null);
  const [reactionError, setReactionError] = useState('');
  const [reactionLoading, setReactionLoading] = useState(false);
  const [productModelText, setProductModelText] = useState('');
  const [productLoading, setProductLoading] = useState(false);
  const [productName, setProductName] = useState('');

  const runReactionSearch = async (left, right) => {
    if (!String(left || '').trim()) {
      return;
    }

    setReactionLoading(true);
    setReactionError('');
    setReaction(null);
    setProductModelText('');
    setProductName('');

    try {
      const response = await chemistryService.getReaction(left, right);
      setReaction(response.data);
    } catch (error) {
      setReactionError(error.message);
    } finally {
      setReactionLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;

    async function loadReactionProduct() {
      if (!reaction?.found || !reaction.productModelTarget) {
        setProductModelText('');
        setProductName('');
        setProductLoading(false);
        return;
      }

      setProductLoading(true);

      try {
        const compoundResponse = await chemistryService.searchCompound(reaction.productModelTarget);
        const compound = compoundResponse.data;

        if (!cancelled) {
          setProductName(compound.name);
        }

        if (!compound.has3dModel) {
          if (!cancelled) {
            setProductModelText('');
          }
          return;
        }

        const modelResponse = await chemistryService.getCompoundModel(compound.id);
        if (!cancelled) {
          setProductModelText(modelResponse);
        }
      } catch {
        if (!cancelled) {
          setProductModelText('');
          setProductName('');
        }
      } finally {
        if (!cancelled) {
          setProductLoading(false);
        }
      }
    }

    loadReactionProduct();

    return () => {
      cancelled = true;
    };
  }, [reaction?.found, reaction?.productModelTarget]);

  const aiPrompt = reaction?.found
    ? `${language === 'kk' ? 'Осы реакцияны қадамдап түсіндір:' : 'Объясни пошагово реакцию:'} ${reaction.equation}`
    : `${language === 'kk' ? 'Неліктен бұл жұп үшін реакция табылмағанын түсіндір.' : 'Объясни, почему реакция этой пары не найдена в школьном каталоге.'}`;

  return (
    <div className="space-y-6">
      <SectionHero
        badge={copy.reactionBadge}
        title={copy.reactionTitle}
        description={copy.reactionDescription}
        accentClass="from-orange-950 via-amber-950 to-slate-900"
        icon={TestTubeDiagonal}
      />

      <div className="rounded-[2rem] border border-neutral-200 bg-white p-5 shadow-sm dark:border-dark-border dark:bg-dark-surface">
        <form
          onSubmit={(event) => {
            event.preventDefault();
            runReactionSearch(leftCompound, rightCompound);
          }}
          className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_180px]"
        >
          <input
            list="chemistry-reaction-options"
            value={leftCompound}
            onChange={(event) => setLeftCompound(event.target.value)}
            placeholder={language === 'kk' ? '1-зат' : 'Вещество 1'}
            className="w-full rounded-2xl border border-neutral-300 bg-neutral-50 px-4 py-3 text-sm text-neutral-800 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20 dark:border-dark-border dark:bg-dark-bg dark:text-white"
          />
          <input
            list="chemistry-reaction-options"
            value={rightCompound}
            onChange={(event) => setRightCompound(event.target.value)}
            placeholder={language === 'kk' ? '2-зат немесе бос қалдыруға болады' : 'Вещество 2 или можно оставить пустым'}
            className="w-full rounded-2xl border border-neutral-300 bg-neutral-50 px-4 py-3 text-sm text-neutral-800 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20 dark:border-dark-border dark:bg-dark-bg dark:text-white"
          />
          <button
            type="submit"
            className="rounded-2xl bg-orange-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-orange-700"
          >
            {language === 'kk' ? 'Реакцияны көру' : 'Показать реакцию'}
          </button>

          <datalist id="chemistry-reaction-options">
            {chemistryReactionOptions.map((option) => (
              <option key={option.key} value={option.query}>
                {getLocalizedLabel(option.label, language)}
              </option>
            ))}
          </datalist>
        </form>

        <div className="mt-4 flex flex-wrap gap-2">
          {[
            ['Na', 'Cl2'],
            ['HCl', 'NaOH'],
            ['CH4', 'O2'],
            ['Zn', 'HCl'],
            ['CaCO3', ''],
          ].map(([left, right]) => (
            <button
              key={`${left}-${right || 'single'}`}
              type="button"
              onClick={() => {
                setLeftCompound(left);
                setRightCompound(right);
                runReactionSearch(left, right);
              }}
              className="rounded-full bg-neutral-100 px-3 py-1.5 text-xs font-semibold text-neutral-700 transition hover:bg-neutral-200 dark:bg-slate-800 dark:text-neutral-200"
            >
              {right ? `${left} + ${right}` : `${left} →`}
            </button>
          ))}
        </div>

        {reactionLoading ? (
          <div className="mt-4 flex items-center gap-3 rounded-2xl bg-neutral-50 px-4 py-4 text-sm text-neutral-600 dark:bg-dark-bg dark:text-neutral-300">
            <Loader2 className="h-4 w-4 animate-spin" />
            {copy.reactionLoading}
          </div>
        ) : null}

        {reactionError ? (
          <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-200">
            {reactionError}
          </div>
        ) : null}
      </div>

      {reaction?.found ? (
        <div className="space-y-5">
          <div className="rounded-[2rem] border border-neutral-200 bg-white p-6 shadow-sm dark:border-dark-border dark:bg-dark-surface">
            <div className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-400">
              {language === 'kk' ? 'Теңдеу' : 'Уравнение'}
            </div>
            <div className="mt-4 rounded-3xl bg-neutral-50 px-5 py-5 text-2xl font-semibold text-neutral-900 dark:bg-dark-bg dark:text-white">
              {reaction.equation}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <StatCard label={language === 'kk' ? 'Реакция түрі' : 'Тип реакции'} value={getLocalizedLabel(reaction.reactionType, language)} accent="orange" />
            <StatCard label={language === 'kk' ? 'Шарттары' : 'Условия'} value={getLocalizedLabel(reaction.conditions, language)} accent="slate" />
            <StatCard label={language === 'kk' ? 'Өнімдер саны' : 'Количество продуктов'} value={reaction.products.length} accent="emerald" />
            <StatCard label="3D" value={reaction.productModelTarget ? (language === 'kk' ? 'Өнімге бар' : 'Для продукта есть') : '—'} accent="sky" />
          </div>

          <div className="grid gap-5 xl:grid-cols-2">
            <InfoCard title={language === 'kk' ? 'Реакция нәтижесі' : 'Результат реакции'}>
              <div className="flex flex-wrap gap-2">
                {reaction.products.map((product) => (
                  <span
                    key={`product-${product.key}`}
                    className="rounded-full bg-orange-100 px-3 py-1.5 text-xs font-semibold text-orange-700 dark:bg-orange-950/40 dark:text-orange-300"
                  >
                    {getLocalizedLabel(product.label, language)}
                  </span>
                ))}
              </div>
              <p className="mt-4 text-sm leading-7 text-neutral-700 dark:text-neutral-200">
                {getLocalizedLabel(reaction.observations, language)}
              </p>
            </InfoCard>

            <InfoCard title={language === 'kk' ? 'Қауіпсіздік' : 'Безопасность'}>
              <p className="text-sm leading-7 text-neutral-700 dark:text-neutral-200">
                {getLocalizedLabel(reaction.safetyNote, language)}
              </p>
            </InfoCard>
          </div>

          <StageCard
            language={language}
            title={productName || reaction.productModelTarget || (language === 'kk' ? 'Өнім моделі' : 'Модель продукта')}
            subtitle={language === 'kk' ? 'Реакция нәтижесінің 3D көрінісі' : '3D-представление результата реакции'}
            modelText={productModelText}
            loading={productLoading}
            emptyTitle={language === 'kk' ? 'Өнім үшін 3D-модель табылмады' : 'Для продукта 3D-модель не найдена'}
            emptyDescription={language === 'kk' ? 'Бұл реакция түсіндірілді, бірақ өнімнің дайын 3D-конформері жоқ.' : 'Реакция разобрана, но готовый 3D-конформер продукта недоступен.'}
          />
        </div>
      ) : reaction && !reaction.found ? (
        <div className="rounded-[2rem] border border-dashed border-neutral-300 bg-white p-8 shadow-sm dark:border-slate-600 dark:bg-dark-surface">
          <div className="inline-flex items-center gap-2 rounded-full bg-neutral-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-neutral-700 dark:bg-slate-800 dark:text-neutral-200">
            <Sparkles className="h-3.5 w-3.5" />
            {language === 'kk' ? 'Каталогта жоқ' : 'Нет в каталоге'}
          </div>
          <h3 className="mt-4 text-2xl font-bold text-neutral-900 dark:text-white">
            {language === 'kk'
              ? 'Бұл жұп үшін мектептік реакция табылмады'
              : 'Для этой пары школьная реакция не найдена'}
          </h3>
          <p className="mt-3 text-sm leading-7 text-neutral-600 dark:text-neutral-300">
            {language === 'kk'
              ? 'Төмендегі AI-талдауды ашуға немесе молекулалар бөлімінде заттарды бөлек 3D түрде қарауға болады.'
              : 'Можно открыть AI-разбор ниже или посмотреть вещества по отдельности в разделе молекул.'}
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              to={`/ai-chat?prompt=${encodeURIComponent(aiPrompt)}`}
              className="rounded-full bg-orange-600 px-4 py-2 font-semibold text-white transition hover:bg-orange-700"
            >
              {language === 'kk' ? 'AI талдауы' : 'AI-разбор'}
            </Link>
            <span className="rounded-full bg-neutral-100 px-4 py-2 font-semibold text-neutral-700 dark:bg-slate-800 dark:text-neutral-200">
              {language === 'kk' ? 'Заттарды молекулалар бөлімінде қараңыз' : 'Смотрите вещества в разделе молекул'}
            </span>
          </div>
        </div>
      ) : (
        <EmptyStateCard
          icon={TestTubeDiagonal}
          title={copy.emptyReactionTitle}
          description={copy.emptyReactionDescription}
        />
      )}

      <InfoCard title={language === 'kk' ? 'Қалай қолдану керек' : 'Как использовать'}>
        <div className="flex items-start gap-3 text-sm leading-7 text-neutral-700 dark:text-neutral-200">
          <CircleHelp className="mt-1 h-4 w-4 shrink-0 text-neutral-400" />
          <div>
            {language === 'kk'
              ? 'Алдымен реагенттерді таңдаңыз, кейін төменде теңдеу мен өнім көрсетіледі. Егер каталогта реакция болмаса, AI-түсіндіруді ашуға болады.'
              : 'Сначала выберите реагенты, затем ниже появятся уравнение и продукт. Если реакции нет в каталоге, можно сразу открыть AI-объяснение.'}
          </div>
        </div>
      </InfoCard>
    </div>
  );
}

export default function ChemistryLab({ subject, language, selectedTool }) {
  if (selectedTool === 'hand_molecule') {
    return <Navigate to={`/lab-arena/chemistry?subject=${subject?.key || 'chemistry'}`} replace />;
  }

  if (selectedTool === 'periodic') {
    return <PeriodicTablePanel language={language} />;
  }

  if (selectedTool === 'molecule') {
    return <MoleculePanel language={language} />;
  }

  return <ReactionsPanel language={language} />;
}
