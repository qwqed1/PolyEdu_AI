import { useState, useEffect } from 'react';
import { 
  BookOpen, Plus, Trash2, Edit3, Loader2, AlertCircle, Calendar,
  ChevronDown, ChevronUp, Save, X, Sparkles, FileText, Clock
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import lessonPlanService from '../../services/lessonPlanService';
import aiService from '../../services/aiService';

export default function LessonPlanPage() {
  const { user } = useAuth();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  const [expandedPlan, setExpandedPlan] = useState(null);
  const [editingPlan, setEditingPlan] = useState(null);

  // Форма генерации
  const [formData, setFormData] = useState({
    subject_name: '',
    module_code: '',
    group_name: '',
    course: 1,
    semester_hours: 36,
    teacher_name: user?.full_name || ''
  });

  useEffect(() => {
    loadPlans();
  }, []);

  const loadPlans = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Сначала инициализируем таблицу (если ещё не создана)
      try {
        await lessonPlanService.initTable();
      } catch (initErr) {
        console.log('Table init:', initErr.message);
      }
      
      // Загружаем данные
      const data = await lessonPlanService.getAll();
      setPlans(data || []);
    } catch (err) {
      console.error('Error loading plans:', err);
      setPlans([]); // Показываем пустой список вместо ошибки
    } finally {
      setLoading(false);
    }
  };

  const generatePlans = async () => {
    if (!formData.subject_name || !formData.group_name) {
      setError('Укажите название предмета и группу');
      return;
    }

    setGenerating(true);
    setError('');

    try {
      const totalLessons = Math.ceil(formData.semester_hours / 2); // 2 часа на урок
      
      const prompt = `Сгенерируй ${totalLessons} планов уроков для предмета "${formData.subject_name}" по казахстанскому образовательному стандарту.

Модуль: ${formData.module_code || formData.subject_name}
Группа: ${formData.group_name}
Курс: ${formData.course}
Педагог: ${formData.teacher_name}

Для каждого урока используй следующую структуру (на казахском или русском):

1. Ұйымдастыру кезеңі (5 мин.) - Организационный момент
2. Білімді өзектендіру (15 мин.) - Актуализация знаний
3. Жаңа білім мен дағдыларды қалыптастыру (40 мин.) - Формирование новых знаний и навыков
4. Өтілген тақырыпты бекіту (15 мин.) - Закрепление темы
5. Бағалау (5 мин.) - Оценивание
6. Үй тапсырмасы (3 мин.) - Домашнее задание
7. Рефлексия (7 мин.) - Рефлексия

ВАЖНО: Ответ дай в формате JSON массива:
[
  {
    "lesson_number": 1,
    "topic": "Тема урока",
    "lesson_type": "Тип урока",
    "goals": "Цели",
    "objectives": "Задачи",
    "expected_results": "Ожидаемые результаты",
    "resources_methods": "Методические ресурсы",
    "resources_technical": "Технические средства",
    "stage_organization": "Содержание организационного момента",
    "stage_knowledge": "Содержание актуализации знаний",
    "stage_new_skills": "Содержание формирования новых знаний",
    "stage_consolidation": "Содержание закрепления",
    "stage_assessment": "Критерии оценивания",
    "stage_homework": "Домашнее задание",
    "stage_reflection": "Вопросы для рефлексии"
  }
]

Сгенерируй логически связанные темы для всего курса.`;

      const response = await aiService.sendMessage(prompt);
      
      console.log('AI Response:', response);
      
      // Извлекаем текст ответа из разных возможных форматов
      let responseText = '';
      if (response.data?.response) {
        responseText = response.data.response;
      } else if (response.message) {
        responseText = response.message;
      } else if (typeof response === 'string') {
        responseText = response;
      } else {
        responseText = JSON.stringify(response);
      }
      
      console.log('Response text:', responseText);
      
      // Парсим JSON из ответа - ищем массив [...]
      let generatedPlans = [];
      const jsonMatch = responseText.match(/\[[\s\S]*?\]/);
      
      if (jsonMatch) {
        try {
          generatedPlans = JSON.parse(jsonMatch[0]);
          console.log('Parsed plans:', generatedPlans.length);
        } catch (parseErr) {
          console.error('JSON parse error:', parseErr);
          console.error('Attempted to parse:', jsonMatch[0].substring(0, 500));
          setError('Ошибка парсинга ответа AI. Попробуйте ещё раз.');
          setGenerating(false);
          return;
        }
      } else {
        console.error('No JSON array found in response:', responseText.substring(0, 500));
        setError('AI не вернул данные в нужном формате. Попробуйте ещё раз.');
        setGenerating(false);
        return;
      }

      // Добавляем общие данные к каждому плану
      const plansWithMeta = generatedPlans.map((plan, index) => ({
        ...plan,
        subject_name: formData.subject_name,
        module_code: formData.module_code,
        group_name: formData.group_name,
        course: formData.course,
        teacher_name: formData.teacher_name,
        semester_hours: formData.semester_hours,
        lesson_number: plan.lesson_number || index + 1
      }));

      // Сохраняем в базу
      await lessonPlanService.createMany(plansWithMeta);
      
      // Перезагружаем список
      await loadPlans();

    } catch (err) {
      console.error('Generate error:', err);
      setError(err.message || 'Ошибка генерации планов');
    } finally {
      setGenerating(false);
    }
  };

  const deletePlan = async (id) => {
    if (!confirm('Удалить этот план урока?')) return;
    
    try {
      await lessonPlanService.delete(id);
      setPlans(plans.filter(p => p.id !== id));
    } catch (err) {
      setError('Ошибка удаления');
    }
  };

  const updatePlan = async (id, data) => {
    try {
      const updated = await lessonPlanService.update(id, data);
      setPlans(plans.map(p => p.id === id ? updated : p));
      setEditingPlan(null);
    } catch (err) {
      setError('Ошибка сохранения');
    }
  };

  // Группировка планов по предмету
  const groupedPlans = plans.reduce((acc, plan) => {
    const key = plan.subject_name;
    if (!acc[key]) acc[key] = [];
    acc[key].push(plan);
    return acc;
  }, {});

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-dark-bg py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold gradient-text-primary flex items-center gap-3">
            <BookOpen className="w-8 h-8" />
            Оқу сабағының жоспары
          </h1>
          <p className="text-neutral-600 dark:text-neutral-400 mt-2">
            Планы уроков на семестр по казахстанскому образовательному стандарту
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <span className="text-red-700 dark:text-red-400">{error}</span>
            <button onClick={() => setError('')} className="ml-auto">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Generation Form */}
        <div className="bg-white dark:bg-dark-card rounded-2xl shadow-lg p-6 mb-8 border border-neutral-200 dark:border-dark-border">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-500" />
            Генерация планов уроков с помощью ИИ
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-1">Модуль/Пән атауы *</label>
              <input
                type="text"
                placeholder="НМЗ «***» ОН 3.1 «***»"
                value={formData.subject_name}
                onChange={(e) => setFormData({...formData, subject_name: e.target.value})}
                className="w-full px-4 py-2 rounded-lg border border-neutral-300 dark:border-dark-border bg-white dark:bg-dark-bg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Топ (Группа) *</label>
              <input
                type="text"
                placeholder="ИС23-1А"
                value={formData.group_name}
                onChange={(e) => setFormData({...formData, group_name: e.target.value})}
                className="w-full px-4 py-2 rounded-lg border border-neutral-300 dark:border-dark-border bg-white dark:bg-dark-bg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Курс</label>
              <select
                value={formData.course}
                onChange={(e) => setFormData({...formData, course: parseInt(e.target.value)})}
                className="w-full px-4 py-2 rounded-lg border border-neutral-300 dark:border-dark-border bg-white dark:bg-dark-bg focus:ring-2 focus:ring-primary-500"
              >
                <option value={1}>1 курс</option>
                <option value={2}>2 курс</option>
                <option value={3}>3 курс</option>
                <option value={4}>4 курс</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Педагог</label>
              <input
                type="text"
                placeholder="ФИО педагога"
                value={formData.teacher_name}
                onChange={(e) => setFormData({...formData, teacher_name: e.target.value})}
                className="w-full px-4 py-2 rounded-lg border border-neutral-300 dark:border-dark-border bg-white dark:bg-dark-bg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Часов за семестр</label>
              <input
                type="number"
                min="2"
                max="200"
                value={formData.semester_hours}
                onChange={(e) => setFormData({...formData, semester_hours: parseInt(e.target.value) || 36})}
                className="w-full px-4 py-2 rounded-lg border border-neutral-300 dark:border-dark-border bg-white dark:bg-dark-bg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
              <p className="text-xs text-neutral-500 mt-1">
                ≈ {Math.ceil(formData.semester_hours / 2)} уроков (по 2 часа)
              </p>
            </div>
          </div>

          <button
            onClick={generatePlans}
            disabled={generating}
            className="w-full md:w-auto mt-4 px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-lg rounded-xl font-semibold flex items-center justify-center gap-3 hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 transition-all shadow-lg"
          >
            {generating ? (
              <>
                <Loader2 className="w-6 h-6 animate-spin" />
                Генерация планов...
              </>
            ) : (
              <>
                <Sparkles className="w-6 h-6" />
                🚀 Сгенерировать планы
              </>
            )}
          </button>
        </div>

        {/* Plans List */}
        {Object.keys(groupedPlans).length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-dark-card rounded-2xl border border-neutral-200 dark:border-dark-border">
            <FileText className="w-16 h-16 mx-auto text-neutral-400 mb-4" />
            <h3 className="text-xl font-medium text-neutral-600 dark:text-neutral-400">
              Нет планов уроков
            </h3>
            <p className="text-neutral-500 mt-2">
              Используйте форму выше для генерации планов
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedPlans).map(([subject, subjectPlans]) => (
              <div key={subject} className="bg-white dark:bg-dark-card rounded-2xl shadow-lg border border-neutral-200 dark:border-dark-border overflow-hidden">
                <div className="p-4 bg-gradient-to-r from-primary-600 to-accent-500 text-white">
                  <h3 className="text-lg font-semibold">{subject}</h3>
                  <p className="text-sm opacity-90">
                    {subjectPlans.length} уроков • Группа: {subjectPlans[0]?.group_name}
                  </p>
                </div>
                
                <div className="divide-y divide-neutral-200 dark:divide-dark-border">
                  {subjectPlans.map((plan) => (
                    <div key={plan.id} className="p-4">
                      <div 
                        className="flex items-center justify-between cursor-pointer"
                        onClick={() => setExpandedPlan(expandedPlan === plan.id ? null : plan.id)}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                            <span className="text-primary-600 font-bold">{plan.lesson_number}</span>
                          </div>
                          <div>
                            <h4 className="font-medium">{plan.topic || 'Без темы'}</h4>
                            <p className="text-sm text-neutral-500">
                              {plan.lesson_type} • {plan.lesson_date ? new Date(plan.lesson_date).toLocaleDateString('ru') : 'Дата не указана'}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={(e) => { e.stopPropagation(); deletePlan(plan.id); }}
                            className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                          {expandedPlan === plan.id ? (
                            <ChevronUp className="w-5 h-5 text-neutral-400" />
                          ) : (
                            <ChevronDown className="w-5 h-5 text-neutral-400" />
                          )}
                        </div>
                      </div>

                      {expandedPlan === plan.id && (
                        <div className="mt-4 pt-4 border-t border-neutral-200 dark:border-dark-border">
                          {/* Plan Details Table */}
                          <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                              <tbody className="divide-y divide-neutral-200 dark:divide-dark-border">
                                <tr>
                                  <td className="py-2 font-medium w-1/3">Мақсаты (Цели)</td>
                                  <td className="py-2">{plan.goals || '-'}</td>
                                </tr>
                                <tr>
                                  <td className="py-2 font-medium">Міндеттері (Задачи)</td>
                                  <td className="py-2">{plan.objectives || '-'}</td>
                                </tr>
                                <tr>
                                  <td className="py-2 font-medium">Күтілетін нәтижелер</td>
                                  <td className="py-2">{plan.expected_results || '-'}</td>
                                </tr>
                              </tbody>
                            </table>
                          </div>

                          {/* Lesson Stages */}
                          <div className="mt-4">
                            <h5 className="font-semibold mb-3 flex items-center gap-2">
                              <Clock className="w-4 h-4" />
                              Сабақтың барысы (Ход урока)
                            </h5>
                            <div className="space-y-3">
                              <StageItem title="Ұйымдастыру кезеңі (5 мин.)" content={plan.stage_organization} />
                              <StageItem title="Білімді өзектендіру (15 мин.)" content={plan.stage_knowledge} />
                              <StageItem title="Жаңа білім мен дағдыларды қалыптастыру (40 мин.)" content={plan.stage_new_skills} />
                              <StageItem title="Өтілген тақырыпты бекіту (15 мин.)" content={plan.stage_consolidation} />
                              <StageItem title="Бағалау (5 мин.)" content={plan.stage_assessment} />
                              <StageItem title="Үй тапсырмасы (3 мин.)" content={plan.stage_homework} />
                              <StageItem title="Рефлексия (7 мин.)" content={plan.stage_reflection} />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StageItem({ title, content }) {
  return (
    <div className="bg-neutral-50 dark:bg-dark-bg rounded-lg p-3">
      <div className="font-medium text-primary-700 dark:text-primary-400 mb-1">{title}</div>
      <div className="text-neutral-700 dark:text-neutral-300 whitespace-pre-wrap">
        {content || 'Не заполнено'}
      </div>
    </div>
  );
}
