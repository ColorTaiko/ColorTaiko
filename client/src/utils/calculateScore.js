import { calculateProgress } from "./calculateProgress";

/**
 * calculateScore - simple scoring function for a candidate configuration.
 * For now this is a thin wrapper around calculateProgress so higher progress
 * yields a higher score. This can be extended later with heuristics.
 *
 * @param {Array} connections - list of connection objects
 * @param {number} topRowCount
 * @param {number} bottomRowCount
 * @returns {number} score (higher is better)
 */
export function calculateScore(connections, topRowCount, bottomRowCount) {
  try {
    return calculateProgress(connections, topRowCount, bottomRowCount);
  } catch (err) {
    console.error("calculateScore error:", err);
    return -Infinity;
  }
}

export default calculateScore;
