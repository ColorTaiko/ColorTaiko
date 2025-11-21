import { rebuildPatternLog } from "./patternLog";

/**
 * Create initial history entry for a fresh board.
 */
export function makeInitialHistoryEntry() {
  return {
    connections: [],
    connectionPairs: [],
    connectionGroups: [],
    topRowCount: 1,
    bottomRowCount: 1,
    edgeState: null,
    groupMap: new Map(),
    topOrientationMap: new Map(),
    botOrientationMap: new Map(),
    currentColorIndex: 0,
  };
}

/**
 * Rebuild processed pair keys from a list of connection pairs.
 * Keys normalize nodes inside a pair, ensuring stable identity.
 */
export function rebuildProcessedPairKeys(connectionPairs, buildPairKey) {
  const processedKeys = new Set();
  (connectionPairs || []).forEach((pair) => {
    if (Array.isArray(pair) && pair.length === 2) {
      const key = buildPairKey(pair);
      if (key) processedKeys.add(key);
    }
  });
  return processedKeys;
}

/**
 * Rebuild the pattern log based on a snapshot's connection pairs and orientation maps.
 */
export function restorePatternLogFromSnapshot(patternLogRef, snapshot) {
  if (!patternLogRef?.current || !snapshot) return;
  rebuildPatternLog(
    patternLogRef.current,
    snapshot.connectionPairs,
    { current: new Map(snapshot.topOrientationMap) },
    { current: new Map(snapshot.botOrientationMap) }
  );
}

/**
 * Given a previous snapshot, ensure connection and pair colors are consistent with its groupMap.
 * - If the snapshot ends with an incomplete pair (single edge), ensure that single edge uses its seedColor.
 * - For full pairs, recolor according to their group color in snapshot.groupMap; if no group, use the pair's seed color.
 * Mutates the provided snapshot's arrays in-place.
 */
export function fixColorsAfterUndo(snapshot) {
  if (!snapshot) return;
  try {
    const gm = new Map(snapshot.groupMap || []);

    // 1) If last pair is a single edge, enforce its seed color
    const prevPairs = Array.isArray(snapshot.connectionPairs)
      ? snapshot.connectionPairs
      : [];
    const lastPrevPair = prevPairs[prevPairs.length - 1];
    if (lastPrevPair && lastPrevPair.length === 1) {
      const single = lastPrevPair[0];
      const fallbackSeed = single?.seedColor ?? single?.color;
      if (fallbackSeed) {
        single.color = fallbackSeed;
        const matchIdx = snapshot.connections.findIndex((conn) => {
          if (!Array.isArray(conn?.nodes) || !Array.isArray(single?.nodes)) return false;
          const a = [...conn.nodes].sort().join("|");
          const b = [...single.nodes].sort().join("|");
          return a === b;
        });
        if (matchIdx !== -1) {
          snapshot.connections[matchIdx].color = fallbackSeed;
        }
      }
    }

    // 2) Recolor all complete pairs based on snapshot's group map
    const recolorPair = (pair) => {
      if (!pair || pair.length !== 2) return;
      const [c1, c2] = pair;
      const [t1, b1] = c1.nodes || [];
      const [t2, b2] = c2.nodes || [];
      const topKey = [t1, t2].sort().join(',');
      const botKey = [b1, b2].sort().join(',');
      const group = gm.get(topKey) || gm.get(botKey) || null;
      const seed = c1.seedColor ?? c1.color ?? c2.seedColor ?? c2.color;
      const groupColor = group?.color ?? seed;
      c1.color = groupColor;
      c2.color = groupColor;
    };

    snapshot.connectionPairs.forEach((p) => recolorPair(p));

    const indexByNodes = new Map(
      snapshot.connections.map((conn, idx) => [
        (Array.isArray(conn.nodes) ? [...conn.nodes].sort().join('|') : `#${idx}`),
        idx,
      ])
    );
    snapshot.connectionPairs.forEach((pair) => {
      if (!pair || pair.length === 0) return;
      pair.forEach((conn) => {
        const key = (Array.isArray(conn.nodes) ? [...conn.nodes].sort().join('|') : null);
        if (key && indexByNodes.has(key)) {
          const i = indexByNodes.get(key);
          snapshot.connections[i].color = conn.color;
        }
      });
    });
  } catch (e) {
    console.warn('fixColorsAfterUndo failed (non-fatal):', e);
  }
}
