
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles, Check, BookOpen, Brain, GraduationCap, Users, Gamepad2, FileText, BarChart3 } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';

export default function LandingPage() {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-white dark:bg-dark-bg transition-colors duration-300">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-12 md:pt-24 md:pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-50 dark:bg-primary-900/30 border border-red-100 dark:border-primary-500/20 mb-6">
              <Sparkles className="w-4 h-4 text-primary-600 dark:text-primary-400" />
              <span className="text-xs font-bold uppercase tracking-wider text-primary-700 dark:text-primary-300">
                {t.landing.badge}
              </span>
            </div>

            <h1 className="text-5xl md:text-8xl font-black tracking-tight mb-6 leading-tight">
              <span className="text-primary-600 dark:text-white">{t.landing.title1}</span>
              <br />
              <span className="text-neutral-900 dark:text-primary-500">{t.landing.title2}</span>
            </h1>

            <p className="text-xl md:text-2xl font-medium text-neutral-600 dark:text-neutral-300 mb-10 max-w-2xl mx-auto">
              {t.landing.subtitle}
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
              <Link to="/register" className="w-full sm:w-auto">
                <button className="w-full px-8 py-4 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-bold text-lg shadow-xl shadow-primary-600/20 transform hover:-translate-y-1 transition-all duration-200 flex items-center justify-center gap-2">
                  {t.landing.startFree}
                  <ArrowRight className="w-5 h-5" />
                </button>
              </Link>
              <Link to="/login" className="w-full sm:w-auto">
                <button className="w-full px-8 py-4 bg-white dark:bg-white/5 text-neutral-900 dark:text-white border-2 border-neutral-100 dark:border-white/10 rounded-xl font-bold text-lg hover:border-primary-600 dark:hover:border-primary-500 hover:text-primary-600 dark:hover:text-primary-400 transition-all duration-200">
                  {t.landing.loginBtn}
                </button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* For Everyone Section */}
      <section className="py-16 bg-neutral-50 dark:bg-dark-surface border-t border-neutral-200 dark:border-dark-border">
        <div className="max-w-5xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold mb-6 text-neutral-900 dark:text-white">
                {t.landing.onePlatform} <br/>
                <span className="text-primary-600">{t.landing.forStudentsAndTeachers}</span>
              </h2>
              <div className="space-y-4">
                <CheckItem text={t.landing.check1} />
                <CheckItem text={t.landing.check2} />
                <CheckItem text={t.landing.check3} />
                <CheckItem text={t.landing.check4} />
              </div>
            </div>

            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-tr from-primary-500 to-cyan-500 rounded-2xl blur-xl opacity-20"></div>
              <div className="relative bg-white dark:bg-dark-bg p-8 rounded-2xl border border-neutral-100 dark:border-white/10 shadow-lg space-y-4">
                <div className="p-4 rounded-xl bg-neutral-100 dark:bg-white/5 border border-neutral-200 dark:border-white/10">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/50 rounded-full flex items-center justify-center">
                      <GraduationCap className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                    </div>
                    <h3 className="font-bold text-neutral-900 dark:text-white">{t.landing.studentRole}</h3>
                  </div>
                  <p className="text-sm text-neutral-700 dark:text-neutral-300">
                    {t.landing.studentDesc}
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-primary-50 dark:bg-primary-900/20 border border-primary-100 dark:border-primary-500/20">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 bg-white dark:bg-primary-950/40 rounded-full flex items-center justify-center">
                      <Users className="w-5 h-5 text-primary-700 dark:text-primary-300" />
                    </div>
                    <h3 className="font-bold text-neutral-900 dark:text-white">{t.landing.teacherRole}</h3>
                  </div>
                  <p className="text-sm text-neutral-800 dark:text-white">
                    {t.landing.teacherDesc}
                  </p>
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
              {t.landing.capabilitiesTitle}
            </h2>
            <p className="text-xl text-neutral-600 dark:text-neutral-400 max-w-2xl mx-auto">
              {t.landing.capabilitiesSubtitle}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <CapabilityCard 
              icon={<Brain className="w-8 h-8" />}
              title={t.landing.aiAssistant}
              desc={t.landing.aiAssistantDesc}
              color="text-primary-500"
            />
            <CapabilityCard 
              icon={<BookOpen className="w-8 h-8" />}
              title={t.landing.materialsBase}
              desc={t.landing.materialsBaseDesc}
              color="text-blue-500"
            />
            <CapabilityCard 
              icon={<Users className="w-8 h-8" />}
              title={t.landing.groupsCourses}
              desc={t.landing.groupsCoursesDesc}
              color="text-purple-500"
            />
            <CapabilityCard 
              icon={<Gamepad2 className="w-8 h-8" />}
              title={t.landing.interactiveTasks}
              desc={t.landing.interactiveTasksDesc}
              color="text-cyan-500"
            />
            <CapabilityCard 
              icon={<FileText className="w-8 h-8" />}
              title={t.landing.lessonPlansFeature}
              desc={t.landing.lessonPlansFeatureDesc}
              color="text-green-500"
            />
            <CapabilityCard 
              icon={<BarChart3 className="w-8 h-8" />}
              title={t.landing.progressStats}
              desc={t.landing.progressStatsDesc}
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
              {t.landing.howItWorks}
            </h2>
            <p className="text-xl text-neutral-600 dark:text-neutral-400">
              {t.landing.howItWorksSubtitle}
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <StepCard 
              number="1"
              title={t.landing.step1Title}
              desc={t.landing.step1Desc}
            />
            <StepCard 
              number="2"
              title={t.landing.step2Title}
              desc={t.landing.step2Desc}
            />
            <StepCard 
              number="3"
              title={t.landing.step3Title}
              desc={t.landing.step3Desc}
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-primary-600 to-primary-700">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            {t.landing.ctaTitle}
          </h2>
          <p className="text-xl text-white/80 mb-10 max-w-2xl mx-auto">
            {t.landing.ctaSubtitle}
          </p>
          <Link to="/register">
            <button className="px-10 py-5 bg-white text-primary-600 rounded-2xl font-bold text-xl shadow-2xl hover:shadow-white/20 hover:-translate-y-1 transition-all duration-200 inline-flex items-center gap-3">
              {t.landing.createAccount}
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

