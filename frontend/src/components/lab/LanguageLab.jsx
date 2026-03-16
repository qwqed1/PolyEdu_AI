import { useEffect, useRef, useState } from 'react';
import { AlertCircle, Languages, Mic, MicOff, PlayCircle, Sparkles, Volume2 } from 'lucide-react';
import aiService from '../../services/aiService';
import { getLocalizedText } from '../../data/labCatalog';

const languageSamples = {
  'kazakh-language': {
    text: 'Білімді өмірмен байланыстыра алған оқушы ғана жаңа ақпаратты терең меңгереді.',
    words: ['байланыс', 'меңгереді', 'ақпарат', 'терең'],
    speakingPrompt: 'Өзіңізге пайдалы болған бір сабақ сәтін 3 сөйлеммен сипаттаңыз.',
    voice: 'kk-KZ',
  },
  'russian-language': {
    text: 'Хорошее объяснение помогает ученику увидеть логику темы, а не запомнить отдельный факт.',
    words: ['логика', 'объяснение', 'отдельный', 'тема'],
    speakingPrompt: 'Расскажите в 3-4 предложениях, почему тема сегодняшнего урока полезна.',
    voice: 'ru-RU',
  },
  'english-language': {
    text: 'Strong learning happens when students can explain an idea, apply it, and reflect on it aloud.',
    words: ['learning', 'apply', 'reflect', 'aloud'],
    speakingPrompt: 'In three sentences, explain one idea from today’s lesson and why it matters.',
    voice: 'en-US',
  },
};

export default function LanguageLab({ subject, language, selectedTool }) {
  const sample = languageSamples[subject.key] || languageSamples['english-language'];
  const recognitionRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);
  const [recognizedText, setRecognizedText] = useState('');
  const [manualResponse, setManualResponse] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [recordingSupported, setRecordingSupported] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedUrl, setRecordedUrl] = useState('');
  const [feedback, setFeedback] = useState('');
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const [feedbackError, setFeedbackError] = useState('');
  const [activeCardIndex, setActiveCardIndex] = useState(0);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    setSpeechSupported(Boolean(SpeechRecognition));
    setRecordingSupported(Boolean(navigator.mediaDevices?.getUserMedia && window.MediaRecorder));

    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.lang = sample.voice;
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.onresult = (event) => {
        let transcript = '';
        for (let index = event.resultIndex; index < event.results.length; index += 1) {
          transcript += event.results[index][0].transcript;
        }
        setRecognizedText(transcript.trim());
      };
      recognition.onerror = () => setIsListening(false);
      recognition.onend = () => setIsListening(false);
      recognitionRef.current = recognition;
    }

    return () => {
      recognitionRef.current?.stop?.();
      mediaRecorderRef.current?.stop?.();
      streamRef.current?.getTracks?.().forEach((track) => track.stop());
    };
  }, [sample.voice]);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
      return;
    }

    setRecognizedText('');
    recognitionRef.current.lang = sample.voice;
    recognitionRef.current.start();
    setIsListening(true);
  };

  const toggleRecording = async () => {
    if (!recordingSupported) {
      return;
    }

    if (isRecording && mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      return;
    }

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    streamRef.current = stream;
    const chunks = [];
    const recorder = new MediaRecorder(stream);
    mediaRecorderRef.current = recorder;

    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        chunks.push(event.data);
      }
    };

    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: 'audio/webm' });
      setRecordedUrl(URL.createObjectURL(blob));
      stream.getTracks().forEach((track) => track.stop());
    };

    recorder.start();
    setRecordedUrl('');
    setIsRecording(true);
  };

  const requestFeedback = async () => {
    const learnerText = recognizedText || manualResponse;
    if (!learnerText.trim()) {
      setFeedbackError(language === 'kk' ? 'Алдымен жауап енгізіңіз.' : 'Сначала добавьте ответ.');
      return;
    }

    setFeedbackLoading(true);
    setFeedbackError('');

    try {
      const response = await aiService.sendMessage(
        `${language === 'kk' ? 'Оқушы жауабына қысқа кері байланыс бер.' : 'Дай краткую обратную связь на ответ ученика.'}

Target language: ${subject.titleRu}
Reference phrase: ${sample.speakingPrompt}
Learner response: ${learnerText}

${language === 'kk'
  ? 'Жауап құрылымы, сөздік қоры және анықтығы бойынша 3 қысқа кеңес бер.'
  : 'Дай 3 коротких рекомендации по структуре ответа, словарю и ясности речи.'}`
      );

      setFeedback(response.data?.message || response.data?.response || response.data?.text || JSON.stringify(response.data));
    } catch (error) {
      setFeedbackError(error.message);
    } finally {
      setFeedbackLoading(false);
    }
  };

  const flashcards = sample.words.map((word, index) => ({ word, index, hint: `${word.length} ${language === 'kk' ? 'әріп' : 'букв'}` }));

  return (
    <div className="space-y-5 rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-dark-border dark:bg-dark-surface">
      <div>
        <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
          <Languages className="h-3.5 w-3.5" />
          {language === 'kk' ? 'Language lab' : 'Language lab'}
        </div>
        <h2 className="mt-3 text-2xl font-bold text-neutral-900 dark:text-white">
          {selectedTool === 'reader'
            ? (language === 'kk' ? 'Оқу және түсіну' : 'Чтение и понимание')
            : selectedTool === 'vocabulary'
              ? (language === 'kk' ? 'Сөздік карталары' : 'Словарь и карточки')
              : (language === 'kk' ? 'Сөйлеу және кері байланыс' : 'Говорение и обратная связь')}
        </h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-neutral-600 dark:text-neutral-300">
          {getLocalizedText({ ru: 'Цикл чтения, словаря и speaking-практики в одном окне.', kk: 'Бір терезедегі оқу, сөздік және speaking-практика циклі.' }, language)}
        </p>
      </div>

      {selectedTool === 'reader' && (
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="rounded-3xl border border-neutral-200 bg-neutral-50 p-5 dark:border-dark-border dark:bg-dark-bg">
            <div className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-400">
              {language === 'kk' ? 'Мәтін' : 'Текст'}
            </div>
            <p className="mt-3 text-base leading-8 text-neutral-800 dark:text-neutral-100">{sample.text}</p>
          </div>
          <div className="rounded-3xl border border-neutral-200 bg-neutral-50 p-5 dark:border-dark-border dark:bg-dark-bg">
            <div className="text-sm font-semibold text-neutral-500 dark:text-neutral-300">
              {language === 'kk' ? 'Талқылау сұрақтары' : 'Вопросы для обсуждения'}
            </div>
            <ul className="mt-4 space-y-3 text-sm leading-6 text-neutral-700 dark:text-neutral-200">
              <li>{language === 'kk' ? '1. Негізгі ой қандай?' : '1. В чём главная мысль?'}</li>
              <li>{language === 'kk' ? '2. Қай сөздер негізгі мағынаны ашады?' : '2. Какие слова раскрывают смысл?'}</li>
              <li>{language === 'kk' ? '3. Бұл ойды сабақпен қалай байланыстыруға болады?' : '3. Как связать эту мысль с уроком?'}</li>
            </ul>
          </div>
        </div>
      )}

      {selectedTool === 'vocabulary' && (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {flashcards.map((card) => (
            <button
              key={card.word}
              type="button"
              onClick={() => setActiveCardIndex(card.index)}
              className={`rounded-3xl border p-5 text-left transition ${
                activeCardIndex === card.index
                  ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30'
                  : 'border-neutral-200 bg-neutral-50 dark:border-dark-border dark:bg-dark-bg'
              }`}
            >
              <div className="text-xs uppercase tracking-[0.2em] text-neutral-400">
                {language === 'kk' ? 'Карта' : 'Карточка'}
              </div>
              <div className="mt-3 text-xl font-bold text-neutral-900 dark:text-white">{card.word}</div>
              <div className="mt-2 text-sm text-neutral-600 dark:text-neutral-300">{card.hint}</div>
              {activeCardIndex === card.index && (
                <div className="mt-4 rounded-2xl bg-white px-3 py-2 text-sm text-neutral-700 shadow-sm dark:bg-slate-900 dark:text-neutral-200">
                  {language === 'kk' ? 'Осы сөзбен бір сөйлем құрастырыңыз.' : 'Составьте одно предложение с этим словом.'}
                </div>
              )}
            </button>
          ))}
        </div>
      )}

      {selectedTool === 'speaking' && (
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="space-y-4 rounded-3xl border border-neutral-200 bg-neutral-50 p-5 dark:border-dark-border dark:bg-dark-bg">
            <div className="rounded-2xl bg-white p-4 text-sm text-neutral-700 shadow-sm dark:bg-slate-900 dark:text-neutral-100">
              <div className="text-xs uppercase tracking-[0.2em] text-neutral-400">Speaking prompt</div>
              <p className="mt-3 text-base leading-7">{sample.speakingPrompt}</p>
            </div>

            <div className="flex flex-wrap gap-2">
              {speechSupported && (
                <button type="button" onClick={toggleListening} className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium ${isListening ? 'bg-red-600 text-white' : 'bg-emerald-600 text-white'}`}>
                  {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                  {isListening ? (language === 'kk' ? 'Тоқтату' : 'Остановить') : (language === 'kk' ? 'Дауысты тану' : 'Распознать речь')}
                </button>
              )}
              {recordingSupported && (
                <button type="button" onClick={toggleRecording} className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium ${isRecording ? 'bg-amber-500 text-white' : 'bg-neutral-800 text-white dark:bg-slate-700'}`}>
                  <PlayCircle className="h-4 w-4" />
                  {isRecording ? (language === 'kk' ? 'Жазуды тоқтату' : 'Остановить запись') : (language === 'kk' ? 'Аудио жазу' : 'Записать аудио')}
                </button>
              )}
            </div>

            {!speechSupported && (
              <div className="rounded-2xl border border-dashed border-neutral-300 px-4 py-3 text-sm text-neutral-600 dark:border-slate-600 dark:text-neutral-300">
                {language === 'kk' ? 'SpeechRecognition жоқ. Жауапты қолмен енгізіңіз немесе аудио жазыңыз.' : 'SpeechRecognition недоступен. Введите ответ вручную или используйте аудиозапись.'}
              </div>
            )}

            <textarea
              value={recognizedText || manualResponse}
              onChange={(event) => {
                setRecognizedText('');
                setManualResponse(event.target.value);
              }}
              placeholder={language === 'kk' ? 'Оқушы жауабын енгізіңіз...' : 'Введите ответ ученика...'}
              className="min-h-32 rounded-2xl border border-neutral-300 bg-white px-4 py-3 text-sm text-neutral-800 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-dark-border dark:bg-slate-900 dark:text-white"
            />

            {recordedUrl && (
              <div className="rounded-2xl bg-white p-4 shadow-sm dark:bg-slate-900">
                <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-neutral-500 dark:text-neutral-300">
                  <Volume2 className="h-4 w-4" />
                  {language === 'kk' ? 'Жазылған аудио' : 'Записанное аудио'}
                </div>
                <audio controls src={recordedUrl} className="w-full" />
              </div>
            )}

            <button type="button" onClick={requestFeedback} disabled={feedbackLoading} className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-60">
              <Sparkles className="h-4 w-4" />
              {feedbackLoading ? (language === 'kk' ? 'AI талдап жатыр...' : 'AI анализирует...') : (language === 'kk' ? 'AI кері байланысы' : 'AI-фидбек')}
            </button>

            {feedbackError && (
              <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-200">
                {feedbackError}
              </div>
            )}
            {feedback && (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm leading-6 text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-100">
                {feedback}
              </div>
            )}
          </div>

          <div className="rounded-3xl border border-neutral-200 bg-neutral-50 p-5 dark:border-dark-border dark:bg-dark-bg">
            <div className="text-sm font-semibold text-neutral-500 dark:text-neutral-300">
              {language === 'kk' ? 'Speaking цикл' : 'Speaking-цикл'}
            </div>
            <ul className="mt-4 space-y-3 text-sm leading-6 text-neutral-700 dark:text-neutral-200">
              <li>{language === 'kk' ? '1. Үлгі фразаны оқыңыз.' : '1. Прочитайте образец.'}</li>
              <li>{language === 'kk' ? '2. Жауапты айтыңыз немесе жазыңыз.' : '2. Скажите или запишите ответ.'}</li>
              <li>{language === 'kk' ? '3. AI-ден қысқа ұсыныс алыңыз.' : '3. Получите короткие рекомендации от AI.'}</li>
            </ul>
          </div>
        </div>
      )}

      {!recordingSupported && selectedTool === 'speaking' && (
        <div className="rounded-2xl border border-dashed border-neutral-300 px-4 py-3 text-sm text-neutral-600 dark:border-slate-600 dark:text-neutral-300">
          <span className="inline-flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            {language === 'kk' ? 'MediaRecorder қолжетімсіз. Бұл жағдайда тек мәтіндік жауап пен AI кері байланысын пайдаланыңыз.' : 'MediaRecorder недоступен. В этом случае используйте текстовый ответ и AI-фидбек.'}
          </span>
        </div>
      )}
    </div>
  );
}
