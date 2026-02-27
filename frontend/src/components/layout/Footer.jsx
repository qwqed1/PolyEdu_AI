import { useLanguage } from '../../contexts/LanguageContext';

export default function Footer() {
  const { t } = useLanguage();

  return (
    <footer className="bg-neutral-100 dark:bg-dark-surface border-t border-neutral-200 dark:border-dark-border mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-neutral-600 dark:text-neutral-400 text-sm">
            © 2026 <span className="gradient-text-primary font-semibold">PolyEduAI</span>. {t.footer.rights}
          </div>
          <div className="flex gap-6 text-sm">
            <a href="#" className="text-neutral-600 dark:text-neutral-400 hover:text-primary-600 dark:hover:text-primary-400 transition-default">
              {t.footer.about}
            </a>
            <a href="#" className="text-neutral-600 dark:text-neutral-400 hover:text-primary-600 dark:hover:text-primary-400 transition-default">
              {t.footer.support}
            </a>
            <a href="#" className="text-neutral-600 dark:text-neutral-400 hover:text-primary-600 dark:hover:text-primary-400 transition-default">
              {t.footer.docs}
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
