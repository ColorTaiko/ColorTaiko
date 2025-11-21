/**
 * Checks if all nodes in the top or bottom rows are connected and, if so,
 * increments the row count to add a new node.
 * @param {number} topRowCount - Current count of nodes in the top row.
 * @param {number} bottomRowCount - Current count of nodes in the bottom row.
 * @param {Array} connections - Array of active connections, where each connection contains nodes it connects.
 * @param {Function} setTopRowCount - Setter function to increment the top row count.
 * @param {Function} setBottomRowCount - Setter function to increment the bottom row count.
 */

export const checkAndAddNewNodes = (
  topRowCount,
  bottomRowCount,
  connections,
  setTopRowCount,
  setBottomRowCount,
  maxTop = Infinity,
  maxBottom = Infinity
) => {
    // Check if all nodes in the top row are connected
    const allTopNodesConnected = Array.from({ length: topRowCount }, (_, i) =>
      connections.some((conn) => conn.nodes.includes(`top-${i}`))
    ).every(Boolean);
    // Check if all nodes in the bottom row are connected
    const allBottomNodesConnected = Array.from(
      { length: bottomRowCount },
      (_, i) => connections.some((conn) => conn.nodes.includes(`bottom-${i}`))
    ).every(Boolean);
    // Add new nodes to any row where all existing nodes are connected.
    // Previously this used an if/else-if which only allowed adding to one
    // side per invocation; change to allow both sides to grow in the same
    // call when appropriate.
    if (allTopNodesConnected && topRowCount < maxTop) {
      setTopRowCount((prev) => prev + 1);
    }

    if (allBottomNodesConnected && bottomRowCount < maxBottom) {
      setBottomRowCount((prev) => prev + 1);
    }
    // If at max, do nothing for that side.
  };