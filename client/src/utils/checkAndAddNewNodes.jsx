import { invalidateNodeCache } from './detectNodeUnderPosition';

/**
 * Checks if all nodes in the top or bottom rows are connected and, if so,
 * increments the row count to add a new node.
 * @param {number} topRowCount - Current count of nodes in the top row.
 * @param {number} bottomRowCount - Current count of nodes in the bottom row.
 * @param {Array} connections - Array of active connections, where each connection contains nodes it connects.
 * @param {Function} setTopRowCount - Setter function to increment the top row count.
 * @param {Function} setBottomRowCount - Setter function to increment the bottom row count.
 */

export const checkAndAddNewNodes = (topRowCount, bottomRowCount, connections, setTopRowCount, setBottomRowCount) => {
    // Check if all nodes in the top row are connected
    const allTopNodesConnected = Array.from({ length: topRowCount }, (_, i) =>
      connections.some((conn) => conn.nodes.includes(`top-${i}`))
    ).every(Boolean);
    // Check if all nodes in the bottom row are connected
    const allBottomNodesConnected = Array.from(
      { length: bottomRowCount },
      (_, i) => connections.some((conn) => conn.nodes.includes(`bottom-${i}`))
    ).every(Boolean);
    // Add a new node to the row if all nodes in that row are connected
    if (allTopNodesConnected || allBottomNodesConnected) {
      allTopNodesConnected ? setTopRowCount((prev) => prev + 1) : setBottomRowCount((prev) => prev + 1);
      // Invalidate cache when new nodes are added
      invalidateNodeCache();
    }
  };