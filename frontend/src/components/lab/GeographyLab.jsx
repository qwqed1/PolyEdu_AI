import { useEffect, useRef, useState } from 'react';
import Globe from 'globe.gl';
import { AlertCircle, Globe2, MapPinned, Orbit, RotateCcw } from 'lucide-react';
import { getLocalizedText } from '../../data/labCatalog';

const capitalPoints = [
  { id: 'astana', name: 'Astana', country: 'Kazakhstan', lat: 51.1694, lng: 71.4491, color: '#f59e0b' },
  { id: 'london', name: 'London', country: 'United Kingdom', lat: 51.5072, lng: -0.1276, color: '#0ea5e9' },
  { id: 'tokyo', name: 'Tokyo', country: 'Japan', lat: 35.6762, lng: 139.6503, color: '#ef4444' },
  { id: 'cairo', name: 'Cairo', country: 'Egypt', lat: 30.0444, lng: 31.2357, color: '#22c55e' },
  { id: 'brasilia', name: 'Brasilia', country: 'Brazil', lat: -15.7939, lng: -47.8828, color: '#8b5cf6' },
];

const kazakhstanRegions = [
  { id: 'almaty', name: 'Almaty', region: 'South-East', lat: 43.2389, lng: 76.8897, color: '#2563eb' },
  { id: 'atyrau', name: 'Atyrau', region: 'West', lat: 47.0945, lng: 51.9239, color: '#0f766e' },
  { id: 'oskemen', name: 'Oskemen', region: 'East', lat: 49.9483, lng: 82.6275, color: '#7c3aed' },
  { id: 'kostanay', name: 'Kostanay', region: 'North', lat: 53.2144, lng: 63.6246, color: '#ea580c' },
  { id: 'shymkent', name: 'Shymkent', region: 'South', lat: 42.3417, lng: 69.5901, color: '#dc2626' },
];

const routeLinks = [
  { startLat: 51.1694, startLng: 71.4491, endLat: 51.5072, endLng: -0.1276, color: ['#f59e0b', '#0ea5e9'], label: 'Astana - London' },
  { startLat: 51.1694, startLng: 71.4491, endLat: 35.6762, endLng: 139.6503, color: ['#f59e0b', '#ef4444'], label: 'Astana - Tokyo' },
  { startLat: 43.2389, startLng: 76.8897, endLat: 30.0444, endLng: 31.2357, color: ['#2563eb', '#22c55e'], label: 'Almaty - Cairo' },
];

function supportsWebGL() {
  try {
    const canvas = document.createElement('canvas');
    return !!window.WebGLRenderingContext && !!(canvas.getContext('webgl') || canvas.getContext('experimental-webgl'));
  } catch {
    return false;
  }
}

export default function GeographyLab({ language, selectedTool }) {
  const globeContainerRef = useRef(null);
  const globeInstanceRef = useRef(null);
  const [error, setError] = useState('');
  const [selectedMarker, setSelectedMarker] = useState(capitalPoints[0]);
  const [mapReady, setMapReady] = useState(false);
  const [layers, setLayers] = useState({ graticules: true, atmosphere: true, routes: true });

  useEffect(() => {
    if (!globeContainerRef.current) {
      return undefined;
    }

    if (!supportsWebGL()) {
      setError(
        getLocalizedText(
          {
            ru: 'В этом браузере недоступен WebGL. Используйте мини-задачи справа или откройте AI-подсказки.',
            kk: 'Бұл браузерде WebGL қолжетімсіз. Оң жақтағы шағын тапсырмаларды немесе AI кеңестерін қолданыңыз.',
          },
          language
        )
      );
      return undefined;
    }

    let destroyed = false;

    try {
      const globe = new Globe(globeContainerRef.current, { animateIn: true, waitForGlobeReady: true });
      globe
        .width(globeContainerRef.current.clientWidth)
        .height(480)
        .backgroundColor('rgba(0,0,0,0)')
        .globeTileEngineUrl((x, y, l) => `https://tile.openstreetmap.org/${l}/${x}/${y}.png`)
        .showAtmosphere(true)
        .atmosphereColor('#7dd3fc')
        .pointAltitude(0.02)
        .pointRadius(0.6)
        .pointLabel((point) => `${point.name} • ${point.country || point.region}`)
        .onPointClick((point) => {
          setSelectedMarker(point);
          globe.pointOfView({ lat: point.lat, lng: point.lng, altitude: 1.3 }, 900);
        })
        .arcLabel((arc) => arc.label)
        .arcStroke(0.35)
        .arcDashLength(0.6)
        .arcDashGap(0.3)
        .arcDashAnimateTime(3500)
        .showGraticules(true)
        .onGlobeReady(() => {
          if (!destroyed) {
            setMapReady(true);
          }
        });

      globe.controls().autoRotate = true;
      globe.controls().autoRotateSpeed = 0.4;
      globe.pointOfView({ lat: 47, lng: 70, altitude: 2 }, 0);
      globeInstanceRef.current = globe;
      setError('');
    } catch (setupError) {
      setError(setupError.message);
    }

    const handleResize = () => {
      if (globeInstanceRef.current && globeContainerRef.current) {
        globeInstanceRef.current.width(globeContainerRef.current.clientWidth);
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      destroyed = true;
      window.removeEventListener('resize', handleResize);
      if (globeInstanceRef.current) {
        globeInstanceRef.current.pauseAnimation();
        globeContainerRef.current.innerHTML = '';
        globeInstanceRef.current = null;
      }
    };
  }, [language]);

  useEffect(() => {
    if (!globeInstanceRef.current) {
      return;
    }

    const isRegions = selectedTool === 'regions';
    const points = isRegions ? kazakhstanRegions : capitalPoints;

    globeInstanceRef.current
      .pointsData(points)
      .pointColor((point) => point.color)
      .showGraticules(layers.graticules)
      .showAtmosphere(layers.atmosphere)
      .arcsData(layers.routes && !isRegions ? routeLinks : []);

    setSelectedMarker(points[0]);
    globeInstanceRef.current.pointOfView({ lat: points[0].lat, lng: points[0].lng, altitude: isRegions ? 1.8 : 1.3 }, 900);
  }, [layers, selectedTool]);

  const toggles = [
    { key: 'graticules', label: language === 'kk' ? 'Тор' : 'Сетка' },
    { key: 'atmosphere', label: language === 'kk' ? 'Атмосфера' : 'Атмосфера' },
    { key: 'routes', label: language === 'kk' ? 'Маршруттар' : 'Маршруты' },
  ];

  const challengeText = selectedTool === 'regions'
    ? getLocalizedText(
      {
        ru: 'Найдите 4 региона Казахстана и объясните их хозяйственную специализацию.',
        kk: 'Қазақстанның 4 өңірін тауып, олардың мамандануын түсіндіріңіз.',
      },
      language
    )
    : getLocalizedText(
      {
        ru: 'Найдите 3 столицы на разных материках и сравните их положение относительно экватора.',
        kk: 'Әртүрлі материктердегі 3 астананы тауып, экваторға қатысты орнын салыстырыңыз.',
      },
      language
    );

  return (
    <div className="space-y-5 rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-dark-border dark:bg-dark-surface">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-sky-700 dark:bg-sky-950/40 dark:text-sky-300">
            <Globe2 className="h-3.5 w-3.5" />
            {language === 'kk' ? '3D глобус' : '3D globe'}
          </div>
          <h2 className="text-2xl font-bold text-neutral-900 dark:text-white">
            {selectedTool === 'regions'
              ? (language === 'kk' ? 'Қазақстан өңірлері' : 'Регионы Казахстана')
              : (language === 'kk' ? 'Әлем астаналары мен маршруттары' : 'Столицы мира и маршруты')}
          </h2>
          <p className="max-w-3xl text-sm leading-6 text-neutral-600 dark:text-neutral-300">{challengeText}</p>
        </div>

        <div className="flex flex-wrap gap-2">
          {toggles.map((toggle) => (
            <button
              key={toggle.key}
              type="button"
              onClick={() => setLayers((current) => ({ ...current, [toggle.key]: !current[toggle.key] }))}
              className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                layers[toggle.key]
                  ? 'bg-sky-600 text-white'
                  : 'bg-neutral-100 text-neutral-600 dark:bg-slate-800 dark:text-neutral-300'
              }`}
            >
              {toggle.label}
            </button>
          ))}
          <button
            type="button"
            onClick={() => {
              if (globeInstanceRef.current) {
                globeInstanceRef.current.pointOfView({ lat: 47, lng: 70, altitude: 2 }, 900);
              }
            }}
            className="inline-flex items-center gap-2 rounded-full bg-neutral-100 px-4 py-2 text-sm font-medium text-neutral-700 dark:bg-slate-800 dark:text-neutral-200"
          >
            <RotateCcw className="h-4 w-4" />
            {language === 'kk' ? 'Қайтару' : 'Сбросить'}
          </button>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="overflow-hidden rounded-3xl border border-neutral-200 bg-slate-950/95 dark:border-slate-700">
          {error ? (
            <div className="flex h-[480px] flex-col items-center justify-center gap-3 px-6 text-center text-slate-100">
              <AlertCircle className="h-10 w-10 text-amber-300" />
              <p className="max-w-md text-sm leading-6">{error}</p>
            </div>
          ) : (
            <div>
              <div ref={globeContainerRef} className="h-[480px] w-full" />
              {!mapReady && (
                <div className="border-t border-slate-800 bg-slate-900/90 px-4 py-3 text-sm text-slate-300">
                  {language === 'kk' ? 'Глобус жүктеліп жатыр...' : 'Глобус загружается...'}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="rounded-3xl border border-neutral-200 bg-neutral-50 p-5 dark:border-dark-border dark:bg-dark-bg">
            <div className="flex items-center gap-2 text-sm font-semibold text-neutral-500 dark:text-neutral-300">
              <MapPinned className="h-4 w-4" />
              {language === 'kk' ? 'Белсенді нүкте' : 'Активная точка'}
            </div>
            <h3 className="mt-3 text-xl font-bold text-neutral-900 dark:text-white">{selectedMarker?.name}</h3>
            <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-300">{selectedMarker?.country || selectedMarker?.region}</p>
            <p className="mt-3 text-xs uppercase tracking-[0.2em] text-neutral-400">
              {language === 'kk' ? 'Координаттар' : 'Координаты'}
            </p>
            <p className="mt-1 text-sm font-medium text-neutral-700 dark:text-neutral-100">
              {selectedMarker?.lat?.toFixed(2)}, {selectedMarker?.lng?.toFixed(2)}
            </p>
          </div>

          <div className="rounded-3xl border border-neutral-200 bg-neutral-50 p-5 dark:border-dark-border dark:bg-dark-bg">
            <div className="flex items-center gap-2 text-sm font-semibold text-neutral-500 dark:text-neutral-300">
              <Orbit className="h-4 w-4" />
              {language === 'kk' ? 'Мини-тапсырма' : 'Мини-задача'}
            </div>
            <ul className="mt-4 space-y-3 text-sm leading-6 text-neutral-700 dark:text-neutral-200">
              <li>{challengeText}</li>
              <li>
                {selectedTool === 'regions'
                  ? (language === 'kk' ? 'Батыс пен шығыстың табиғи ерекшеліктерін салыстырыңыз.' : 'Сравните природные особенности запада и востока страны.')
                  : (language === 'kk' ? 'Астаналарды уақыт белдеулері бойынша топтастырыңыз.' : 'Сгруппируйте столицы по часовым поясам.')}
              </li>
              <li>
                {language === 'kk'
                  ? 'Келесі қадам: осы картадан ойын немесе пікірталас сценариін жасаңыз.'
                  : 'Следующий шаг: превратите карту в игру или сценарий обсуждения.'}
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
