import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Card from '../../components/common/Card';

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    password: '',
    confirmPassword: '',
    institution: '',
    position: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Пароли не совпадают');
      return;
    }

    setLoading(true);

    try {
      const { confirmPassword, ...registerData } = formData;
      await register(registerData);
      navigate('/login', { state: { message: 'Регистрация успешна! Войдите в систему.' } });
    } catch (err) {
      setError(err.response?.data?.message || 'Ошибка регистрации');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-dark-bg px-4 py-8">
      <Card className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-gradient-primary rounded-2xl flex items-center justify-center">
              <span className="text-white font-bold text-3xl">P</span>
            </div>
          </div>
          <h1 className="text-3xl font-bold gradient-text-primary mb-2">PolyEduAI</h1>
          <p className="text-neutral-600 dark:text-neutral-400">Регистрация студента</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <Input
              label="ФИО"
              name="full_name"
              value={formData.full_name}
              onChange={handleChange}
              placeholder="Иванов Иван Иванович"
              required
            />

            <Input
              label="Email"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="your@email.com"
              required
            />

            <Input
              label="Учебное заведение"
              name="institution"
              value={formData.institution}
              onChange={handleChange}
              placeholder="Колледж или университет"
              required
            />

            <Input
              label="Группа / Курс"
              name="position"
              value={formData.position}
              onChange={handleChange}
              placeholder="Например: ИС-221"
              required
            />

            <Input
              label="Пароль"
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="••••••••"
              required
            />

            <Input
              label="Подтверждение пароля"
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="••••••••"
              required
            />
          </div>

          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 text-sm">
              {error}
            </div>
          )}

          <Button type="submit" className="w-full" loading={loading}>
            Зарегистрироваться
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            Уже есть аккаунт?{' '}
            <Link to="/login" className="text-primary-600 dark:text-primary-400 hover:underline font-medium">
              Войти
            </Link>
          </p>
        </div>
      </Card>
    </div>
  );
}
