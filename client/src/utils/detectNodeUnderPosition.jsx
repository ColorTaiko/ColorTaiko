/**
 * Cache for storing node references and their bounding boxes
 * Structure: { nodeId: { element: DOMElement, rect: DOMRect, lastUpdate: timestamp } }
 */
let nodeCache = new Map();
let cacheInvalidated = true;
let lastCacheUpdate = 0;
const CACHE_LIFETIME = 100; // milliseconds

/**
 * Invalidates the node cache, forcing a refresh on next detection.
 * Call this function when nodes are added, removed, or their positions change.
 */
export const invalidateNodeCache = () => {
  cacheInvalidated = true;
};

/**
 * Updates the node cache with current DOM nodes and their bounding boxes.
 * Uses requestAnimationFrame timing to batch updates efficiently.
 */
const updateNodeCache = () => {
  const now = performance.now();
  
  // Only update if cache is invalidated or expired
  if (!cacheInvalidated && (now - lastCacheUpdate) < CACHE_LIFETIME) {
    return;
  }

  // Query all nodes once
  const topNodes = document.querySelectorAll("[id^='top-']");
  const bottomNodes = document.querySelectorAll("[id^='bottom-']");
  
  // Clear old cache
  const newCache = new Map();
  
  // Cache top nodes
  for (const element of topNodes) {
    const rect = element.getBoundingClientRect();
    newCache.set(element.id, { element, rect });
  }
  
  // Cache bottom nodes
  for (const element of bottomNodes) {
    const rect = element.getBoundingClientRect();
    newCache.set(element.id, { element, rect });
  }
  
  nodeCache = newCache;
  cacheInvalidated = false;
  lastCacheUpdate = now;
};

/**
 * Detects if the mouse position is over any node's bounding box.
 * Optimized version with caching to avoid repeated DOM queries and layout calculations.
 * 
 * @param {number} x - The X coordinate of the mouse (clientX).
 * @param {number} y - The Y coordinate of the mouse (clientY).
 * @returns {string|null} If a node is hit, returns the node's ID; otherwise, returns null.
 */
export const detectNodeUnderPosition = (x, y) => {
  // Update cache if needed
  updateNodeCache();
  
  // Early return if no nodes cached
  if (nodeCache.size === 0) {
    console.log("No nodes in cache");
    return null;
  }
  
  // Iterate through cached nodes for collision detection
  for (const [nodeId, { rect }] of nodeCache) {
    // Check if the mouse (x, y) is within the current node's bounding box
    if (
      x >= rect.left &&
      x <= rect.right &&
      y >= rect.top &&
      y <= rect.bottom
    ) {
      console.log("Detected node under position:", nodeId);
      return nodeId; // Return the ID of the detected node
    }
  }
  
  console.log("No node detected under position:", x, y);
  return null; // Return null if no node is detected
};