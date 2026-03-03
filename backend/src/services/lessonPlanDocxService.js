import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TEMPLATE_PATH = path.resolve(__dirname, '../../../План урока П3А.docx');

const COL_WIDTHS = {
  number: 596,
  label: 2835,
  content: 2552,
  extra: 3685,
};

const TABLE_WIDTH = COL_WIDTHS.number + COL_WIDTHS.label + COL_WIDTHS.content + COL_WIDTHS.extra;
const MERGED_CONTENT_WIDTH = COL_WIDTHS.content + COL_WIDTHS.extra;

const SCHOOL_TITLE = '«Almaty Polytechnic College» КМҚК';
const STAGES = [
  { number: 1, title: 'Ұйымдастыру кезеңі (5 мин.):', key: 'stage_organization' },
  { number: 2, title: 'Білімді өзектендіру (15 мин.):', key: 'stage_knowledge' },
  { number: 3, title: 'Жаңа білім мен дағдыларды/кәсіби дағдыларды қалыптастыру (40 мин.):', key: 'stage_new_skills' },
  { number: 4, title: 'Өтілген тақырыпты бекіту (15 мин.):', key: 'stage_consolidation' },
  { number: 5, title: 'Бағалау (5 мин.):', key: 'stage_assessment' },
  { number: 6, title: 'Үй тапсырмасы (3 мин.):', key: 'stage_homework' },
  { number: 7, title: 'Рефлексия (7 мин.):', key: 'stage_reflection' },
];

let templatePromise;

function escapeXml(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function sanitizeFilenamePart(value = '') {
  return String(value)
    .replace(/[<>:"/\\|?*\u0000-\u001F]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function formatDate(value) {
  if (!value) return '';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}.${month}.${year}`;
}

function normalizeText(value = '') {
  return String(value ?? '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>\s*<p[^>]*>/gi, '\n')
    .replace(/<\/?(div|p|span|strong|b|em|i|ul|ol|li|table|tbody|tr|td)[^>]*>/gi, '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/\r\n?/g, '\n')
    .trim();
}

function toLines(value, fallback = []) {
  const normalized = normalizeText(value);
  if (!normalized) {
    return fallback;
  }

  return normalized
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => line.replace(/^[-*•–]\s*/, '• '));
}

function buildRun(text, options = {}) {
  const {
    bold = false,
    italic = false,
    underline = false,
    size = 24,
  } = options;

  if (!text) {
    return '';
  }

  const xmlSpace = /\s/.test(text[0]) || /\s/.test(text[text.length - 1]) || /\s{2,}/.test(text)
    ? ' xml:space="preserve"'
    : '';

  return [
    '<w:r>',
    '<w:rPr>',
    '<w:rFonts w:ascii="Times New Roman" w:eastAsia="Times New Roman" w:hAnsi="Times New Roman" w:cs="Times New Roman"/>',
    bold ? '<w:b/>' : '',
    italic ? '<w:i/>' : '',
    underline ? '<w:u w:val="single"/>' : '',
    `<w:sz w:val="${size}"/>`,
    `<w:szCs w:val="${size}"/>`,
    '</w:rPr>',
    `<w:t${xmlSpace}>${escapeXml(text)}</w:t>`,
    '</w:r>',
  ].join('');
}

function buildParagraph(text = '', options = {}) {
  const {
    align = 'left',
    bold = false,
    italic = false,
    underline = false,
    size = 24,
    spacingBefore = 0,
    spacingAfter = 0,
  } = options;

  const runs = Array.isArray(text)
    ? text
    : [buildRun(text, { bold, italic, underline, size })];

  return [
    '<w:p>',
    '<w:pPr>',
    `<w:spacing w:before="${spacingBefore}" w:after="${spacingAfter}"/>`,
    align !== 'left' ? `<w:jc w:val="${align}"/>` : '',
    '<w:rPr>',
    '<w:rFonts w:ascii="Times New Roman" w:eastAsia="Times New Roman" w:hAnsi="Times New Roman" w:cs="Times New Roman"/>',
    bold ? '<w:b/>' : '',
    italic ? '<w:i/>' : '',
    underline ? '<w:u w:val="single"/>' : '',
    `<w:sz w:val="${size}"/>`,
    `<w:szCs w:val="${size}"/>`,
    '</w:rPr>',
    '</w:pPr>',
    runs.join('') || buildRun('', { size }),
    '</w:p>',
  ].join('');
}

function buildParagraphs(lines, options = {}) {
  if (!lines.length) {
    return buildParagraph('', options);
  }

  return lines.map((line) => buildParagraph(line, options)).join('');
}

function buildCell(contentXml, options = {}) {
  const {
    width,
    gridSpan,
    vMerge,
    verticalAlign = 'top',
  } = options;

  const mergeXml = vMerge
    ? vMerge === 'restart'
      ? '<w:vMerge w:val="restart"/>'
      : '<w:vMerge/>'
    : '';

  return [
    '<w:tc>',
    '<w:tcPr>',
    `<w:tcW w:w="${width}" w:type="dxa"/>`,
    gridSpan ? `<w:gridSpan w:val="${gridSpan}"/>` : '',
    mergeXml,
    `<w:vAlign w:val="${verticalAlign}"/>`,
    '<w:tcBorders>',
    '<w:top w:val="single" w:sz="4" w:space="0" w:color="000000"/>',
    '<w:left w:val="single" w:sz="4" w:space="0" w:color="000000"/>',
    '<w:bottom w:val="single" w:sz="4" w:space="0" w:color="000000"/>',
    '<w:right w:val="single" w:sz="4" w:space="0" w:color="000000"/>',
    '</w:tcBorders>',
    '</w:tcPr>',
    contentXml || buildParagraph(''),
    '</w:tc>',
  ].join('');
}

function buildRow(cells, height = 300) {
  return [
    '<w:tr>',
    '<w:trPr>',
    `<w:trHeight w:val="${height}"/>`,
    '</w:trPr>',
    cells.join(''),
    '</w:tr>',
  ].join('');
}

function buildNumberCell(number, options = {}) {
  return buildCell(
    buildParagraph(String(number), { bold: true, align: 'center' }),
    {
      width: COL_WIDTHS.number,
      vMerge: options.vMerge,
      verticalAlign: 'center',
    },
  );
}

function buildMergedNumberContinuation() {
  return buildCell(
    buildParagraph(''),
    {
      width: COL_WIDTHS.number,
      vMerge: 'continue',
      verticalAlign: 'center',
    },
  );
}

function buildLabelCell(label, options = {}) {
  return buildCell(
    buildParagraph(label, { bold: options.bold !== false }),
    {
      width: COL_WIDTHS.label,
      verticalAlign: options.verticalAlign || 'center',
    },
  );
}

function buildContentCell(lines, options = {}) {
  return buildCell(
    buildParagraphs(lines, { spacingAfter: 0 }),
    {
      width: options.width || MERGED_CONTENT_WIDTH,
      gridSpan: options.gridSpan,
      vMerge: options.vMerge,
      verticalAlign: options.verticalAlign || 'top',
    },
  );
}

function buildStageContent(stageTitle, stageValue) {
  const lines = toLines(stageValue);
  return [
    buildParagraph(stageTitle, { bold: true }),
    buildParagraphs(lines, { spacingAfter: 0 }),
  ].join('');
}

function buildTitleParagraph(planNumber) {
  return buildParagraph(
    [
      buildRun('Оқу сабағының жоспары', { bold: true, size: 24 }),
      buildRun(` № ${planNumber}`, { bold: true, size: 24 }),
    ],
    { align: 'center', spacingBefore: 225, spacingAfter: 135 },
  );
}

function buildHeaderBlock(plan, includeLogo, imageParagraphXml) {
  return [
    includeLogo ? imageParagraphXml : '',
    buildParagraph(SCHOOL_TITLE, { align: 'center', bold: true, size: 28 }),
    buildTitleParagraph(plan.lesson_number || 1),
    buildParagraph(''),
  ].join('');
}

function buildLessonTable(plan) {
  const moduleLines = [
    ...toLines(plan.subject_name),
    ...toLines(plan.module_code),
  ];

  const resourcesMethodLines = toLines(plan.resources_methods);
  const resourcesTechnicalLines = toLines(plan.resources_technical);

  const rows = [
    buildRow([
      buildNumberCell(1),
      buildLabelCell('Модуль/Пән атауы'),
      buildContentCell(moduleLines, { gridSpan: 2 }),
    ]),
    buildRow([
      buildNumberCell(2),
      buildLabelCell('Бөлім/Сабақ тақырыбы'),
      buildContentCell(toLines(plan.topic), { gridSpan: 2 }),
    ]),
    buildRow([
      buildNumberCell(3),
      buildLabelCell('Дайындаған педагог'),
      buildContentCell(toLines(plan.teacher_name), { gridSpan: 2 }),
    ]),
    buildRow([
      buildNumberCell(4),
      buildLabelCell('Өтілген күні'),
      buildContentCell(toLines(formatDate(plan.lesson_date)), { gridSpan: 2 }),
    ]),
    buildRow([
      buildNumberCell(5),
      buildLabelCell('Жалпы мәліметтер'),
      buildCell(
        buildParagraph(`Курс ${plan.course || ''}`.trim()),
        { width: COL_WIDTHS.content, verticalAlign: 'center' },
      ),
      buildCell(
        buildParagraph(plan.group_name ? `Топ ${plan.group_name}` : ''),
        { width: COL_WIDTHS.extra, verticalAlign: 'center' },
      ),
    ]),
    buildRow([
      buildNumberCell(6),
      buildLabelCell('Сабақтың түрі'),
      buildContentCell(toLines(plan.lesson_type), { gridSpan: 2 }),
    ]),
    buildRow([
      buildNumberCell(7, { vMerge: 'restart' }),
      buildLabelCell('Мақсаты'),
      buildContentCell(toLines(plan.goals), { gridSpan: 2 }),
    ]),
    buildRow([
      buildMergedNumberContinuation(),
      buildLabelCell('Міндеттері'),
      buildContentCell(toLines(plan.objectives), { gridSpan: 2 }),
    ]),
    buildRow([
      buildNumberCell(8),
      buildLabelCell('Күтілетін нәтижелер'),
      buildContentCell(toLines(plan.expected_results), { gridSpan: 2 }),
    ]),
    buildRow([
      buildNumberCell(9, { vMerge: 'restart' }),
      buildLabelCell('Қажетті ресурстар'),
      buildContentCell(resourcesMethodLines, { gridSpan: 2, vMerge: 'restart' }),
    ]),
    buildRow([
      buildMergedNumberContinuation(),
      buildLabelCell('Оқу-әдістемелік құралдар, анықтамалық әдебиеттер:', { bold: false }),
      buildContentCell([], { gridSpan: 2, vMerge: 'continue' }),
    ]),
    buildRow([
      buildMergedNumberContinuation(),
      buildLabelCell('Техникалық құралдар-жабдықтар:', { bold: false }),
      buildContentCell(resourcesTechnicalLines, { gridSpan: 2 }),
    ]),
    buildRow([
      buildCell(
        buildParagraph('Сабақтың барысы', { bold: true, align: 'center' }),
        { width: TABLE_WIDTH, gridSpan: 4, verticalAlign: 'center' },
      ),
    ]),
    ...STAGES.map((stage) => buildRow([
      buildNumberCell(stage.number),
      buildCell(
        buildStageContent(stage.title, plan[stage.key]),
        { width: COL_WIDTHS.label + MERGED_CONTENT_WIDTH, gridSpan: 3 },
      ),
    ])),
  ];

  return [
    '<w:tbl>',
    '<w:tblPr>',
    '<w:tblStyle w:val="af"/>',
    `<w:tblW w:w="${TABLE_WIDTH}" w:type="dxa"/>`,
    '<w:tblInd w:w="-34" w:type="dxa"/>',
    '<w:tblBorders>',
    '<w:top w:val="single" w:sz="4" w:space="0" w:color="000000"/>',
    '<w:left w:val="single" w:sz="4" w:space="0" w:color="000000"/>',
    '<w:bottom w:val="single" w:sz="4" w:space="0" w:color="000000"/>',
    '<w:right w:val="single" w:sz="4" w:space="0" w:color="000000"/>',
    '<w:insideH w:val="single" w:sz="4" w:space="0" w:color="000000"/>',
    '<w:insideV w:val="single" w:sz="4" w:space="0" w:color="000000"/>',
    '</w:tblBorders>',
    '<w:tblLayout w:type="fixed"/>',
    '<w:tblLook w:val="0400" w:firstRow="0" w:lastRow="0" w:firstColumn="0" w:lastColumn="0" w:noHBand="0" w:noVBand="1"/>',
    '</w:tblPr>',
    '<w:tblGrid>',
    `<w:gridCol w:w="${COL_WIDTHS.number}"/>`,
    `<w:gridCol w:w="${COL_WIDTHS.label}"/>`,
    `<w:gridCol w:w="${COL_WIDTHS.content}"/>`,
    `<w:gridCol w:w="${COL_WIDTHS.extra}"/>`,
    '</w:tblGrid>',
    rows.join(''),
    '</w:tbl>',
  ].join('');
}

async function getTemplateCache() {
  if (!templatePromise) {
    templatePromise = (async () => {
      const { default: AdmZip } = await import('adm-zip');
      const buffer = await fs.readFile(TEMPLATE_PATH);
      const zip = new AdmZip(buffer);
      const documentXml = zip.getEntry('word/document.xml').getData().toString('utf8');
      const bodyStart = documentXml.indexOf('<w:body>') + '<w:body>'.length;
      const sectionStart = documentXml.lastIndexOf('<w:sectPr');
      const bodyXml = documentXml.slice(bodyStart, sectionStart);
      const imageParagraphMatch = bodyXml.match(/<w:p\b[\s\S]*?<\/w:p>/);

      return {
        AdmZip,
        buffer,
        prefix: documentXml.slice(0, bodyStart),
        suffix: documentXml.slice(sectionStart),
        imageParagraphXml: imageParagraphMatch?.[0] || '',
      };
    })();
  }

  return templatePromise;
}

function buildBody(planList, imageParagraphXml) {
  return planList
    .map((plan, index) => [
      index > 0 ? '<w:p><w:r><w:br w:type="page"/></w:r></w:p>' : '',
      buildHeaderBlock(plan, index === 0, imageParagraphXml),
      buildLessonTable(plan),
      buildParagraph(''),
    ].join(''))
    .join('');
}

function buildFilename(plans) {
  const firstPlan = plans[0] || {};
  const group = sanitizeFilenamePart(firstPlan.group_name) || 'group';

  if (plans.length === 1) {
    const plan = plans[0];
    return `lesson-plan-${group}-${plan.lesson_number || 1}.docx`;
  }

  return `lesson-plans-${group}.docx`;
}

async function generate(plans) {
  const normalizedPlans = [...plans]
    .filter(Boolean)
    .sort((left, right) => (left.lesson_number || 0) - (right.lesson_number || 0));

  if (!normalizedPlans.length) {
    throw new Error('Нет данных для экспорта');
  }

  const cache = await getTemplateCache();

  const zip = new cache.AdmZip(cache.buffer);
  const documentXml = `${cache.prefix}${buildBody(normalizedPlans, cache.imageParagraphXml)}${cache.suffix}`;

  zip.updateFile('word/document.xml', Buffer.from(documentXml, 'utf8'));

  return {
    buffer: zip.toBuffer(),
    filename: buildFilename(normalizedPlans),
  };
}

export const lessonPlanDocxService = {
  async generateForPlan(plan) {
    return generate([plan]);
  },

  async generateForPlans(plans) {
    return generate(plans);
  },
};
