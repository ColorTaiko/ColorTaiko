import { deriveHorizontalEdgesFromPair } from "./patternLog";

/**
 * Pattern-log-driven no-fold checks. These helpers have replaced the legacy
 * map-based approach and operate entirely on the derived horizontal edge
 * sequences that the app maintains.
 */

function cloneSequenceWithCandidate(sequence, candidate) {
  const cloned = Array.isArray(sequence) ? [...sequence] : [];

  if (!candidate) {
    return cloned;
  }

  if (candidate.id) {
    const existingIndex = cloned.findIndex(
      (edge) => edge?.id && edge.id === candidate.id
    );
    if (existingIndex >= 0) {
      cloned[existingIndex] = candidate;
      return cloned;
    }
  }

  cloned.push(candidate);
  return cloned;
}

function checkSequence(sequence, sequenceName) {
  const adjacency = new Map(); // from -> Map(color -> { to, edgeId })
  const incoming = new Map(); // to -> Array<{ from, edgeId, color }>
  const foldEdges = new Set();

  for (const edge of sequence) {
    if (!edge || !edge.orientation || !edge.nodes || edge.nodes.length !== 2) {
      continue;
    }

    const [nodeA, nodeB] = edge.nodes;
    const from = edge.orientation === "right" ? nodeA : nodeB;
    const to = edge.orientation === "right" ? nodeB : nodeA;
    const colorKey = edge.color ?? "__unknown__";
    const edgeId = edge.id ?? `${from},${to}`;

    if (!adjacency.has(from)) {
      adjacency.set(from, new Map());
    }

    const outEdges = adjacency.get(from);
    const existingOut = outEdges.get(colorKey);

    if (existingOut && existingOut.to !== to) {
      foldEdges.add(edgeId);
      foldEdges.add(existingOut.edgeId);
      console.log(
        `Fold detected in ${sequenceName}: ${from} has ${edge.color ?? "unknown"} going to both ${existingOut.to} and ${to}`
      );
    }

    outEdges.set(colorKey, { to, edgeId });

    const toOutEdges = adjacency.get(to);
    const reverseEdge = toOutEdges?.get(colorKey);
    if (reverseEdge && reverseEdge.to === from) {
      foldEdges.add(edgeId);
      foldEdges.add(reverseEdge.edgeId);
      console.log(
        `Cycle detected in ${sequenceName}: ${from} <-> ${to} with color ${edge.color ?? "unknown"}`
      );
    }

    const incomingEdges = incoming.get(to);
    if (!incomingEdges) {
      incoming.set(to, [{ from, edgeId, color: edge.color ?? "unknown" }]);
      continue;
    }

    const duplicate = incomingEdges.some(({ edgeId: existingId }) => existingId === edgeId);
    if (duplicate) {
      continue;
    }

    for (const existing of incomingEdges) {
      foldEdges.add(edgeId);
      foldEdges.add(existing.edgeId);
      console.log(
        `Fold detected in ${sequenceName}: ${to} receives ${edge.color ?? "unknown"} from both ${existing.from} and ${from}`
      );
    }

    incomingEdges.push({ from, edgeId, color: edge.color ?? "unknown" });
  }

  return foldEdges;
}

/**
 * Pattern-log based noFold check
 * @param {Object} patternLog - Pattern log with topSequence and bottomSequence
 * @param {Set<string>} [foldsFound] - Optional set to populate with fold edge IDs
 * @param {Object} [options]
 * @param {Object|null} [options.candidateTopEdge]
 * @param {Object|null} [options.candidateBottomEdge]
 * @returns {{ ok: boolean, message?: string }}
 */
export function noFoldFromPatternLog(patternLog, foldsFound, options = {}) {
  if (!patternLog || (!patternLog.topSequence && !patternLog.bottomSequence)) {
    return { ok: true };
  }

  if (foldsFound) {
    foldsFound.clear();
  }

  const { candidateTopEdge = null, candidateBottomEdge = null } = options;

  const topSequence = cloneSequenceWithCandidate(
    patternLog.topSequence,
    candidateTopEdge
  );
  const bottomSequence = cloneSequenceWithCandidate(
    patternLog.bottomSequence,
    candidateBottomEdge
  );

  const topFolds = checkSequence(topSequence, "top");
  const bottomFolds = checkSequence(bottomSequence, "bottom");

  const allFolds = new Set([...topFolds, ...bottomFolds]);

  if (foldsFound) {
    for (const fold of allFolds) {
      foldsFound.add(fold);
    }
  }

  if (allFolds.size > 0) {
    return { ok: false, message: "No-Fold condition failed!" };
  }

  return { ok: true };
}

/**
 * Unified noFold entry point that delegates entirely to the pattern-log
 * implementation. It accepts the current pattern log plus the latest pair and
 * returns a `{ ok, message }` result. Optional `foldsFound` metadata will be
 * populated from the pattern-log check when provided.
 *
 * @param {Array<{nodes: [string,string], color: string}>} latestPair - The most recent completed pair
 * @param {Object} context
 * @param {{ current: Map<string, 'left'|'right'> }} context.topOrientation
 * @param {{ current: Map<string, 'left'|'right'> }} context.botOrientation
 * @param {Set<string>} [context.foldsFound]
 * @param {Object} [context.patternLog]
 * @returns {{ ok: boolean, message?: string }}
 */
export function noFold(latestPair, context) {
  void latestPair;

  const { topOrientation, botOrientation, foldsFound, patternLog } = context || {};

  if (!patternLog) {
    return { ok: true };
  }

  const { topEdge = null, bottomEdge = null } =
    deriveHorizontalEdgesFromPair(latestPair, topOrientation, botOrientation) || {};

  return noFoldFromPatternLog(patternLog, foldsFound, {
    candidateTopEdge: topEdge,
    candidateBottomEdge: bottomEdge,
  });
}
