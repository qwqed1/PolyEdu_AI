import { useState, useEffect } from 'react';
import { Users, Shuffle, Plus, Trash2, Download, Copy, Check, ListPlus, UserPlus } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import groupService from '../../services/groupService';

export default function GroupSplitterPage() {
  const { language } = useLanguage();
  const isRu = language === 'ru';

  // Источник данных
  const [mode, setMode] = useState('manual'); // 'manual' | 'fromGroup'
  const [groups, setGroups] = useState([]);
  const [selectedGroupId, setSelectedGroupId] = useState('');
  const [loadingGroups, setLoadingGroups] = useState(false);

  // Ввод учеников
  const [studentInput, setStudentInput] = useState('');
  const [students, setStudents] = useState([]);

  // Настройки деления
  const [teamCount, setTeamCount] = useState(2);

  // Результат
  const [teams, setTeams] = useState([]);
  const [copied, setCopied] = useState(false);

  // Загрузка групп при монтировании
  useEffect(() => {
    loadGroups();
  }, []);

  async function loadGroups() {
    try {
      setLoadingGroups(true);
      const data = await groupService.getAll();
      setGroups(data || []);
    } catch (err) {
      console.error('Failed to load groups:', err);
    } finally {
      setLoadingGroups(false);
    }
  }

  // Загрузить студентов из выбранной группы
  async function loadStudentsFromGroup() {
    if (!selectedGroupId) return;
    try {
      const data = await groupService.getById(selectedGroupId);
      if (data?.students && data.students.length > 0) {
        setStudents(data.students.map(s => s.full_name));
      } else if (data?.student_count === 0) {
        setStudents([]);
      }
    } catch (err) {
      console.error('Failed to load students:', err);
    }
  }

  useEffect(() => {
    if (mode === 'fromGroup' && selectedGroupId) {
      loadStudentsFromGroup();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedGroupId, mode]);

  // Добавить студентов из текстового поля
  function addStudentsFromInput() {
    const names = studentInput
      .split(/[\n,;]+/)
      .map(n => n.trim())
      .filter(n => n.length > 0);
    if (names.length > 0) {
      setStudents(prev => [...prev, ...names]);
      setStudentInput('');
    }
  }

  // Удалить студента
  function removeStudent(index) {
    setStudents(prev => prev.filter((_, i) => i !== index));
  }

  // Перемешать массив (Fisher-Yates)
  function shuffleArray(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  // Разделить на команды
  function splitIntoTeams() {
    if (students.length === 0 || teamCount < 2) return;

    const shuffled = shuffleArray(students);
    const result = Array.from({ length: teamCount }, () => []);

    shuffled.forEach((student, i) => {
      result[i % teamCount].push(student);
    });

    setTeams(result);
  }

  // Перемешать заново
  function reshuffle() {
    splitIntoTeams();
  }

  // Копировать результат
  function copyResults() {
    const text = teams.map((team, i) =>
      `${isRu ? 'Команда' : 'Топ'} ${i + 1}:\n${team.map((s, j) => `  ${j + 1}. ${s}`).join('\n')}`
    ).join('\n\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  // Цвета для команд
  const teamColors = [
    'from-red-500 to-rose-600',
    'from-blue-500 to-indigo-600',
    'from-emerald-500 to-green-600',
    'from-amber-500 to-orange-600',
    'from-purple-500 to-violet-600',
    'from-cyan-500 to-teal-600',
    'from-pink-500 to-fuchsia-600',
    'from-lime-500 to-emerald-600',
    'from-sky-500 to-blue-600',
    'from-rose-500 to-pink-600',
  ];

  const teamBorders = [
    'border-red-200 dark:border-red-800',
    'border-blue-200 dark:border-blue-800',
    'border-emerald-200 dark:border-emerald-800',
    'border-amber-200 dark:border-amber-800',
    'border-purple-200 dark:border-purple-800',
    'border-cyan-200 dark:border-cyan-800',
    'border-pink-200 dark:border-pink-800',
    'border-lime-200 dark:border-lime-800',
    'border-sky-200 dark:border-sky-800',
    'border-rose-200 dark:border-rose-800',
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center shadow-lg">
            <Users className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-neutral-900 dark:text-white">
              {isRu ? 'Деление на группы' : 'Топтарға бөлу'}
            </h1>
            <p className="text-neutral-500 dark:text-neutral-400 text-sm">
              {isRu
                ? 'Случайное распределение учеников по командам'
                : 'Оқушыларды кездейсоқ командаларға бөлу'}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left: Input */}
        <div className="space-y-6">
          {/* Source Toggle */}
          <div className="bg-white dark:bg-dark-surface rounded-2xl border border-neutral-100 dark:border-dark-border p-6 shadow-sm">
            <h2 className="text-lg font-bold text-neutral-900 dark:text-white mb-4 flex items-center gap-2">
              <ListPlus className="w-5 h-5 text-primary-500" />
              {isRu ? 'Список Студентов' : 'Студентер тізімі'}
            </h2>

            {/* Mode tabs */}
            <div className="flex flex-wrap gap-2 mb-4">
              <button
                onClick={() => setMode('manual')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  mode === 'manual'
                    ? 'bg-primary-600 text-white shadow-md'
                    : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700'
                }`}
              >
                <div className="flex items-center gap-2">
                  <UserPlus className="w-4 h-4" />
                  {isRu ? 'Ввести вручную' : 'Қолмен енгізу'}
                </div>
              </button>
              <button
                onClick={() => setMode('fromGroup')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  mode === 'fromGroup'
                    ? 'bg-primary-600 text-white shadow-md'
                    : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  {isRu ? 'Из группы' : 'Топтан'}
                </div>
              </button>
            </div>

            {/* Manual input */}
            {mode === 'manual' && (
              <div>
                <textarea
                  value={studentInput}
                  onChange={(e) => setStudentInput(e.target.value)}
                  placeholder={isRu
                    ? 'Введите имена (каждое на новой строке или через запятую):\nИванов Иван\nПетрова Анна\nСидоров Максим'
                    : 'Есімдерді енгізіңіз (әр жолға жаңа немесе үтір арқылы):\nИванов Иван\nПетрова Анна\nСидоров Максим'}
                  className="w-full h-36 px-4 py-3 rounded-xl bg-neutral-50 dark:bg-neutral-900/50 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-white placeholder-neutral-400 resize-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                />
                <button
                  onClick={addStudentsFromInput}
                  disabled={!studentInput.trim()}
                  className="mt-3 px-5 py-2.5 bg-primary-600 hover:bg-primary-700 disabled:bg-neutral-300 disabled:dark:bg-neutral-700 text-white rounded-xl font-medium transition-all flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  {isRu ? 'Добавить' : 'Қосу'}
                </button>
              </div>
            )}

            {/* From group */}
            {mode === 'fromGroup' && (
              <div>
                <select
                  value={selectedGroupId}
                  onChange={(e) => setSelectedGroupId(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-neutral-50 dark:bg-neutral-900/50 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                >
                  <option value="">
                    {loadingGroups
                      ? (isRu ? 'Загрузка...' : 'Жүктелуде...')
                      : (isRu ? 'Выберите группу' : 'Топты таңдаңыз')}
                  </option>
                  {groups.map(g => (
                    <option key={g.id} value={g.id}>
                      {g.name} ({g.student_count || 0} {isRu ? 'студ.' : 'студ.'})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Student list */}
          {students.length > 0 && (
            <div className="bg-white dark:bg-dark-surface rounded-2xl border border-neutral-100 dark:border-dark-border p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-neutral-900 dark:text-white">
                  {isRu ? 'Ученики' : 'Оқушылар'} ({students.length})
                </h3>
                <button
                  onClick={() => setStudents([])}
                  className="text-sm text-red-500 hover:text-red-600 dark:text-red-400 flex items-center gap-1 transition-all"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  {isRu ? 'Очистить' : 'Тазалау'}
                </button>
              </div>
              <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
                {students.map((name, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between px-3 py-2 bg-neutral-50 dark:bg-neutral-900/30 rounded-lg group"
                  >
                    <span className="text-sm text-neutral-800 dark:text-neutral-200">
                      <span className="text-neutral-400 mr-2">{i + 1}.</span>
                      {name}
                    </span>
                    <button
                      onClick={() => removeStudent(i)}
                      className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Split settings */}
          {students.length >= 2 && (
            <div className="bg-white dark:bg-dark-surface rounded-2xl border border-neutral-100 dark:border-dark-border p-6 shadow-sm">
              <h3 className="font-bold text-neutral-900 dark:text-white mb-4">
                {isRu ? 'Настройки деления' : 'Бөлу параметрлері'}
              </h3>

              <div className="flex items-center gap-4 mb-5">
                <label className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
                  {isRu ? 'Количество команд:' : 'Команда саны:'}
                </label>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setTeamCount(c => Math.max(2, c - 1))}
                    className="w-10 h-10 rounded-lg bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 flex items-center justify-center text-xl font-bold text-neutral-700 dark:text-neutral-300 transition-all"
                  >
                    −
                  </button>
                  <span className="w-12 text-center text-2xl font-bold text-primary-600 dark:text-primary-400">
                    {teamCount}
                  </span>
                  <button
                    onClick={() => setTeamCount(c => Math.min(students.length, c + 1))}
                    className="w-10 h-10 rounded-lg bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 flex items-center justify-center text-xl font-bold text-neutral-700 dark:text-neutral-300 transition-all"
                  >
                    +
                  </button>
                </div>
              </div>

              <button
                onClick={splitIntoTeams}
                className="w-full py-3.5 bg-gradient-to-r from-primary-600 to-purple-600 hover:from-primary-700 hover:to-purple-700 text-white rounded-xl font-bold text-lg shadow-lg shadow-primary-600/20 flex items-center justify-center gap-2 transition-all hover:-translate-y-0.5"
              >
                <Shuffle className="w-5 h-5" />
                {isRu ? 'Разделить!' : 'Бөлу!'}
              </button>
            </div>
          )}
        </div>

        {/* Right: Results */}
        <div>
          {teams.length > 0 ? (
            <div className="space-y-4">
              {/* Actions */}
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-neutral-900 dark:text-white">
                  {isRu ? 'Результат' : 'Нәтиже'}
                </h2>
                <div className="flex items-center gap-2">
                  <button
                    onClick={reshuffle}
                    className="px-4 py-2 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 rounded-lg text-sm font-medium hover:bg-amber-200 dark:hover:bg-amber-900/50 transition-all flex items-center gap-1.5"
                  >
                    <Shuffle className="w-4 h-4" />
                    {isRu ? 'Перемешать' : 'Араластыру'}
                  </button>
                  <button
                    onClick={copyResults}
                    className="px-4 py-2 bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 rounded-lg text-sm font-medium hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-all flex items-center gap-1.5"
                  >
                    {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                    {copied
                      ? (isRu ? 'Скопировано!' : 'Көшірілді!')
                      : (isRu ? 'Копировать' : 'Көшіру')}
                  </button>
                </div>
              </div>

              {/* Teams grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {teams.map((team, i) => (
                  <div
                    key={i}
                    className={`bg-white dark:bg-dark-surface rounded-2xl border ${teamBorders[i % teamBorders.length]} overflow-hidden shadow-sm hover:shadow-md transition-all`}
                  >
                    <div className={`bg-gradient-to-r ${teamColors[i % teamColors.length]} px-5 py-3 flex items-center justify-between`}>
                      <h3 className="font-bold text-white text-lg">
                        {isRu ? 'Команда' : 'Топ'} {i + 1}
                      </h3>
                      <span className="bg-white/20 text-white text-sm font-medium px-2.5 py-0.5 rounded-full">
                        {team.length} {isRu ? 'чел.' : 'адам'}
                      </span>
                    </div>
                    <div className="p-4 space-y-1.5">
                      {team.map((student, j) => (
                        <div
                          key={j}
                          className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-neutral-50 dark:bg-neutral-900/30"
                        >
                          <div className={`w-7 h-7 rounded-full bg-gradient-to-br ${teamColors[i % teamColors.length]} flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>
                            {j + 1}
                          </div>
                          <span className="text-sm font-medium text-neutral-800 dark:text-neutral-200">
                            {student}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center">
              <div className="text-center py-20">
                <div className="w-24 h-24 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-primary-100 to-purple-100 dark:from-primary-900/30 dark:to-purple-900/30 flex items-center justify-center">
                  <Shuffle className="w-12 h-12 text-primary-500/50" />
                </div>
                <p className="text-lg font-medium text-neutral-400 dark:text-neutral-500">
                  {isRu
                    ? 'Добавьте учеников и нажмите "Разделить!"'
                    : 'Оқушыларды қосып, "Бөлу!" батырмасын басыңыз'}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
