import { BatteryCharging, Sparkles, Zap } from 'lucide-react';
import { Navigate } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';

function PhysicsInfoCard({ title, body }) {
  return (
    <div className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-dark-border dark:bg-dark-surface">
      <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
        <Sparkles className="h-3.5 w-3.5" />
        Physics lab
      </div>
      <h2 className="mt-4 text-2xl font-bold text-neutral-900 dark:text-white">{title}</h2>
      <p className="mt-3 max-w-3xl text-sm leading-7 text-neutral-600 dark:text-neutral-300">{body}</p>
    </div>
  );
}

export default function PhysicsLab({ subject, selectedTool }) {
  const { language } = useLanguage();

  if (selectedTool === 'hand_circuit') {
    return <Navigate to={`/lab-arena/physics?subject=${subject?.key || 'physics'}`} replace />;
  }

  return (
    <div className="space-y-5">
      <PhysicsInfoCard
        title={language === 'kk' ? 'Физика лабораториясы' : 'Физическая лаборатория'}
        body={language === 'kk'
          ? 'Қазіргі MVP қолмен электр тізбегін жинауға бағытталған. Келесі итерацияларда механика және оптика сценаларын осы адаптерге қосуға болады.'
          : 'Текущий MVP сфокусирован на hand-tracking сборке электрической цепи. В следующих итерациях сюда же можно добавлять механику и оптику.'}
      />

      <div className="grid gap-4 lg:grid-cols-3">
        {[
          {
            icon: BatteryCharging,
            title: language === 'kk' ? 'Қуат көзі' : 'Источник питания',
            body: language === 'kk' ? 'Батареяны дұрыс орынға қойып, тізбектің басталуын белгілеңіз.' : 'Поставьте батарею в правильную зону и задайте старт цепи.',
          },
          {
            icon: Zap,
            title: language === 'kk' ? 'Ток жүрісі' : 'Путь тока',
            body: language === 'kk' ? 'Сымдарды орналастырып, тұйық тізбек құрыңыз.' : 'Разместите проводники и соберите замкнутый контур.',
          },
          {
            icon: Sparkles,
            title: language === 'kk' ? 'Нәтиже' : 'Результат',
            body: language === 'kk' ? 'Дұрыс жинақталғаннан кейін шам жанады және қысқа түсіндіру шығады.' : 'После правильной сборки лампа загорается, а сцена показывает короткое объяснение.',
          },
        ].map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.title} className="rounded-3xl border border-neutral-200 bg-white p-5 shadow-sm dark:border-dark-border dark:bg-dark-surface">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                <Icon className="h-5 w-5" />
              </div>
              <div className="mt-4 text-lg font-semibold text-neutral-900 dark:text-white">{card.title}</div>
              <p className="mt-2 text-sm leading-6 text-neutral-600 dark:text-neutral-300">{card.body}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
