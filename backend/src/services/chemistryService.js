import { chemistryReactionCatalog, findCompoundByAlias, getCompoundLabel } from '../data/chemistryCatalog.js';

const PUBCHEM_BASE_URL = 'https://pubchem.ncbi.nlm.nih.gov/rest/pug';

const compoundCache = new Map();
const cidCache = new Map();
const modelCache = new Map();

function createError(message, status = 500) {
  const error = new Error(message);
  error.status = status;
  return error;
}

function normalizeQuery(value) {
  return String(value || '').trim().toLowerCase();
}

function encodeValue(value) {
  return encodeURIComponent(String(value || '').trim());
}

function buildFormulaAtomsSummary(formula) {
  if (!formula) {
    return [];
  }

  return [...String(formula).matchAll(/([A-Z][a-z]?)(\d*)/g)].map((match) => ({
    symbol: match[1],
    count: Number(match[2] || 1),
    label: getCompoundLabel(match[1]),
  }));
}

async function fetchJson(url) {
  const response = await fetch(url, {
    headers: {
      Accept: 'application/json',
      'User-Agent': 'AIZERT-Chemistry-Lab/1.0',
    },
  });

  if (!response.ok) {
    return null;
  }

  return response.json();
}

async function fetchText(url) {
  const response = await fetch(url, {
    headers: {
      Accept: 'text/plain',
      'User-Agent': 'AIZERT-Chemistry-Lab/1.0',
    },
  });

  if (!response.ok) {
    return null;
  }

  return response.text();
}

function resolvePubChemQuery(query) {
  const alias = findCompoundByAlias(query);
  return alias?.pubchemQuery || String(query || '').trim();
}

async function resolveCid(query) {
  const normalized = normalizeQuery(query);

  if (cidCache.has(normalized)) {
    return cidCache.get(normalized);
  }

  const resolvedQuery = resolvePubChemQuery(query);
  const looksLikeFormula = /^[A-Za-z0-9()+\-]+$/.test(resolvedQuery);
  const endpoints = [
    `${PUBCHEM_BASE_URL}/compound/name/${encodeValue(resolvedQuery)}/cids/JSON`,
    looksLikeFormula ? `${PUBCHEM_BASE_URL}/compound/fastformula/${encodeValue(resolvedQuery)}/cids/JSON` : null,
    `${PUBCHEM_BASE_URL}/compound/synonym/${encodeValue(resolvedQuery)}/cids/JSON`,
  ].filter(Boolean);

  for (const endpoint of endpoints) {
    const result = await fetchJson(endpoint);
    const cid = result?.IdentifierList?.CID?.[0];

    if (cid) {
      cidCache.set(normalized, cid);
      return cid;
    }
  }

  throw createError('Вещество не найдено в каталоге PubChem', 404);
}

async function getCompoundProperties(cid) {
  const response = await fetchJson(
    `${PUBCHEM_BASE_URL}/compound/cid/${cid}/property/Title,MolecularFormula,MolecularWeight,CanonicalSMILES,ConnectivitySMILES,IUPACName/JSON`,
  );

  const property = response?.PropertyTable?.Properties?.[0];

  if (!property) {
    throw createError('Не удалось получить свойства вещества', 502);
  }

  return property;
}

async function getCompoundSynonyms(cid) {
  const response = await fetchJson(`${PUBCHEM_BASE_URL}/compound/cid/${cid}/synonyms/JSON`);
  return response?.InformationList?.Information?.[0]?.Synonym || [];
}

async function getCompoundModel(cid) {
  const cacheKey = String(cid);

  if (modelCache.has(cacheKey)) {
    return modelCache.get(cacheKey);
  }

  const modelText = await fetchText(`${PUBCHEM_BASE_URL}/compound/cid/${cid}/SDF?record_type=3d`);

  if (!modelText) {
    modelCache.set(cacheKey, null);
    return null;
  }

  const payload = {
    format: 'sdf',
    text: modelText,
  };

  modelCache.set(cacheKey, payload);
  return payload;
}

function normalizeCompoundResponse(query, cid, property, synonyms, model) {
  return {
    id: String(cid),
    query,
    name: property.Title || property.IUPACName || query,
    formula: property.MolecularFormula || '',
    synonyms: synonyms.slice(0, 12),
    source: 'PubChem',
    has3dModel: Boolean(model?.text),
    modelFormat: model?.format || null,
    modelDataUrl: model?.text ? `/api/chemistry/compound/${cid}/model` : null,
    atomsSummary: buildFormulaAtomsSummary(property.MolecularFormula),
    properties: {
      molecularWeight: property.MolecularWeight,
      iupacName: property.IUPACName || property.Title || null,
      connectivitySmiles: property.ConnectivitySMILES || property.CanonicalSMILES || null,
    },
  };
}

function matchesReaction(entry, left, right) {
  const normalizedLeft = findCompoundByAlias(left)?.key || String(left || '').trim();
  const normalizedRight = findCompoundByAlias(right)?.key || String(right || '').trim();

  if (!entry.right) {
    return normalizedLeft === entry.left && !normalizedRight;
  }

  return (
    (normalizedLeft === entry.left && normalizedRight === entry.right) ||
    (normalizedLeft === entry.right && normalizedRight === entry.left)
  );
}

class ChemistryService {
  async getCompound(query) {
    const normalized = normalizeQuery(query);

    if (!normalized) {
      throw createError('Нужно указать название или формулу вещества', 400);
    }

    if (compoundCache.has(normalized)) {
      return compoundCache.get(normalized);
    }

    const cid = await resolveCid(query);
    const property = await getCompoundProperties(cid);
    const synonyms = await getCompoundSynonyms(cid);
    const model = await getCompoundModel(cid);
    const payload = normalizeCompoundResponse(query, cid, property, synonyms, model);

    compoundCache.set(normalized, payload);
    compoundCache.set(String(cid), payload);

    return payload;
  }

  async getCompoundModel(id) {
    if (!id) {
      throw createError('Не указан идентификатор вещества', 400);
    }

    const model = await getCompoundModel(id);

    if (!model?.text) {
      throw createError('Для вещества не найден 3D-конформер', 404);
    }

    return model;
  }

  async getReaction(left, right) {
    const normalizedLeft = String(left || '').trim();
    const normalizedRight = String(right || '').trim();

    if (!normalizedLeft) {
      throw createError('Нужно выбрать хотя бы одно вещество', 400);
    }

    const reaction = chemistryReactionCatalog.find((entry) => matchesReaction(entry, normalizedLeft, normalizedRight));

    if (!reaction) {
      return {
        found: false,
        reactants: [normalizedLeft, normalizedRight].filter(Boolean),
        equation: null,
        products: [],
        reactionType: null,
        conditions: null,
        observations: null,
        productModelTarget: null,
      };
    }

    return {
      found: true,
      equation: reaction.equation,
      reactants: [reaction.left, reaction.right]
        .filter(Boolean)
        .map((key) => ({ key, label: getCompoundLabel(key) })),
      products: reaction.products.map((key) => ({ key, label: getCompoundLabel(key) })),
      reactionType: reaction.reactionType,
      conditions: reaction.conditions,
      observations: {
        ru: reaction.observationRu,
        kk: reaction.observationKk,
      },
      productModelTarget: reaction.productModelTarget,
      isReversible: reaction.isReversible,
      safetyNote: reaction.safetyNote,
    };
  }
}

export default new ChemistryService();
