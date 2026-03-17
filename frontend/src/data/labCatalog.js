/**
 * @typedef {Object} MiniTaskConfig
 * @property {string} id
 * @property {{ ru: string, kk: string }} title
 * @property {{ ru: string, kk: string }} description
 * @property {{ ru: string, kk: string }} challenge
 * @property {{ ru: string, kk: string }} outcome
 */

/**
 * @typedef {Object} LabPromptPreset
 * @property {string} id
 * @property {{ ru: string, kk: string }} label
 * @property {string} aiPrompt
 * @property {string} gamePrompt
 * @property {string} lessonTopic
 */

/**
 * @typedef {Object} LabSubjectConfig
 * @property {string} key
 * @property {string} titleRu
 * @property {string} titleKk
 * @property {string} subjectFamily
 * @property {string[]} grades
 * @property {string[]} curriculumAliases
 * @property {string[]} enabledTools
 * @property {LabPromptPreset[]} promptPresets
 * @property {MiniTaskConfig[]} miniTaskTemplates
 * @property {'deep' | 'catalog'} status
 * @property {'geography' | 'math' | 'language' | 'chemistry' | 'physics' | 'generic'} adapterKey
 * @property {string} summaryRu
 * @property {string} summaryKk
 * @property {string[]} teacherMovesRu
 * @property {string[]} teacherMovesKk
 */

const grades = {
  primary: ['1-4'],
  middle: ['5-9'],
  high: ['10-11'],
  all: ['1-4', '5-9', '10-11'],
};

const adapterMoves = {
  geography: {
    ru: ['Покажите точку на глобусе.', 'Сравните объекты и маршруты.', 'Завершите мини-квизом.'],
    kk: ['Нүктені глобуста көрсетіңіз.', 'Нысандар мен маршруттарды салыстырыңыз.', 'Шағын квизбен аяқтаңыз.'],
  },
  math: {
    ru: ['Покажите ход решения.', 'Свяжите формулу и модель.', 'Проверьте идею на графике.'],
    kk: ['Шешу жолын көрсетіңіз.', 'Формула мен модельді байланыстырыңыз.', 'Идеяны графикте тексеріңіз.'],
  },
  language: {
    ru: ['Дайте короткий текст.', 'Разберите лексику.', 'Попросите устный ответ.'],
    kk: ['Қысқа мәтін беріңіз.', 'Лексиканы талдаңыз.', 'Ауызша жауап сұраңыз.'],
  },
  generic: {
    ru: ['Возьмите мини-задачу.', 'Уточните вопрос урока.', 'Сделайте короткую рефлексию.'],
    kk: ['Шағын тапсырма алыңыз.', 'Сабақ сұрағын нақтылаңыз.', 'Қысқа рефлексия жасаңыз.'],
  },
};

function text(ru, kk) {
  return { ru, kk };
}

function preset(id, labelRu, labelKk, subjectRu) {
  return {
    id,
    label: text(labelRu, labelKk),
    aiPrompt: `Помоги подготовить урок по предмету "${subjectRu}": объяснение, 3 вопроса на понимание, мини-задача и рефлексия.`,
    gamePrompt: `Создай короткую HTML-игру по предмету "${subjectRu}" на 8-10 вопросов с таймером и быстрым фидбеком.`,
    lessonTopic: `${subjectRu}: интерактивный урок`,
  };
}

function task(id, titleRu, titleKk, descRu, descKk, challengeRu, challengeKk, outcomeRu, outcomeKk) {
  return {
    id,
    title: text(titleRu, titleKk),
    description: text(descRu, descKk),
    challenge: text(challengeRu, challengeKk),
    outcome: text(outcomeRu, outcomeKk),
  };
}

const genericTasks = [
  task('starter', 'Быстрый старт', 'Жылдам бастау', 'Соберите вход в тему за 5 минут.', 'Тақырыпқа 5 минуттық кіріспе жинаңыз.', 'Подготовьте 3 вопроса и 1 микро-демо.', '3 сұрақ және 1 микро-демо дайындаңыз.', 'Есть готовый старт урока.', 'Сабақтың дайын бастамасы бар.'),
  task('reflection', 'Рефлексия', 'Рефлексия', 'Соберите короткую обратную связь.', 'Қысқа кері байланыс жинаңыз.', 'Придумайте 2 вопроса на самооценку.', 'Өзін-өзі бағалауға 2 сұрақ ойластырыңыз.', 'Есть материал для следующего урока.', 'Келесі сабаққа материал бар.'),
];

const geographyTasks = [
  task('capitals', 'Столицы', 'Астаналар', 'Найдите ключевые точки.', 'Негізгі нүктелерді табыңыз.', 'Сравните 3 столицы по положению на карте.', 'Картадағы 3 астананы салыстырыңыз.', 'Карта связана с обсуждением.', 'Карта талқылаумен байланысады.'),
  task('regions', 'Регионы РК', 'ҚР өңірлері', 'Сопоставьте города и регионы.', 'Қалалар мен өңірлерді сәйкестендіріңіз.', 'Объясните различия севера, юга, запада и востока.', 'Солтүстік, оңтүстік, батыс, шығыс айырмасын түсіндіріңіз.', 'География привязана к реальным территориям.', 'География нақты аумақтармен байланысады.'),
];

const mathTasks = [
  task('board', 'Разбор', 'Талдау', 'Соберите решение по шагам.', 'Шешімді қадамдап жинаңыз.', 'Выделите условие, ход решения и проверку.', 'Шартты, шешуді және тексеруді бөліңіз.', 'Ученики видят структуру решения.', 'Оқушылар шешім құрылымын көреді.'),
  task('graph', 'График', 'График', 'Проверьте гипотезу визуально.', 'Болжамды визуалды тексеріңіз.', 'Сравните 2 функции и точки пересечения.', '2 функцияны және қиылысу нүктелерін салыстырыңыз.', 'Формула и график связаны.', 'Формула мен график байланысады.'),
];

const languageTasks = [
  task('speaking', 'Устная практика', 'Ауызша практика', 'Скажите ответ вслух и сравните с образцом.', 'Жауапты дауыстап айтып, үлгімен салыстырыңыз.', 'Запишите 30-секундный ответ и попросите AI-фидбек.', '30 секундтық жауап жазып, AI кері байланысын сұраңыз.', 'Есть безопасная speaking-практика.', 'Қауіпсіз speaking-практика бар.'),
];

adapterMoves.chemistry = {
  ru: ['Откройте элемент в таблице.', 'Соберите 3D-модель вещества.', 'Сравните реактивы и продукты.'],
  kk: ['Кестеден элементті ашыңыз.', 'Заттың 3D моделін жинаңыз.', 'Реактивтер мен өнімдерді салыстырыңыз.'],
};

adapterMoves.physics = {
  ru: ['Покажите источник энергии.', 'Замкните контур проводниками.', 'Объясните, почему лампа загорелась.'],
  kk: ['Энергия көзін көрсетіңіз.', 'Сымды қойып, тұйық тізбек құрыңыз.', 'Шам неге жанғанын түсіндіріңіз.'],
};

const chemistryTasks = [
  task('periodic-explorer', 'Исследование элемента', 'Элементті зерттеу', 'Найдите элемент в таблице и объясните его свойства.', 'Кестеден элементті тауып, қасиетін түсіндіріңіз.', 'Свяжите положение в таблице с электронными оболочками.', 'Кестедегі орнын электрон қабаттарымен байланыстырыңыз.', 'Есть готовый разбор элемента.', 'Элемент бойынша дайын талдау бар.'),
  task('molecule-3d', '3D молекула', '3D молекула', 'Откройте вещество и разберите его формулу.', 'Затты ашып, формуласын талдаңыз.', 'Найдите связи, формулу и 3D-форму.', 'Байланыстарын, формуласын және 3D пішінін табыңыз.', 'Формула и модель показаны вместе.', 'Формула мен модель бірге көрсетіледі.'),
  task('reaction-lab', 'Разбор реакции', 'Реакцияны талдау', 'Сравните два вещества и посмотрите продукты.', 'Екі затты салыстырып, өнімдерін көріңіз.', 'Опишите условия, тип реакции и наблюдаемый эффект.', 'Шартын, реакция типін және байқалатын әсерін сипаттаңыз.', 'Есть учебный разбор реакции.', 'Реакция бойынша оқу талдауы бар.'),
];

const physicsTasks = [
  task('hand-circuit', 'Электрическая цепь', 'Электр тізбегі', 'Соберите простую цепь руками через камеру.', 'Камера арқылы қарапайым тізбекті қолмен жинаңыз.', 'Поставьте батарею, лампу и два проводника в нужные зоны.', 'Батареяны, шамды және екі сымды дұрыс орынға қойыңыз.', 'Замкнутая цепь показывает результат и объяснение.', 'Тұйық тізбек нәтиже мен түсіндіруді көрсетеді.'),
  task('current-flow', 'Путь тока', 'Ток жолы', 'Покажите, как ток проходит по замкнутому контуру.', 'Токтың тұйық контурмен қалай өтетінін көрсетіңіз.', 'Объясните разницу между незамкнутой и замкнутой цепью.', 'Ашық және тұйық тізбектің айырмасын түсіндіріңіз.', 'Ученики видят причинно-следственную связь.', 'Оқушылар себеп-салдар байланысын көреді.'),
];

function chemistryPreset(id, labelRu, labelKk, subjectRu) {
  return {
    id,
    label: text(labelRu, labelKk),
    aiPrompt: `Помоги подготовить урок по "${subjectRu}": выбери вещество, объясни его строение, свойства и 1-2 типовые реакции для школы.`,
    gamePrompt: `Создай короткую HTML-игру по "${subjectRu}" на тему элементов, формул и типовых реакций с понятным фидбеком.`,
    lessonTopic: `${subjectRu}: элементы, молекулы и реакции`,
  };
}

function subject(config) {
  const moves = adapterMoves[config.adapterKey] || adapterMoves.generic;
  const taskSet = config.adapterKey === 'geography'
    ? geographyTasks
    : config.adapterKey === 'math'
      ? mathTasks
      : config.adapterKey === 'language'
        ? languageTasks
        : config.adapterKey === 'chemistry'
          ? chemistryTasks
          : config.adapterKey === 'physics'
            ? physicsTasks
          : genericTasks;

  return {
    ...config,
    promptPresets: config.promptPresets || [preset(`${config.key}-core`, config.titleRu, config.titleKk, config.titleRu)],
    miniTaskTemplates: config.miniTaskTemplates || taskSet,
    teacherMovesRu: moves.ru,
    teacherMovesKk: moves.kk,
  };
}

/** @type {LabSubjectConfig[]} */
export const labCatalog = [
  subject({ key: 'geography', titleRu: 'География', titleKk: 'География', subjectFamily: 'social', grades: [...grades.middle, ...grades.high], curriculumAliases: ['Дүниежүзі географиясы', 'Қазақстан географиясы'], enabledTools: ['globe', 'capitals', 'regions'], status: 'deep', adapterKey: 'geography', summaryRu: '3D-глобус, столицы, маршруты и регионы Казахстана.', summaryKk: '3D глобус, астаналар, маршруттар және Қазақстан өңірлері.' }),
  subject({ key: 'mathematics', titleRu: 'Математика', titleKk: 'Математика', subjectFamily: 'stem', grades: grades.all, curriculumAliases: ['Алгебра', 'Геометрия', 'Анализ бастамалары'], enabledTools: ['board', 'air_board', 'formula', 'graph'], status: 'deep', adapterKey: 'math', summaryRu: 'Доска, формулы, hand-writing и графики в одном workspace.', summaryKk: 'Бір workspace ішіндегі тақта, hand-writing, формула және график.' }),
  subject({ key: 'kazakh-language', titleRu: 'Казахский язык', titleKk: 'Қазақ тілі', subjectFamily: 'languages', grades: grades.all, curriculumAliases: ['Қазақ тілі', 'Тіл дамыту'], enabledTools: ['reader', 'vocabulary', 'speaking'], status: 'deep', adapterKey: 'language', summaryRu: 'Чтение, словарь и устная практика.', summaryKk: 'Оқу, сөздік және ауызша практика.' }),
  subject({ key: 'russian-language', titleRu: 'Русский язык', titleKk: 'Орыс тілі', subjectFamily: 'languages', grades: grades.all, curriculumAliases: ['Русский язык', 'Речевое развитие'], enabledTools: ['reader', 'vocabulary', 'speaking'], status: 'deep', adapterKey: 'language', summaryRu: 'Текст, словарь и speaking-практика.', summaryKk: 'Мәтін, сөздік және speaking-практика.' }),
  subject({ key: 'english-language', titleRu: 'Английский язык', titleKk: 'Ағылшын тілі', subjectFamily: 'languages', grades: grades.all, curriculumAliases: ['English', 'Foreign language'], enabledTools: ['reader', 'vocabulary', 'speaking'], status: 'deep', adapterKey: 'language', summaryRu: 'Reading, vocabulary and speaking with AI feedback.', summaryKk: 'AI кері байланысымен reading, vocabulary және speaking.' }),
  subject({ key: 'algebra', titleRu: 'Алгебра', titleKk: 'Алгебра', subjectFamily: 'stem', grades: [...grades.middle, ...grades.high], curriculumAliases: ['Функции', 'Уравнения'], enabledTools: ['board', 'air_board', 'formula', 'graph'], status: 'catalog', adapterKey: 'math', summaryRu: 'Алгебра в единой математической лаборатории.', summaryKk: 'Алгебра бірыңғай математикалық зертханада.' }),
  subject({ key: 'geometry', titleRu: 'Геометрия', titleKk: 'Геометрия', subjectFamily: 'stem', grades: [...grades.middle, ...grades.high], curriculumAliases: ['Планиметрия', 'Стереометрия'], enabledTools: ['board', 'air_board', 'formula', 'graph'], status: 'catalog', adapterKey: 'math', summaryRu: 'Чертежи, доказательства и визуализация.', summaryKk: 'Сызбалар, дәлелдеулер және визуализация.' }),
  subject({ key: 'history-kazakhstan', titleRu: 'История Казахстана', titleKk: 'Қазақстан тарихы', subjectFamily: 'social', grades: [...grades.middle, ...grades.high], curriculumAliases: ['Қазақстан тарихы'], enabledTools: ['overview', 'ai', 'tasks'], status: 'catalog', adapterKey: 'generic', summaryRu: 'Хронология, фигуры и причинно-следственные связи.', summaryKk: 'Хронология, тұлғалар және себеп-салдар байланысы.' }),
  subject({ key: 'world-history', titleRu: 'Всемирная история', titleKk: 'Дүниежүзі тарихы', subjectFamily: 'social', grades: [...grades.middle, ...grades.high], curriculumAliases: ['Всеобщая история'], enabledTools: ['overview', 'ai', 'tasks'], status: 'catalog', adapterKey: 'generic', summaryRu: 'Эпохи, события и сравнение исторических процессов.', summaryKk: 'Дәуірлер, оқиғалар және тарихи процестерді салыстыру.' }),
  subject({ key: 'biology', titleRu: 'Биология', titleKk: 'Биология', subjectFamily: 'science', grades: [...grades.middle, ...grades.high], curriculumAliases: ['Анатомия', 'Экология'], enabledTools: ['overview', 'ai', 'tasks'], status: 'catalog', adapterKey: 'generic', summaryRu: 'Процессы, классификация и научное объяснение.', summaryKk: 'Процестер, жіктеу және ғылыми түсіндіру.' }),
  subject({ key: 'chemistry', titleRu: 'Химия', titleKk: 'Химия', subjectFamily: 'science', grades: [...grades.middle, ...grades.high], curriculumAliases: ['Органическая химия', 'Неорганическая химия'], enabledTools: ['overview', 'ai', 'tasks'], status: 'catalog', adapterKey: 'generic', summaryRu: 'Формулы, реакции и свойства веществ.', summaryKk: 'Формула, реакция және зат қасиеті.' }),
  subject({ key: 'physics', titleRu: 'Физика', titleKk: 'Физика', subjectFamily: 'science', grades: [...grades.middle, ...grades.high], curriculumAliases: ['Механика', 'Электродинамика'], enabledTools: ['current_flow', 'hand_circuit'], status: 'deep', adapterKey: 'physics', summaryRu: 'Обычная лаборатория по цепям и отдельный hand-tracking режим внутри предмета.', summaryKk: 'Тізбек бойынша кәдімгі зертхана және пән ішіндегі бөлек hand-tracking режимі.' }),
  subject({ key: 'informatics', titleRu: 'Информатика', titleKk: 'Информатика', subjectFamily: 'stem', grades: [...grades.middle, ...grades.high], curriculumAliases: ['Алгоритмы', 'Программирование'], enabledTools: ['overview', 'ai', 'tasks'], status: 'catalog', adapterKey: 'generic', summaryRu: 'Алгоритмы, цифровые навыки и логика.', summaryKk: 'Алгоритмдер, цифрлық дағдылар және логика.' }),
  subject({ key: 'natural-science', titleRu: 'Естествознание', titleKk: 'Жаратылыстану', subjectFamily: 'science', grades: grades.primary, curriculumAliases: ['Science', 'Окружающий мир'], enabledTools: ['overview', 'ai', 'tasks'], status: 'catalog', adapterKey: 'generic', summaryRu: 'Наблюдение, вопросы и простое исследование.', summaryKk: 'Бақылау, сұрақтар және қарапайым зерттеу.' }),
  subject({ key: 'kazakh-literature', titleRu: 'Казахская литература', titleKk: 'Қазақ әдебиеті', subjectFamily: 'languages', grades: [...grades.middle, ...grades.high], curriculumAliases: ['Әдебиет'], enabledTools: ['overview', 'ai', 'tasks'], status: 'catalog', adapterKey: 'generic', summaryRu: 'Образы, цитаты и авторская позиция.', summaryKk: 'Бейнелер, цитаталар және автор ұстанымы.' }),
  subject({ key: 'russian-literature', titleRu: 'Русская литература', titleKk: 'Орыс әдебиеті', subjectFamily: 'languages', grades: [...grades.middle, ...grades.high], curriculumAliases: ['Литература'], enabledTools: ['overview', 'ai', 'tasks'], status: 'catalog', adapterKey: 'generic', summaryRu: 'Темы, герои и аргументация.', summaryKk: 'Тақырыптар, кейіпкерлер және аргументация.' }),
  subject({ key: 'art-work', titleRu: 'Художественный труд / Технология', titleKk: 'Көркем еңбек / Технология', subjectFamily: 'arts', grades: grades.all, curriculumAliases: ['Технология', 'Қолөнер'], enabledTools: ['overview', 'ai', 'tasks'], status: 'catalog', adapterKey: 'generic', summaryRu: 'Идея, материалы и этапы проекта.', summaryKk: 'Идея, материалдар және жоба кезеңдері.' }),
  subject({ key: 'music', titleRu: 'Музыка', titleKk: 'Музыка', subjectFamily: 'arts', grades: grades.all, curriculumAliases: ['Музыкальная культура'], enabledTools: ['overview', 'ai', 'tasks'], status: 'catalog', adapterKey: 'generic', summaryRu: 'Ритм, жанры и эмоциональный отклик.', summaryKk: 'Ырғақ, жанрлар және эмоционалды жауап.' }),
  subject({ key: 'physical-education', titleRu: 'Физическая культура', titleKk: 'Дене шынықтыру', subjectFamily: 'wellness', grades: grades.all, curriculumAliases: ['Спорт', 'Физкультура'], enabledTools: ['overview', 'ai', 'tasks'], status: 'catalog', adapterKey: 'generic', summaryRu: 'Активность, техника и безопасный сценарий урока.', summaryKk: 'Белсенділік, техника және қауіпсіз сабақ сценарийі.' }),
  subject({ key: 'basic-military-training', titleRu: 'НВТП / Начальная военная и технологическая подготовка', titleKk: 'Алғашқы әскери және технологиялық дайындық', subjectFamily: 'civic', grades: grades.high, curriculumAliases: ['НВТП', 'АӘТД'], enabledTools: ['overview', 'ai', 'tasks'], status: 'catalog', adapterKey: 'generic', summaryRu: 'Алгоритмы действий, дисциплина и безопасность.', summaryKk: 'Әрекет алгоритмдері, тәртіп және қауіпсіздік.' }),
  subject({ key: 'global-competencies', titleRu: 'Глобальные компетенции', titleKk: 'Жаһандық құзыреттер', subjectFamily: 'civic', grades: [...grades.middle, ...grades.high], curriculumAliases: ['Soft skills', 'Глобальные навыки'], enabledTools: ['overview', 'ai', 'tasks'], status: 'catalog', adapterKey: 'generic', summaryRu: 'Коммуникация, аргументация и работа с кейсами.', summaryKk: 'Коммуникация, аргументация және кейстермен жұмыс.' }),
];

const chemistrySubject = labCatalog.find((subject) => subject.key === 'chemistry');

if (chemistrySubject) {
  Object.assign(chemistrySubject, {
    enabledTools: ['periodic', 'molecule', 'reactions', 'hand_molecule'],
    promptPresets: [
      chemistryPreset('chemistry-core', '3D молекулы и реакции', '3D молекулалар мен реакциялар', chemistrySubject.titleRu),
      chemistryPreset('chemistry-lab', 'Учебная химическая лаборатория', 'Оқу химиялық зертхана', chemistrySubject.titleRu),
    ],
    miniTaskTemplates: chemistryTasks,
    status: 'deep',
    adapterKey: 'chemistry',
    summaryRu: 'Таблица Менделеева, 3D-молекулы и школьный каталог реакций в одном workspace.',
    summaryKk: 'Бір workspace ішінде Менделеев кестесі, 3D молекулалар және мектептік реакция каталогы.',
    teacherMovesRu: adapterMoves.chemistry.ru,
    teacherMovesKk: adapterMoves.chemistry.kk,
  });
}

const physicsSubject = labCatalog.find((subject) => subject.key === 'physics');

if (physicsSubject) {
  Object.assign(physicsSubject, {
    miniTaskTemplates: physicsTasks,
    teacherMovesRu: adapterMoves.physics.ru,
    teacherMovesKk: adapterMoves.physics.kk,
  });
}

export const labFamilyLabels = {
  stem: text('STEM', 'STEM'),
  languages: text('Языки', 'Тілдер'),
  social: text('Общество', 'Қоғам'),
  science: text('Естественные науки', 'Жаратылыстану'),
  arts: text('Искусство и технология', 'Өнер және технология'),
  wellness: text('Здоровье и спорт', 'Денсаулық және спорт'),
  civic: text('Гражданские навыки', 'Азаматтық дағдылар'),
};

export const labGradeLabels = {
  '1-4': text('1-4 классы', '1-4 сыныптар'),
  '5-9': text('5-9 классы', '5-9 сыныптар'),
  '10-11': text('10-11 классы', '10-11 сыныптар'),
};

export function getLocalizedText(value, language) {
  if (!value) {
    return '';
  }
  return typeof value === 'string' ? value : (language === 'kk' ? value.kk : value.ru);
}

export function getSubjectTitle(subject, language) {
  return language === 'kk' ? subject.titleKk : subject.titleRu;
}

export function getLabSubjectByKey(subjectKey) {
  return labCatalog.find((subject) => subject.key === subjectKey) || null;
}
