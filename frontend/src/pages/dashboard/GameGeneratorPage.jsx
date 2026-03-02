import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  Bot, Send, User, Loader2, Gamepad2, Save, Trash2, Plus,
  Play, X, Maximize2, Minimize2, ArrowLeft, Sparkles,
  RefreshCw, Download, Eye, ListChecks, Wand2
} from 'lucide-react';
import aiGameService from '../../services/aiGameService';

export default function GameGeneratorPage() {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedHtml, setGeneratedHtml] = useState('');
  const [currentPrompt, setCurrentPrompt] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [savedGames, setSavedGames] = useState([]);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [saveTitle, setSaveTitle] = useState('');
  const [showSavedList, setShowSavedList] = useState(false);
  const [loadingGame, setLoadingGame] = useState(false);
  const messagesEndRef = useRef(null);
  const iframeRef = useRef(null);

  useEffect(() => {
    loadSavedGames();
    setMessages([{
      id: 1,
      type: 'ai',
      content: 'Привет! Я помогу тебе создать интерактивную игру. Опиши, какую игру ты хочешь, и я сгенерирую её для тебя!\n\nНапример:\n• "Создай игру на знание столиц мира"\n• "Сделай математическую игру на скорость"\n• "Игра-викторина по истории Казахстана"\n• "Змейка с образовательными вопросами"',
      timestamp: new Date()
    }]);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadSavedGames = async () => {
    try {
      const res = await aiGameService.getAll();
      setSavedGames(res.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim() || isGenerating) return;

    const prompt = inputMessage.trim();
    const userMsg = {
      id: Date.now(),
      type: 'user',
      content: prompt,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInputMessage('');
    setIsGenerating(true);
    setCurrentPrompt(prompt);

    // AI "thinking" message
    const thinkingMsg = {
      id: Date.now() + 1,
      type: 'ai',
      content: 'Генерирую игру... Это может занять до 1-2 минут.',
      timestamp: new Date()
    };
    setMessages(prev => [...prev, thinkingMsg]);

    try {
      const result = await aiGameService.generate(prompt);

      if (result.success && result.data?.html_code) {
        setGeneratedHtml(result.data.html_code);
        setShowPreview(true);

        // Remove thinking message and add success
        setMessages(prev => {
          const filtered = prev.filter(m => m.id !== thinkingMsg.id);
          return [...filtered, {
            id: Date.now() + 2,
            type: 'ai',
            content: 'Игра готова! Она отображается справа. Вы можете:\n• Сохранить её\n• Скачать как HTML-файл\n• Открыть на весь экран\n• Попросить меня переделать или создать новую',
            timestamp: new Date()
          }];
        });
      } else {
        setMessages(prev => {
          const filtered = prev.filter(m => m.id !== thinkingMsg.id);
          return [...filtered, {
            id: Date.now() + 2,
            type: 'error',
            content: 'Не удалось сгенерировать игру. Попробуйте описать более подробно.',
            timestamp: new Date()
          }];
        });
      }
    } catch (error) {
      setMessages(prev => {
        const filtered = prev.filter(m => m.id !== thinkingMsg.id);
        return [...filtered, {
          id: Date.now() + 2,
          type: 'error',
          content: `Ошибка: ${error.message}`,
          timestamp: new Date()
        }];
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveGame = async () => {
    if (!saveTitle.trim() || !generatedHtml) return;
    try {
      await aiGameService.save(saveTitle.trim(), currentPrompt, generatedHtml);
      setSaveTitle('');
      setShowSaveModal(false);
      await loadSavedGames();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleLoadGame = async (gameId) => {
    try {
      setLoadingGame(true);
      const res = await aiGameService.getById(gameId);
      if (res.data) {
        setGeneratedHtml(res.data.html_code);
        setCurrentPrompt(res.data.prompt);
        setShowPreview(true);
        setShowSavedList(false);
      }
    } catch (err) {
      alert(err.message);
    } finally {
      setLoadingGame(false);
    }
  };

  const handleDeleteGame = async (gameId) => {
    if (!confirm('Удалить эту игру?')) return;
    try {
      await aiGameService.delete(gameId);
      await loadSavedGames();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDownload = () => {
    if (!generatedHtml) return;
    const blob = new Blob([generatedHtml], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `game-${Date.now()}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const renderIframeContent = () => {
    if (!iframeRef.current || !generatedHtml) return;
    const doc = iframeRef.current.contentDocument;
    doc.open();
    doc.write(generatedHtml);
    doc.close();
  };

  useEffect(() => {
    if (showPreview && generatedHtml) {
      // Small delay to ensure iframe is mounted
      setTimeout(renderIframeContent, 100);
    }
  }, [showPreview, generatedHtml]);

  return (
    <div className="h-[calc(100vh-4rem)] bg-neutral-50 dark:bg-dark-bg flex">
      {/* Left Sidebar */}
      <div className="hidden lg:flex w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex-col flex-shrink-0">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Gamepad2 className="w-5 h-5 text-primary-500" />
            Игры
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Интерактивные активности</p>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          <button
            onClick={() => window.location.href = '/interactive-games'}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all"
          >
            <ListChecks className="w-5 h-5" />
            <div className="text-left">
              <div>Викторины</div>
              <div className="text-xs opacity-70">Созданные квизы</div>
            </div>
          </button>

          <button
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium bg-gradient-to-r from-violet-50 to-fuchsia-50 dark:from-violet-900/20 dark:to-fuchsia-900/20 text-violet-700 dark:text-violet-300 shadow-sm transition-all"
          >
            <Wand2 className="w-5 h-5" />
            <div className="text-left">
              <div>Создать игру</div>
              <div className="text-xs opacity-70">AI генератор</div>
            </div>
          </button>
        </nav>

              </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-r from-violet-500 to-fuchsia-500 rounded-lg flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900 dark:text-white">AI Генератор игр</h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">Опишите игру — AI создаст её</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowSavedList(!showSavedList)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition"
            >
              <Gamepad2 className="w-4 h-4" />
              Мои игры ({savedGames.length})
            </button>
          </div>
        </div>

      {/* Main content: Chat + Preview */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden relative">
        {/* Chat Panel */}
        <div className={`flex flex-col h-full ${showPreview && !isFullscreen ? 'w-full h-1/2 lg:w-1/2 lg:h-full' : 'w-full'} transition-all duration-300`}>
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4">
            <div className="max-w-2xl mx-auto space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex items-start gap-3 ${message.type === 'user' ? 'flex-row-reverse' : ''}`}
                >
                  <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                    message.type === 'user'
                      ? 'bg-blue-500'
                      : message.type === 'error'
                      ? 'bg-red-500'
                      : 'bg-gradient-to-r from-violet-500 to-fuchsia-500'
                  }`}>
                    {message.type === 'user' ? (
                      <User className="w-4 h-4 text-white" />
                    ) : (
                      <Bot className="w-4 h-4 text-white" />
                    )}
                  </div>
                  <div className={`flex-1 max-w-[80%] ${message.type === 'user' ? 'text-right' : ''}`}>
                    <div className={`inline-block p-3 rounded-xl text-sm ${
                      message.type === 'user'
                        ? 'bg-blue-600 text-white'
                        : message.type === 'error'
                        ? 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800'
                        : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700'
                    }`}>
                      <p className="whitespace-pre-wrap">{message.content}</p>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">
                      {message.timestamp.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))}

              {isGenerating && (
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-gradient-to-r from-violet-500 to-fuchsia-500 rounded-full flex items-center justify-center">
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                  <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-3 rounded-xl">
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 text-violet-500 animate-spin" />
                      <span className="text-sm text-gray-500">Генерирую игру...</span>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Input */}
          <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4 flex-shrink-0">
            <form onSubmit={handleSendMessage} className="max-w-2xl mx-auto flex gap-2">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Опишите игру которую хотите создать..."
                disabled={isGenerating}
                className="flex-1 px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 disabled:opacity-50 text-sm"
              />
              <button
                type="submit"
                disabled={!inputMessage.trim() || isGenerating}
                className="px-4 py-2.5 bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white rounded-xl font-medium hover:from-violet-600 hover:to-fuchsia-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                <Send className="w-5 h-5" />
              </button>
            </form>
          </div>
        </div>

        {/* Preview Panel */}
        {showPreview && !isFullscreen && (
          <div className="w-full h-1/2 lg:w-1/2 lg:h-full border-t lg:border-t-0 lg:border-l border-gray-200 dark:border-gray-700 flex flex-col bg-white dark:bg-gray-900">
            {/* Preview toolbar */}
            <div className="flex flex-wrap items-center justify-between px-4 py-2 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex-shrink-0 gap-2">
              <div className="flex items-center gap-2">
                <Play className="w-4 h-4 text-green-500" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Превью игры</span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => renderIframeContent()}
                  className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition"
                  title="Перезапустить"
                >
                  <RefreshCw className="w-4 h-4 text-gray-500" />
                </button>
                <button
                  onClick={() => setShowSaveModal(true)}
                  className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition"
                  title="Сохранить"
                >
                  <Save className="w-4 h-4 text-blue-500" />
                </button>
                <button
                  onClick={handleDownload}
                  className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition"
                  title="Скачать HTML"
                >
                  <Download className="w-4 h-4 text-gray-500" />
                </button>
                <button
                  onClick={() => setIsFullscreen(true)}
                  className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition"
                  title="На весь экран"
                >
                  <Maximize2 className="w-4 h-4 text-gray-500" />
                </button>
                <button
                  onClick={() => { setShowPreview(false); setGeneratedHtml(''); }}
                  className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition"
                  title="Закрыть"
                >
                  <X className="w-4 h-4 text-gray-500" />
                </button>
              </div>
            </div>
            {/* Iframe */}
            <div className="flex-1 overflow-hidden">
              <iframe
                ref={iframeRef}
                className="w-full h-full border-0"
                sandbox="allow-scripts allow-same-origin"
                title="Game Preview"
              />
            </div>
          </div>
        )}

        {/* Fullscreen Preview */}
        {isFullscreen && generatedHtml && (
          <div className="fixed inset-0 z-50 bg-white dark:bg-gray-900 flex flex-col">
            <div className="flex items-center justify-between px-4 py-2 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
              <div className="flex items-center gap-2">
                <Gamepad2 className="w-5 h-5 text-violet-500" />
                <span className="font-medium text-gray-900 dark:text-white">Игра</span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => {
                    const fsIframe = document.getElementById('fullscreen-iframe');
                    if (fsIframe) {
                      const doc = fsIframe.contentDocument;
                      doc.open();
                      doc.write(generatedHtml);
                      doc.close();
                    }
                  }}
                  className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition"
                  title="Перезапустить"
                >
                  <RefreshCw className="w-4 h-4 text-gray-500" />
                </button>
                <button
                  onClick={() => setShowSaveModal(true)}
                  className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition"
                  title="Сохранить"
                >
                  <Save className="w-4 h-4 text-blue-500" />
                </button>
                <button
                  onClick={handleDownload}
                  className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition"
                  title="Скачать"
                >
                  <Download className="w-4 h-4 text-gray-500" />
                </button>
                <button
                  onClick={() => setIsFullscreen(false)}
                  className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition"
                  title="Выйти из полного экрана"
                >
                  <Minimize2 className="w-4 h-4 text-gray-500" />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-hidden">
              <iframe
                id="fullscreen-iframe"
                className="w-full h-full border-0"
                sandbox="allow-scripts allow-same-origin"
                title="Game Fullscreen"
                ref={(el) => {
                  if (el && generatedHtml) {
                    setTimeout(() => {
                      const doc = el.contentDocument;
                      doc.open();
                      doc.write(generatedHtml);
                      doc.close();
                    }, 50);
                  }
                }}
              />
            </div>
          </div>
        )}

        {/* Saved Games Panel */}
        {showSavedList && (
          <div className="absolute right-0 top-0 bottom-0 w-full sm:w-80 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 shadow-xl z-40 flex flex-col">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
              <h3 className="font-semibold text-gray-900 dark:text-white">Мои игры</h3>
              <button onClick={() => setShowSavedList(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {savedGames.length === 0 ? (
                <div className="text-center py-8 text-gray-400 text-sm">Нет сохранённых игр</div>
              ) : (
                savedGames.map((game) => (
                  <div key={game.id} className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-gray-900 dark:text-white text-sm truncate">{game.title}</h4>
                        <p className="text-xs text-gray-500 mt-1 truncate">{game.prompt}</p>
                        <p className="text-xs text-gray-400 mt-1">{new Date(game.created_at).toLocaleDateString('ru-RU')}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 mt-2">
                      <button
                        onClick={() => handleLoadGame(game.id)}
                        disabled={loadingGame}
                        className="flex items-center gap-1 px-2 py-1 text-xs bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 rounded hover:bg-violet-200 transition"
                      >
                        <Eye className="w-3 h-3" />
                        Открыть
                      </button>
                      <button
                        onClick={() => handleDeleteGame(game.id)}
                        className="flex items-center gap-1 px-2 py-1 text-xs bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded hover:bg-red-200 transition"
                      >
                        <Trash2 className="w-3 h-3" />
                        Удалить
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* Save Modal */}
      {showSaveModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setShowSaveModal(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Сохранить игру</h2>
              <button onClick={() => setShowSaveModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <input
              type="text"
              value={saveTitle}
              onChange={(e) => setSaveTitle(e.target.value)}
              placeholder="Название игры"
              className="w-full px-4 py-2.5 border dark:border-gray-600 rounded-lg mb-4 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:border-violet-500"
              autoFocus
            />
            <div className="flex gap-2">
              <button
                onClick={() => setShowSaveModal(false)}
                className="flex-1 px-4 py-2 border dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300"
              >
                Отмена
              </button>
              <button
                onClick={handleSaveGame}
                disabled={!saveTitle.trim()}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white rounded-lg hover:from-violet-600 hover:to-fuchsia-600 disabled:opacity-50"
              >
                Сохранить
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
