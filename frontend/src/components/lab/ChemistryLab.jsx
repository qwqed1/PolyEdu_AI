import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
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
    gas: { ru: 'Газ', kk: 'Газ' },
    liquid: { ru: 'Жидкость', kk: 'Сұйық' },
    solid: { ru: 'Твёрдое', kk: 'Қатты' },
    unknown: { ru: 'Не указано', kk: 'Көрсетілмеген' },
  };

  return getLocalizedLabel(labels[phase] || labels.unknown, language);
}

async function getMoleculeViewerLibrary() {
  if (viewerLibraryPromise) {
    return viewerLibraryPromise;
  }

  viewerLibraryPromise = import('3dmol/build/3Dmol.es6.js')
    .then((module) => module)
    .catch(async () => {
      await loadExternalScript('https://3dmol.org/build/3Dmol-min.js', '$3Dmol');
      return window.$3Dmol;
    });

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

function MoleculeViewer({ language, modelText, title, subtitle }) {
  const viewerRef = useRef(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    const viewerNode = viewerRef.current;

    async function renderModel() {
      if (!viewerNode || !modelText) {
        return;
      }

      try {
        const library = await getMoleculeViewerLibrary();
        const createViewer = library.createViewer || library.default?.createViewer;

        if (!createViewer) {
          throw new Error('3D viewer is not available');
        }

        viewerNode.innerHTML = '';

        const viewer = createViewer(viewerNode, {
          backgroundColor: 'rgba(2, 6, 23, 0)',
        });

        viewer.addModel(modelText, 'sdf');
        viewer.setStyle({}, {
          stick: { radius: 0.18, colorscheme: 'Jmol' },
          sphere: { scale: 0.28, colorscheme: 'Jmol' },
        });
        viewer.zoomTo();
        viewer.render();
        viewer.spin('y', 0.35);

        if (!cancelled) {
          setError('');
        }
      } catch (viewerError) {
        if (!cancelled) {
          setError(viewerError.message || '3D viewer failed');
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
  }, [modelText]);

  return (
    <div className="overflow-hidden rounded-3xl border border-neutral-200 bg-gradient-to-br from-slate-950 via-slate-900 to-sky-950 p-5 shadow-sm dark:border-dark-border">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-200/80">3D</div>
          <h3 className="mt-2 text-lg font-semibold text-white">{title}</h3>
          <p className="mt-1 text-sm text-sky-100/70">{subtitle}</p>
        </div>
        <Orbit className="h-8 w-8 text-sky-300" />
      </div>

      <div className="mt-5 rounded-3xl border border-white/10 bg-white/5">
        {error ? (
          <div className="flex h-[340px] items-center justify-center px-6 text-center text-sm text-slate-200">
            {language === 'kk' ? '3D көріністі жүктеу мүмкін болмады.' : 'Не удалось загрузить 3D-представление.'}
          </div>
        ) : (
          <div ref={viewerRef} className="h-[340px] w-full" />
        )}
      </div>
    </div>
  );
}

function BohrAtomModel({ element }) {
  const shellBase = 64;

  return (
    <div className="relative mx-auto h-72 w-72">
      <div className="absolute left-1/2 top-1/2 flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-gradient-to-br from-amber-300 to-orange-500 text-center text-[10px] font-bold uppercase tracking-[0.2em] text-slate-950 shadow-lg">
        {element.symbol}
      </div>

      {element.electronShells.map((count, shellIndex) => {
        const shellSize = shellBase + shellIndex * 34;

        return (
          <div
            key={`${element.symbol}-shell-${shellIndex}`}
            className="absolute left-1/2 top-1/2 rounded-full border border-sky-300/40"
            style={{
              width: `${shellSize}px`,
              height: `${shellSize}px`,
              marginLeft: `${shellSize / -2}px`,
              marginTop: `${shellSize / -2}px`,
              transform: 'rotateX(68deg)',
            }}
          >
            {Array.from({ length: count }).map((_, electronIndex) => {
              const angle = (360 / count) * electronIndex;
              const radius = shellSize / 2;

              return (
                <span
                  key={`${element.symbol}-${shellIndex}-${electronIndex}`}
                  className="absolute left-1/2 top-1/2 block h-3 w-3 rounded-full bg-cyan-300 shadow-[0_0_14px_rgba(103,232,249,0.9)]"
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
  const [searchValue, setSearchValue] = useState('');
  const [groupFilter, setGroupFilter] = useState('all');
  const [periodFilter, setPeriodFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [selectedElement, setSelectedElement] = useState(chemistryElements[0]);

  const matchesFilters = (element) => {
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
  };

  const visibleCount = chemistryElements.filter(matchesFilters).length;

  return (
    <div className="space-y-5">
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="rounded-3xl border border-neutral-200 bg-white p-5 shadow-sm dark:border-dark-border dark:bg-dark-surface">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-sky-700 dark:bg-sky-950/40 dark:text-sky-300">
                <Atom className="h-3.5 w-3.5" />
                {language === 'kk' ? 'Периодтық жүйе' : 'Периодическая таблица'}
              </div>
              <h2 className="mt-3 text-2xl font-bold text-neutral-900 dark:text-white">
                {language === 'kk' ? '118 элементпен толық кесте' : 'Полная таблица из 118 элементов'}
              </h2>
            </div>

            <div className="text-sm text-neutral-500 dark:text-neutral-300">
              {language === 'kk'
                ? `${visibleCount} элемент көрініп тұр`
                : `Показано элементов: ${visibleCount}`}
            </div>
          </div>

          <div className="mt-5 grid gap-3 lg:grid-cols-[minmax(0,1fr)_140px_140px_180px]">
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
              {Array.from({ length: 9 }).map((_, index) => (
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
                <option key={key} value={key}>{getLocalizedLabel(label, language)}</option>
              ))}
            </select>
          </div>

          <div className="mt-6 overflow-x-auto rounded-3xl border border-neutral-200 bg-neutral-50 p-4 dark:border-dark-border dark:bg-dark-bg">
            <div
              className="grid min-w-[1100px] gap-2"
              style={{ gridTemplateColumns: 'repeat(18, minmax(0, 1fr))' }}
            >
              {chemistryElements.map((element) => {
                const isVisible = matchesFilters(element);
                const isActive = selectedElement.symbol === element.symbol;

                return (
                  <button
                    key={element.symbol}
                    type="button"
                    onClick={() => setSelectedElement(element)}
                    className={`rounded-2xl border p-2 text-left transition ${isActive ? 'border-sky-500 shadow-lg shadow-sky-500/20' : 'border-neutral-200 dark:border-slate-700'} ${isVisible ? 'opacity-100' : 'opacity-20'}`}
                    style={{
                      gridColumn: element.group,
                      gridRow: element.period,
                      background: `linear-gradient(145deg, ${element.color}22, ${element.colorDark}33)`,
                    }}
                  >
                    <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-neutral-500 dark:text-neutral-300">
                      {element.atomicNumber}
                    </div>
                    <div className="mt-1 text-lg font-bold text-neutral-900 dark:text-white">{element.symbol}</div>
                    <div className="mt-1 text-[11px] leading-4 text-neutral-600 dark:text-neutral-300">
                      {getElementName(element, language)}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-neutral-200 bg-white p-5 shadow-sm dark:border-dark-border dark:bg-dark-surface">
          <div className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-400">
            {language === 'kk' ? 'Таңдалған элемент' : 'Выбранный элемент'}
          </div>
          <h3 className="mt-3 text-2xl font-bold text-neutral-900 dark:text-white">
            {getElementName(selectedElement, language)}
          </h3>
          <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-300">{selectedElement.nameEn}</p>

          <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-2xl bg-neutral-50 p-3 dark:bg-dark-bg">
              <div className="text-xs uppercase tracking-[0.2em] text-neutral-400">Symbol</div>
              <div className="mt-2 font-semibold text-neutral-900 dark:text-white">{selectedElement.symbol}</div>
            </div>
            <div className="rounded-2xl bg-neutral-50 p-3 dark:bg-dark-bg">
              <div className="text-xs uppercase tracking-[0.2em] text-neutral-400">
                {language === 'kk' ? 'Атом нөмірі' : 'Атомный номер'}
              </div>
              <div className="mt-2 font-semibold text-neutral-900 dark:text-white">{selectedElement.atomicNumber}</div>
            </div>
            <div className="rounded-2xl bg-neutral-50 p-3 dark:bg-dark-bg">
              <div className="text-xs uppercase tracking-[0.2em] text-neutral-400">
                {language === 'kk' ? 'Масса' : 'Масса'}
              </div>
              <div className="mt-2 font-semibold text-neutral-900 dark:text-white">{selectedElement.atomicMass}</div>
            </div>
            <div className="rounded-2xl bg-neutral-50 p-3 dark:bg-dark-bg">
              <div className="text-xs uppercase tracking-[0.2em] text-neutral-400">
                {language === 'kk' ? 'Күйі' : 'Состояние'}
              </div>
              <div className="mt-2 font-semibold text-neutral-900 dark:text-white">{getPhaseLabel(selectedElement.phase, language)}</div>
            </div>
          </div>

          <div className="mt-5 rounded-3xl border border-neutral-200 bg-gradient-to-br from-slate-950 via-slate-900 to-sky-950 p-4 dark:border-slate-700">
            <BohrAtomModel element={selectedElement} />
          </div>

          <div className="mt-5 space-y-3 text-sm">
            <div className="rounded-2xl bg-neutral-50 p-4 leading-6 text-neutral-700 dark:bg-dark-bg dark:text-neutral-200">
              {getLocalizedLabel(selectedElement.summary, language)}
            </div>
            <div className="rounded-2xl bg-neutral-50 p-4 dark:bg-dark-bg">
              <div className="text-xs uppercase tracking-[0.2em] text-neutral-400">
                {language === 'kk' ? 'Электрон қабықшалары' : 'Электронные оболочки'}
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                {selectedElement.electronShells.map((count, index) => (
                  <span key={`${selectedElement.symbol}-shell-count-${index}`} className="rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold text-sky-700 dark:bg-sky-950/40 dark:text-sky-300">
                    {language === 'kk' ? `Қабық ${index + 1}: ${count}` : `Оболочка ${index + 1}: ${count}`}
                  </span>
                ))}
              </div>
            </div>
            <div className="rounded-2xl bg-neutral-50 p-4 dark:bg-dark-bg">
              <div className="text-xs uppercase tracking-[0.2em] text-neutral-400">
                {language === 'kk' ? 'Тотығу дәрежелері' : 'Степени окисления'}
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                {selectedElement.oxidationStates.map((state) => (
                  <span key={`${selectedElement.symbol}-${state}`} className="rounded-full bg-neutral-200 px-3 py-1 text-xs font-semibold text-neutral-700 dark:bg-slate-800 dark:text-neutral-200">
                    {state}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MoleculePanel({ language }) {
  const [query, setQuery] = useState('H2O');
  const [compound, setCompound] = useState(null);
  const [modelText, setModelText] = useState('');
  const [loading, setLoading] = useState(false);
  const [modelLoading, setModelLoading] = useState(false);
  const [error, setError] = useState('');

  const structureInsights = compound ? buildStructureInsights(compound, modelText) : null;

  const runSearch = async (nextQuery) => {
    setLoading(true);
    setError('');
    setCompound(null);
    setModelText('');

    try {
      const response = await chemistryService.searchCompound(nextQuery);
      setCompound(response.data);
    } catch (compoundError) {
      setError(compoundError.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runSearch('H2O');
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadModel() {
      if (!compound?.has3dModel) {
        setModelText('');
        return;
      }

      setModelLoading(true);

      try {
        const text = await chemistryService.getCompoundModel(compound.id);
        if (!cancelled) {
          setModelText(text);
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
  }, [compound?.id, compound?.has3dModel]);

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
      <div className="space-y-4 rounded-3xl border border-neutral-200 bg-white p-5 shadow-sm dark:border-dark-border dark:bg-dark-surface">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
            <Beaker className="h-3.5 w-3.5" />
            3D Molecules
          </div>
          <h2 className="mt-3 text-2xl font-bold text-neutral-900 dark:text-white">
            {language === 'kk' ? 'Молекуланы формуламен немесе атаумен табу' : 'Поиск молекулы по формуле или названию'}
          </h2>
        </div>

        <form
          onSubmit={(event) => {
            event.preventDefault();
            runSearch(query);
          }}
          className="grid gap-3 md:grid-cols-[minmax(0,1fr)_140px]"
        >
          <label className="relative block">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={language === 'kk' ? 'Мысалы: H2O, methane, sodium chloride' : 'Например: H2O, methane, sodium chloride'}
              className="w-full rounded-2xl border border-neutral-300 bg-neutral-50 py-3 pl-11 pr-4 text-sm text-neutral-800 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-dark-border dark:bg-dark-bg dark:text-white"
            />
          </label>
          <button
            type="submit"
            className="rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700"
          >
            {language === 'kk' ? 'Іздеу' : 'Найти'}
          </button>
        </form>

        <div className="flex flex-wrap gap-2">
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
          <div className="flex items-center gap-3 rounded-2xl bg-neutral-50 px-4 py-4 text-sm text-neutral-600 dark:bg-dark-bg dark:text-neutral-300">
            <Loader2 className="h-4 w-4 animate-spin" />
            {language === 'kk' ? 'Вещество ізделіп жатыр...' : 'Ищем вещество...'}
          </div>
        ) : null}

        {error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-200">
            {error}
          </div>
        ) : null}

        {compound ? (
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_300px]">
            <div className="space-y-4">
              <div className="rounded-3xl border border-neutral-200 bg-neutral-50 p-5 dark:border-dark-border dark:bg-dark-bg">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-400">
                      {compound.source}
                    </div>
                    <h3 className="mt-2 text-2xl font-bold text-neutral-900 dark:text-white">{compound.name}</h3>
                    <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-300">{compound.formula}</p>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${compound.has3dModel ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300' : 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300'}`}>
                    {compound.has3dModel
                      ? (language === 'kk' ? '3D бар' : '3D доступна')
                      : (language === 'kk' ? 'Картасыз' : 'Без 3D')}
                  </span>
                </div>

                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  <div className="rounded-2xl bg-white p-4 shadow-sm dark:bg-slate-900">
                    <div className="text-xs uppercase tracking-[0.2em] text-neutral-400">
                      {language === 'kk' ? 'Молекулалық масса' : 'Молекулярная масса'}
                    </div>
                    <div className="mt-2 text-lg font-semibold text-neutral-900 dark:text-white">
                      {compound.properties?.molecularWeight || '—'}
                    </div>
                  </div>
                  <div className="rounded-2xl bg-white p-4 shadow-sm dark:bg-slate-900">
                    <div className="text-xs uppercase tracking-[0.2em] text-neutral-400">IUPAC</div>
                    <div className="mt-2 text-sm font-semibold text-neutral-900 dark:text-white">
                      {compound.properties?.iupacName || compound.name}
                    </div>
                  </div>
                </div>

                <div className="mt-4 rounded-2xl bg-white p-4 shadow-sm dark:bg-slate-900">
                  <div className="text-xs uppercase tracking-[0.2em] text-neutral-400">
                    {language === 'kk' ? 'Атомдық құрам' : 'Атомный состав'}
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {compound.atomsSummary.map((atom) => (
                      <span key={`${compound.id}-${atom.symbol}`} className="rounded-full bg-emerald-100 px-3 py-1.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                        {atom.symbol} × {atom.count}
                      </span>
                    ))}
                  </div>
                </div>

                {compound.synonyms?.length ? (
                  <div className="mt-4 rounded-2xl bg-white p-4 shadow-sm dark:bg-slate-900">
                    <div className="text-xs uppercase tracking-[0.2em] text-neutral-400">
                      {language === 'kk' ? 'Синонимдер' : 'Синонимы'}
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {compound.synonyms.slice(0, 8).map((synonym) => (
                        <span key={`${compound.id}-${synonym}`} className="rounded-full bg-neutral-100 px-3 py-1.5 text-xs font-medium text-neutral-600 dark:bg-slate-800 dark:text-neutral-200">
                          {synonym}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            </div>

            <div className="space-y-4">
              <div className="rounded-3xl border border-neutral-200 bg-neutral-50 p-5 dark:border-dark-border dark:bg-dark-bg">
                <div className="text-sm font-semibold text-neutral-500 dark:text-neutral-300">
                  {language === 'kk' ? 'Құрылым талдауы' : 'Разбор структуры'}
                </div>
                <ul className="mt-4 space-y-3 text-sm leading-6 text-neutral-700 dark:text-neutral-200">
                  <li>{language === 'kk' ? `Формула: ${structureInsights?.formula || compound.formula}` : `Формула: ${structureInsights?.formula || compound.formula}`}</li>
                  <li>{language === 'kk' ? `Атом саны: ${structureInsights?.atomCount || '—'}` : `Количество атомов: ${structureInsights?.atomCount || '—'}`}</li>
                  <li>{language === 'kk' ? `Байланыс саны: ${structureInsights?.bondCount || '—'}` : `Количество связей: ${structureInsights?.bondCount || '—'}`}</li>
                </ul>
                <div className="mt-4 rounded-2xl border border-dashed border-neutral-300 px-4 py-3 text-sm text-neutral-600 dark:border-slate-600 dark:text-neutral-300">
                  {language === 'kk'
                    ? 'OpenChemLib формула мен байланыстар санын талдау үшін қолданылады.'
                    : 'OpenChemLib используется для разбора формулы и структуры связей.'}
                </div>
              </div>

              {!compound.has3dModel ? (
                <div className="rounded-3xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-100">
                  {language === 'kk'
                    ? 'Бұл зат үшін 3D-конформер табылмады. Бірақ формуласы мен қасиеттерін қарауға болады.'
                    : 'Для этого вещества не найден 3D-конформер. Но формулу и свойства всё равно можно изучить.'}
                </div>
              ) : null}
            </div>
          </div>
        ) : null}

        {compound?.has3dModel ? (
          modelLoading ? (
            <div className="flex items-center gap-3 rounded-2xl bg-neutral-50 px-4 py-4 text-sm text-neutral-600 dark:bg-dark-bg dark:text-neutral-300">
              <Loader2 className="h-4 w-4 animate-spin" />
              {language === 'kk' ? '3D модель жүктеліп жатыр...' : 'Загружаем 3D-модель...'}
            </div>
          ) : modelText ? (
            <MoleculeViewer
              language={language}
              modelText={modelText}
              title={compound.name}
              subtitle={language === 'kk' ? 'Ball-and-stick көрінісі' : 'Ball-and-stick представление'}
            />
          ) : null
        ) : null}
      </div>

      <div className="space-y-4">
        <div className="rounded-3xl border border-neutral-200 bg-white p-5 shadow-sm dark:border-dark-border dark:bg-dark-surface">
          <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.2em] text-neutral-400">
            <CircleHelp className="h-4 w-4" />
            {language === 'kk' ? 'Қалай оқу керек' : 'Как читать модель'}
          </div>
          <ul className="mt-4 space-y-3 text-sm leading-6 text-neutral-700 dark:text-neutral-200">
            <li>{language === 'kk' ? '1. Формула арқылы молекуладағы атомдар санын анықтаңыз.' : '1. По формуле определите, сколько атомов в молекуле.'}</li>
            <li>{language === 'kk' ? '2. 3D көріністе атомдардың кеңістікте қалай орналасқанын қараңыз.' : '2. Посмотрите, как атомы расположены в пространстве в 3D.'}</li>
            <li>{language === 'kk' ? '3. Қасиеттерді реакциялар бөлімімен байланыстырыңыз.' : '3. Свяжите свойства вещества с разделом реакций.'}</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

function ReactionsPanel({ language }) {
  const [leftCompound, setLeftCompound] = useState('HCl');
  const [rightCompound, setRightCompound] = useState('NaOH');
  const [reaction, setReaction] = useState(null);
  const [reactionError, setReactionError] = useState('');
  const [reactionLoading, setReactionLoading] = useState(false);
  const [productModelText, setProductModelText] = useState('');
  const [productLoading, setProductLoading] = useState(false);
  const [productName, setProductName] = useState('');

  const runReactionSearch = async (left, right) => {
    setReactionLoading(true);
    setReactionError('');
    setReaction(null);
    setProductModelText('');

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
    runReactionSearch('HCl', 'NaOH');
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadReactionProduct() {
      if (!reaction?.found || !reaction.productModelTarget) {
        setProductModelText('');
        setProductName('');
        return;
      }

      setProductLoading(true);

      try {
        const compoundResponse = await chemistryService.searchCompound(reaction.productModelTarget);
        const compound = compoundResponse.data;
        if (!cancelled) {
          setProductName(compound.name);
        }

        if (compound.has3dModel) {
          const modelResponse = await chemistryService.getCompoundModel(compound.id);
          if (!cancelled) {
            setProductModelText(modelResponse);
          }
        } else if (!cancelled) {
          setProductModelText('');
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
    : `${language === 'kk' ? 'Неліктен бұл екі заттың реакциясы мектеп каталогында жоқ екенін түсіндір.' : 'Объясни, почему реакция этих веществ не найдена в школьном каталоге.'}`;

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
      <div className="space-y-4 rounded-3xl border border-neutral-200 bg-white p-5 shadow-sm dark:border-dark-border dark:bg-dark-surface">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-orange-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-orange-700 dark:bg-orange-950/40 dark:text-orange-300">
            <TestTubeDiagonal className="h-3.5 w-3.5" />
            {language === 'kk' ? 'Мектеп реакциялары' : 'Школьные реакции'}
          </div>
          <h2 className="mt-3 text-2xl font-bold text-neutral-900 dark:text-white">
            {language === 'kk' ? 'Екі заттың реакциясын көру' : 'Посмотреть реакцию двух веществ'}
          </h2>
        </div>

        <form
          onSubmit={(event) => {
            event.preventDefault();
            runReactionSearch(leftCompound, rightCompound);
          }}
          className="grid gap-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_140px]"
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
            placeholder={language === 'kk' ? '2-зат немесе бос қалдырыңыз' : 'Вещество 2 или оставьте пустым'}
            className="w-full rounded-2xl border border-neutral-300 bg-neutral-50 px-4 py-3 text-sm text-neutral-800 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20 dark:border-dark-border dark:bg-dark-bg dark:text-white"
          />
          <button type="submit" className="rounded-2xl bg-orange-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-orange-700">
            {language === 'kk' ? 'Көру' : 'Показать'}
          </button>

          <datalist id="chemistry-reaction-options">
            {chemistryReactionOptions.map((option) => (
              <option key={option.key} value={option.query}>
                {getLocalizedLabel(option.label, language)}
              </option>
            ))}
          </datalist>
        </form>

        {reactionLoading ? (
          <div className="flex items-center gap-3 rounded-2xl bg-neutral-50 px-4 py-4 text-sm text-neutral-600 dark:bg-dark-bg dark:text-neutral-300">
            <Loader2 className="h-4 w-4 animate-spin" />
            {language === 'kk' ? 'Реакция ізделіп жатыр...' : 'Ищем реакцию...'}
          </div>
        ) : null}

        {reactionError ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-200">
            {reactionError}
          </div>
        ) : null}

        {reaction?.found ? (
          <div className="space-y-4">
            <div className="rounded-3xl border border-neutral-200 bg-neutral-50 p-5 dark:border-dark-border dark:bg-dark-bg">
              <div className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-400">
                {language === 'kk' ? 'Теңдеу' : 'Уравнение'}
              </div>
              <div className="mt-3 rounded-2xl bg-white px-4 py-4 text-lg font-semibold text-neutral-900 shadow-sm dark:bg-slate-900 dark:text-white">
                {reaction.equation}
              </div>

              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <div className="rounded-2xl bg-white p-4 shadow-sm dark:bg-slate-900">
                  <div className="text-xs uppercase tracking-[0.2em] text-neutral-400">
                    {language === 'kk' ? 'Реакция түрі' : 'Тип реакции'}
                  </div>
                  <div className="mt-2 text-sm font-semibold text-neutral-900 dark:text-white">
                    {getLocalizedLabel(reaction.reactionType, language)}
                  </div>
                </div>
                <div className="rounded-2xl bg-white p-4 shadow-sm dark:bg-slate-900">
                  <div className="text-xs uppercase tracking-[0.2em] text-neutral-400">
                    {language === 'kk' ? 'Шарттары' : 'Условия'}
                  </div>
                  <div className="mt-2 text-sm font-semibold text-neutral-900 dark:text-white">
                    {getLocalizedLabel(reaction.conditions, language)}
                  </div>
                </div>
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <div className="rounded-3xl border border-neutral-200 bg-neutral-50 p-5 dark:border-dark-border dark:bg-dark-bg">
                <div className="text-sm font-semibold text-neutral-500 dark:text-neutral-300">
                  {language === 'kk' ? 'Өнімдер' : 'Продукты'}
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {reaction.products.map((product) => (
                    <span key={`product-${product.key}`} className="rounded-full bg-orange-100 px-3 py-1.5 text-xs font-semibold text-orange-700 dark:bg-orange-950/40 dark:text-orange-300">
                      {getLocalizedLabel(product.label, language)}
                    </span>
                  ))}
                </div>
                <p className="mt-4 text-sm leading-6 text-neutral-700 dark:text-neutral-200">
                  {getLocalizedLabel(reaction.observations, language)}
                </p>
              </div>

              <div className="rounded-3xl border border-neutral-200 bg-neutral-50 p-5 dark:border-dark-border dark:bg-dark-bg">
                <div className="text-sm font-semibold text-neutral-500 dark:text-neutral-300">
                  {language === 'kk' ? 'Қауіпсіздік' : 'Безопасность'}
                </div>
                <p className="mt-4 text-sm leading-6 text-neutral-700 dark:text-neutral-200">
                  {getLocalizedLabel(reaction.safetyNote, language)}
                </p>
              </div>
            </div>

            {productLoading ? (
              <div className="flex items-center gap-3 rounded-2xl bg-neutral-50 px-4 py-4 text-sm text-neutral-600 dark:bg-dark-bg dark:text-neutral-300">
                <Loader2 className="h-4 w-4 animate-spin" />
                {language === 'kk' ? 'Өнімнің 3D моделі жүктеліп жатыр...' : 'Загружаем 3D-модель продукта...'}
              </div>
            ) : productModelText ? (
              <MoleculeViewer
                language={language}
                modelText={productModelText}
                title={productName || reaction.productModelTarget}
                subtitle={language === 'kk' ? 'Реакция өнімінің моделі' : 'Модель продукта реакции'}
              />
            ) : null}
          </div>
        ) : reaction && !reaction.found ? (
          <div className="rounded-3xl border border-dashed border-neutral-300 bg-neutral-50 p-6 dark:border-slate-600 dark:bg-dark-bg">
            <div className="inline-flex items-center gap-2 rounded-full bg-neutral-200 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-neutral-700 dark:bg-slate-800 dark:text-neutral-200">
              <Sparkles className="h-3.5 w-3.5" />
              {language === 'kk' ? 'Каталогта жоқ' : 'Нет в каталоге'}
            </div>
            <h3 className="mt-4 text-xl font-bold text-neutral-900 dark:text-white">
              {language === 'kk'
                ? 'Бұл жұп үшін мектептік реакция табылмады'
                : 'Для этой пары школьная реакция не найдена'}
            </h3>
            <div className="mt-4 flex flex-wrap gap-3 text-sm">
              <Link
                to={`/ai-chat?prompt=${encodeURIComponent(aiPrompt)}`}
                className="rounded-full bg-orange-600 px-4 py-2 font-semibold text-white transition hover:bg-orange-700"
              >
                {language === 'kk' ? 'AI талдауы' : 'AI-разбор'}
              </Link>
              <span className="rounded-full bg-neutral-200 px-4 py-2 font-semibold text-neutral-700 dark:bg-slate-800 dark:text-neutral-200">
                {language === 'kk' ? 'Заттарды бөлек 3D-де қарауға болады' : 'Можно посмотреть вещества отдельно в 3D'}
              </span>
            </div>
          </div>
        ) : null}
      </div>

      <div className="space-y-4">
        <div className="rounded-3xl border border-neutral-200 bg-white p-5 shadow-sm dark:border-dark-border dark:bg-dark-surface">
          <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.2em] text-neutral-400">
            <CircleHelp className="h-4 w-4" />
            {language === 'kk' ? 'Мысалдар' : 'Примеры'}
          </div>
          <ul className="mt-4 space-y-3 text-sm leading-6 text-neutral-700 dark:text-neutral-200">
            <li>Na + Cl2</li>
            <li>HCl + NaOH</li>
            <li>CH4 + O2</li>
            <li>Zn + HCl</li>
            <li>CaCO3 + {language === 'kk' ? 'қыздыру' : 'нагрев'}</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default function ChemistryLab({ language, selectedTool }) {
  if (selectedTool === 'periodic') {
    return <PeriodicTablePanel language={language} />;
  }

  if (selectedTool === 'molecule') {
    return <MoleculePanel language={language} />;
  }

  return <ReactionsPanel language={language} />;
}
