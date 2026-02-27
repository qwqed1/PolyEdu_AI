import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Gamepad2, ArrowRight, Sparkles } from 'lucide-react';

const JoinGamePage = () => {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    const cleanCode = code.trim().toUpperCase();
    
    if (cleanCode.length !== 6) {
      setError('Код должен состоять из 6 символов');
      return;
    }

    navigate(`/play/${cleanCode}`);
  };

  const handleCodeChange = (e) => {
    const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
    setCode(value);
    setError('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-indigo-600 to-blue-600 flex items-center justify-center p-4">
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-white/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <div className="relative bg-white dark:bg-dark-card rounded-3xl shadow-2xl p-8 max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
            <Gamepad2 className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-neutral-900 dark:text-white mb-2">
            Присоединиться к игре
          </h1>
          <p className="text-neutral-500 dark:text-neutral-400">
            Введите код игры от преподавателя
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <input
              type="text"
              value={code}
              onChange={handleCodeChange}
              placeholder="XXXXXX"
              className="w-full text-center text-4xl font-mono font-bold tracking-[0.5em] px-4 py-6 rounded-2xl border-2 border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-dark-bg focus:ring-4 focus:ring-primary-500/30 focus:border-primary-500 transition-all placeholder:text-neutral-300 placeholder:tracking-[0.3em]"
              autoFocus
            />
            {error && (
              <p className="mt-2 text-red-500 text-center text-sm">{error}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={code.length !== 6}
            className="w-full py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-2xl font-bold text-xl hover:shadow-lg hover:scale-[1.02] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-3"
          >
            <span>Войти</span>
            <ArrowRight className="w-6 h-6" />
          </button>
        </form>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-neutral-400 text-sm flex items-center justify-center gap-2">
            <Sparkles className="w-4 h-4" />
            Интерактивные игры от AIZERT
          </p>
        </div>
      </div>
    </div>
  );
};

export default JoinGamePage;
