import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Bot,
  Copy,
  Download,
  Eye,
  FolderOpen,
  Gamepad2,
  Globe,
  ListChecks,
  Loader2,
  Save,
  Send,
  Trash2,
  User,
  Wand2,
  X,
} from 'lucide-react';
import aiGameService from '../../services/aiGameService';
import { getPublicResourceUrl } from '../../utils/publicLinks';

const initialMessage = {
  id: 1,
  type: 'ai',
  content:
    'Привет! Я помогу создать интерактивную игру. Опиши механику, тему или формат, и я сгенерирую готовый HTML.',
  timestamp: new Date(),
};

export default function GameGeneratorPage() {
  const [messages, setMessages] = useState([initialMessage]);
  const [inputMessage, setInputMessage] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedHtml, setGeneratedHtml] = useState('');
  const [currentPrompt, setCurrentPrompt] = useState('');
  const [savedGames, setSavedGames] = useState([]);
  const [showSavedList, setShowSavedList] = useState(false);
  const [loadingGame, setLoadingGame] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [saveTitle, setSaveTitle] = useState('');
  const [saveIsPublic, setSaveIsPublic] = useState(false);
  const [searchParams] = useSearchParams();
  const [sourceLessonPlanId, setSourceLessonPlanId] = useState('');

  useEffect(() => {
    loadSavedGames();
  }, []);

  useEffect(() => {
    const presetPrompt = searchParams.get('prompt');
    const presetTitle = searchParams.get('title');
    const lessonPlanId = searchParams.get('lessonPlanId');

    if (!presetPrompt) {
      return;
    }

    setInputMessage(presetPrompt);
    setCurrentPrompt(presetPrompt);
    setSourceLessonPlanId(lessonPlanId || '');

    if (presetTitle) {
      setSaveTitle(presetTitle);
    }

    const infoText = 'Промпт из плана урока уже подставлен. При необходимости отредактируй его и нажми отправить.';
    setMessages((prev) => {
      if (prev.some((item) => item.content === infoText)) {
        return prev;
      }

      return [
        ...prev,
        {
          id: Date.now() + 10,
          type: 'ai',
          content: infoText,
          timestamp: new Date(),
        },
      ];
    });
  }, [searchParams]);

  const loadSavedGames = async () => {
    try {
      const response = await aiGameService.getAll();
      setSavedGames(response.data || []);
    } catch (error) {
      console.error(error);
    }
  };

  const handleSendMessage = async (event) => {
    event.preventDefault();
    if (!inputMessage.trim() || isGenerating) {
      return;
    }

    const prompt = inputMessage.trim();
    setInputMessage('');
    setCurrentPrompt(prompt);
    setIsGenerating(true);

    setMessages((prev) => [
      ...prev,
      {
        id: Date.now(),
        type: 'user',
        content: prompt,
        timestamp: new Date(),
      },
      {
        id: Date.now() + 1,
        type: 'ai',
        content: 'Генерирую игру... Это может занять 1-2 минуты.',
        timestamp: new Date(),
        isLoading: true,
      },
    ]);

    try {
      const result = await aiGameService.generate(prompt);

      setMessages((prev) => {
        const withoutLoading = prev.filter((message) => !message.isLoading);

        if (result.success && result.data?.html_code) {
          setGeneratedHtml(result.data.html_code);
          return [
            ...withoutLoading,
            {
              id: Date.now() + 2,
              type: 'ai',
              content:
                'Игра готова. Можно сохранить её в библиотеку, опубликовать или попросить изменить механику.',
              timestamp: new Date(),
            },
          ];
        }

        return [
          ...withoutLoading,
          {
            id: Date.now() + 3,
            type: 'error',
            content: 'Не удалось сгенерировать игру. Попробуй описать задачу подробнее.',
            timestamp: new Date(),
          },
        ];
      });
    } catch (error) {
      setMessages((prev) => [
        ...prev.filter((message) => !message.isLoading),
        {
          id: Date.now() + 4,
          type: 'error',
          content: `Ошибка: ${error.message}`,
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveGame = async () => {
    if (!saveTitle.trim() || !generatedHtml) {
      return;
    }

    try {
      const response = await aiGameService.save(saveTitle.trim(), currentPrompt, generatedHtml, {
        sourceLessonPlanId: sourceLessonPlanId || null,
      });

      if (saveIsPublic && response.data?.id) {
        await aiGameService.publish(response.data.id, true);
      }

      setShowSaveModal(false);
      setSaveTitle('');
      setSaveIsPublic(false);
      await loadSavedGames();
    } catch (error) {
      alert(error.message);
    }
  };

  const handleLoadGame = async (gameId) => {
    try {
      setLoadingGame(true);
      const response = await aiGameService.getById(gameId);

      if (response.data) {
        setGeneratedHtml(response.data.html_code || '');
        setCurrentPrompt(response.data.prompt || '');
        setSourceLessonPlanId(response.data.source_lesson_plan_id || '');
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now() + 5,
            type: 'ai',
            content: `Загрузил игру: ${response.data.title}`,
            timestamp: new Date(),
          },
        ]);
        setShowSavedList(false);
      }
    } catch (error) {
      alert(error.message);
    } finally {
      setLoadingGame(false);
    }
  };

  const handleDeleteGame = async (gameId) => {
    if (!window.confirm('Удалить эту игру?')) {
      return;
    }

    try {
      await aiGameService.delete(gameId);
      await loadSavedGames();
    } catch (error) {
      alert(error.message);
    }
  };

  const handleTogglePublic = async (game) => {
    try {
      await aiGameService.publish(game.id, !game.is_public);
      await loadSavedGames();
    } catch (error) {
      alert(error.message);
    }
  };

  const handleCopyLink = async (gameId) => {
    try {
      await navigator.clipboard.writeText(getPublicResourceUrl('game', gameId));
      alert('Публичная ссылка скопирована');
    } catch (error) {
      console.error(error);
      alert('Не удалось скопировать ссылку');
    }
  };

  const handleDownload = () => {
    if (!generatedHtml) {
      return;
    }

    const blob = new Blob([generatedHtml], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ai-game-${Date.now()}.html`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="h-[calc(100vh-4rem)] bg-neutral-100 dark:bg-dark-bg flex overflow-hidden">
      <aside className="hidden lg:flex w-80 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex-col">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-3xl font-black tracking-tight text-neutral-900 dark:text-white flex items-center gap-3">
            <Gamepad2 className="w-7 h-7 text-red-500" />
            Игры
          </h2>
          <p className="text-sm text-neutral-500 mt-2">Интерактивные активности и генерация</p>
        </div>

        <nav className="p-4 space-y-3">
          <Link
            to="/interactive-games"
            className="w-full flex items-center gap-3 px-4 py-4 rounded-2xl text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-gray-700 transition-colors"
          >
            <ListChecks className="w-5 h-5" />
            <div>
              <div className="font-semibold">Викторины</div>
              <div className="text-xs text-neutral-500">Созданные квизы</div>
            </div>
          </Link>

          <div className="w-full flex items-center gap-3 px-4 py-4 rounded-2xl bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-300">
            <Wand2 className="w-5 h-5" />
            <div>
              <div className="font-semibold">Создать игру</div>
              <div className="text-xs opacity-80">AI генератор</div>
            </div>
          </div>
        </nav>
      </aside>

      <section className="flex-1 flex flex-col min-w-0">
        <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-4 min-w-0">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-violet-500 to-fuchsia-500 flex items-center justify-center shrink-0">
              <Wand2 className="w-6 h-6 text-white" />
            </div>
            <div className="min-w-0">
              <h1 className="text-3xl font-black tracking-tight text-neutral-900 dark:text-white truncate">
                AI Генератор Игр
              </h1>
              <p className="text-sm text-neutral-500 truncate">
                Опиши игру и получи интерактивный HTML-сценарий
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowSavedList((prev) => !prev)}
            className="flex items-center gap-2 rounded-xl bg-neutral-100 dark:bg-gray-700 px-4 py-2 text-sm font-semibold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-gray-600 transition-colors"
          >
            <FolderOpen className="w-4 h-4" />
            Мои игры ({savedGames.length})
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-5 sm:px-8 py-6">
          <div className="max-w-3xl mx-auto space-y-4">
            {messages.map((message) => (
              <article
                key={message.id}
                className={`flex gap-3 ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {message.type !== 'user' && (
                  <div className="w-10 h-10 rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 flex items-center justify-center shrink-0 mt-1">
                    {message.isLoading ? (
                      <Loader2 className="w-5 h-5 text-white animate-spin" />
                    ) : (
                      <Bot className="w-5 h-5 text-white" />
                    )}
                  </div>
                )}

                <div className={`max-w-[85%] ${message.type === 'user' ? 'order-first' : ''}`}>
                  <div
                    className={`rounded-2xl px-5 py-4 border text-base leading-relaxed whitespace-pre-wrap ${
                      message.type === 'user'
                        ? 'bg-primary-600 text-white border-primary-600'
                        : message.type === 'error'
                          ? 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800'
                          : 'bg-white text-neutral-900 border-neutral-200 dark:bg-gray-800 dark:text-neutral-100 dark:border-gray-700'
                    }`}
                  >
                    {message.content}
                  </div>
                  <p className="text-xs text-neutral-400 mt-2 px-1">
                    {message.timestamp.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>

                {message.type === 'user' && (
                  <div className="w-10 h-10 rounded-full bg-primary-600 flex items-center justify-center shrink-0 mt-1">
                    <User className="w-5 h-5 text-white" />
                  </div>
                )}
              </article>
            ))}

            {generatedHtml && (
              <div className="max-w-[85%] bg-white dark:bg-gray-800 border border-neutral-200 dark:border-gray-700 rounded-2xl px-5 py-4">
                <p className="text-sm text-neutral-600 dark:text-neutral-300 mb-3">
                  Игра сгенерирована. Можно сохранить её в библиотеку или скачать HTML.
                </p>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setShowSaveModal(true)}
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-violet-600 text-white text-sm font-medium hover:bg-violet-700 transition-colors"
                  >
                    <Save className="w-4 h-4" />
                    Сохранить
                  </button>
                  <button
                    type="button"
                    onClick={handleDownload}
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-neutral-200 dark:bg-gray-700 text-sm font-medium text-neutral-700 dark:text-neutral-200 hover:bg-neutral-300 dark:hover:bg-gray-600 transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    Скачать HTML
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-5 sm:px-8 py-4">
          <form onSubmit={handleSendMessage} className="max-w-3xl mx-auto flex items-center gap-3">
            <input
              type="text"
              value={inputMessage}
              onChange={(event) => setInputMessage(event.target.value)}
              placeholder="Опиши игру, которую хочешь создать..."
              disabled={isGenerating}
              className="flex-1 h-14 rounded-2xl border border-neutral-300 dark:border-gray-600 bg-neutral-50 dark:bg-gray-900 px-5 text-base text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-violet-500 disabled:opacity-60"
            />
            <button
              type="submit"
              disabled={!inputMessage.trim() || isGenerating}
              className="h-14 w-14 rounded-2xl bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white flex items-center justify-center hover:from-violet-600 hover:to-fuchsia-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="w-5 h-5" />
            </button>
          </form>
        </footer>
      </section>

      {showSavedList && (
        <aside className="absolute right-0 top-0 bottom-0 w-full sm:w-96 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 shadow-2xl z-40 flex flex-col">
          <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">Мои игры</h3>
            <button
              type="button"
              onClick={() => setShowSavedList(false)}
              className="text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {savedGames.length === 0 ? (
              <div className="h-full min-h-48 flex items-center justify-center text-sm text-neutral-500">
                Сохраненных игр пока нет
              </div>
            ) : (
              savedGames.map((game) => (
                <article
                  key={game.id}
                  className="rounded-xl border border-neutral-200 dark:border-gray-700 bg-neutral-50 dark:bg-gray-700/40 p-3"
                >
                  <div className="flex items-center justify-between gap-3 mb-2">
                    <h4 className="font-semibold text-neutral-900 dark:text-white truncate">{game.title}</h4>
                    <button
                      type="button"
                      onClick={() => handleTogglePublic(game)}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-semibold ${
                        game.is_public
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
                          : 'bg-neutral-200 text-neutral-700 dark:bg-gray-800 dark:text-neutral-300'
                      }`}
                    >
                      <Globe className="w-3.5 h-3.5" />
                      {game.is_public ? 'Опубликован' : 'Приватный'}
                    </button>
                  </div>

                  <p className="text-xs text-neutral-500 mt-1 line-clamp-2">{game.prompt}</p>
                  <p className="text-xs text-neutral-400 mt-2">
                    {new Date(game.created_at).toLocaleDateString('ru-RU')}
                  </p>

                  <div className="flex items-center gap-2 mt-3 flex-wrap">
                    <button
                      type="button"
                      disabled={loadingGame}
                      onClick={() => handleLoadGame(game.id)}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 text-xs font-medium hover:bg-violet-200 dark:hover:bg-violet-900/50"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      Открыть
                    </button>
                    <button
                      type="button"
                      disabled={!game.is_public}
                      onClick={() => handleCopyLink(game.id)}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 text-xs font-medium hover:bg-emerald-200 dark:hover:bg-emerald-900/50 disabled:opacity-40"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      Ссылка
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteGame(game.id)}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 text-xs font-medium hover:bg-red-200 dark:hover:bg-red-900/50"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Удалить
                    </button>
                  </div>
                </article>
              ))
            )}
          </div>
        </aside>
      )}

      {showSaveModal && (
        <div
          className="fixed inset-0 bg-black/45 z-50 flex items-center justify-center p-4"
          onClick={() => setShowSaveModal(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-white dark:bg-gray-800 shadow-2xl border border-neutral-200 dark:border-gray-700 p-6"
            onClick={(event) => event.stopPropagation()}
          >
            <h3 className="text-xl font-bold text-neutral-900 dark:text-white mb-4">Сохранить игру</h3>
            <input
              type="text"
              value={saveTitle}
              onChange={(event) => setSaveTitle(event.target.value)}
              placeholder="Название игры"
              className="w-full h-11 rounded-lg border border-neutral-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 text-neutral-900 dark:text-white mb-4 focus:outline-none focus:ring-2 focus:ring-violet-500"
              autoFocus
            />

            <label className="flex items-center gap-3 mb-5 cursor-pointer">
              <input
                type="checkbox"
                checked={saveIsPublic}
                onChange={(event) => setSaveIsPublic(event.target.checked)}
                className="w-4 h-4 rounded"
              />
              <span className="text-sm text-neutral-700 dark:text-neutral-300">
                Сразу опубликовать игру в библиотеке
              </span>
            </label>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowSaveModal(false)}
                className="flex-1 h-11 rounded-lg border border-neutral-300 dark:border-gray-600 text-neutral-700 dark:text-neutral-200"
              >
                Отмена
              </button>
              <button
                type="button"
                onClick={handleSaveGame}
                disabled={!saveTitle.trim()}
                className="flex-1 h-11 rounded-lg bg-violet-600 text-white hover:bg-violet-700 disabled:opacity-50"
              >
                Сохранить
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
