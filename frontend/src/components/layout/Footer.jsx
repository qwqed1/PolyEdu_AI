export default function Footer() {
  return (
    <footer className="bg-neutral-100 dark:bg-dark-surface border-t border-neutral-200 dark:border-dark-border mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-neutral-600 dark:text-neutral-400 text-sm">
            © 2026 <span className="gradient-text-primary font-semibold">PolyEduAI</span>. Все права защищены.
          </div>
          <div className="flex gap-6 text-sm">
            <a href="#" className="text-neutral-600 dark:text-neutral-400 hover:text-primary-600 dark:hover:text-primary-400 transition-default">
              О проекте
            </a>
            <a href="#" className="text-neutral-600 dark:text-neutral-400 hover:text-primary-600 dark:hover:text-primary-400 transition-default">
              Поддержка
            </a>
            <a href="#" className="text-neutral-600 dark:text-neutral-400 hover:text-primary-600 dark:hover:text-primary-400 transition-default">
              Документация
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
