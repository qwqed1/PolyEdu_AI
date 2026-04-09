const CP1251_DECODER = typeof TextDecoder !== 'undefined'
  ? new TextDecoder('windows-1251')
  : null;

const UTF8_DECODER = typeof TextDecoder !== 'undefined'
  ? new TextDecoder('utf-8', { fatal: false })
  : null;

const CP1251_CHAR_TO_BYTE = (() => {
  if (!CP1251_DECODER) {
    return new Map();
  }

  const bytes = Uint8Array.from({ length: 128 }, (_, index) => index + 0x80);
  const chars = CP1251_DECODER.decode(bytes);
  const map = new Map();

  for (let index = 0; index < chars.length; index += 1) {
    map.set(chars[index], index + 0x80);
  }

  return map;
})();

const SUSPICIOUS_CHAR_RE = /[ЂЃ„…†‡€‰Љ‹ЊЌЋЏђ‘’“”•–—™љ›њќћџЎўЈ¤Ґ¦§Ё©Є«¬®Ї°±Ііґµ¶·ё№є»јЅѕїÐÑÒÓ]/g;
const SUSPICIOUS_PAIR_RE = /(?:Р.|С.|Т.|Ð.|Ñ.|Ò.|Ó.)/g;
const READABLE_CHAR_RE = /[A-Za-zА-Яа-яЁёӘәҒғҚқҢңӨөҰұҮүҺһІі0-9]/g;

function scoreText(value) {
  const suspiciousChars = (value.match(SUSPICIOUS_CHAR_RE) || []).length;
  const suspiciousPairs = (value.match(SUSPICIOUS_PAIR_RE) || []).length;
  const readableChars = (value.match(READABLE_CHAR_RE) || []).length;
  const replacementChars = (value.match(/\uFFFD/g) || []).length;

  return readableChars - suspiciousChars * 3 - suspiciousPairs * 2 - replacementChars * 5;
}

function encodeWindows1251(value) {
  const bytes = [];

  for (const char of value) {
    const codePoint = char.charCodeAt(0);

    if (codePoint <= 0x7f) {
      bytes.push(codePoint);
      continue;
    }

    const mappedByte = CP1251_CHAR_TO_BYTE.get(char);

    if (mappedByte == null) {
      return null;
    }

    bytes.push(mappedByte);
  }

  return Uint8Array.from(bytes);
}

export function repairMojibake(value) {
  if (!value || typeof value !== 'string' || !CP1251_DECODER || !UTF8_DECODER) {
    return value;
  }

  let current = value;

  for (let pass = 0; pass < 2; pass += 1) {
    const bytes = encodeWindows1251(current);

    if (!bytes) {
      break;
    }

    const candidate = UTF8_DECODER.decode(bytes);

    if (scoreText(candidate) <= scoreText(current)) {
      break;
    }

    current = candidate;
  }

  return current;
}

export function repairMojibakeDeep(value) {
  if (typeof value === 'string') {
    return repairMojibake(value);
  }

  if (typeof value === 'function') {
    return (...args) => repairMojibakeDeep(value(...args));
  }

  if (Array.isArray(value)) {
    return value.map((entry) => repairMojibakeDeep(entry));
  }

  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, entry]) => [key, repairMojibakeDeep(entry)]),
    );
  }

  return value;
}
