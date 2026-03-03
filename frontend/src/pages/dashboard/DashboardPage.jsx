import { useAuth } from '../../contexts/AuthContext';
import { Link } from 'react-router-dom';
import Card from '../../components/common/Card';
import { User, Building2, Mail, Bot, BookOpen, Share2, Calendar, GraduationCap, Gamepad2, NotebookPen } from 'lucide-react';

export default function DashboardPage() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-dark-bg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-neutral-900 dark:text-white mb-2">
            Привет, {user?.full_name}!
          </h1>
          <p className="text-neutral-600 dark:text-neutral-400">
            Твоя учебная панель — материалы, ИИ-помощник и обмен с однокурсниками
          </p>
        </div>

        {/* Profile Card + Quick Stats */}
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
                  <GraduationCap className="w-4 h-4" />
                  Студент
                </div>
                <div className="flex items-center justify-center gap-2 text-neutral-600 dark:text-neutral-400">
                  <Mail className="w-4 h-4" />
                  {user?.email}
                </div>
              </div>
            </div>
          </Card>

          {/* Quick Actions Grid */}
          <div className="md:col-span-2 grid sm:grid-cols-2 gap-4">
            <Link to="/ai-chat">
              <Card className="h-full hover:shadow-lg hover:border-primary-200 dark:hover:border-primary-500/30 transition-all cursor-pointer group">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-primary-100 dark:bg-primary-900/30 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Bot className="w-7 h-7 text-primary-600 dark:text-primary-400" />
                  </div>
                  <div>
                    <h3 className="font-bold text-neutral-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">Чат с ИИ</h3>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400">Задай вопрос AIZERT</p>
                  </div>
                </div>
              </Card>
            </Link>

            <Link to="/materials">
              <Card className="h-full hover:shadow-lg hover:border-primary-200 dark:hover:border-primary-500/30 transition-all cursor-pointer group">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <BookOpen className="w-7 h-7 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h3 className="font-bold text-neutral-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">Материалы</h3>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400">Конспекты и курсы</p>
                  </div>
                </div>
              </Card>
            </Link>

            <Link to="/exchange">
              <Card className="h-full hover:shadow-lg hover:border-primary-200 dark:hover:border-primary-500/30 transition-all cursor-pointer group">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Share2 className="w-7 h-7 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <h3 className="font-bold text-neutral-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">Обмен</h3>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400">Делись с однокурсниками</p>
                  </div>
                </div>
              </Card>
            </Link>

            <Link to="/games">
              <Card className="h-full hover:shadow-lg hover:border-emerald-200 dark:hover:border-emerald-500/30 transition-all cursor-pointer group">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Gamepad2 className="w-7 h-7 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="font-bold text-neutral-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">Игры</h3>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400">Викторины и тесты</p>
                  </div>
                </div>
              </Card>
            </Link>

            <Link to="/schedule">
              <Card className="h-full hover:shadow-lg hover:border-primary-200 dark:hover:border-primary-500/30 transition-all cursor-pointer group">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-cyan-100 dark:bg-cyan-900/30 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Calendar className="w-7 h-7 text-cyan-600 dark:text-cyan-400" />
                  </div>
                  <div>
                    <h3 className="font-bold text-neutral-900 dark:text-white group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors">Расписание</h3>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400">Твои пары на неделю</p>
                  </div>
                </div>
              </Card>
            </Link>

            <Link to="/reflections">
              <Card className="h-full hover:shadow-lg hover:border-orange-200 dark:hover:border-orange-500/30 transition-all cursor-pointer group">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-orange-100 dark:bg-orange-900/30 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <NotebookPen className="w-7 h-7 text-orange-600 dark:text-orange-400" />
                  </div>
                  <div>
                    <h3 className="font-bold text-neutral-900 dark:text-white group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">Рефлексия</h3>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400">Оставь отзыв по уроку</p>
                  </div>
                </div>
              </Card>
            </Link>
          </div>
        </div>

        {/* Tips Card */}
        <Card>
          <h3 className="text-lg font-bold text-neutral-900 dark:text-white mb-4">Советы для учёбы</h3>
          <div className="grid sm:grid-cols-3 gap-4">
            <div className="p-4 bg-primary-50 dark:bg-primary-900/20 rounded-xl border border-primary-100 dark:border-primary-500/20">
              <p className="text-sm font-medium text-primary-700 dark:text-primary-300 mb-1">Спроси у ИИ</p>
              <p className="text-xs text-neutral-600 dark:text-neutral-400">Не понимаешь тему? AIZERT объяснит простым языком</p>
            </div>
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-500/20">
              <p className="text-sm font-medium text-blue-700 dark:text-blue-300 mb-1">Делись конспектами</p>
              <p className="text-xs text-neutral-600 dark:text-neutral-400">Помогай другим — и другие помогут тебе</p>
            </div>
            <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-100 dark:border-green-500/20">
              <p className="text-sm font-medium text-green-700 dark:text-green-300 mb-1">Учись каждый день</p>
              <p className="text-xs text-neutral-600 dark:text-neutral-400">Регулярность важнее длительности занятий</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
