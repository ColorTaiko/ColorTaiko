/**
 * Robust no-fold validation utilities.
 *
 * Derived horizontal edges are grouped by colour; for each colour we ensure a
 * node has at most one outgoing and one incoming edge. Violations indicate a
 * “fold” in the puzzle.
 */

import { checkOrientation } from "./checkOrientation.js";
import { deriveHorizontalEdgesFromPair } from "./patternLog.js";
import { checkAndGroupConnections } from "./MergeUtils.js";

const FALLBACK_COLOR_PREFIX = "__uncoloured__:";

function ensureArray(value) {
  return Array.isArray(value) ? value : [];
}

function ensureColor(color, key) {
  return color ?? `${FALLBACK_COLOR_PREFIX}${key}`;
}

function resolveColor(groupMapRef, combinationKey, fallbackColor) {
  if (groupMapRef?.current && combinationKey) {
    const group = groupMapRef.current.get(combinationKey);
    if (group?.color) {
      return group.color;
    }
  }
  if (fallbackColor == null) {
    console.warn(`[noFold] fallback colour used for ${combinationKey}`);
  }
  return fallbackColor;
}

// removed legacy helper getConnectionColor

// Minimal helper used by noFoldFromPatternLog normalisation
function normalizeCombination(nodeA, nodeB) {
  const nodes = [nodeA, nodeB].sort();
  return { nodes, key: nodes.join(',') };
}

// removed legacy helper normalizeCombination

// removed legacy helper deriveOrientation

// removed legacy helper classifyConnection

// removed legacy helper buildHorizontalEdge

// gatherHorizontalEdges was used by the legacy path; removed to keep single path via patternLog

function recordFold(foldSet, edgeId) {
  if (!edgeId) return;
  foldSet.add(edgeId);
}

function checkSequence(edges, sequenceName) {
  const foldEdges = new Set();
  const violationDetails = [];
  const colorMap = new Map(); // color -> { outgoing, incoming }

  for (const edge of ensureArray(edges)) {
    if (!edge || !edge.from || !edge.to) {
      continue;
    }

    const color = edge.color ?? `${FALLBACK_COLOR_PREFIX}${edge.id ?? "unknown"}`;
    if (!colorMap.has(color)) {
      colorMap.set(color, {
        outgoing: new Map(), // from -> { to, edgeInfo }
        incoming: new Map(), // to -> { from, edgeInfo }
      });
    }

    const { outgoing, incoming } = colorMap.get(color);
    const { from, to } = edge;
    const edgeId = edge.id ?? `${from},${to}`;

    const edgeInfo = {
      id: edgeId,
      pairId: edge.pairId ?? null,
      nodes: ensureArray(edge.nodes),
      from,
      to,
      color,
      orientation: edge.orientation,
      sequence: sequenceName,
    };

    if (outgoing.has(from)) {
      const existing = outgoing.get(from);
      if (existing.to !== to) {
        console.log(
          `Fold detected in ${sequenceName}: ${from} has ${color} going to both ${existing.to} and ${to}`
        );
        recordFold(foldEdges, edgeId);
        recordFold(foldEdges, existing.edgeInfo.id);
        violationDetails.push({
          sequence: sequenceName,
          type: "multiple-outgoing",
          anchorNode: from,
          color,
          edges: [existing.edgeInfo, edgeInfo],
        });
      }
    } else {
      outgoing.set(from, { to, edgeInfo });
    }

    if (incoming.has(to)) {
      const existing = incoming.get(to);
      if (existing.from !== from) {
        console.log(
          `Fold detected in ${sequenceName}: ${to} receives ${color} from both ${existing.from} and ${from}`
        );
        recordFold(foldEdges, edgeId);
        recordFold(foldEdges, existing.edgeInfo.id);
        violationDetails.push({
          sequence: sequenceName,
          type: "multiple-incoming",
          anchorNode: to,
          color,
          edges: [existing.edgeInfo, edgeInfo],
        });
      }
    } else {
      incoming.set(to, { from, edgeInfo });
    }

    if (outgoing.has(to)) {
      const reverse = outgoing.get(to);
      if (reverse.to === from) {
        console.log(
          `Cycle detected in ${sequenceName}: ${from} <-> ${to} with color ${color}`
        );
        recordFold(foldEdges, edgeId);
        recordFold(foldEdges, reverse.edgeInfo.id);
        violationDetails.push({
          sequence: sequenceName,
          type: "two-cycle",
          anchorNode: from,
          color,
          edges: [reverse.edgeInfo, edgeInfo],
        });
      }
    }
  }

  return { foldEdges, details: violationDetails };
}

export function noFold(latestPair, context = {}) {
  // Delegate to the preflight check so we have a single, consistent logic path
  // that accounts for orientation flips and colour merges caused by the pair.
  return noFoldPreflightWithPatternLog(latestPair, context);
}

/**
 * Preflight no-fold check using patternLog before committing a new pair.
 * This performs a dry-run orientation resolution on cloned maps, derives the
 * candidate horizontal edges for the new pair, appends them onto a cloned
 * patternLog, and then runs noFoldFromPatternLog. It does not mutate real state.
 *
 * @param {Array} newPair - Exactly two vertical connections to form a pair
 * @param {Object} context
 *  - connectionPairs: existing history (not strictly required here)
 *  - topOrientation, botOrientation: refs with current orientation maps
 *  - groupMapRef: ref to colour groups
 *  - patternLog: current pattern log object { topSequence, bottomSequence }
 * @returns {{ ok: boolean, message?: string }}
 */
export function noFoldPreflightWithPatternLog(newPair, context = {}) {
  const { topOrientation, botOrientation, groupMapRef, patternLog } = context;

  if (!Array.isArray(newPair) || newPair.length !== 2) {
    return { ok: true };
  }

  // Clone orientation maps so mutations during orientation resolution don't leak.
  const topClone = { current: new Map(topOrientation?.current || []) };
  const botClone = { current: new Map(botOrientation?.current || []) };

  // Shallow-clone pattern log arrays (edges are immutable records for our purpose).
  const logClone = {
    topSequence: Array.isArray(patternLog?.topSequence)
      ? patternLog.topSequence.map((e) => ({ ...e }))
      : [],
    bottomSequence: Array.isArray(patternLog?.bottomSequence)
      ? patternLog.bottomSequence.map((e) => ({ ...e }))
      : [],
  };

  // Dry-run orientation resolution on clones. If orientation fails, block.
  const orientRes = checkOrientation(
    newPair,
    groupMapRef,
    topClone,
    botClone,
    { patternLog: logClone }
  );
  if (orientRes === -1) {
    try {
      const [c1, c2] = Array.isArray(newPair) ? newPair : [];
      if (!c1 || !c2) return { ok: false, code: "ORIENTATION", message: "Orientation condition failed!" };
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
        {
          sequence: "top",
          type: "orientation-conflict",
          edges: [
            { id: topId, nodes: topNodes, color: topColor, orientation: topDir || "right" },
          ],
        },
        {
          sequence: "bottom",
          type: "orientation-conflict",
          edges: [
            { id: bottomId, nodes: bottomNodes, color: bottomColor, orientation: botDir || "right" },
          ],
        },
      ];

      return { ok: false, code: "ORIENTATION", message: "Orientation condition failed!", violations };
    } catch (_) {
      return { ok: false, code: "ORIENTATION", message: "Orientation condition failed!" };
    }
  }

  // Simulate color group merge on a cloned groupMap, as this pair may merge groups
  // and change effective colours seen by noFold.
  const groupMapCloneRef = { current: new Map(groupMapRef?.current || []) };
  try {
    const noop = () => {};
    const connectionsClone = [];
    const connectionPairsClone = [];
    checkAndGroupConnections(
      newPair,
      groupMapCloneRef,
      noop,
      connectionsClone,
      noop,
      connectionPairsClone
    );
  } catch {
    // ignore: group merge simulation failure in preflight should not block
  }

  // Derive candidate horizontal edges for this pair using the resolved orientations.
  const { topEdge, bottomEdge } = deriveHorizontalEdgesFromPair(
    newPair,
    topClone,
    botClone
  );
  if (topEdge) logClone.topSequence.push(topEdge);
  if (bottomEdge) logClone.bottomSequence.push(bottomEdge);

  // Run no-fold check on the updated log clone.
  const res = noFoldFromPatternLog(logClone, null, { groupMapRef: groupMapCloneRef });
  return res && typeof res.ok === "boolean" ? res : { ok: true };
}

export function noFoldFromPatternLog(patternLog, foldsFound, options = {}) {
  if (!patternLog) {
    foldsFound?.clear?.();
    return { ok: true };
  }

  const { groupMapRef = null } = options;

  const normalise = (sequence) =>
    ensureArray(sequence).map((edge) => {
      const normalised = { ...edge };
      const nodes = ensureArray(normalised.nodes);
      if (nodes.length === 2) {
        const { nodes: sortedNodes, key } = normalizeCombination(nodes[0], nodes[1]);
        normalised.id = normalised.id ?? key;
        normalised.nodes = sortedNodes;
        const orientation = normalised.orientation === "left" ? "left" : "right";
        normalised.orientation = orientation;
        const color = ensureColor(
          resolveColor(groupMapRef, normalised.id, normalised.color),
          normalised.id
        );
        normalised.color = color;
        const [first, second] = sortedNodes;
        normalised.from = orientation === "right" ? first : second;
        normalised.to = orientation === "right" ? second : first;
      }
      return normalised;
    });

  const topEdges = normalise(patternLog.topSequence);
  const bottomEdges = normalise(patternLog.bottomSequence);

  const topResult = checkSequence(topEdges, "top");
  const bottomResult = checkSequence(bottomEdges, "bottom");

  const allFolds = new Set([...topResult.foldEdges, ...bottomResult.foldEdges]);
  const violationDetails = [...topResult.details, ...bottomResult.details];

  if (foldsFound) {
    foldsFound.clear();
    for (const fold of allFolds) {
      foldsFound.add(fold);
    }
  }

  if (allFolds.size > 0) {
    return {
      ok: false,
      message: "No-Fold condition failed!",
      code: "NO_FOLD",
      violations: violationDetails,
    };
  }

  return { ok: true };
}
