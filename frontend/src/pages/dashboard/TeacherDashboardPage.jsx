import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { Link } from 'react-router-dom';
import Card from '../../components/common/Card';
import {
  User,
  Building2,
  Briefcase,
  Mail,
  Bot,
  Users,
  GraduationCap,
  BarChart2,
  Book,
  Gamepad2,
  FlaskConical,
  Sparkles,
} from 'lucide-react';
import statsService from '../../services/statsService';

const dashboardCopy = {
  ru: {
    greeting: 'Добро пожаловать',
    subtitle: 'Управляйте группами, материалами и интерактивными активностями',
    emptyInstitution: 'Не указано',
    emptyPosition: 'Преподаватель',
    totalGroups: 'Всего групп',
    totalStudents: 'Всего студентов',
    averageGrade: 'Средний балл',
    quickActions: 'Быстрые действия',
    groups: 'Группы',
    lessonPlans: 'Планы уроков',
    games: 'Игры',
    aiChat: 'Чат с ИИ',
  },
  kk: {
    greeting: 'Қош келдіңіз',
    subtitle: 'Топтарды, материалдарды және интерактивті белсенділіктерді басқарыңыз',
    emptyInstitution: 'Көрсетілмеген',
    emptyPosition: 'Оқытушы',
    totalGroups: 'Барлық топтар',
    totalStudents: 'Барлық студенттер',
    averageGrade: 'Орташа балл',
    quickActions: 'Жылдам әрекеттер',
    groups: 'Топтар',
    lessonPlans: 'Сабақ жоспарлары',
    games: 'Ойындар',
    aiChat: 'AI чат',
  },
};

export default function TeacherDashboardPage() {
  const { user } = useAuth();
  const { language, t } = useLanguage();
  const [stats, setStats] = useState({
    total_groups: 0,
    total_students: 0,
    average_grade: null,
  });
  const [loading, setLoading] = useState(true);
  const copy = dashboardCopy[language] || dashboardCopy.ru;

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
            {copy.greeting}, {user?.full_name}!
          </h1>
          <p className="text-neutral-600 dark:text-neutral-400">
            {copy.subtitle}
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
                  {user?.institution || copy.emptyInstitution}
                </div>
                <div className="flex items-center justify-center gap-2 text-neutral-600 dark:text-neutral-400">
                  <Briefcase className="w-4 h-4" />
                  {user?.position || copy.emptyPosition}
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
                  <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-1">{copy.totalGroups}</p>
                  <p className="text-3xl font-bold text-neutral-900 dark:text-white">
                    {loading ? '...' : stats.total_groups}
                  </p>
                </div>
                <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/30 rounded-lg flex items-center justify-center text-primary-600 dark:text-primary-400">
                  <Users className="w-6 h-6" />
                </div>
              </div>
            </Card>

            <Card>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-1">{copy.totalStudents}</p>
                  <p className="text-3xl font-bold text-neutral-900 dark:text-white">
                    {loading ? '...' : stats.total_students}
                  </p>
                </div>
                <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/30 rounded-lg flex items-center justify-center text-primary-600 dark:text-primary-400">
                  <GraduationCap className="w-6 h-6" />
                </div>
              </div>
            </Card>

            <Card className="sm:col-span-2">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-1">{copy.averageGrade}</p>
                  <p className="text-3xl font-bold text-neutral-900 dark:text-white">
                    {loading ? '...' : (stats.average_grade || '-')}
                  </p>
                </div>
                <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/30 rounded-lg flex items-center justify-center text-primary-600 dark:text-primary-400">
                  <BarChart2 className="w-6 h-6" />
                </div>
              </div>
            </Card>
          </div>
        </div>

        <Card>
          <h3 className="text-lg font-bold text-neutral-900 dark:text-white mb-4">{copy.quickActions}</h3>
          <div className="grid sm:grid-cols-2 md:grid-cols-6 gap-4">
            <Link to="/groups" className="p-4 border-2 border-neutral-200 dark:border-dark-border rounded-lg hover:border-primary-600 dark:hover:border-primary-500 transition-default text-center group">
              <div className="flex items-center justify-center mb-2 text-primary-600 dark:text-primary-400 group-hover:scale-110 transition-transform">
                <Users className="w-8 h-8" />
              </div>
              <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300">{copy.groups}</p>
            </Link>
            <Link to="/lesson-plans" className="p-4 border-2 border-neutral-200 dark:border-dark-border rounded-lg hover:border-primary-600 dark:hover:border-primary-500 transition-default text-center group">
              <div className="flex items-center justify-center mb-2 text-primary-600 dark:text-primary-400 group-hover:scale-110 transition-transform">
                <Book className="w-8 h-8" />
              </div>
              <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300">{copy.lessonPlans}</p>
            </Link>
            <Link to="/interactive-games" className="p-4 border-2 border-neutral-200 dark:border-dark-border rounded-lg hover:border-primary-600 dark:hover:border-primary-500 transition-default text-center group">
              <div className="flex items-center justify-center mb-2 text-primary-600 dark:text-primary-400 group-hover:scale-110 transition-transform">
                <Gamepad2 className="w-8 h-8" />
              </div>
              <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300">{copy.games}</p>
            </Link>
            <Link to="/lab" className="p-4 border-2 border-neutral-200 dark:border-dark-border rounded-lg hover:border-primary-600 dark:hover:border-primary-500 transition-default text-center group">
              <div className="flex items-center justify-center mb-2 text-primary-600 dark:text-primary-400 group-hover:scale-110 transition-transform">
                <FlaskConical className="w-8 h-8" />
              </div>
              <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300">{t.nav.lab}</p>
            </Link>
            <Link to="/brain-break" className="p-4 border-2 border-neutral-200 dark:border-dark-border rounded-lg hover:border-emerald-500 dark:hover:border-emerald-400 transition-default text-center group">
              <div className="flex items-center justify-center mb-2 text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform">
                <Sparkles className="w-8 h-8" />
              </div>
              <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300">{t.nav.brainBreak}</p>
            </Link>
            <Link to="/ai-chat" className="p-4 border-2 border-neutral-200 dark:border-dark-border rounded-lg hover:border-primary-600 dark:hover:border-primary-500 transition-default text-center group">
              <div className="flex items-center justify-center mb-2">
                <Bot className="w-8 h-8 text-primary-600 dark:text-primary-500 group-hover:scale-110 transition-transform" />
              </div>
              <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300">{copy.aiChat}</p>
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
