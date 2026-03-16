import { useEffect, useRef, useState } from 'react';
import { Excalidraw } from '@excalidraw/excalidraw';
import '@excalidraw/excalidraw/index.css';
import 'mathlive';
import { AlertCircle, FunctionSquare, PenTool, Sigma } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { getLocalizedText } from '../../data/labCatalog';
import { loadExternalScript } from '../../utils/loadExternalScript';

const EXCALIDRAW_STORAGE_KEY = 'lab:math:board';
const FORMULA_STORAGE_KEY = 'lab:math:formula';
const NOTE_STORAGE_KEY = 'lab:math:note';

function loadStoredBoard() {
  try {
    const raw = localStorage.getItem(EXCALIDRAW_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export default function MathLab({ language, selectedTool }) {
  const { theme } = useTheme();
  const mathFieldRef = useRef(null);
  const ggbContainerRef = useRef(null);
  const ggbIdRef = useRef(`geogebra-${Math.random().toString(36).slice(2)}`);
  const [formulaValue, setFormulaValue] = useState(() => localStorage.getItem(FORMULA_STORAGE_KEY) || 'f(x)=x^2-4x+3');
  const [teacherNote, setTeacherNote] = useState(() => localStorage.getItem(NOTE_STORAGE_KEY) || '');
  const [graphError, setGraphError] = useState('');

  useEffect(() => {
    localStorage.setItem(FORMULA_STORAGE_KEY, formulaValue);
  }, [formulaValue]);

  useEffect(() => {
    localStorage.setItem(NOTE_STORAGE_KEY, teacherNote);
  }, [teacherNote]);

  useEffect(() => {
    if (!mathFieldRef.current) {
      return;
    }

    mathFieldRef.current.value = formulaValue;
    const field = mathFieldRef.current;
    const handleInput = () => setFormulaValue(field.value);
    field.addEventListener('input', handleInput);

    return () => field.removeEventListener('input', handleInput);
  }, [formulaValue, selectedTool]);

  useEffect(() => {
    if (selectedTool !== 'graph' || !ggbContainerRef.current) {
      return undefined;
    }

    const containerEl = ggbContainerRef.current;
    let destroyed = false;

    loadExternalScript('https://www.geogebra.org/apps/deployggb.js', 'GGBApplet')
      .then(() => {
        if (destroyed || !window.GGBApplet || !containerEl) {
          return;
        }

        containerEl.innerHTML = '';
        const applet = new window.GGBApplet(
          {
            appName: 'graphing',
            width: containerEl.clientWidth,
            height: 430,
            showToolBar: true,
            showAlgebraInput: true,
            showMenuBar: false,
            showResetIcon: true,
            enableShiftDragZoom: true,
          },
          true
        );

        applet.inject(ggbIdRef.current);
        setGraphError('');
      })
      .catch((error) => setGraphError(error.message));

    return () => {
      destroyed = true;
    };
  }, [selectedTool]);

  const formulaExamples = ['y=x^2-4x+3', 'y=2x+5', 'y=sin(x)'];

  return (
    <div className="space-y-5 rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-dark-border dark:bg-dark-surface">
      <div>
        <div className="inline-flex items-center gap-2 rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
          <Sigma className="h-3.5 w-3.5" />
          {language === 'kk' ? 'Math workspace' : 'Math workspace'}
        </div>
        <h2 className="mt-3 text-2xl font-bold text-neutral-900 dark:text-white">
          {selectedTool === 'board'
            ? (language === 'kk' ? 'Online board' : 'Онлайн-доска')
            : selectedTool === 'formula'
              ? (language === 'kk' ? 'Formula editor' : 'Редактор формул')
              : (language === 'kk' ? 'Graph lab' : 'Лаборатория графиков')}
        </h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-neutral-600 dark:text-neutral-300">
          {selectedTool === 'graph'
            ? getLocalizedText({ ru: 'Проверяйте гипотезы на координатной плоскости через GeoGebra.', kk: 'GeoGebra арқылы гипотезаларды координаталық жазықтықта тексеріңіз.' }, language)
            : getLocalizedText({ ru: 'Показывайте ход решения так, чтобы ученики видели структуру, а не только ответ.', kk: 'Оқушылар тек жауапты емес, шешім құрылымын көретіндей түсіндіріңіз.' }, language)}
        </p>
      </div>

      {selectedTool === 'board' && (
        <div className="space-y-4">
          <div className="overflow-hidden rounded-3xl border border-neutral-200 dark:border-dark-border">
            <div className="h-[540px]">
              <Excalidraw
                initialData={loadStoredBoard()}
                onChange={(elements, appState) => {
                  localStorage.setItem(
                    EXCALIDRAW_STORAGE_KEY,
                    JSON.stringify({
                      elements,
                      appState: {
                        viewBackgroundColor: appState.viewBackgroundColor,
                        currentItemStrokeColor: appState.currentItemStrokeColor,
                        currentItemBackgroundColor: appState.currentItemBackgroundColor,
                      },
                    })
                  );
                }}
                theme={theme === 'dark' ? 'dark' : 'light'}
              />
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_280px]">
            <textarea
              value={teacherNote}
              onChange={(event) => setTeacherNote(event.target.value)}
              placeholder={language === 'kk' ? 'Түсіндіру қадамдарын жазыңыз...' : 'Запишите ход объяснения...'}
              className="min-h-32 rounded-2xl border border-neutral-300 bg-neutral-50 px-4 py-3 text-sm text-neutral-800 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20 dark:border-dark-border dark:bg-dark-bg dark:text-white"
            />

            <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4 dark:border-dark-border dark:bg-dark-bg">
              <div className="flex items-center gap-2 text-sm font-semibold text-neutral-500 dark:text-neutral-300">
                <PenTool className="h-4 w-4" />
                {language === 'kk' ? 'Жылдам сценарий' : 'Быстрый сценарий'}
              </div>
              <ul className="mt-3 space-y-2 text-sm leading-6 text-neutral-700 dark:text-neutral-200">
                <li>{language === 'kk' ? '1. Берілгенді бөліңіз.' : '1. Выделите дано.'}</li>
                <li>{language === 'kk' ? '2. Аралық қадамдарды түспен көрсетіңіз.' : '2. Отметьте промежуточные шаги цветом.'}</li>
                <li>{language === 'kk' ? '3. Соңында тексеру жазыңыз.' : '3. В конце добавьте проверку.'}</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {selectedTool === 'formula' && (
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="rounded-3xl border border-neutral-200 bg-neutral-50 p-5 dark:border-dark-border dark:bg-dark-bg">
            <label className="mb-3 block text-sm font-semibold text-neutral-500 dark:text-neutral-300">
              {language === 'kk' ? 'Формуланы енгізу' : 'Ввод формулы'}
            </label>
            <math-field
              ref={mathFieldRef}
              class="block min-h-16 rounded-2xl border border-neutral-300 bg-white px-4 py-4 text-lg dark:border-slate-600 dark:bg-slate-900"
              math-virtual-keyboard-policy="manual"
              smart-fence="on"
            />
            <div className="mt-4 rounded-2xl bg-white p-4 text-sm text-neutral-700 shadow-sm dark:bg-slate-900 dark:text-neutral-100">
              <div className="text-xs uppercase tracking-[0.2em] text-neutral-400">LaTeX</div>
              <div className="mt-2 break-all font-mono">{formulaValue}</div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {formulaExamples.map((example) => (
                <button key={example} type="button" onClick={() => setFormulaValue(example)} className="rounded-full bg-amber-100 px-3 py-1.5 text-xs font-semibold text-amber-700 transition hover:bg-amber-200 dark:bg-amber-950/40 dark:text-amber-300">
                  {example}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-neutral-200 bg-neutral-50 p-5 dark:border-dark-border dark:bg-dark-bg">
            <div className="flex items-center gap-2 text-sm font-semibold text-neutral-500 dark:text-neutral-300">
              <Sigma className="h-4 w-4" />
              {language === 'kk' ? 'Мұғалімге идеялар' : 'Идеи для преподавателя'}
            </div>
            <ul className="mt-4 space-y-3 text-sm leading-6 text-neutral-700 dark:text-neutral-200">
              <li>{language === 'kk' ? 'Формуланы оқушы тілімен айтқызыңыз.' : 'Попросите ученика проговорить формулу своими словами.'}</li>
              <li>{language === 'kk' ? 'Әр белгілеудің мағынасын талдатыңыз.' : 'Разберите смысл каждого обозначения.'}</li>
              <li>{language === 'kk' ? 'Келесі қадамда формуланы графикке ауыстырыңыз.' : 'Следующим шагом переведите формулу в график.'}</li>
            </ul>
          </div>
        </div>
      )}

      {selectedTool === 'graph' && (
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_280px]">
          <div className="overflow-hidden rounded-3xl border border-neutral-200 bg-neutral-50 p-3 dark:border-dark-border dark:bg-dark-bg">
            {graphError ? (
              <div className="flex h-[430px] flex-col items-center justify-center gap-3 px-6 text-center">
                <AlertCircle className="h-10 w-10 text-amber-500" />
                <p className="text-sm leading-6 text-neutral-600 dark:text-neutral-300">{graphError}</p>
              </div>
            ) : (
              <div id={ggbIdRef.current} ref={ggbContainerRef} className="min-h-[430px] w-full overflow-hidden rounded-2xl" />
            )}
          </div>

          <div className="rounded-3xl border border-neutral-200 bg-neutral-50 p-5 dark:border-dark-border dark:bg-dark-bg">
            <div className="flex items-center gap-2 text-sm font-semibold text-neutral-500 dark:text-neutral-300">
              <FunctionSquare className="h-4 w-4" />
              {language === 'kk' ? 'График миссиясы' : 'Миссия графика'}
            </div>
            <ul className="mt-4 space-y-3 text-sm leading-6 text-neutral-700 dark:text-neutral-200">
              <li>{language === 'kk' ? 'f(x)=x^2-4x+3 графигін тұрғызыңыз.' : 'Постройте график f(x)=x^2-4x+3.'}</li>
              <li>{language === 'kk' ? 'Төбесін және нөлдерін табыңыз.' : 'Найдите вершину и нули функции.'}</li>
              <li>{language === 'kk' ? 'y=2x+1 түзуімен салыстырыңыз.' : 'Сравните с прямой y=2x+1.'}</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
