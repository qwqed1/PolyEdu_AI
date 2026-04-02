import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Card from '../../components/common/Card';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || err.message || t.auth.authError);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-dark-bg px-4">
      <Card className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-gradient-primary rounded-2xl flex items-center justify-center">
              <span className="text-white font-bold text-3xl">P</span>
            </div>
          </div>
          <h1 className="text-3xl font-bold gradient-text-primary mb-2">PolyEduAI</h1>
          <p className="text-neutral-600 dark:text-neutral-400">
            {t.auth.loginTitle('teacher')}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label={t.auth.email}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
            required
          />

          <Input
            label={t.auth.password}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="********"
            required
          />

          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 text-sm">
              {error}
            </div>
          )}

          <Button type="submit" className="w-full" loading={loading}>
            {t.auth.loginBtn}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            {t.auth.noAccount}{' '}
            <Link to="/register" className="text-primary-600 dark:text-primary-400 hover:underline font-medium">
              {t.auth.register}
            </Link>
          </p>
        </div>
      </Card>
    </div>
  );
}
