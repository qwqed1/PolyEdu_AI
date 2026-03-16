import { useState, useEffect, useRef, useCallback } from 'react';
import { Bot, Send, User, Loader2, AlertCircle, Mic, MicOff } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import aiService from '../../services/aiService';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';

export default function AIChatPage() {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [, setError] = useState(null);
  const [isListening, setIsListening] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(false);
  const messagesEndRef = useRef(null);
  const recognitionRef = useRef(null);
  const { user } = useAuth();
  const { language, t } = useLanguage();
  const [searchParams] = useSearchParams();

  // Автоматическая прокрутка к последнему сообщению
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Инициализация Web Speech API
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      setVoiceSupported(true);
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;

      recognition.onresult = (event) => {
        let finalTranscript = '';
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          }
        }
        
        if (finalTranscript) {
          setInputMessage(prev => prev + finalTranscript);
        }
      };

      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }

    return () => {
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch { /* ignore */ }
      }
    };
  }, []);

  // Обновляем язык распознавания при смене языка
  useEffect(() => {
    if (recognitionRef.current) {
      recognitionRef.current.lang = language === 'kk' ? 'kk-KZ' : 'ru-RU';
    }
  }, [language]);

  const toggleVoiceInput = useCallback(() => {
    if (!recognitionRef.current) return;

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      recognitionRef.current.lang = language === 'kk' ? 'kk-KZ' : 'ru-RU';
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (e) {
        console.error('Failed to start recognition:', e);
      }
    }
  }, [isListening, language]);

  // Приветственное сообщение
  useEffect(() => {
    setMessages([
      {
        id: 1,
        type: 'ai',
        content: t.aiChat.greeting(user?.name),
        timestamp: new Date()
      }
    ]);
  }, [user, t]);

  useEffect(() => {
    const presetPrompt = searchParams.get('prompt');
    if (!presetPrompt) {
      return;
    }

    setInputMessage(presetPrompt);
  }, [searchParams]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if (!inputMessage.trim() || isLoading) return;

    // Останавливаем голосовой ввод при отправке
    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: inputMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);
    setError(null);

    try {
      const response = await aiService.sendMessage(inputMessage);
      
      console.log('=== AI Response Debug ===');
      console.log('Full response:', response);
      console.log('response.data:', response.data);
      console.log('response.data type:', typeof response.data);
      
      // Извлекаем текст ответа из различных возможных полей
      let aiResponseText = '';
      
      if (response.data) {
        console.log('Checking response.data fields...');
        console.log('response.data.message:', response.data.message);
        console.log('response.data.response:', response.data.response);
        console.log('response.data.text:', response.data.text);
        
        // Проверяем все возможные поля
        if (response.data.message) {
          aiResponseText = response.data.message;
          console.log('✓ Using response.data.message');
        } else if (response.data.response) {
          aiResponseText = response.data.response;
          console.log('✓ Using response.data.response');
        } else if (response.data.text) {
          aiResponseText = response.data.text;
          console.log('✓ Using response.data.text');
        } else if (response.data.output) {
          aiResponseText = response.data.output;
          console.log('✓ Using response.data.output');
        } else if (typeof response.data === 'string') {
          aiResponseText = response.data;
          console.log('✓ Using response.data as string');
        } else {
          aiResponseText = JSON.stringify(response.data, null, 2);
          console.log('✓ Using stringified response.data');
        }
      } else {
        aiResponseText = t.aiChat.noData;
        console.log('✗ No response.data');
      }
      
      console.log('Final aiResponseText:', aiResponseText);
      console.log('========================');
      
      // Проверяем, что текст не пустой
      if (!aiResponseText || aiResponseText.trim() === '') {
        aiResponseText = t.aiChat.emptyResponse;
      }
      
      // Добавляем ответ AI
      const aiMessage = {
        id: Date.now() + 1,
        type: 'ai',
        content: aiResponseText,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Ошибка при отправке сообщения:', error);
      setError(error.message);
      
      // Добавляем сообщение об ошибке
      const errorMessage = {
        id: Date.now() + 1,
        type: 'error',
        content: `${t.aiChat.errorPrefix} ${error.message}`,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-theme(spacing.32))] bg-gray-50 dark:bg-gray-900 flex flex-col">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4">
        <div className="max-w-4xl mx-auto flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-r from-red-500 to-pink-500 rounded-full flex items-center justify-center">
            <Bot className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">{t.aiChat.title}</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">{t.aiChat.subtitle}</p>
          </div>
        </div>
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="max-w-4xl mx-auto space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex items-start gap-3 ${
                message.type === 'user' ? 'flex-row-reverse' : ''
              }`}
            >
              {/* Avatar */}
              <div
                className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                  message.type === 'user'
                    ? 'bg-blue-500'
                    : message.type === 'error'
                    ? 'bg-red-500'
                    : 'bg-gradient-to-r from-red-500 to-pink-500'
                }`}
              >
                {message.type === 'user' ? (
                  <User className="w-5 h-5 text-white" />
                ) : message.type === 'error' ? (
                  <AlertCircle className="w-5 h-5 text-white" />
                ) : (
                  <Bot className="w-5 h-5 text-white" />
                )}
              </div>

              {/* Message Bubble */}
              <div
                className={`flex-1 max-w-[70%] ${
                  message.type === 'user' ? 'text-right' : ''
                }`}
              >
                <div
                  className={`inline-block p-3 rounded-lg ${
                    message.type === 'user'
                      ? 'bg-blue-600 text-white'
                      : message.type === 'error'
                      ? 'bg-red-50 dark:bg-red-900/30 text-red-800 dark:text-red-100 border border-red-200 dark:border-red-700'
                      : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 shadow-sm dark:shadow-none'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {message.timestamp.toLocaleTimeString('ru-RU', {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
            </div>
          ))}

          {/* Loading Indicator */}
          {isLoading && (
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-gradient-to-r from-red-500 to-pink-500 rounded-full flex items-center justify-center">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-3 rounded-lg shadow-sm dark:shadow-none">
                <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Voice listening indicator */}
      {isListening && (
        <div className="bg-red-50 dark:bg-red-900/20 border-t border-red-200 dark:border-red-800 px-4 py-2">
          <div className="max-w-4xl mx-auto flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
            </span>
            <span className="text-sm text-red-600 dark:text-red-400 font-medium">
              {t.aiChat.voiceListening}
            </span>
          </div>
        </div>
      )}

      {/* Input Form */}
      <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4">
        <div className="max-w-4xl mx-auto">
          <form onSubmit={handleSendMessage} className="flex gap-2">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder={t.aiChat.placeholder}
              disabled={isLoading}
              className="flex-1 px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
              maxLength={2000}
            />

            {/* Voice input button */}
            {voiceSupported && (
              <button
                type="button"
                onClick={toggleVoiceInput}
                disabled={isLoading}
                title={isListening ? t.aiChat.voiceStop : t.aiChat.voiceStart}
                className={`px-4 py-3 rounded-lg font-medium transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-900 disabled:opacity-50 disabled:cursor-not-allowed ${
                  isListening
                    ? 'bg-red-500 hover:bg-red-600 text-white focus:ring-red-500 animate-pulse'
                    : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 focus:ring-gray-400'
                }`}
              >
                {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </button>
            )}

            <button
              type="submit"
              disabled={!inputMessage.trim() || isLoading}
              className="px-6 py-3 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-lg font-medium hover:from-red-600 hover:to-pink-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              <Send className="w-5 h-5" />
            </button>
          </form>
          <p className="text-xs text-gray-500 mt-2">
            {t.aiChat.charCount(inputMessage.length, 2000)}
          </p>
        </div>
      </div>
    </div>
  );
}
