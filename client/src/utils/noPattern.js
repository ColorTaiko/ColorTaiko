import { checkOrientation } from "./checkOrientation.js";
import { deriveHorizontalEdgesFromPair } from "./patternLog.js";
import { checkAndGroupConnections } from "./MergeUtils.js";

/**
 * No-Pattern check: verifies that no two horizontal trios (pt1-pt2-pt3) share the same
 * signature key: `${o1}|${c1}|${o2}|${c2}` where oX in {'in','out'} and cX is the edge color.
 */

/**
 * Build the horizontal edges adjacency map from connectionPairs and orientations.
 * Returns: Map<nodeId, [outMap: Map<nodeId,color>, inMap: Map<nodeId,color>]>
 */
function buildAdjacencyFromPatternLog(patternLog, groupMapRef) {
  const horiEdges = new Map(); // node -> [outMap, inMap]

  const getGroupColor = (edge) => {
    const groupColor = groupMapRef?.current?.get(edge.id)?.color;
    return groupColor ?? edge.color ?? null;
  };

  const record = (from, to, isOut, color) => {
    if (!horiEdges.has(from)) horiEdges.set(from, [new Map(), new Map()]);
    const [outM, inM] = horiEdges.get(from);
    if (isOut) {
      inM.delete(to);
      outM.set(to, color);
    } else {
      outM.delete(to);
      inM.set(to, color);
    }
  };

  const pushEdge = (edge) => {
    if (!edge || !Array.isArray(edge.nodes) || edge.nodes.length !== 2) return;
    const [left, right] = edge.nodes; // nodes are sorted left<right
    const color = getGroupColor(edge);
    const ori = edge.orientation === 'left' ? 'left' : 'right';
    if (ori === 'right') {
      record(left, right, true, color);  // left -> right (out)
      record(right, left, false, color); // from right perspective it's 'in'
    } else {
      record(right, left, true, color);  // right -> left (out)
      record(left, right, false, color);
    }
  };

  (patternLog?.topSequence || []).forEach(pushEdge);
  (patternLog?.bottomSequence || []).forEach(pushEdge);

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
function assertNoPatternFromAdj(horiEdges) {
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

  // Determine orientations relative to center using adjacency
  // If edge is center->neighbor it's 'out'; if neighbor->center it's 'in'
  const o1 = (outMap.has(pt1) ? 'out' : 'in');
  const o2 = (outMap.has(pt3) ? 'out' : 'in');

        const c1 = getEdgeColor(horiEdges, pt1, center);
        const c2 = getEdgeColor(horiEdges, center, pt3);
        const key = `${o1}|${c1}|${o2}|${c2}`;

        if (trioMap.has(key)) {
          // Conflict detected: duplicate trio signature
          const msg = 'No-Pattern fails! Check the flashing edges to see your mistake.';
          throw new Error(msg);
        }

        trioMap.set(key, { pt1, pt2: center, pt3, orientation1: o1, color1: c1, orientation2: o2, color2: c2 });
      });
    });
  });
}

export function noPatternFromPatternLog(patternLog, options = {}) {
  try {
    const { groupMapRef = null } = options;
    const adj = buildAdjacencyFromPatternLog(patternLog, groupMapRef);
    assertNoPatternFromAdj(adj);
    return { ok: true };
  } catch (err) {
    return { ok: false, message: err?.message || 'No-Pattern condition failed!' };
  }
}

export function noPatternPreflightWithPatternLog(newPair, context = {}) {
  const { topOrientation, botOrientation, groupMapRef, patternLog } = context || {};
  if (!Array.isArray(newPair) || newPair.length !== 2) return { ok: true };

  // Clone orientations and patternLog
  const topClone = { current: new Map(topOrientation?.current || []) };
  const botClone = { current: new Map(botOrientation?.current || []) };
  const logClone = {
    topSequence: Array.isArray(patternLog?.topSequence)
      ? patternLog.topSequence.map(e => ({ ...e }))
      : [],
    bottomSequence: Array.isArray(patternLog?.bottomSequence)
      ? patternLog.bottomSequence.map(e => ({ ...e }))
      : [],
  };

  // Dry-run orientation on clones; apply flips to logClone via checkOrientation
  const orientRes = checkOrientation(newPair, groupMapRef, topClone, botClone, { patternLog: logClone });
  if (orientRes === -1) {
    try {
      const [c1, c2] = Array.isArray(newPair) ? newPair : [];
      if (!c1 || !c2) return { ok: false, code: 'ORIENTATION', message: 'Orientation condition failed!' };
      const [top1, bottom1] = c1.nodes;
      const [top2, bottom2] = c2.nodes;
      const topNodes = [top1, top2].sort();
      const bottomNodes = [bottom1, bottom2].sort();
      const topId = topNodes.join(',');
      const bottomId = bottomNodes.join(',');
      const topDir = topClone?.current?.get(topId) || topOrientation?.current?.get(topId);
      const botDir = botClone?.current?.get(bottomId) || botOrientation?.current?.get(bottomId);
      const topColor = groupMapRef?.current?.get(topId)?.color;
      const bottomColor = groupMapRef?.current?.get(bottomId)?.color;
      const violations = [
        { sequence: 'top', type: 'orientation-conflict', edges: [ { id: topId, nodes: topNodes, color: topColor, orientation: topDir || 'right' } ] },
        { sequence: 'bottom', type: 'orientation-conflict', edges: [ { id: bottomId, nodes: bottomNodes, color: bottomColor, orientation: botDir || 'right' } ] }
      ];
      return { ok: false, code: 'ORIENTATION', message: 'Orientation condition failed!', violations };
    } catch (_) {
      return { ok: false, code: 'ORIENTATION', message: 'Orientation condition failed!' };
    }
  }

  // Simulate colour merge on groupMap clone (effective colours for edges)
  const groupMapCloneRef = { current: new Map(groupMapRef?.current || []) };
  try {
    const noop = () => {};
    checkAndGroupConnections(newPair, groupMapCloneRef, noop, [], noop, []);
  } catch {
    // ignore
  }

  // Append candidate horizontal edges for this pair using clones
  const { topEdge, bottomEdge } = deriveHorizontalEdgesFromPair(newPair, topClone, botClone);
  if (topEdge) logClone.topSequence.push(topEdge);
  if (bottomEdge) logClone.bottomSequence.push(bottomEdge);

  // Run noPattern on updated log
  return noPatternFromPatternLog(logClone, { groupMapRef: groupMapCloneRef });
}

export function noPattern(latestPair, context) {
  // Delegate to preflight path for consistency with noFold
  return noPatternPreflightWithPatternLog(latestPair, context);
}
