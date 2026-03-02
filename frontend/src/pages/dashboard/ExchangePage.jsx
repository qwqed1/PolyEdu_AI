import { useState } from 'react';
import { Share2, Search, Plus, Heart, MessageCircle, Send, FileText, Image, Link2, X, Clock, User, ThumbsUp, Bookmark, MoreHorizontal } from 'lucide-react';
import Card from '../../components/common/Card';
import { useAuth } from '../../contexts/AuthContext';

const SAMPLE_POSTS = [
  {
    id: 1,
    author: 'Аслан М.',
    avatar: 'А',
    time: '2 часа назад',
    subject: 'Web-разработка',
    title: 'Конспект по React Hooks',
    content: 'Сделал подробный конспект по всем основным хукам React: useState, useEffect, useContext, useRef, useMemo, useCallback. Всё с примерами кода и пояснениями.',
    tags: ['React', 'JavaScript', 'Frontend'],
    likes: 24,
    comments: 8,
    saves: 12,
    type: 'document',
    liked: false,
    saved: false,
  },
  {
    id: 2,
    author: 'Дана К.',
    avatar: 'Д',
    time: '5 часов назад',
    subject: 'Математика',
    title: 'Шпаргалка по интегралам',
    content: 'Собрала все формулы интегрирования в одну таблицу. Основные методы: подстановка, по частям, разложение на простейшие дроби. Плюс табличные интегралы.',
    tags: ['Математика', 'Интегралы', 'Формулы'],
    likes: 45,
    comments: 15,
    saves: 38,
    type: 'document',
    liked: true,
    saved: false,
  },
  {
    id: 3,
    author: 'Тимур Р.',
    avatar: 'Т',
    time: '1 день назад',
    subject: 'Базы данных',
    title: 'SQL запросы — практические примеры',
    content: 'Подготовил набор SQL запросов разной сложности: от простых SELECT до подзапросов, JOIN и оконных функций. Полезно для подготовки к экзамену.',
    tags: ['SQL', 'Базы данных', 'Практика'],
    likes: 31,
    comments: 6,
    saves: 22,
    type: 'link',
    liked: false,
    saved: true,
  },
  {
    id: 4,
    author: 'Айгерим Б.',
    avatar: 'А',
    time: '2 дня назад',
    subject: 'Дизайн',
    title: 'Ресурсы для изучения Figma',
    content: 'Список лучших бесплатных курсов, туториалов и YouTube-каналов для изучения Figma с нуля. Включает плагины и шаблоны для практики.',
    tags: ['Figma', 'UI/UX', 'Дизайн'],
    likes: 56,
    comments: 12,
    saves: 41,
    type: 'link',
    liked: false,
    saved: false,
  },
];

const TYPE_ICON_MAP = {
  document: <FileText className="w-4 h-4" />,
  image: <Image className="w-4 h-4" />,
  link: <Link2 className="w-4 h-4" />,
};

const AVATAR_COLORS = [
  'bg-primary-500',
  'bg-blue-500',
  'bg-green-500',
  'bg-purple-500',
  'bg-orange-500',
  'bg-cyan-500',
];

function getAvatarColor(name) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

export default function ExchangePage() {
  const { user } = useAuth();
  const [posts, setPosts] = useState(SAMPLE_POSTS);
  const [searchQuery, setSearchQuery] = useState('');
  const [showNewPost, setShowNewPost] = useState(false);
  const [newPost, setNewPost] = useState({ title: '', content: '', tags: '', subject: '' });
  const [activeFilter, setActiveFilter] = useState('all');

  const filters = [
    { id: 'all', label: 'Все' },
    { id: 'popular', label: 'Популярные' },
    { id: 'recent', label: 'Недавние' },
    { id: 'saved', label: 'Сохранённые' },
  ];

  const handleLike = (postId) => {
    setPosts(posts.map(p => {
      if (p.id === postId) {
        return { ...p, liked: !p.liked, likes: p.liked ? p.likes - 1 : p.likes + 1 };
      }
      return p;
    }));
  };

  const handleSave = (postId) => {
    setPosts(posts.map(p => {
      if (p.id === postId) {
        return { ...p, saved: !p.saved, saves: p.saved ? p.saves - 1 : p.saves + 1 };
      }
      return p;
    }));
  };

  const handleSubmitPost = (e) => {
    e.preventDefault();
    if (!newPost.title.trim() || !newPost.content.trim()) return;

    const post = {
      id: Date.now(),
      author: user?.full_name || 'Студент',
      avatar: (user?.full_name || 'С')[0],
      time: 'Только что',
      subject: newPost.subject || 'Общее',
      title: newPost.title,
      content: newPost.content,
      tags: newPost.tags.split(',').map(t => t.trim()).filter(Boolean),
      likes: 0,
      comments: 0,
      saves: 0,
      type: 'document',
      liked: false,
      saved: false,
    };

    setPosts([post, ...posts]);
    setNewPost({ title: '', content: '', tags: '', subject: '' });
    setShowNewPost(false);
  };

  const filteredPosts = posts.filter(p => {
    const matchesSearch =
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));

    if (activeFilter === 'saved') return matchesSearch && p.saved;
    return matchesSearch;
  }).sort((a, b) => {
    if (activeFilter === 'popular') return b.likes - a.likes;
    return 0;
  });

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-dark-bg">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/30 rounded-lg flex items-center justify-center">
                <Share2 className="w-6 h-6 text-primary-600 dark:text-primary-400" />
              </div>
              <h1 className="text-3xl font-bold text-neutral-900 dark:text-white">Обмен материалами</h1>
            </div>
          </div>
          <p className="text-neutral-600 dark:text-neutral-400">
            Делитесь конспектами, ресурсами и полезными материалами с другими студентами
          </p>
        </div>

        {/* New Post Button */}
        <button
          onClick={() => setShowNewPost(!showNewPost)}
          className="w-full mb-6 py-4 bg-white dark:bg-dark-surface border-2 border-dashed border-neutral-300 dark:border-dark-border rounded-xl text-neutral-500 dark:text-neutral-400 hover:border-primary-400 dark:hover:border-primary-500/50 hover:text-primary-600 dark:hover:text-primary-400 transition-all flex items-center justify-center gap-2 font-medium"
        >
          <Plus className="w-5 h-5" />
          Поделиться материалом
        </button>

        {/* New Post Form */}
        {showNewPost && (
          <Card className="mb-6 border-primary-200 dark:border-primary-500/30">
            <form onSubmit={handleSubmitPost}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-neutral-900 dark:text-white">Новая публикация</h3>
                <button type="button" onClick={() => setShowNewPost(false)} className="p-1 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-all">
                  <X className="w-5 h-5 text-neutral-500" />
                </button>
              </div>

              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="Заголовок"
                  value={newPost.title}
                  onChange={(e) => setNewPost({ ...newPost, title: e.target.value })}
                  className="w-full px-4 py-3 bg-neutral-50 dark:bg-dark-bg border border-neutral-200 dark:border-dark-border rounded-xl text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all"
                />
                <textarea
                  placeholder="Описание материала..."
                  value={newPost.content}
                  onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-3 bg-neutral-50 dark:bg-dark-bg border border-neutral-200 dark:border-dark-border rounded-xl text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all resize-none"
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <input
                    type="text"
                    placeholder="Предмет"
                    value={newPost.subject}
                    onChange={(e) => setNewPost({ ...newPost, subject: e.target.value })}
                    className="w-full px-4 py-3 bg-neutral-50 dark:bg-dark-bg border border-neutral-200 dark:border-dark-border rounded-xl text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all"
                  />
                  <input
                    type="text"
                    placeholder="Теги (через запятую)"
                    value={newPost.tags}
                    onChange={(e) => setNewPost({ ...newPost, tags: e.target.value })}
                    className="w-full px-4 py-3 bg-neutral-50 dark:bg-dark-bg border border-neutral-200 dark:border-dark-border rounded-xl text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-medium transition-all flex items-center justify-center gap-2"
                >
                  <Send className="w-5 h-5" />
                  Опубликовать
                </button>
              </div>
            </form>
          </Card>
        )}

        {/* Search & Filter */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
            <input
              type="text"
              placeholder="Поиск по публикациям..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white dark:bg-dark-surface border border-neutral-200 dark:border-dark-border rounded-xl text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all"
            />
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
          {filters.map((filter) => (
            <button
              key={filter.id}
              onClick={() => setActiveFilter(filter.id)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                activeFilter === filter.id
                  ? 'bg-primary-600 text-white shadow-md shadow-primary-600/20'
                  : 'bg-white dark:bg-dark-surface text-neutral-600 dark:text-neutral-300 border border-neutral-200 dark:border-dark-border hover:border-primary-300 dark:hover:border-primary-500/30'
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>

        {/* Posts Feed */}
        {filteredPosts.length === 0 ? (
          <div className="text-center py-16">
            <Share2 className="w-16 h-16 text-neutral-300 dark:text-neutral-600 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-neutral-900 dark:text-white mb-2">Пока нет публикаций</h3>
            <p className="text-neutral-500 dark:text-neutral-400">Будьте первым, кто поделится материалом!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredPosts.map((post) => (
              <Card key={post.id} className="hover:shadow-md transition-all">
                {/* Post Header */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 ${getAvatarColor(post.author)} rounded-full flex items-center justify-center text-white font-bold text-sm`}>
                      {post.avatar}
                    </div>
                    <div>
                      <p className="font-medium text-neutral-900 dark:text-white text-sm">{post.author}</p>
                      <div className="flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400">
                        <Clock className="w-3 h-3" />
                        <span>{post.time}</span>
                        <span>•</span>
                        <span>{post.subject}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={`p-1.5 rounded-lg ${
                      post.type === 'document' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' :
                      post.type === 'link' ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400' :
                      'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400'
                    }`}>
                      {TYPE_ICON_MAP[post.type]}
                    </div>
                  </div>
                </div>

                {/* Post Content */}
                <h3 className="text-lg font-bold text-neutral-900 dark:text-white mb-2">{post.title}</h3>
                <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-3 leading-relaxed">{post.content}</p>

                {/* Tags */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {post.tags.map((tag, i) => (
                    <span
                      key={i}
                      className="px-2.5 py-1 bg-neutral-100 dark:bg-white/5 text-neutral-600 dark:text-neutral-300 rounded-full text-xs font-medium"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>

                {/* Post Actions */}
                <div className="flex items-center justify-between pt-3 border-t border-neutral-100 dark:border-dark-border">
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => handleLike(post.id)}
                      className={`flex items-center gap-1.5 text-sm font-medium transition-all ${
                        post.liked
                          ? 'text-primary-600 dark:text-primary-400'
                          : 'text-neutral-500 dark:text-neutral-400 hover:text-primary-600 dark:hover:text-primary-400'
                      }`}
                    >
                      <ThumbsUp className={`w-4 h-4 ${post.liked ? 'fill-current' : ''}`} />
                      {post.likes}
                    </button>
                    <button className="flex items-center gap-1.5 text-sm font-medium text-neutral-500 dark:text-neutral-400 hover:text-primary-600 dark:hover:text-primary-400 transition-all">
                      <MessageCircle className="w-4 h-4" />
                      {post.comments}
                    </button>
                  </div>
                  <button
                    onClick={() => handleSave(post.id)}
                    className={`flex items-center gap-1.5 text-sm font-medium transition-all ${
                      post.saved
                        ? 'text-primary-600 dark:text-primary-400'
                        : 'text-neutral-500 dark:text-neutral-400 hover:text-primary-600 dark:hover:text-primary-400'
                    }`}
                  >
                    <Bookmark className={`w-4 h-4 ${post.saved ? 'fill-current' : ''}`} />
                    {post.saves}
                  </button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
