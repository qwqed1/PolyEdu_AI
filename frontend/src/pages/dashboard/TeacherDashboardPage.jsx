import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Link } from 'react-router-dom';
import Card from '../../components/common/Card';
import { User, Building2, Briefcase, Mail, Bot } from 'lucide-react';
import statsService from '../../services/statsService';

export default function TeacherDashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    total_groups: 0,
    total_students: 0,
    weekly_lessons: 0,
    average_grade: null,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const response = await statsService.getTeacherStats();
      if (response.success) {
        setStats(response.data);
      }
    } catch (error) {
      console.error('Error loading teacher stats:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-dark-bg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-neutral-900 dark:text-white mb-2">
            Добро пожаловать, {user?.full_name}!
          </h1>
          <p className="text-neutral-600 dark:text-neutral-400">
            Управляйте группами, материалами и интерактивными активностями
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card className="md:col-span-1">
            <div className="text-center">
              <div className="w-24 h-24 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-4">
                <User className="w-12 h-12 text-white" />
              </div>
              <h2 className="text-xl font-bold text-neutral-900 dark:text-white mb-2">
                {user?.full_name}
              </h2>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-center gap-2 text-neutral-600 dark:text-neutral-400">
                  <Building2 className="w-4 h-4" />
                  {user?.institution || 'Не указано'}
                </div>
                <div className="flex items-center justify-center gap-2 text-neutral-600 dark:text-neutral-400">
                  <Briefcase className="w-4 h-4" />
                  {user?.position || 'Преподаватель'}
                </div>
                <div className="flex items-center justify-center gap-2 text-neutral-600 dark:text-neutral-400">
                  <Mail className="w-4 h-4" />
                  {user?.email}
                </div>
              </div>
            </div>
          </Card>

          <div className="md:col-span-2 grid sm:grid-cols-2 gap-4">
            <Card>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-1">Всего групп</p>
                  <p className="text-3xl font-bold text-neutral-900 dark:text-white">
                    {loading ? '...' : stats.total_groups}
                  </p>
                </div>
                <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/30 rounded-lg flex items-center justify-center">
                  <span className="text-2xl">👥</span>
                </div>
              </div>
            </Card>

            <Card>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-1">Всего студентов</p>
                  <p className="text-3xl font-bold text-neutral-900 dark:text-white">
                    {loading ? '...' : stats.total_students}
                  </p>
                </div>
                <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/30 rounded-lg flex items-center justify-center">
                  <span className="text-2xl">🎓</span>
                </div>
              </div>
            </Card>

            <Card>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-1">Занятий на неделе</p>
                  <p className="text-3xl font-bold text-neutral-900 dark:text-white">
                    {loading ? '...' : stats.weekly_lessons}
                  </p>
                </div>
                <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/30 rounded-lg flex items-center justify-center">
                  <span className="text-2xl">📅</span>
                </div>
              </div>
            </Card>

            <Card>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-1">Средний балл</p>
                  <p className="text-3xl font-bold text-neutral-900 dark:text-white">
                    {loading ? '...' : (stats.average_grade || '-')}
                  </p>
                </div>
                <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/30 rounded-lg flex items-center justify-center">
                  <span className="text-2xl">📊</span>
                </div>
              </div>
            </Card>
          </div>
        </div>

        <Card>
          <h3 className="text-lg font-bold text-neutral-900 dark:text-white mb-4">Быстрые действия</h3>
          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4">
            <Link to="/groups" className="p-4 border-2 border-neutral-200 dark:border-dark-border rounded-lg hover:border-primary-600 dark:hover:border-primary-500 transition-default text-center group">
              <div className="text-3xl mb-2">👥</div>
              <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Группы</p>
            </Link>
            <Link to="/lesson-plans" className="p-4 border-2 border-neutral-200 dark:border-dark-border rounded-lg hover:border-primary-600 dark:hover:border-primary-500 transition-default text-center group">
              <div className="text-3xl mb-2">📚</div>
              <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Планы уроков</p>
            </Link>
            <Link to="/interactive-games" className="p-4 border-2 border-neutral-200 dark:border-dark-border rounded-lg hover:border-primary-600 dark:hover:border-primary-500 transition-default text-center group">
              <div className="text-3xl mb-2">🎮</div>
              <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Игры</p>
            </Link>
            <Link to="/ai-chat" className="p-4 border-2 border-neutral-200 dark:border-dark-border rounded-lg hover:border-primary-600 dark:hover:border-primary-500 transition-default text-center group">
              <div className="flex items-center justify-center mb-2">
                <Bot className="w-8 h-8 text-primary-600 dark:text-primary-500 group-hover:scale-110 transition-transform" />
              </div>
              <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Чат с ИИ</p>
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
