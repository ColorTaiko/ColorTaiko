/**
 * No-Pattern check: verifies that no two horizontal trios (pt1-pt2-pt3) share the same
 * signature key: `${o1}|${c1}|${o2}|${c2}` where oX in {'in','out'} and cX is the edge color.
 *
 * Contract
 * - Input:
 *   - latestPair: [{ nodes: [topX,bottomY], color }, { nodes: [topZ,bottomW], color }]
 *                 The most recently completed vertical pair. Not strictly required for the
 *                 computation but provided to align with the unified check interface.
 *   - context: {
 *       connectionPairs: Array<[conn, conn] | [conn]>,
 *       topOrientation:  { current: Map<string, 'in'|'out'> },
 *       botOrientation:  { current: Map<string, 'in'|'out'> }
 *     }
 * - Output: { ok: boolean, message?: string }
 *
 * Notes
 * - This is a pure, side-effect free check. It does not mutate refs or touch the DOM.
 * - It re-derives the horizontal edge map from connectionPairs and the current orientations.
 */

import { NoPatternError } from "./errors";

/**
 * Build the horizontal edges adjacency map from connectionPairs and orientations.
 * Returns: Map<nodeId, [outMap: Map<nodeId,color>, inMap: Map<nodeId,color>]>
 */
function buildHorizontalEdges(connectionPairs, topOrientation, botOrientation) {
  const horiEdges = new Map();

  const record = (from, to, ori, color) => {
    if (!horiEdges.has(from)) horiEdges.set(from, [new Map(), new Map()]);
    const [outM, inM] = horiEdges.get(from);
    if (ori === 'out') {
      inM.delete(to);
      outM.set(to, color);
    } else {
      outM.delete(to);
      inM.set(to, color);
    }
  };

  (connectionPairs || []).forEach(pair => {
    if (!pair || pair.length !== 2) return;
    const [{ nodes: [t1, b1] }, { nodes: [t2, b2], color }] = pair;

    // Top row horizontal edge t1<->t2 with orientation from orientation maps
    const topKey = [t1, t2].sort().join(',');
    const topOri = (topOrientation?.current?.get(topKey)) || 'out';
    record(t1, t2, topOri, color);
    record(t2, t1, topOri === 'out' ? 'in' : 'out', color);

    // Bottom row horizontal edge b1<->b2
    const botKey = [b1, b2].sort().join(',');
    const botOri = (botOrientation?.current?.get(botKey)) || 'out';
    record(b1, b2, botOri, color);
    record(b2, b1, botOri === 'out' ? 'in' : 'out', color);
  });

  return horiEdges;
}

function getEdgeColor(horiEdges, a, b) {
  const entry = horiEdges.get(a);
  if (!entry) return null;
  const [outM, inM] = entry;
  return outM.get(b) || inM.get(b) || null;
}

/**
 * Build trio map and throw on conflict (duplicate key).
 * Mirrors the active logic in drawingUtils.buildTrioMap to ensure consistent behavior.
 */
function assertNoPattern(horiEdges, topOrientation, botOrientation) {
  const trioMap = new Map();

  const idsToIndex = id => +id.split('-')[1];

  horiEdges.forEach(([outMap, inMap], center) => {
    const row = center.split('-')[0];
    if (row !== 'top' && row !== 'bottom') return;

    const neighbors = Array.from(new Set([
      ...outMap.keys(),
      ...inMap.keys()
    ]))
      .filter(id => id.startsWith(row))
      .sort((A, B) => idsToIndex(A) - idsToIndex(B));

    neighbors.forEach((n1, i) => {
      neighbors.slice(i + 1).forEach(n2 => {
        const ic = idsToIndex(center), i1 = idsToIndex(n1), i2 = idsToIndex(n2);
        let pt1, pt3;

        // Ordering logic: if center is outside the interval, pt1 is the farther toward the outside.
        if ((ic < i1 && ic < i2) || (ic > i1 && ic > i2)) {
          if (i1 > i2) { pt1 = n1; pt3 = n2; }
          else         { pt1 = n2; pt3 = n1; }
        } else {
          if (i1 < i2) { pt1 = n1; pt3 = n2; }
          else         { pt1 = n2; pt3 = n1; }
        }

        // Determine orientations for edges (pt1-center) and (center-pt3)
        const combo12 = [pt1, center].sort().join(',');
        const raw1 = (row === 'top'
                      ? topOrientation?.current?.get(combo12)
                      : botOrientation?.current?.get(combo12)) || 'out';
        const o1 = combo12 === `${pt1},${center}` ? raw1 : (raw1 === 'out' ? 'in' : 'out');

        const combo23 = [center, pt3].sort().join(',');
        const raw2 = (row === 'top'
                      ? topOrientation?.current?.get(combo23)
                      : botOrientation?.current?.get(combo23)) || 'out';
        const o2 = combo23 === `${center},${pt3}` ? raw2 : (raw2 === 'out' ? 'in' : 'out');

        const c1 = getEdgeColor(horiEdges, pt1, center);
        const c2 = getEdgeColor(horiEdges, center, pt3);
        const key = `${o1}|${c1}|${o2}|${c2}`;

        if (trioMap.has(key)) {
          // Conflict detected: duplicate trio signature
          const msg = 'No-Pattern fails! Check the flashing edges to see your mistake.';
          throw new NoPatternError(msg);
        }

        trioMap.set(key, { pt1, pt2: center, pt3, orientation1: o1, color1: c1, orientation2: o2, color2: c2 });
      });
    });
  });
}

export function noPattern(latestPair, context) {
  void latestPair; // latestPair not strictly required; check uses full state

  const { connectionPairs, topOrientation, botOrientation } = context || {};
  if (!connectionPairs || !topOrientation || !botOrientation) {
    // Insufficient context → do not block
    return { ok: true };
  }

  try {
    const horiEdges = buildHorizontalEdges(connectionPairs, topOrientation, botOrientation);
    assertNoPattern(horiEdges, topOrientation, botOrientation);
    return { ok: true };
  } catch (err) {
    return { ok: false, message: err?.message || 'No-Pattern condition failed!' };
  }
}
