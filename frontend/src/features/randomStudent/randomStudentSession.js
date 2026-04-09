import {
  RANDOM_STUDENT_HIGHLIGHT_MS,
  RANDOM_STUDENT_SLOT_GRACE_MS,
  RANDOM_STUDENT_SLOT_MATCH_DISTANCE,
  RANDOM_STUDENT_SLOT_MAX_SIZE_DELTA,
  RANDOM_STUDENT_SLOT_STABLE_FRAMES,
} from './randomStudentConfig';

export const RANDOM_STUDENT_SLOT_STATUS = {
  available: 'available',
  selected: 'selected',
  missing: 'missing',
};

function createSessionSlot(id, labelNumber, now, overrides = {}) {
  return {
    id,
    labelNumber,
    status: RANDOM_STUDENT_SLOT_STATUS.available,
    bbox: null,
    centroid: null,
    lastSeenAt: now,
    seenFrames: 0,
    stable: false,
    isPlaceholder: false,
    ...overrides,
  };
}

function sortSlotsByLabel(slots) {
  return [...slots].sort((left, right) => left.labelNumber - right.labelNumber);
}

function calculateDistance(left, right) {
  return Math.hypot(left.x - right.x, left.y - right.y);
}

function calculateSizeDelta(slot, detection) {
  if (!slot?.bbox?.width || !slot?.bbox?.height || !detection?.bbox?.width || !detection?.bbox?.height) {
    return 0;
  }

  const slotArea = slot.bbox.width * slot.bbox.height;
  const detectionArea = detection.bbox.width * detection.bbox.height;
  return Math.abs(slotArea - detectionArea) / Math.max(slotArea, detectionArea, 0.0001);
}

function buildSlotMatches(slots, detections) {
  const candidates = [];

  slots.forEach((slot) => {
    if (slot.isPlaceholder || !slot.centroid) {
      return;
    }

    detections.forEach((detection, detectionIndex) => {
      const distance = calculateDistance(slot.centroid, detection.centroid);
      const sizeDelta = calculateSizeDelta(slot, detection);

      if (distance > RANDOM_STUDENT_SLOT_MATCH_DISTANCE || sizeDelta > RANDOM_STUDENT_SLOT_MAX_SIZE_DELTA) {
        return;
      }

      candidates.push({
        slotId: slot.id,
        detectionIndex,
        weight: distance + sizeDelta * 0.2,
      });
    });
  });

  candidates.sort((left, right) => left.weight - right.weight);

  const matches = new Map();
  const usedSlotIds = new Set();
  const usedDetections = new Set();

  candidates.forEach((candidate) => {
    if (usedSlotIds.has(candidate.slotId) || usedDetections.has(candidate.detectionIndex)) {
      return;
    }

    matches.set(candidate.slotId, candidate.detectionIndex);
    usedSlotIds.add(candidate.slotId);
    usedDetections.add(candidate.detectionIndex);
  });

  return { matches, usedDetections };
}

function reconcilePlaceholderSlots(session, now) {
  const manualCount = session.manualCountOverride;
  const realSlots = session.slots.filter((slot) => !slot.isPlaceholder);
  const placeholders = sortSlotsByLabel(session.slots.filter((slot) => slot.isPlaceholder));

  if (!manualCount || manualCount < 1) {
    return {
      ...session,
      slots: sortSlotsByLabel([
        ...realSlots,
        ...placeholders.filter((slot) => session.selectedSlotIds.includes(slot.id)),
      ]),
    };
  }

  const selectedPlaceholders = placeholders.filter((slot) => session.selectedSlotIds.includes(slot.id));
  const requiredPlaceholderCount = Math.max(0, manualCount - realSlots.length);
  const unselectedPlaceholders = placeholders.filter((slot) => !session.selectedSlotIds.includes(slot.id));

  const nextPlaceholders = [...selectedPlaceholders];

  unselectedPlaceholders
    .slice(0, Math.max(requiredPlaceholderCount - selectedPlaceholders.length, 0))
    .forEach((slot) => {
      nextPlaceholders.push(slot);
    });

  let nextSlotNumber = session.nextSlotNumber;
  while (realSlots.length + nextPlaceholders.length < manualCount) {
    nextPlaceholders.push(
      createSessionSlot(
        `slot-${nextSlotNumber}`,
        nextSlotNumber,
        now,
        {
          isPlaceholder: true,
          status: RANDOM_STUDENT_SLOT_STATUS.missing,
          lastSeenAt: 0,
        },
      ),
    );
    nextSlotNumber += 1;
  }

  return {
    ...session,
    nextSlotNumber,
    slots: sortSlotsByLabel([...realSlots, ...nextPlaceholders]),
  };
}

export function createRandomStudentSession() {
  return {
    slots: [],
    detectedCount: 0,
    manualCountOverride: null,
    selectedSlotIds: [],
    currentPickId: '',
    currentPickAt: 0,
    nextSlotNumber: 1,
  };
}

export function updateManualCountOverride(session, manualCountOverride, now = Date.now()) {
  return reconcilePlaceholderSlots(
    {
      ...session,
      manualCountOverride,
    },
    now,
  );
}

export function syncSlotsWithDetections(session, detections, now = Date.now()) {
  const { matches, usedDetections } = buildSlotMatches(session.slots, detections);
  const nextSlots = session.slots.map((slot) => {
    const detectionIndex = matches.get(slot.id);

    if (typeof detectionIndex === 'number') {
      const detection = detections[detectionIndex];
      return {
        ...slot,
        bbox: detection.bbox,
        centroid: detection.centroid,
        lastSeenAt: now,
        seenFrames: slot.seenFrames + 1,
        stable: slot.stable || slot.seenFrames + 1 >= RANDOM_STUDENT_SLOT_STABLE_FRAMES,
        isPlaceholder: false,
      };
    }

    return slot;
  });
  const slotsById = new Map(nextSlots.map((slot) => [slot.id, slot]));

  const placeholderTargets = sortSlotsByLabel(
    nextSlots.filter((slot) => slot.isPlaceholder && !matches.has(slot.id)),
  );

  let nextSlotNumber = session.nextSlotNumber;

  detections.forEach((detection, detectionIndex) => {
    if (usedDetections.has(detectionIndex)) {
      return;
    }

    const placeholderSlot = placeholderTargets.shift();
    if (placeholderSlot) {
      const nextSlot = {
        ...placeholderSlot,
        bbox: detection.bbox,
        centroid: detection.centroid,
        lastSeenAt: now,
        seenFrames: 1,
        stable: false,
        isPlaceholder: false,
      };
      slotsById.set(placeholderSlot.id, nextSlot);
      return;
    }

    const slot = createSessionSlot(
      `slot-${nextSlotNumber}`,
      nextSlotNumber,
      now,
      {
        bbox: detection.bbox,
        centroid: detection.centroid,
        seenFrames: 1,
      },
    );
    slotsById.set(slot.id, slot);
    nextSlotNumber += 1;
  });

  const visibleStableSlots = [];
  const normalizedSlots = sortSlotsByLabel([...slotsById.values()]).filter((slot) => {
    if (slot.isPlaceholder) {
      slot.status = session.selectedSlotIds.includes(slot.id)
        ? RANDOM_STUDENT_SLOT_STATUS.selected
        : RANDOM_STUDENT_SLOT_STATUS.missing;
      return true;
    }

    const withinGrace = now - slot.lastSeenAt <= RANDOM_STUDENT_SLOT_GRACE_MS;
    const isSelected = session.selectedSlotIds.includes(slot.id);

    if (!withinGrace && !isSelected) {
      return false;
    }

    if (withinGrace && slot.stable) {
      visibleStableSlots.push(slot);
    }

    slot.status = isSelected
      ? RANDOM_STUDENT_SLOT_STATUS.selected
      : withinGrace
        ? RANDOM_STUDENT_SLOT_STATUS.available
        : RANDOM_STUDENT_SLOT_STATUS.missing;

    return true;
  });

  return reconcilePlaceholderSlots(
    {
      ...session,
      slots: normalizedSlots,
      detectedCount: visibleStableSlots.length,
      nextSlotNumber,
    },
    now,
  );
}

function getSelectionPoolSlotsInternal(session, now = Date.now()) {
  const realSlots = sortSlotsByLabel(
    session.slots.filter(
      (slot) =>
        !slot.isPlaceholder &&
        slot.stable &&
        now - slot.lastSeenAt <= RANDOM_STUDENT_SLOT_GRACE_MS,
    ),
  );
  const placeholders = sortSlotsByLabel(session.slots.filter((slot) => slot.isPlaceholder));
  const effectiveCount = getEffectiveParticipantCount(session);

  return [...realSlots, ...placeholders].slice(0, effectiveCount);
}

export function getEffectiveParticipantCount(session) {
  return session.manualCountOverride || session.detectedCount;
}

export function getSelectionPoolSlots(session, now = Date.now()) {
  return getSelectionPoolSlotsInternal(session, now);
}

export function getAvailableSelectionSlots(session, now = Date.now()) {
  return getSelectionPoolSlotsInternal(session, now).filter(
    (slot) => !session.selectedSlotIds.includes(slot.id),
  );
}

export function getSelectedSlots(session) {
  const slotsById = new Map(session.slots.map((slot) => [slot.id, slot]));

  return session.selectedSlotIds
    .map((slotId) => slotsById.get(slotId))
    .filter(Boolean);
}

export function pickRandomStudentSlot(session, now = Date.now()) {
  const availableSlots = getAvailableSelectionSlots(session, now);
  if (!availableSlots.length) {
    return session;
  }

  const winner = availableSlots[Math.floor(Math.random() * availableSlots.length)];

  return {
    ...session,
    selectedSlotIds: [...session.selectedSlotIds, winner.id],
    currentPickId: winner.id,
    currentPickAt: now,
    slots: session.slots.map((slot) =>
      slot.id === winner.id
        ? { ...slot, status: RANDOM_STUDENT_SLOT_STATUS.selected }
        : slot,
    ),
  };
}

export function resetRandomStudentLesson(session) {
  return {
    ...session,
    selectedSlotIds: [],
    currentPickId: '',
    currentPickAt: 0,
    slots: session.slots.map((slot) => ({
      ...slot,
      status: slot.isPlaceholder
        ? RANDOM_STUDENT_SLOT_STATUS.missing
        : RANDOM_STUDENT_SLOT_STATUS.available,
    })),
  };
}

export function isPickHighlightActive(session, now = Date.now()) {
  return Boolean(session.currentPickId) && now - session.currentPickAt <= RANDOM_STUDENT_HIGHLIGHT_MS;
}
