import { useState, useEffect, useRef } from 'react';
import { Bot, Send, User, Loader2, AlertCircle } from 'lucide-react';
import aiService from '../../services/aiService';
import { useAuth } from '../../contexts/AuthContext';

export default function AIChatPage() {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);
  const { user } = useAuth();

  // Автоматическая прокрутка к последнему сообщению
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Приветственное сообщение
  useEffect(() => {
    setMessages([
      {
        id: 1,
        type: 'ai',
        content: `Здравствуйте${user?.name ? ', ' + user.name : ''}! Я AIZERT, ваш AI-помощник. Чем могу помочь сегодня?`,
        timestamp: new Date()
      }
    ]);
  }, [user]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if (!inputMessage.trim() || isLoading) return;

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
        aiResponseText = 'Получен ответ от AI агента, но данные отсутствуют';
        console.log('✗ No response.data');
      }
      
      console.log('Final aiResponseText:', aiResponseText);
      console.log('========================');
      
      // Проверяем, что текст не пустой
      if (!aiResponseText || aiResponseText.trim() === '') {
        aiResponseText = 'AI вернул пустой ответ. Попробуйте переформулировать вопрос.';
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
        content: `Извините, произошла ошибка: ${error.message}`,
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
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">AIZERT</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">Твой ИИ-помощник для учёбы</p>
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

      {/* Input Form */}
      <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4">
        <div className="max-w-4xl mx-auto">
          <form onSubmit={handleSendMessage} className="flex gap-2">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Введите ваш вопрос..."
              disabled={isLoading}
              className="flex-1 px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
              maxLength={2000}
            />
            <button
              type="submit"
              disabled={!inputMessage.trim() || isLoading}
              className="px-6 py-3 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-lg font-medium hover:from-red-600 hover:to-pink-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              <Send className="w-5 h-5" />
            </button>
          </form>
          <p className="text-xs text-gray-500 mt-2">
            {inputMessage.length}/2000 символов
          </p>
        </div>
      </div>
    </div>
  );
}
