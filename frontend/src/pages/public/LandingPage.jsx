import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Sparkles,
  Check,
  Brain,
  Users,
  Gamepad2,
  FileText,
  FlaskConical,
} from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { repairMojibakeDeep } from '../../utils/repairMojibake';

const copyByLanguage = {
  ru: {
    badge: 'РџР»Р°С‚С„РѕСЂРјР° РґР»СЏ РїСЂРµРїРѕРґР°РІР°С‚РµР»РµР№',
    title1: 'AIZERT',
    title2: 'Teacher Suite',
    subtitle:
      'Р•РґРёРЅРѕРµ СЂР°Р±РѕС‡РµРµ РїСЂРѕСЃС‚СЂР°РЅСЃС‚РІРѕ РїСЂРµРїРѕРґР°РІР°С‚РµР»СЏ: AI-РїРѕРјРѕС‰РЅРёРє, РіСЂСѓРїРїС‹, РїР»Р°РЅС‹ СѓСЂРѕРєРѕРІ, РёРЅС‚РµСЂР°РєС‚РёРІРЅС‹Рµ Р·Р°РґР°РЅРёСЏ Рё Р»Р°Р±РѕСЂР°С‚РѕСЂРёРё РІ РѕРґРЅРѕРј РєР°Р±РёРЅРµС‚Рµ.',
    primaryCta: 'РЎРѕР·РґР°С‚СЊ РєР°Р±РёРЅРµС‚',
    secondaryCta: 'Р’РѕР№С‚Рё',
    sectionTitle: 'Р§С‚Рѕ РїРѕР»СѓС‡Р°РµС‚ РїСЂРµРїРѕРґР°РІР°С‚РµР»СЊ',
    sectionSubtitle: 'РЎРµСЂРІРёСЃС‹ РґР»СЏ РїРѕРґРіРѕС‚РѕРІРєРё, РїСЂРѕРІРµРґРµРЅРёСЏ Рё Р°РЅР°Р»РёР·Р° Р·Р°РЅСЏС‚РёР№ Р±РµР· Р»РёС€РЅРёС… РїРµСЂРµРєР»СЋС‡РµРЅРёР№ РјРµР¶РґСѓ РёРЅСЃС‚СЂСѓРјРµРЅС‚Р°РјРё.',
    checks: [
      'AI-С‡Р°С‚ РґР»СЏ РїРѕРґРіРѕС‚РѕРІРєРё РѕР±СЉСЏСЃРЅРµРЅРёР№, РёРґРµР№, Р·Р°РґР°РЅРёР№ Рё СЂР°Р·Р±РѕСЂРѕРІ С‚РµРј',
      'РЈРїСЂР°РІР»РµРЅРёРµ РіСЂСѓРїРїР°РјРё, СЃС‚СѓРґРµРЅС‚Р°РјРё, РѕС†РµРЅРєР°РјРё Рё СЂРµР·СѓР»СЊС‚Р°С‚Р°РјРё',
      'РљРѕРЅСЃС‚СЂСѓРєС‚РѕСЂ РІРёРєС‚РѕСЂРёРЅ, Р»Р°Р±РѕСЂР°С‚РѕСЂРёР№ Рё СѓС‡РµР±РЅС‹С… Р°РєС‚РёРІРЅРѕСЃС‚РµР№',
      'РџР»Р°РЅС‹ СѓСЂРѕРєРѕРІ Рё С‚РµРєСѓС‰Р°СЏ СЂР°Р±РѕС‚Р° РїРѕ РіСЂСѓРїРїР°Рј РІ РѕРґРЅРѕРј РєРѕРЅС‚СѓСЂРµ',
    ],
    features: [
      {
        title: 'AI-РїРѕРјРѕС‰РЅРёРє',
        desc: 'Р‘С‹СЃС‚СЂРѕ РїРѕРјРѕРіР°РµС‚ СЃРѕР±СЂР°С‚СЊ РѕР±СЉСЏСЃРЅРµРЅРёРµ, С‚РµСЃС‚, СѓРїСЂР°Р¶РЅРµРЅРёСЏ РёР»Рё РїР»Р°РЅ Р·Р°РЅСЏС‚РёСЏ.',
        icon: Brain,
        color: 'text-primary-500',
      },
      {
        title: 'Р“СЂСѓРїРїС‹ Рё СЃС‚СѓРґРµРЅС‚С‹',
        desc: 'РЎРѕСЃС‚Р°РІ РіСЂСѓРїРї, СѓСЃРїРµРІР°РµРјРѕСЃС‚СЊ Рё СЂР°Р±РѕС‡РёРµ СЃРїРёСЃРєРё РІСЃРµРіРґР° РїРѕРґ СЂСѓРєРѕР№.',
        icon: Users,
        color: 'text-blue-500',
      },
      {
        title: 'РРЅС‚РµСЂР°РєС‚РёРІРЅС‹Рµ РёРіСЂС‹',
        desc: 'РЎРѕР±РёСЂР°Р№С‚Рµ РёРіСЂРѕРІС‹Рµ Р·Р°РґР°РЅРёСЏ Рё СЂРµРґР°РєС‚РёСЂСѓР№С‚Рµ РёС… РїРѕРґ РєРѕРЅРєСЂРµС‚РЅСѓСЋ С‚РµРјСѓ.',
        icon: Gamepad2,
        color: 'text-emerald-500',
      },
      {
        title: 'РџР»Р°РЅС‹ СѓСЂРѕРєРѕРІ',
        desc: 'РЎС‚СЂСѓРєС‚СѓСЂРёСЂСѓР№С‚Рµ Р·Р°РЅСЏС‚РёСЏ РїРѕ СЌС‚Р°РїР°Рј Рё РїРѕРґРіРѕРЅСЏР№С‚Рµ СЃРѕРґРµСЂР¶Р°РЅРёРµ РїРѕРґ РіСЂСѓРїРїСѓ.',
        icon: FileText,
        color: 'text-orange-500',
      },
      {
        title: 'Р›Р°Р±РѕСЂР°С‚РѕСЂРёРё',
        desc: 'Р—Р°РїСѓСЃРєР°Р№С‚Рµ РїСЂР°РєС‚РёС‡РµСЃРєРёРµ РјРѕРґСѓР»Рё Рё РІРёР·СѓР°Р»СЊРЅС‹Рµ СЃРёРјСѓР»СЏС†РёРё РёР· Р±СЂР°СѓР·РµСЂР°.',
        icon: FlaskConical,
        color: 'text-fuchsia-500',
      },
    ],
    ctaTitle: 'РЎРѕР±РµСЂРёС‚Рµ РїСЂРµРїРѕРґР°РІР°С‚РµР»СЊСЃРєРёР№ СЃС‚РµРє РІ РѕРґРЅРѕРј РјРµСЃС‚Рµ',
    ctaSubtitle:
      'AIZERT РґРµР»Р°РµС‚ РєР°Р±РёРЅРµС‚ teacher-only Рё РѕСЃС‚Р°РІР»СЏРµС‚ РІРЅСѓС‚СЂРё С‚РѕР»СЊРєРѕ СЂР°Р±РѕС‡РёРµ РёРЅСЃС‚СЂСѓРјРµРЅС‚С‹ РїСЂРµРїРѕРґР°РІР°С‚РµР»СЏ.',
  },
  kk: {
    badge: 'РћТ›С‹С‚СѓС€С‹Р»Р°СЂТ“Р° Р°СЂРЅР°Р»Т“Р°РЅ РїР»Р°С‚С„РѕСЂРјР°',
    title1: 'AIZERT',
    title2: 'Teacher Suite',
    subtitle:
      'РћТ›С‹С‚СѓС€С‹РЅС‹ТЈ Р±С–СЂС‹ТЈТ“Р°Р№ Р¶Т±РјС‹СЃ РєРµТЈС–СЃС‚С–РіС–: AI-РєУ©РјРµРєС€С–, С‚РѕРїС‚Р°СЂ, СЃР°Р±Р°Т› Р¶РѕСЃРїР°СЂР»Р°СЂС‹, РёРЅС‚РµСЂР°РєС‚РёРІС‚С– С‚Р°РїСЃС‹СЂРјР°Р»Р°СЂ Р¶У™РЅРµ Р·РµСЂС‚С…Р°РЅР°Р»Р°СЂ Р±С–СЂ РєР°Р±РёРЅРµС‚С‚Рµ.',
    primaryCta: 'РљР°Р±РёРЅРµС‚ Р°С€Сѓ',
    secondaryCta: 'РљС–СЂСѓ',
    sectionTitle: 'РћТ›С‹С‚СѓС€С‹ РЅРµ Р°Р»Р°РґС‹',
    sectionSubtitle: 'РЎР°Р±Р°Т›С‚С‹ РґР°Р№С‹РЅРґР°Сѓ, У©С‚РєС–Р·Сѓ Р¶У™РЅРµ С‚Р°Р»РґР°СѓТ“Р° Р°СЂРЅР°Р»Т“Р°РЅ Т›Т±СЂР°Р»РґР°СЂ Р±С–СЂ Р¶РµСЂРґРµ Р¶РёРЅР°Р»Т“Р°РЅ.',
    checks: [
      'РўТЇСЃС–РЅРґС–СЂСѓ, РёРґРµСЏ, С‚Р°РїСЃС‹СЂРјР° Р¶У™РЅРµ С‚Р°Т›С‹СЂС‹Рї С‚Р°Р»РґР°СѓС‹РЅР° Р°СЂРЅР°Р»Т“Р°РЅ AI-С‡Р°С‚',
      'РўРѕРїС‚Р°СЂРґС‹, СЃС‚СѓРґРµРЅС‚С‚РµСЂРґС–, Р±Р°Т“Р°Р»Р°СЂРґС‹ Р¶У™РЅРµ РЅУ™С‚РёР¶РµР»РµСЂРґС– Р±Р°СЃТ›Р°СЂСѓ',
      'Р’РёРєС‚РѕСЂРёРЅР°, Р·РµСЂС‚С…Р°РЅР° Р¶У™РЅРµ РѕТ›Сѓ Р±РµР»СЃРµРЅРґС–Р»С–РєС‚РµСЂС–РЅС–ТЈ РєРѕРЅСЃС‚СЂСѓРєС‚РѕСЂС‹',
      'РЎР°Р±Р°Т› Р¶РѕСЃРїР°СЂР»Р°СЂС‹ РјРµРЅ С‚РѕРїРїРµРЅ Р¶Т±РјС‹СЃ Р±С–СЂ РєРѕРЅС‚СѓСЂРґР°',
    ],
    features: [
      {
        title: 'AI-РєУ©РјРµРєС€С–',
        desc: 'РўТЇСЃС–РЅРґС–СЂСѓ, С‚РµСЃС‚, Р¶Р°С‚С‚С‹Т“Сѓ РЅРµРјРµСЃРµ СЃР°Р±Р°Т› Р¶РѕСЃРїР°СЂС‹РЅ С‚РµР· РґР°Р№С‹РЅРґР°СѓТ“Р° РєУ©РјРµРєС‚РµСЃРµРґС–.',
        icon: Brain,
        color: 'text-primary-500',
      },
      {
        title: 'РўРѕРїС‚Р°СЂ РјРµРЅ СЃС‚СѓРґРµРЅС‚С‚РµСЂ',
        desc: 'РўРѕРї Т›Т±СЂР°РјС‹, ТЇР»РіРµСЂС–Рј Р¶У™РЅРµ Р¶Т±РјС‹СЃ С‚С–Р·С–РјРґРµСЂС– У™СЂРґР°Р№С‹Рј Т›РѕР» Р°СЃС‚С‹РЅРґР°.',
        icon: Users,
        color: 'text-blue-500',
      },
      {
        title: 'РРЅС‚РµСЂР°РєС‚РёРІС‚С– РѕР№С‹РЅРґР°СЂ',
        desc: 'РћТ›Сѓ РѕР№С‹РЅРґР°СЂС‹РЅ С‚Р°Т›С‹СЂС‹РїТ›Р° СЃР°Р№ Р¶РёРЅР°Рї, СЂРµРґР°РєС†РёСЏР»Р°Р№ Р°Р»Р°СЃС‹Р·.',
        icon: Gamepad2,
        color: 'text-emerald-500',
      },
      {
        title: 'РЎР°Р±Р°Т› Р¶РѕСЃРїР°СЂР»Р°СЂС‹',
        desc: 'РЎР°Р±Р°Т›С‚С‹ РєРµР·РµТЈ-РєРµР·РµТЈС–РјРµРЅ Т›Т±СЂС‹Рї, РјР°Р·РјТ±РЅРґС‹ С‚РѕРїТ›Р° Р±РµР№С–РјРґРµР№СЃС–Р·.',
        icon: FileText,
        color: 'text-orange-500',
      },
      {
        title: 'Р—РµСЂС‚С…Р°РЅР°Р»Р°СЂ',
        desc: 'РџСЂР°РєС‚РёРєР°Р»С‹Т› РјРѕРґСѓР»СЊРґРµСЂ РјРµРЅ РІРёР·СѓР°Р»РґС‹ СЃРёРјСѓР»СЏС†РёСЏР»Р°СЂРґС‹ Р±СЂР°СѓР·РµСЂРґРµРЅ С–СЃРєРµ Т›РѕСЃС‹ТЈС‹Р·.',
        icon: FlaskConical,
        color: 'text-fuchsia-500',
      },
    ],
    ctaTitle: 'РћТ›С‹С‚СѓС€С‹Т“Р° РєРµСЂРµРє Р±Р°СЂР»С‹Т› Т›Т±СЂР°Р» Р±С–СЂ Р¶РµСЂРґРµ',
    ctaSubtitle:
      'AIZERT teacher-only РєР°Р±РёРЅРµС‚РєРµ Р°СѓС‹СЃС‹Рї, С–С€С–РЅРґРµ С‚РµРє РѕТ›С‹С‚СѓС€С‹ Р¶Т±РјС‹СЃС‹РЅР° Т›Р°Р¶РµС‚ С„СѓРЅРєС†РёСЏР»Р°СЂРґС‹ Т›Р°Р»РґС‹СЂР°РґС‹.',
  },
};

const normalizedCopyByLanguage = repairMojibakeDeep(copyByLanguage);

export default function LandingPage() {
  const { language } = useLanguage();
  const copy = normalizedCopyByLanguage[language] || normalizedCopyByLanguage.ru;

  return (
    <div className="min-h-screen bg-white dark:bg-dark-bg transition-colors duration-300">
      <section className="relative overflow-hidden pt-12 pb-16 md:pt-24 md:pb-24">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(220,38,38,0.12),_transparent_35%),radial-gradient(circle_at_bottom_right,_rgba(14,165,233,0.14),_transparent_30%)]" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-50 dark:bg-primary-900/30 border border-red-100 dark:border-primary-500/20 mb-6">
              <Sparkles className="w-4 h-4 text-primary-600 dark:text-primary-400" />
              <span className="text-xs font-bold uppercase tracking-wider text-primary-700 dark:text-primary-300">
                {copy.badge}
              </span>
            </div>

            <h1 className="text-5xl md:text-8xl font-black tracking-tight mb-6 leading-tight">
              <span className="text-primary-600 dark:text-white">{copy.title1}</span>
              <br />
              <span className="text-neutral-900 dark:text-primary-500">{copy.title2}</span>
            </h1>

            <p className="text-xl md:text-2xl font-medium text-neutral-600 dark:text-neutral-300 mb-10 max-w-3xl mx-auto">
              {copy.subtitle}
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
              <Link to="/register" className="w-full sm:w-auto">
                <button className="w-full px-8 py-4 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-bold text-lg shadow-xl shadow-primary-600/20 transform hover:-translate-y-1 transition-all duration-200 flex items-center justify-center gap-2">
                  {copy.primaryCta}
                  <ArrowRight className="w-5 h-5" />
                </button>
              </Link>
              <Link to="/login" className="w-full sm:w-auto">
                <button className="w-full px-8 py-4 bg-white dark:bg-white/5 text-neutral-900 dark:text-white border-2 border-neutral-100 dark:border-white/10 rounded-xl font-bold text-lg hover:border-primary-600 dark:hover:border-primary-500 hover:text-primary-600 dark:hover:text-primary-400 transition-all duration-200">
                  {copy.secondaryCta}
                </button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-neutral-50 dark:bg-dark-surface border-t border-neutral-200 dark:border-dark-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-start">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-6 text-neutral-900 dark:text-white">
                {copy.sectionTitle}
              </h2>
              <p className="text-lg text-neutral-600 dark:text-neutral-400 mb-8">
                {copy.sectionSubtitle}
              </p>
              <div className="space-y-4">
                {copy.checks.map((text) => (
                  <CheckItem key={text} text={text} />
                ))}
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              {copy.features.slice(0, 4).map((feature) => (
                <FeatureTile key={feature.title} feature={feature} />
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-white dark:bg-dark-bg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {copy.features.map((feature) => (
              <CapabilityCard key={feature.title} feature={feature} />
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-gradient-to-br from-primary-600 to-primary-700">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            {copy.ctaTitle}
          </h2>
          <p className="text-xl text-white/80 mb-10 max-w-2xl mx-auto">
            {copy.ctaSubtitle}
          </p>
          <Link to="/register">
            <button className="px-10 py-5 bg-white text-primary-600 rounded-2xl font-bold text-xl shadow-2xl hover:shadow-white/20 hover:-translate-y-1 transition-all duration-200 inline-flex items-center gap-3">
              {copy.primaryCta}
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

function FeatureTile({ feature }) {
  const Icon = feature.icon;

  return (
    <div className="p-5 rounded-2xl bg-white dark:bg-dark-bg border border-neutral-100 dark:border-white/10 shadow-sm">
      <div className={`mb-4 ${feature.color}`}>
        <Icon className="w-7 h-7" />
      </div>
      <h3 className="text-lg font-bold text-neutral-900 dark:text-white mb-2">{feature.title}</h3>
      <p className="text-sm text-neutral-600 dark:text-neutral-400">{feature.desc}</p>
    </div>
  );
}

function CapabilityCard({ feature }) {
  const Icon = feature.icon;

  return (
    <div className="p-8 rounded-2xl bg-neutral-50 dark:bg-white/5 border border-neutral-100 dark:border-white/5 hover:border-primary-200 dark:hover:border-primary-500/30 transition-all hover:shadow-lg group">
      <div className={`${feature.color} mb-5 group-hover:scale-110 transition-transform`}>
        <Icon className="w-8 h-8" />
      </div>
      <h3 className="text-xl font-bold text-neutral-900 dark:text-white mb-3">{feature.title}</h3>
      <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed">{feature.desc}</p>
    </div>
  );
}
