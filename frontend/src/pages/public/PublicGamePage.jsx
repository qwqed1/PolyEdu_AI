import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Loader2, RefreshCw } from 'lucide-react';
import publicLibraryService from '../../services/publicLibraryService';

export default function PublicGamePage() {
  const { id } = useParams();
  const [game, setGame] = useState(null);
  const [html, setHtml] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [frameKey, setFrameKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function loadGame() {
      try {
        setLoading(true);
        setError('');
        const [gameResponse, htmlResponse] = await Promise.all([
          publicLibraryService.getGame(id),
          publicLibraryService.getGameHtml(id),
        ]);

        if (!cancelled) {
          setGame(gameResponse.data);
          setHtml(htmlResponse || '');
        }
      } catch (loadError) {
        if (!cancelled) {
          console.error(loadError);
          setError('Публичная игра не найдена');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadGame();
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  if (error || !game) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="max-w-lg w-full bg-white dark:bg-dark-card rounded-2xl border border-neutral-200 dark:border-dark-border p-8 text-center">
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white mb-3">Материал недоступен</h1>
          <p className="text-neutral-500 mb-6">{error || 'Игра не найдена'}</p>
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
      <div className="max-w-6xl mx-auto">
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <Link to="/library" className="inline-flex items-center gap-2 text-sm text-neutral-500 hover:text-primary-600 mb-3">
              <ArrowLeft className="w-4 h-4" />
              К библиотеке
            </Link>
            <h1 className="text-3xl font-black text-neutral-900 dark:text-white">{game.title}</h1>
            <p className="text-neutral-600 dark:text-neutral-400 mt-2 max-w-3xl">{game.prompt}</p>
          </div>

          <button
            type="button"
            onClick={() => setFrameKey((value) => value + 1)}
            className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-primary-600 text-white font-semibold"
          >
            <RefreshCw className="w-4 h-4" />
            Перезапустить
          </button>
        </div>

        <div className="bg-white dark:bg-dark-card rounded-3xl border border-neutral-200 dark:border-dark-border p-3 shadow-sm">
          <iframe
            key={frameKey}
            title={game.title}
            srcDoc={html}
            sandbox="allow-scripts allow-modals"
            className="w-full min-h-[80vh] rounded-2xl bg-white"
          />
        </div>
      </div>
    </div>
  );
}
