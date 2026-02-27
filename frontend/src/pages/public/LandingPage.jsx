
import { Link } from 'react-router-dom';
import { Bot, Calendar, Share2, ArrowRight, Sparkles, Check, BookOpen, Brain, MessageSquare, GraduationCap } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-dark-bg transition-colors duration-300">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-12 md:pt-24 md:pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-50 dark:bg-primary-900/30 border border-red-100 dark:border-primary-500/20 mb-6">
              <Sparkles className="w-4 h-4 text-primary-600 dark:text-primary-400" />
              <span className="text-xs font-bold uppercase tracking-wider text-primary-700 dark:text-primary-300">
                Для студентов
              </span>
            </div>

            <h1 className="text-5xl md:text-8xl font-black tracking-tight mb-6 leading-tight">
              <span className="text-primary-600 dark:text-white">PolyEduAI</span>
              <br />
              <span className="text-neutral-900 dark:text-primary-500">Учись умнее</span>
            </h1>

            <p className="text-xl md:text-2xl font-medium text-neutral-600 dark:text-neutral-300 mb-10 max-w-2xl mx-auto">
              Твой ИИ-помощник для учёбы. Находи материалы, делись конспектами с однокурсниками и получай ответы на любые вопросы за секунды.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
              <Link to="/register" className="w-full sm:w-auto">
                <button className="w-full px-8 py-4 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-bold text-lg shadow-xl shadow-primary-600/20 transform hover:-translate-y-1 transition-all duration-200 flex items-center justify-center gap-2">
                  Начать учиться
                  <ArrowRight className="w-5 h-5" />
                </button>
              </Link>
              <Link to="/login" className="w-full sm:w-auto">
                <button className="w-full px-8 py-4 bg-white dark:bg-white/5 text-neutral-900 dark:text-white border-2 border-neutral-100 dark:border-white/10 rounded-xl font-bold text-lg hover:border-primary-600 dark:hover:border-primary-500 hover:text-primary-600 dark:hover:text-primary-400 transition-all duration-200">
                  Войти
                </button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* "For Students" Section */}
      <section className="py-16 bg-neutral-50 dark:bg-dark-surface border-t border-neutral-200 dark:border-dark-border">
        <div className="max-w-5xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold mb-6 text-neutral-900 dark:text-white">
                Всё, что нужно <br/> 
                <span className="text-primary-600">студенту</span>
              </h2>
              <div className="space-y-4">
                <CheckItem text="ИИ-ассистент для помощи с учёбой" />
                <CheckItem text="Библиотека учебных материалов" />
                <CheckItem text="Обмен конспектами с однокурсниками" />
                <CheckItem text="Расписание занятий всегда под рукой" />
              </div>
            </div>
            
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-tr from-primary-500 to-purple-500 rounded-2xl blur-xl opacity-20"></div>
              <div className="relative bg-white dark:bg-dark-bg p-8 rounded-2xl border border-neutral-100 dark:border-white/10 shadow-lg">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/50 rounded-full flex items-center justify-center">
                    <Bot className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                  </div>
                  <div>
                    <div className="font-bold text-lg text-neutral-900 dark:text-white">AIZERT</div>
                    <div className="text-sm text-green-500 flex items-center gap-1">
                      <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                      Online
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="bg-neutral-100 dark:bg-white/5 p-3 rounded-lg rounded-tl-none">
                    <p className="text-sm text-neutral-700 dark:text-neutral-300">Объясни мне рекурсию простыми словами</p>
                  </div>
                  <div className="bg-primary-50 dark:bg-primary-900/20 p-3 rounded-lg rounded-tr-none border border-primary-100 dark:border-primary-500/20">
                    <p className="text-sm text-neutral-800 dark:text-white">
                      <span className="font-bold text-primary-700 dark:text-primary-300">Рекурсия</span> — это когда функция вызывает сама себя.
                      <br/>Представь матрёшку: открываешь одну — внутри такая же, поменьше. И так до самой маленькой.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Platform Capabilities Section */}
      <section className="py-20 bg-white dark:bg-dark-bg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-neutral-900 dark:text-white mb-4">
              Возможности платформы
            </h2>
            <p className="text-xl text-neutral-600 dark:text-neutral-400 max-w-2xl mx-auto">
              Инструменты, которые помогут тебе учиться эффективнее
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <CapabilityCard 
              icon={<Brain className="w-8 h-8" />}
              title="ИИ Ассистент AIZERT"
              desc="Задавай любые вопросы по учёбе — от объяснения тем до помощи с домашкой. ИИ всегда на связи."
              color="text-primary-500"
            />
            <CapabilityCard 
              icon={<BookOpen className="w-8 h-8" />}
              title="Учебные материалы"
              desc="Конспекты, курсы, гайды по разным предметам. Всё структурировано и удобно для изучения."
              color="text-blue-500"
            />
            <CapabilityCard 
              icon={<Share2 className="w-8 h-8" />}
              title="Обмен материалами"
              desc="Делись своими конспектами, находи полезные ресурсы от других студентов. Учись вместе!"
              color="text-purple-500"
            />
            <CapabilityCard 
              icon={<Calendar className="w-8 h-8" />}
              title="Расписание"
              desc="Твоё расписание всегда под рукой. Знай, какая пара следующая и в какой аудитории."
              color="text-cyan-500"
            />
            <CapabilityCard 
              icon={<GraduationCap className="w-8 h-8" />}
              title="Подготовка к экзаменам"
              desc="ИИ поможет составить план подготовки, объяснить сложные темы и проверить твои знания."
              color="text-green-500"
            />
            <CapabilityCard 
              icon={<MessageSquare className="w-8 h-8" />}
              title="Сообщество студентов"
              desc="Общайся, задавай вопросы, помогай другим. Вместе учиться проще и веселее."
              color="text-orange-500"
            />
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-neutral-50 dark:bg-dark-surface border-t border-neutral-200 dark:border-dark-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-neutral-900 dark:text-white mb-4">
              Как это работает?
            </h2>
            <p className="text-xl text-neutral-600 dark:text-neutral-400">
              Начни использовать платформу за 3 простых шага
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <StepCard 
              number="1"
              title="Зарегистрируйся"
              desc="Создай аккаунт за минуту — это бесплатно"
            />
            <StepCard 
              number="2"
              title="Изучай материалы"
              desc="Находи конспекты, курсы и делись с однокурсниками"
            />
            <StepCard 
              number="3"
              title="Спроси у ИИ"
              desc="Получай мгновенные ответы и помощь по любой теме"
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-primary-600 to-primary-700">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Готов учиться по-новому?
          </h2>
          <p className="text-xl text-white/80 mb-10 max-w-2xl mx-auto">
            Присоединяйся к студентам, которые уже используют ИИ для эффективной учёбы
          </p>
          <Link to="/register">
            <button className="px-10 py-5 bg-white text-primary-600 rounded-2xl font-bold text-xl shadow-2xl hover:shadow-white/20 hover:-translate-y-1 transition-all duration-200 inline-flex items-center gap-3">
              Начать бесплатно
              <ArrowRight className="w-6 h-6" />
            </button>
          </Link>
        </div>
      </section>
    </div>
  );
}

function CheckItem({ text }) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-6 h-6 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center flex-shrink-0">
        <Check className="w-4 h-4 text-primary-600 dark:text-primary-400" />
      </div>
      <span className="font-medium text-neutral-700 dark:text-neutral-300">{text}</span>
    </div>
  );
}

function CapabilityCard({ icon, title, desc, color }) {
  return (
    <div className="p-8 rounded-2xl bg-neutral-50 dark:bg-white/5 border border-neutral-100 dark:border-white/5 hover:border-primary-200 dark:hover:border-primary-500/30 transition-all hover:shadow-lg group">
      <div className={`${color} mb-5 group-hover:scale-110 transition-transform`}>
        {icon}
      </div>
      <h3 className="text-xl font-bold text-neutral-900 dark:text-white mb-3">{title}</h3>
      <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed">{desc}</p>
    </div>
  );
}

function StepCard({ number, title, desc }) {
  return (
    <div className="text-center p-8">
      <div className="w-16 h-16 rounded-full bg-primary-600 text-white text-2xl font-bold flex items-center justify-center mx-auto mb-6 shadow-lg shadow-primary-600/30">
        {number}
      </div>
      <h3 className="text-xl font-bold text-neutral-900 dark:text-white mb-3">{title}</h3>
      <p className="text-neutral-600 dark:text-neutral-400">{desc}</p>
    </div>
  );
}

