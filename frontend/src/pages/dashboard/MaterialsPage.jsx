import { useState } from 'react';
import { BookOpen, Search, Filter, Download, Clock, Star, ChevronRight, FileText, Video, Headphones, Code } from 'lucide-react';
import Card from '../../components/common/Card';

const CATEGORIES = [
  { id: 'all', label: 'Все' },
  { id: 'programming', label: 'Программирование' },
  { id: 'math', label: 'Математика' },
  { id: 'design', label: 'Дизайн' },
  { id: 'languages', label: 'Языки' },
  { id: 'science', label: 'Науки' },
];

const MATERIALS = [
  {
    id: 1,
    title: 'Основы Python для начинающих',
    description: 'Полный курс по основам Python: переменные, циклы, функции, ООП и работа с файлами.',
    category: 'programming',
    type: 'text',
    difficulty: 'Начальный',
    duration: '~2 часа',
    rating: 4.8,
    downloads: 342,
  },
  {
    id: 2,
    title: 'Линейная алгебра: конспекты лекций',
    description: 'Матрицы, определители, системы линейных уравнений, собственные значения и векторы.',
    category: 'math',
    type: 'text',
    difficulty: 'Средний',
    duration: '~5 часов',
    rating: 4.5,
    downloads: 218,
  },
  {
    id: 3,
    title: 'UI/UX дизайн: от идеи до прототипа',
    description: 'Практический гайд по созданию интерфейсов: wireframes, Figma, пользовательские сценарии.',
    category: 'design',
    type: 'video',
    difficulty: 'Начальный',
    duration: '~3 часа',
    rating: 4.9,
    downloads: 156,
  },
  {
    id: 4,
    title: 'JavaScript: продвинутые концепции',
    description: 'Замыкания, промисы, async/await, прототипы, модули ES6+ и паттерны проектирования.',
    category: 'programming',
    type: 'text',
    difficulty: 'Продвинутый',
    duration: '~4 часа',
    rating: 4.7,
    downloads: 289,
  },
  {
    id: 5,
    title: 'Английский для IT-специалистов',
    description: 'Технический английский: термины, чтение документации, написание коммитов и код-ревью.',
    category: 'languages',
    type: 'audio',
    difficulty: 'Средний',
    duration: '~6 часов',
    rating: 4.3,
    downloads: 178,
  },
  {
    id: 6,
    title: 'React: создание современных веб-приложений',
    description: 'Компоненты, хуки, роутинг, стейт-менеджмент и деплой React-приложений.',
    category: 'programming',
    type: 'code',
    difficulty: 'Средний',
    duration: '~8 часов',
    rating: 4.6,
    downloads: 412,
  },
];

const TYPE_ICONS = {
  text: <FileText className="w-5 h-5" />,
  video: <Video className="w-5 h-5" />,
  audio: <Headphones className="w-5 h-5" />,
  code: <Code className="w-5 h-5" />,
};

const TYPE_COLORS = {
  text: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
  video: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400',
  audio: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400',
  code: 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400',
};

const DIFFICULTY_COLORS = {
  'Начальный': 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  'Средний': 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  'Продвинутый': 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

export default function MaterialsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');

  const filteredMaterials = MATERIALS.filter((m) => {
    const matchesSearch =
      m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory === 'all' || m.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-dark-bg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/30 rounded-lg flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-primary-600 dark:text-primary-400" />
            </div>
            <h1 className="text-3xl font-bold text-neutral-900 dark:text-white">Материалы</h1>
          </div>
          <p className="text-neutral-600 dark:text-neutral-400">
            Учебные материалы, конспекты и курсы для вашего обучения
          </p>
        </div>

        {/* Search & Filter */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
            <input
              type="text"
              placeholder="Поиск материалов..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white dark:bg-dark-surface border border-neutral-200 dark:border-dark-border rounded-xl text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all"
            />
          </div>
          <div className="flex items-center gap-2 text-neutral-500 dark:text-neutral-400">
            <Filter className="w-5 h-5" />
            <span className="text-sm font-medium">Фильтр</span>
          </div>
        </div>

        {/* Categories */}
        <div className="flex flex-wrap gap-2 mb-8">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                activeCategory === cat.id
                  ? 'bg-primary-600 text-white shadow-md shadow-primary-600/20'
                  : 'bg-white dark:bg-dark-surface text-neutral-600 dark:text-neutral-300 border border-neutral-200 dark:border-dark-border hover:border-primary-300 dark:hover:border-primary-500/30'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Materials Grid */}
        {filteredMaterials.length === 0 ? (
          <div className="text-center py-16">
            <BookOpen className="w-16 h-16 text-neutral-300 dark:text-neutral-600 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-neutral-900 dark:text-white mb-2">Ничего не найдено</h3>
            <p className="text-neutral-500 dark:text-neutral-400">Попробуйте изменить фильтры или поисковой запрос</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredMaterials.map((material) => (
              <Card key={material.id} className="hover:shadow-lg hover:border-primary-200 dark:hover:border-primary-500/30 transition-all group cursor-pointer">
                <div className="flex items-start justify-between mb-4">
                  <div className={`p-2 rounded-lg ${TYPE_COLORS[material.type]}`}>
                    {TYPE_ICONS[material.type]}
                  </div>
                  <span className={`text-xs font-medium px-2 py-1 rounded-full ${DIFFICULTY_COLORS[material.difficulty]}`}>
                    {material.difficulty}
                  </span>
                </div>

                <h3 className="text-lg font-bold text-neutral-900 dark:text-white mb-2 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                  {material.title}
                </h3>
                <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-4 line-clamp-2">
                  {material.description}
                </p>

                <div className="flex items-center justify-between text-sm text-neutral-500 dark:text-neutral-400 mb-4">
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    <span>{material.duration}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                    <span className="font-medium">{material.rating}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Download className="w-4 h-4" />
                    <span>{material.downloads}</span>
                  </div>
                </div>

                <button className="w-full py-2.5 bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 rounded-lg font-medium text-sm hover:bg-primary-100 dark:hover:bg-primary-900/40 transition-all flex items-center justify-center gap-2">
                  Открыть
                  <ChevronRight className="w-4 h-4" />
                </button>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
