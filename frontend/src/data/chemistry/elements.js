import periodicTableData from 'periodic-table-data/periodicTableData.json';
import { ChemElementData } from '@chemistry/elements';

const coreShells = {
  He: [2],
  Ne: [2, 8],
  Ar: [2, 8, 8],
  Kr: [2, 8, 18, 8],
  Xe: [2, 8, 18, 18, 8],
  Rn: [2, 8, 18, 32, 18, 8],
};

const categoryLabels = {
  'alkali-metal': { ru: 'Щелочной металл', kk: 'Сілтілік металл' },
  'alkaline-earth-metal': { ru: 'Щелочноземельный металл', kk: 'Сілтілік-жер металы' },
  metalloid: { ru: 'Металлоид', kk: 'Жартылай металл' },
  'post-transition-metal': { ru: 'Постпереходный металл', kk: 'Ауыр металл' },
  'transition-metal': { ru: 'Переходный металл', kk: 'Өтпелі металл' },
  lanthanide: { ru: 'Лантаноид', kk: 'Лантаноид' },
  actinide: { ru: 'Актиноид', kk: 'Актиноид' },
  nonmetal: { ru: 'Неметалл', kk: 'Бейметалл' },
  halogen: { ru: 'Галоген', kk: 'Галоген' },
  'noble-gas': { ru: 'Благородный газ', kk: 'Инертті газ' },
  unknown: { ru: 'Элемент', kk: 'Элемент' },
};

const categoryByGroupBlock = {
  'Alkali metal': 'alkali-metal',
  'Alkaline earth metal': 'alkaline-earth-metal',
  Metalloid: 'metalloid',
  'Post-transition metal': 'post-transition-metal',
  'Transition metal': 'transition-metal',
  Lanthanide: 'lanthanide',
  Actinide: 'actinide',
  Nonmetal: 'nonmetal',
  Halogen: 'halogen',
  'Noble gas': 'noble-gas',
};

const localizedNames = {
  H: { ru: 'Водород', kk: 'Сутек' },
  He: { ru: 'Гелий', kk: 'Гелий' },
  Li: { ru: 'Литий', kk: 'Литий' },
  Be: { ru: 'Бериллий', kk: 'Бериллий' },
  B: { ru: 'Бор', kk: 'Бор' },
  C: { ru: 'Углерод', kk: 'Көміртек' },
  N: { ru: 'Азот', kk: 'Азот' },
  O: { ru: 'Кислород', kk: 'Оттек' },
  F: { ru: 'Фтор', kk: 'Фтор' },
  Ne: { ru: 'Неон', kk: 'Неон' },
  Na: { ru: 'Натрий', kk: 'Натрий' },
  Mg: { ru: 'Магний', kk: 'Магний' },
  Al: { ru: 'Алюминий', kk: 'Алюминий' },
  Si: { ru: 'Кремний', kk: 'Кремний' },
  P: { ru: 'Фосфор', kk: 'Фосфор' },
  S: { ru: 'Сера', kk: 'Күкірт' },
  Cl: { ru: 'Хлор', kk: 'Хлор' },
  Ar: { ru: 'Аргон', kk: 'Аргон' },
  K: { ru: 'Калий', kk: 'Калий' },
  Ca: { ru: 'Кальций', kk: 'Кальций' },
  Fe: { ru: 'Железо', kk: 'Темір' },
  Co: { ru: 'Кобальт', kk: 'Кобальт' },
  Ni: { ru: 'Никель', kk: 'Никель' },
  Cu: { ru: 'Медь', kk: 'Мыс' },
  Zn: { ru: 'Цинк', kk: 'Мырыш' },
  Br: { ru: 'Бром', kk: 'Бром' },
  Ag: { ru: 'Серебро', kk: 'Күміс' },
  I: { ru: 'Йод', kk: 'Йод' },
  Ba: { ru: 'Барий', kk: 'Барий' },
  Pt: { ru: 'Платина', kk: 'Платина' },
  Au: { ru: 'Золото', kk: 'Алтын' },
  Hg: { ru: 'Ртуть', kk: 'Сынап' },
  Pb: { ru: 'Свинец', kk: 'Қорғасын' },
  U: { ru: 'Уран', kk: 'Уран' },
};

const positionsBySymbol = new Map(
  ChemElementData.filter((entry) => entry.id > 0 && entry.symbol !== 'D').map((entry) => [entry.symbol, entry]),
);

function normalizePhase(standardState) {
  if (!standardState) {
    return 'unknown';
  }

  const normalized = standardState.toLowerCase();

  if (normalized.includes('gas')) {
    return 'gas';
  }

  if (normalized.includes('liquid')) {
    return 'liquid';
  }

  if (normalized.includes('solid')) {
    return 'solid';
  }

  return 'unknown';
}

function normalizeOxidationStates(value) {
  if (!value) {
    return [];
  }

  return String(value)
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);
}

function buildFallbackShells(atomicNumber) {
  const capacities = [2, 8, 18, 32, 32, 18, 8];
  let rest = atomicNumber;

  return capacities.reduce((shells, capacity) => {
    if (rest <= 0) {
      return shells;
    }

    const electrons = Math.min(capacity, rest);
    shells.push(electrons);
    rest -= electrons;
    return shells;
  }, []);
}

function parseElectronShells(electronConfiguration, atomicNumber) {
  if (!electronConfiguration) {
    return buildFallbackShells(atomicNumber);
  }

  const cleaned = electronConfiguration.replace(/\(.*?\)/g, '').trim();
  const tokens = cleaned.split(/\s+/).filter(Boolean);
  const shells = [];
  let index = 0;

  if (tokens[0]?.startsWith('[') && tokens[0]?.endsWith(']')) {
    const core = tokens[0].slice(1, -1);
    const coreValues = coreShells[core];
    if (coreValues) {
      coreValues.forEach((count, shellIndex) => {
        shells[shellIndex] = count;
      });
      index = 1;
    }
  }

  for (; index < tokens.length; index += 1) {
    const match = tokens[index].match(/^(\d)([spdfg])(\d+)$/);
    if (!match) {
      continue;
    }

    const shellIndex = Number(match[1]) - 1;
    const electrons = Number(match[3]);
    shells[shellIndex] = (shells[shellIndex] || 0) + electrons;
  }

  const normalized = shells.filter(Boolean);
  return normalized.length > 0 ? normalized : buildFallbackShells(atomicNumber);
}

function buildSummary(element, category) {
  const phaseLabels = {
    gas: { ru: 'газообразном состоянии', kk: 'газ күйінде' },
    liquid: { ru: 'жидком состоянии', kk: 'сұйық күйде' },
    solid: { ru: 'твёрдом состоянии', kk: 'қатты күйде' },
    unknown: { ru: 'особом состоянии', kk: 'арнайы күйде' },
  };

  const phase = phaseLabels[element.phase] || phaseLabels.unknown;

  return {
    ru: `${element.nameRu} относится к категории "${category.ru}" и обычно встречается в ${phase.ru}.`,
    kk: `${element.nameKk} "${category.kk}" санатына жатады және көбіне ${phase.kk} кездеседі.`,
  };
}

export const chemistryElements = periodicTableData.map((element) => {
  const position = positionsBySymbol.get(element.symbol);
  const categoryKey = categoryByGroupBlock[element.groupBlock] || 'unknown';
  const category = categoryLabels[categoryKey];
  const localized = localizedNames[element.symbol];

  const mappedElement = {
    atomicNumber: element.atomicNumber,
    symbol: element.symbol,
    nameEn: element.name,
    nameRu: localized?.ru || element.name,
    nameKk: localized?.kk || localized?.ru || element.name,
    group: position?.posY || null,
    period: position?.posX || null,
    category: categoryKey,
    categoryLabel: category,
    atomicMass: element.atomicMass,
    electronShells: parseElectronShells(element.electronConfiguration, element.atomicNumber),
    oxidationStates: normalizeOxidationStates(element.oxidationStates),
    phase: normalizePhase(element.standardState),
    summary: { ru: '', kk: '' },
    electronConfiguration: element.electronConfiguration,
    electronegativity: element.electronegativity,
    atomicRadius: element.atomicRadius,
    standardState: element.standardState,
    yearDiscovered: element.yearDiscovered,
    color: position?.color || `#${element.cPKHexColor || '94a3b8'}`,
    colorDark: position?.color2 || '#334155',
  };

  mappedElement.summary = buildSummary(mappedElement, category);
  return mappedElement;
});

export const chemistryElementsBySymbol = chemistryElements.reduce((accumulator, element) => {
  accumulator[element.symbol] = element;
  return accumulator;
}, {});

export const chemistryCategoryLabels = categoryLabels;
