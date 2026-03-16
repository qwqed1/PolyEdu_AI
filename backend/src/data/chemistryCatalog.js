export const chemistryCommonCompounds = [
  {
    key: 'H2O',
    pubchemQuery: 'water',
    aliases: ['h2o', 'water', 'вода', 'су', 'oxidane'],
    label: { ru: 'Вода', kk: 'Су' },
  },
  {
    key: 'CO2',
    pubchemQuery: 'carbon dioxide',
    aliases: ['co2', 'carbon dioxide', 'углекислый газ', 'көмірқышқыл газы'],
    label: { ru: 'Углекислый газ', kk: 'Көмірқышқыл газы' },
  },
  {
    key: 'NaCl',
    pubchemQuery: 'sodium chloride',
    aliases: ['nacl', 'sodium chloride', 'salt', 'поваренная соль', 'хлорид натрия', 'ас тұзы'],
    label: { ru: 'Хлорид натрия', kk: 'Натрий хлориді' },
  },
  {
    key: 'CH4',
    pubchemQuery: 'methane',
    aliases: ['ch4', 'methane', 'метан'],
    label: { ru: 'Метан', kk: 'Метан' },
  },
  {
    key: 'C6H12O6',
    pubchemQuery: 'glucose',
    aliases: ['c6h12o6', 'glucose', 'глюкоза'],
    label: { ru: 'Глюкоза', kk: 'Глюкоза' },
  },
  {
    key: 'Na',
    pubchemQuery: 'sodium',
    aliases: ['na', 'sodium', 'натрий'],
    label: { ru: 'Натрий', kk: 'Натрий' },
  },
  {
    key: 'Cl2',
    pubchemQuery: 'chlorine',
    aliases: ['cl2', 'chlorine', 'хлор'],
    label: { ru: 'Хлор', kk: 'Хлор' },
  },
  {
    key: 'HCl',
    pubchemQuery: 'hydrochloric acid',
    aliases: ['hcl', 'hydrochloric acid', 'соляная кислота', 'тұз қышқылы'],
    label: { ru: 'Соляная кислота', kk: 'Тұз қышқылы' },
  },
  {
    key: 'NaOH',
    pubchemQuery: 'sodium hydroxide',
    aliases: ['naoh', 'sodium hydroxide', 'гидроксид натрия', 'натрий гидроксиді'],
    label: { ru: 'Гидроксид натрия', kk: 'Натрий гидроксиді' },
  },
  {
    key: 'O2',
    pubchemQuery: 'oxygen',
    aliases: ['o2', 'oxygen', 'кислород', 'оттек'],
    label: { ru: 'Кислород', kk: 'Оттек' },
  },
  {
    key: 'Zn',
    pubchemQuery: 'zinc',
    aliases: ['zn', 'zinc', 'цинк', 'мырыш'],
    label: { ru: 'Цинк', kk: 'Мырыш' },
  },
  {
    key: 'H2',
    pubchemQuery: 'hydrogen',
    aliases: ['h2', 'hydrogen', 'водород', 'сутек'],
    label: { ru: 'Водород', kk: 'Сутек' },
  },
  {
    key: 'CaCO3',
    pubchemQuery: 'calcium carbonate',
    aliases: ['caco3', 'calcium carbonate', 'карбонат кальция', 'кальций карбонаты'],
    label: { ru: 'Карбонат кальция', kk: 'Кальций карбонаты' },
  },
  {
    key: 'CaO',
    pubchemQuery: 'calcium oxide',
    aliases: ['cao', 'calcium oxide', 'оксид кальция', 'кальций оксиді'],
    label: { ru: 'Оксид кальция', kk: 'Кальций оксиді' },
  },
  {
    key: 'ZnCl2',
    pubchemQuery: 'zinc chloride',
    aliases: ['zncl2', 'zinc chloride', 'хлорид цинка', 'мырыш хлориді'],
    label: { ru: 'Хлорид цинка', kk: 'Мырыш хлориді' },
  },
];

export const chemistryReactionCatalog = [
  {
    id: 'sodium-chlorine',
    left: 'Na',
    right: 'Cl2',
    equation: '2Na + Cl2 -> 2NaCl',
    products: ['NaCl'],
    productModelTarget: 'NaCl',
    conditions: {
      ru: 'Нагревание или инициирование реакции.',
      kk: 'Қыздыру немесе реакцияны бастау жеткілікті.',
    },
    reactionType: {
      ru: 'Реакция соединения',
      kk: 'Қосылу реакциясы',
    },
    observationRu: 'Натрий ярко реагирует, образуется белая соль.',
    observationKk: 'Натрий қарқынды әрекеттесіп, ақ түсті тұз түзіледі.',
    isReversible: false,
    safetyNote: {
      ru: 'Проводить только как демонстрацию: натрий и хлор опасны.',
      kk: 'Тек демонстрация ретінде көрсету керек: натрий мен хлор қауіпті.',
    },
  },
  {
    id: 'hcl-naoh',
    left: 'HCl',
    right: 'NaOH',
    equation: 'HCl + NaOH -> NaCl + H2O',
    products: ['NaCl', 'H2O'],
    productModelTarget: 'H2O',
    conditions: {
      ru: 'Растворы смешивают при комнатной температуре.',
      kk: 'Ерітінділерді бөлме температурасында араластырады.',
    },
    reactionType: {
      ru: 'Нейтрализация',
      kk: 'Бейтараптану',
    },
    observationRu: 'Кислота и щёлочь нейтрализуются, раствор слегка нагревается.',
    observationKk: 'Қышқыл мен сілті бейтараптанып, ерітінді сәл қызады.',
    isReversible: false,
    safetyNote: {
      ru: 'Использовать очки и перчатки при работе с кислотой и щёлочью.',
      kk: 'Қышқыл және сілтімен жұмыс істегенде қорғаныш көзілдірігі мен қолғап кию керек.',
    },
  },
  {
    id: 'methane-oxygen',
    left: 'CH4',
    right: 'O2',
    equation: 'CH4 + 2O2 -> CO2 + 2H2O',
    products: ['CO2', 'H2O'],
    productModelTarget: 'CO2',
    conditions: {
      ru: 'Требуется поджиг или высокая температура.',
      kk: 'Жану үшін тұтандыру немесе жоғары температура қажет.',
    },
    reactionType: {
      ru: 'Горение',
      kk: 'Жану',
    },
    observationRu: 'Метан горит голубым пламенем, выделяется тепло.',
    observationKk: 'Метан көгілдір жалынмен жанып, жылу бөледі.',
    isReversible: false,
    safetyNote: {
      ru: 'Работать только в контролируемых условиях и с хорошей вентиляцией.',
      kk: 'Тек бақылауда және жақсы желдетілетін жерде көрсету керек.',
    },
  },
  {
    id: 'zinc-hcl',
    left: 'Zn',
    right: 'HCl',
    equation: 'Zn + 2HCl -> ZnCl2 + H2',
    products: ['ZnCl2', 'H2'],
    productModelTarget: 'H2',
    conditions: {
      ru: 'Разбавленная кислота и цинк при обычной температуре.',
      kk: 'Сұйытылған қышқыл мен мырыш қалыпты температурада әрекеттеседі.',
    },
    reactionType: {
      ru: 'Замещение',
      kk: 'Орынбасу',
    },
    observationRu: 'Выделяются пузырьки водорода, цинк постепенно растворяется.',
    observationKk: 'Сутек көпіршіктері бөлініп, мырыш біртіндеп ериді.',
    isReversible: false,
    safetyNote: {
      ru: 'Не подносить открытое пламя к выделяющемуся водороду.',
      kk: 'Бөлінген сутекке ашық от жақындатуға болмайды.',
    },
  },
  {
    id: 'sodium-water',
    left: 'Na',
    right: 'H2O',
    equation: '2Na + 2H2O -> 2NaOH + H2',
    products: ['NaOH', 'H2'],
    productModelTarget: 'H2',
    conditions: {
      ru: 'Реакция проходит сразу после контакта натрия с водой.',
      kk: 'Натрий суға түскен сәттен бастап реакция жүреді.',
    },
    reactionType: {
      ru: 'Замещение',
      kk: 'Орынбасу',
    },
    observationRu: 'Натрий движется по воде, выделяется газ и тепло.',
    observationKk: 'Натрий су бетінде қозғалып, газ және жылу бөледі.',
    isReversible: false,
    safetyNote: {
      ru: 'Показывать только учителю: реакция очень бурная.',
      kk: 'Тек мұғалім көрсетуі керек: реакция өте қарқынды.',
    },
  },
  {
    id: 'calcium-carbonate-heat',
    left: 'CaCO3',
    right: '',
    equation: 'CaCO3 -> CaO + CO2',
    products: ['CaO', 'CO2'],
    productModelTarget: 'CO2',
    conditions: {
      ru: 'Сильный нагрев.',
      kk: 'Қатты қыздыру қажет.',
    },
    reactionType: {
      ru: 'Разложение',
      kk: 'Айырылу',
    },
    observationRu: 'Известняк разлагается, образуются оксид кальция и углекислый газ.',
    observationKk: 'Әктас айырылып, кальций оксиді мен көмірқышқыл газы түзіледі.',
    isReversible: false,
    safetyNote: {
      ru: 'Нужно учитывать высокую температуру и отвод газа.',
      kk: 'Жоғары температураны және бөлінетін газды ескеру керек.',
    },
  },
];

const aliases = chemistryCommonCompounds.reduce((accumulator, compound) => {
  compound.aliases.forEach((alias) => {
    accumulator[alias.trim().toLowerCase()] = compound;
  });
  accumulator[compound.key.toLowerCase()] = compound;
  return accumulator;
}, {});

export function findCompoundByAlias(query) {
  return aliases[String(query || '').trim().toLowerCase()] || null;
}

export function getCompoundLabel(key) {
  return chemistryCommonCompounds.find((compound) => compound.key === key)?.label || {
    ru: key,
    kk: key,
  };
}
