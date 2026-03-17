import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

function cloneObjects(objects) {
  return objects.map((object) => ({
    ...object,
    position: { ...object.position },
    size: { ...object.size },
  }));
}

function pointInsideObject(cursor, object) {
  const padding = 0.03;
  return (
    cursor.x >= object.position.x - padding &&
    cursor.x <= object.position.x + object.size.w + padding &&
    cursor.y >= object.position.y - padding &&
    cursor.y <= object.position.y + object.size.h + padding
  );
}

function clampPosition(object, nextPosition) {
  return {
    x: Math.min(Math.max(nextPosition.x, 0), 1 - object.size.w),
    y: Math.min(Math.max(nextPosition.y, 0), 1 - object.size.h),
  };
}

function resolveSnap(object, objects, zones) {
  const center = {
    x: object.position.x + object.size.w / 2,
    y: object.position.y + object.size.h / 2,
  };

  const occupiedZoneIds = new Set(
    objects
      .filter((entry) => entry.id !== object.id && entry.snappedZoneId)
      .map((entry) => entry.snappedZoneId),
  );

  const availableZone = zones.find((zone) => {
    if (!zone.accepts.includes(object.kind) || occupiedZoneIds.has(zone.id)) {
      return false;
    }

    return (
      center.x >= zone.x &&
      center.x <= zone.x + zone.w &&
      center.y >= zone.y &&
      center.y <= zone.y + zone.h
    );
  });

  if (!availableZone) {
    return {
      ...object,
      snappedZoneId: '',
    };
  }

  return {
    ...object,
    position: {
      x: availableZone.x + availableZone.w / 2 - object.size.w / 2,
      y: availableZone.y + availableZone.h / 2 - object.size.h / 2,
    },
    snappedZoneId: availableZone.id,
  };
}

export function useInteractiveHandScene({ scene, hands }) {
  const [objects, setObjects] = useState(() => cloneObjects(scene.objects));
  const grabsRef = useRef({});

  useEffect(() => {
    const timerId = window.setTimeout(() => {
      grabsRef.current = {};
      setObjects(cloneObjects(scene.objects));
    }, 0);

    return () => window.clearTimeout(timerId);
  }, [scene]);

  useEffect(() => {
    setObjects((previousObjects) => {
      let didChange = false;
      let nextObjects = previousObjects;
      const activeHands = new Map(hands.map((hand) => [hand.id, hand]));
      const nextGrabs = { ...grabsRef.current };

      Object.entries(grabsRef.current).forEach(([handId, grabState]) => {
        const hand = activeHands.get(handId);
        if (!hand || hand.pinchState !== 'pinching') {
          if (!didChange) {
            nextObjects = previousObjects.map((object) => ({ ...object, position: { ...object.position } }));
            didChange = true;
          }

          const objectIndex = nextObjects.findIndex((object) => object.id === grabState.objectId);
          if (objectIndex >= 0) {
            nextObjects[objectIndex] = resolveSnap(
              nextObjects[objectIndex],
              nextObjects,
              scene.snapZones,
            );
          }

          delete nextGrabs[handId];
        }
      });

      hands.forEach((hand) => {
        const activeGrab = nextGrabs[hand.id];

        if (activeGrab) {
          if (!didChange) {
            nextObjects = previousObjects.map((object) => ({ ...object, position: { ...object.position } }));
            didChange = true;
          }

          const objectIndex = nextObjects.findIndex((object) => object.id === activeGrab.objectId);
          if (objectIndex >= 0) {
            const object = nextObjects[objectIndex];
            nextObjects[objectIndex] = {
              ...object,
              snappedZoneId: '',
              position: clampPosition(object, {
                x: hand.cursor.x - activeGrab.offset.x,
                y: hand.cursor.y - activeGrab.offset.y,
              }),
            };
          }

          return;
        }

        if (hand.pinchState !== 'pinching') {
          return;
        }

        const occupiedObjectIds = new Set(Object.values(nextGrabs).map((grab) => grab.objectId));
        const candidate = [...nextObjects]
          .reverse()
          .find((object) => !occupiedObjectIds.has(object.id) && pointInsideObject(hand.cursor, object));

        if (!candidate) {
          return;
        }

        nextGrabs[hand.id] = {
          objectId: candidate.id,
          offset: {
            x: hand.cursor.x - candidate.position.x,
            y: hand.cursor.y - candidate.position.y,
          },
        };
      });

      grabsRef.current = nextGrabs;
      return didChange ? nextObjects : previousObjects;
    });
  }, [hands, scene.snapZones]);

  const isComplete = useMemo(() => {
    if (typeof scene.isComplete === 'function') {
      return scene.isComplete(objects);
    }

    return scene.snapZones.every((zone) => objects.some((object) => object.snappedZoneId === zone.id));
  }, [objects, scene]);

  const resetScene = useCallback(() => {
    grabsRef.current = {};
    setObjects(cloneObjects(scene.objects));
  }, [scene]);

  return {
    objects,
    isComplete,
    resetScene,
  };
}
