import { useState, useEffect } from 'react';
import { BookOpen, Send, Loader2, Calendar } from 'lucide-react';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';

export default function StudentReflectionsPage() {
  const [reflections, setReflections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [newTopic, setNewTopic] = useState('');
  const [newText, setNewText] = useState('');
  const [error, setError] = useState(null);
  const { token } = useAuth();

  const loadReflections = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/reflections`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setReflections(response.data.data);
    } catch (err) {
      console.error('Failed to object reflections', err);
      setError('Не удалось загрузить рефлексии');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReflections();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newTopic.trim() || !newText.trim()) return;

    setSubmitting(true);
    setError(null);
    try {
      const res = await axios.post(`${import.meta.env.VITE_API_URL}/reflections`, {
        lesson_topic: newTopic,
        reflection_text: newText
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.data.success) {
        setNewTopic('');
        setNewText('');
        loadReflections();
      }
    } catch (err) {
      console.error('Failed to submit reflection', err);
      setError('Ошибка при отправке: ' + (err.response?.data?.message || err.message));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-neutral-900 dark:text-white mb-2">
          Рефлексия по урокам
        </h1>
        <p className="text-neutral-600 dark:text-neutral-400">
          Здесь ты можешь оставить свои мысли о прошедших занятиях
        </p>
      </div>

      <Card className="mb-8">
        <h2 className="text-xl font-bold text-neutral-900 dark:text-white mb-4">
          Оставить новую рефлексию
        </h2>
        
        {error && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg text-sm border border-red-200 dark:border-red-800">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input 
            label="Тема урока" 
            placeholder="Например: Введение в AI" 
            value={newTopic}
            onChange={e => setNewTopic(e.target.value)}
            required
          />
          
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
              Твоя рефлексия
            </label>
            <textarea
              className="w-full px-4 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all dark:text-white"
              rows={4}
              placeholder="Что было понятным? Что вызвало трудности? Какие инсайты?"
              value={newText}
              onChange={e => setNewText(e.target.value)}
              required
            />
          </div>

          <div className="flex justify-end">
            <Button type="submit" loading={submitting} icon={<Send className="w-4 h-4" />}>
              Отправить рефлексию
            </Button>
          </div>
        </form>
      </Card>

      <div className="space-y-4">
        <h2 className="text-xl font-bold text-neutral-900 dark:text-white mb-4">
          Твои прошлые рефлексии
        </h2>
        {reflections.length === 0 ? (
          <div className="text-center py-12 bg-neutral-50 dark:bg-neutral-800/50 rounded-2xl border border-neutral-200 dark:border-neutral-800">
            <BookOpen className="w-12 h-12 text-neutral-400 mx-auto mb-3" />
            <p className="text-neutral-500 dark:text-neutral-400">Вы еще не оставили ни одной рефлексии</p>
          </div>
        ) : (
          reflections.map(ref => (
            <Card key={ref.id} hover className="p-4">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-bold text-lg text-neutral-900 dark:text-white">
                  {ref.lesson_topic}
                </h3>
                <div className="flex items-center text-sm text-neutral-500 dark:text-neutral-400">
                  <Calendar className="w-4 h-4 mr-1" />
                  {new Date(ref.created_at).toLocaleDateString()}
                </div>
              </div>
              <p className="text-neutral-700 dark:text-neutral-300 whitespace-pre-wrap">
                {ref.reflection_text}
              </p>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
