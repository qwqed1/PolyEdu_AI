import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Card from '../../components/common/Card';

export default function RegisterPage() {
  const [role, setRole] = useState('student');
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
  const { t } = useLanguage();
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
      setError(t.auth.passwordsMismatch);
      return;
    }

    setLoading(true);

    try {
      const { confirmPassword: _confirmPassword, ...registerData } = formData;
      await register({ ...registerData, role });
      navigate('/login', { state: { message: t.auth.registerSuccess } });
    } catch (err) {
      setError(err.response?.data?.message || t.auth.registerError);
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
          <p className="text-neutral-600 dark:text-neutral-400">
            {t.auth.registerTitle(role)}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
              {t.auth.accountRole}
            </label>
            <div className="grid grid-cols-2 gap-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 p-1">
              <button
                type="button"
                onClick={() => setRole('student')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  role === 'student'
                    ? 'bg-white dark:bg-neutral-700 text-primary-600 dark:text-primary-400 shadow-sm'
                    : 'text-neutral-600 dark:text-neutral-300'
                }`}
              >
                {t.auth.student}
              </button>
              <button
                type="button"
                onClick={() => setRole('teacher')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  role === 'teacher'
                    ? 'bg-white dark:bg-neutral-700 text-primary-600 dark:text-primary-400 shadow-sm'
                    : 'text-neutral-600 dark:text-neutral-300'
                }`}
              >
                {t.auth.teacher}
              </button>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <Input
              label={t.auth.fullName}
              name="full_name"
              value={formData.full_name}
              onChange={handleChange}
              placeholder={t.auth.fullNamePlaceholder}
              required
            />

            <Input
              label={t.auth.email}
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="your@email.com"
              required
            />

            <Input
              label={t.auth.institution}
              name="institution"
              value={formData.institution}
              onChange={handleChange}
              placeholder={t.auth.institutionPlaceholder}
              required
            />

            <Input
              label={role === 'student' ? t.auth.groupLabel : t.auth.positionLabel}
              name="position"
              value={formData.position}
              onChange={handleChange}
              placeholder={role === 'student' ? t.auth.groupPlaceholder : t.auth.positionPlaceholder}
              required
            />

            <Input
              label={t.auth.password}
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="••••••••"
              required
            />

            <Input
              label={t.auth.confirmPassword}
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
            {t.auth.registerBtn}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            {t.auth.hasAccount}{' '}
            <Link to="/login" className="text-primary-600 dark:text-primary-400 hover:underline font-medium">
              {t.auth.loginLink}
            </Link>
          </p>
        </div>
      </Card>
    </div>
  );
}
