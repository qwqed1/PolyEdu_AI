import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  BookOpen,
  FileText,
  Gamepad2,
  Loader2,
  Search,
  Sparkles,
} from 'lucide-react';
import publicLibraryService from '../../services/publicLibraryService';
import { getPublicResourcePath } from '../../utils/publicLinks';

const FILTERS = [
  { key: 'all', label: 'Все', icon: BookOpen },
  { key: 'lesson-plan', label: 'Планы', icon: FileText },
  { key: 'quiz', label: 'Викторины', icon: BookOpen },
  { key: 'game', label: 'Мини-игры', icon: Gamepad2 },
];

export default function LibraryPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState({ page: 1, totalPages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchValue, setSearchValue] = useState(searchParams.get('q') || '');

  const type = searchParams.get('type') || 'all';
  const q = searchParams.get('q') || '';

  useEffect(() => {
    setSearchValue(q);
  }, [q]);

  useEffect(() => {
    let cancelled = false;

    async function loadLibrary() {
      try {
        setLoading(true);
        setError('');
        const response = await publicLibraryService.getLibrary({
          type,
          q: q || undefined,
        });

        if (!cancelled) {
          setItems(response.data || []);
          setMeta(response.meta || { page: 1, totalPages: 1, total: 0 });
        }
      } catch (loadError) {
        if (!cancelled) {
          console.error(loadError);
          setError('Не удалось загрузить библиотеку');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadLibrary();
    return () => {
      cancelled = true;
    };
  }, [q, type]);

  const updateParams = (next) => {
    const params = new URLSearchParams(searchParams);
    Object.entries(next).forEach(([key, value]) => {
      if (!value || value === 'all') {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    });
    setSearchParams(params);
  };

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    updateParams({ q: searchValue.trim() || null });
  };

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-dark-bg py-10 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-50 text-primary-700 dark:bg-primary-900/20 dark:text-primary-300 mb-4">
            <Sparkles className="w-4 h-4" />
            Публичная библиотека
          </div>
          <h1 className="text-4xl font-black text-neutral-900 dark:text-white mb-3">
            Готовые планы, викторины и мини-игры
          </h1>
          <p className="text-neutral-600 dark:text-neutral-400 max-w-3xl">
            Открывайте опубликованные материалы преподавателей, используйте готовые планы уроков
            и запускайте публичные активности без входа в кабинет.
          </p>
        </div>

        <div className="bg-white dark:bg-dark-card border border-neutral-200 dark:border-dark-border rounded-2xl p-5 shadow-sm mb-8">
          <div className="flex flex-col gap-4">
            <form onSubmit={handleSearchSubmit} className="flex gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" />
                <input
                  type="text"
                  value={searchValue}
                  onChange={(event) => setSearchValue(event.target.value)}
                  placeholder="Поиск по теме, предмету или названию"
                  className="w-full h-12 rounded-xl border border-neutral-300 dark:border-dark-border bg-white dark:bg-dark-bg pl-11 pr-4 text-neutral-900 dark:text-white"
                />
              </div>
              <button
                type="submit"
                className="px-5 h-12 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-semibold"
              >
                Найти
              </button>
            </form>

            <div className="flex flex-wrap gap-2">
              {FILTERS.map((filter) => {
                const Icon = filter.icon;
                const active = type === filter.key;
                return (
                  <button
                    key={filter.key}
                    type="button"
                    onClick={() => updateParams({ type: filter.key })}
                    className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
                      active
                        ? 'bg-primary-600 text-white'
                        : 'bg-neutral-100 text-neutral-700 dark:bg-dark-bg dark:text-neutral-300'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {filter.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
          </div>
        ) : error ? (
          <div className="bg-red-50 text-red-700 border border-red-200 rounded-2xl p-5">{error}</div>
        ) : items.length === 0 ? (
          <div className="bg-white dark:bg-dark-card border border-neutral-200 dark:border-dark-border rounded-2xl p-12 text-center">
            <BookOpen className="w-14 h-14 mx-auto text-neutral-300 mb-4" />
            <h2 className="text-xl font-semibold text-neutral-900 dark:text-white mb-2">
              Пока нет опубликованных материалов
            </h2>
            <p className="text-neutral-500">Попробуйте изменить фильтр или поисковый запрос.</p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-neutral-500">Найдено материалов: {meta.total}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {items.map((item) => (
                <LibraryCard key={`${item.type}-${item.id}`} item={item} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function LibraryCard({ item }) {
  const typeLabel =
    item.type === 'lesson-plan' ? 'План урока' : item.type === 'quiz' ? 'Викторина' : 'Мини-игра';

  return (
    <Link
      to={getPublicResourcePath(item.type, item.id)}
      className="block bg-white dark:bg-dark-card border border-neutral-200 dark:border-dark-border rounded-2xl p-5 shadow-sm hover:shadow-lg transition-shadow"
    >
      <div className="flex items-center justify-between mb-3 gap-4">
        <span className="inline-flex items-center rounded-full bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 text-xs font-semibold px-3 py-1">
          {typeLabel}
        </span>
        <span className="text-xs text-neutral-400">
          {new Date(item.published_at || item.created_at).toLocaleDateString('ru-RU')}
        </span>
      </div>

      <h2 className="text-lg font-bold text-neutral-900 dark:text-white mb-2 line-clamp-2">
        {item.title}
      </h2>

      {item.subject_name && (
        <p className="text-sm text-primary-600 dark:text-primary-300 mb-2">{item.subject_name}</p>
      )}

      {item.description && (
        <p className="text-sm text-neutral-600 dark:text-neutral-400 line-clamp-3 mb-4">
          {item.description}
        </p>
      )}

      <div className="flex items-center justify-between text-sm text-neutral-500">
        <span>
          {item.type === 'quiz'
            ? `${item.questions_count || 0} вопросов`
            : item.group_name || 'Открыть материал'}
        </span>
        <span className="font-semibold text-primary-600">Открыть</span>
      </div>
    </Link>
  );
}
