import { AlertCircle, Loader2 } from 'lucide-react';
import { Component, useEffect, useState } from 'react';

/**
 * @typedef {Object} ToolAdapterProps
 * @property {import('../../data/labCatalog').LabSubjectConfig} subject
 * @property {'ru' | 'kk'} language
 * @property {string} selectedTool
 */

/**
 * @typedef {Object} LabToolConfig
 * @property {string} key
 * @property {() => Promise<{ default: React.ComponentType<ToolAdapterProps> }>} loader
 */

/**
 * @typedef {Object} SubjectWorkspaceProps
 * @property {import('../../data/labCatalog').LabSubjectConfig} subject
 * @property {'ru' | 'kk'} language
 * @property {string} selectedTool
 */

/** @type {Record<string, LabToolConfig>} */
export const labToolRegistry = {
  geography: { key: 'geography', loader: () => import('./GeographyLab') },
  math: { key: 'math', loader: () => import('./MathLab') },
  language: { key: 'language', loader: () => import('./LanguageLab') },
  chemistry: { key: 'chemistry', loader: () => import('./ChemistryLab') },
  generic: { key: 'generic', loader: () => import('./GenericSubjectLab') },
};

function LoadingState({ language }) {
  return (
    <div className="rounded-3xl border border-neutral-200 bg-white p-8 shadow-sm dark:border-dark-border dark:bg-dark-surface">
      <div className="flex items-center justify-center gap-3 text-neutral-600 dark:text-neutral-300">
        <Loader2 className="h-5 w-5 animate-spin" />
        <span>{language === 'kk' ? 'Модуль жүктелуде...' : 'Модуль загружается...'}</span>
      </div>
    </div>
  );
}

function ErrorState({ language, error }) {
  return (
    <div className="rounded-3xl border border-red-200 bg-white p-8 shadow-sm dark:border-red-900 dark:bg-dark-surface">
      <div className="flex items-start gap-3">
        <AlertCircle className="mt-0.5 h-5 w-5 text-red-500" />
        <div>
          <h3 className="text-base font-semibold text-neutral-900 dark:text-white">
            {language === 'kk' ? 'Лаборатория модулі жүктелмеді' : 'Модуль лаборатории не загрузился'}
          </h3>
          <p className="mt-2 text-sm leading-6 text-neutral-600 dark:text-neutral-300">
            {language === 'kk'
              ? 'Бұл бөлімді ашу кезінде қате шықты. Бет енді толық ақ экранға құламайды, ал қалған лаборатория бөлімдері ашыла береді.'
              : 'При открытии этого раздела произошла ошибка. Страница больше не падает целиком в белый экран, а остальные разделы лаборатории продолжают работать.'}
          </p>
          {error ? (
            <p className="mt-3 rounded-2xl bg-red-50 px-3 py-2 text-xs text-red-700 dark:bg-red-950/30 dark:text-red-200">
              {String(error)}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}

class LabAdapterBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error) {
    return {
      hasError: true,
      message: error?.message || 'Unknown adapter render error',
    };
  }

  componentDidCatch(error) {
    console.error('Lab adapter render failed', error);
  }

  componentDidUpdate(prevProps) {
    if (prevProps.resetKey !== this.props.resetKey && this.state.hasError) {
      this.setState({ hasError: false, message: '' });
    }
  }

  render() {
    if (this.state.hasError) {
      return <ErrorState language={this.props.language} error={this.state.message} />;
    }

    return this.props.children;
  }
}

export default function SubjectWorkspace({ subject, language, selectedTool }) {
  const [Component, setComponent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    const adapter = labToolRegistry[subject.adapterKey] || labToolRegistry.generic;

    setLoading(true);
    setError('');
    setComponent(null);

    adapter.loader()
      .then((module) => {
        if (cancelled) {
          return;
        }
        setComponent(() => module.default);
      })
      .catch((loadError) => {
        if (cancelled) {
          return;
        }
        console.error(`Failed to load lab adapter "${adapter.key}"`, loadError);
        setError(loadError?.message || 'Unknown adapter error');
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [subject.adapterKey]);

  if (loading) {
    return <LoadingState language={language} />;
  }

  if (error || !Component) {
    return <ErrorState language={language} error={error} />;
  }

  return (
    <LabAdapterBoundary language={language} resetKey={`${subject.key}:${selectedTool}`}>
      <Component subject={subject} language={language} selectedTool={selectedTool} />
    </LabAdapterBoundary>
  );
}
