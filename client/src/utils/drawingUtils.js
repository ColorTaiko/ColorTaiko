/**
 * Draws connection lines and curved paths between nodes on an SVG canvas.
 * @param {Object} svgRef - Reference to the SVG element where connections will be drawn.
 * @param {Array} connections - Array of connections, each containing nodes to connect and the color of the line.
 * @param {Array} connectionPairs - Array of connection pairs to be drawn with curved paths.
 * @param {number} offset - Distance to offset connection lines from node centers.
 * @param {Object} topOrientation - A ref (Map) for top orientation values.
 * @param {Object} botOrientation - A ref (Map) for bottom orientation values.
 * @param {Object} arrowOptions - Options for drawing arrows (default color red, size 10).
 * @param {Object} horiEdgesRef - A ref to the horizontal edges data structure.
 */
export const drawConnections = (
  svgRef,
  connections,
  connectionPairs,
  offset,
  topOrientation,
  botOrientation,
  arrowOptions = { color: "red", size: 10 },
  horiEdgesRef
) => {
  if (!svgRef.current) return;

  // Remove existing SVG children
  while (svgRef.current.firstChild) {
    svgRef.current.removeChild(svgRef.current.firstChild);
  }

  const svgRect = svgRef.current.getBoundingClientRect();

  const adjustPoint = (x1, y1, x2, y2, distance) => {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const len = Math.sqrt(dx * dx + dy * dy);
    const scale = (len - distance) / len;
    return { x: x1 + dx * scale, y: y1 + dy * scale };
  };

  // Straight-line connections
  connections.forEach(({ nodes: [start, end], color }) => {
    const startEl = document.getElementById(start);
    const endEl = document.getElementById(end);
    if (!startEl || !endEl) return;
    const startRect = startEl.getBoundingClientRect();
    const endRect = endEl.getBoundingClientRect();
    const startX = startRect.left + startRect.width / 2 - svgRect.left;
    const startY = startRect.top + startRect.height / 2 - svgRect.top;
    const endX = endRect.left + endRect.width / 2 - svgRect.left;
    const endY = endRect.top + endRect.height / 2 - svgRect.top;
    const adjStart = adjustPoint(startX, startY, endX, endY, offset);
    const adjEnd = adjustPoint(endX, endY, startX, startY, offset);
    const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
    line.setAttribute("x1", adjStart.x);
    line.setAttribute("y1", adjStart.y);
    line.setAttribute("x2", adjEnd.x);
    line.setAttribute("y2", adjEnd.y);
    line.setAttribute("stroke", color);
    line.setAttribute("stroke-width", "4");
    line.setAttribute("stroke-linecap", "round");
    svgRef.current.appendChild(line);
  });

  // Curved paths for connection pairs
  connectionPairs.forEach((pair) => {
    if (pair.length !== 2) return;
    const [firstConn, secondConn] = pair;
    const [top1, bottom1] = firstConn.nodes;
    const [top2, bottom2] = secondConn.nodes;
    const sortNodes = (a, b) => {
      const na = parseInt(a.split('-')[1], 10);
      const nb = parseInt(b.split('-')[1], 10);
      return na < nb ? [a, b] : [b, a];
    };
    const [sTop1, sTop2] = sortNodes(top1, top2);
    const [sBot1, sBot2] = sortNodes(bottom1, bottom2);
    const topCombo = [top1, top2].sort().join(',');
    const bottomCombo = [bottom1, bottom2].sort().join(',');
    const topDir = topOrientation.current.get(topCombo);
    const bottomDir = botOrientation.current.get(bottomCombo);

    const createCurvedPath = (startNode, endNode, isTopCurve, orientation) => {
      const startEl = document.getElementById(startNode);
      const endEl = document.getElementById(endNode);
      if (!startEl || !endEl) return null;
      const startRect = startEl.getBoundingClientRect();
      const endRect = endEl.getBoundingClientRect();
      const startX = startRect.left + startRect.width / 2 - svgRect.left;
      const startY = startRect.top + startRect.height / 2 - svgRect.top;
      const endX = endRect.left + endRect.width / 2 - svgRect.left;
      const endY = endRect.top + endRect.height / 2 - svgRect.top;
      const adjStart = adjustPoint(startX, startY, endX, endY, offset);
      const adjEnd = adjustPoint(endX, endY, startX, startY, offset);
      const dx = adjEnd.x - adjStart.x;
      const dy = adjEnd.y - adjStart.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const controlX = (adjStart.x + adjEnd.x) / 2;
      const controlY = isTopCurve
        ? Math.min(adjStart.y, adjEnd.y) - distance / 5
        : Math.max(adjStart.y, adjEnd.y) + distance / 5;
      const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
      const d = `M ${adjStart.x},${adjStart.y} Q ${controlX},${controlY} ${adjEnd.x},${adjEnd.y}`;
      path.setAttribute("d", d);
      path.setAttribute("stroke", firstConn.color);
      path.setAttribute("fill", "none");
      path.setAttribute("stroke-width", "4");
      path.setAttribute("stroke-linecap", "round");
      const pathLength = path.getTotalLength();
      const midPoint = path.getPointAtLength(pathLength / 2);
      const tangentPoint1 = path.getPointAtLength(pathLength / 2 - 1);
      const tangentPoint2 = path.getPointAtLength(pathLength / 2 + 1);
      const tangentAngle =
        (Math.atan2(
          tangentPoint2.y - tangentPoint1.y,
          tangentPoint2.x - tangentPoint1.x
        ) *
          180) /
        Math.PI;
      const arrow = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "polygon"
      );
      const arrowSize = arrowOptions.size || 10;
      let arrowPoints;
      if (orientation === "right") {
        arrowPoints = `
          ${midPoint.x},${midPoint.y - arrowSize} 
          ${midPoint.x - arrowSize},${midPoint.y} 
          ${midPoint.x},${midPoint.y + arrowSize}`;
      } else {
        arrowPoints = `
          ${midPoint.x},${midPoint.y - arrowSize} 
          ${midPoint.x + arrowSize},${midPoint.y} 
          ${midPoint.x},${midPoint.y + arrowSize}`;
      }
      arrow.setAttribute("points", arrowPoints);
      arrow.setAttribute("fill", firstConn.color);
      arrow.setAttribute(
        "transform",
        `rotate(${tangentAngle}, ${midPoint.x}, ${midPoint.y})`
      );
      return { path, arrow };
    };

    const topCurve = createCurvedPath(sTop1, sTop2, true, topDir);
    if (topCurve) {
      svgRef.current.appendChild(topCurve.path);
      svgRef.current.appendChild(topCurve.arrow);
    }
    const bottomCurve = createCurvedPath(sBot1, sBot2, false, bottomDir);
    if (bottomCurve) {
      svgRef.current.appendChild(bottomCurve.path);
      svgRef.current.appendChild(bottomCurve.arrow);
    }
  });
};

function arrayEquals(a, b) {
  return (
    Array.isArray(a) &&
    Array.isArray(b) &&
    a.length === b.length &&
    a.every((val, idx) => val === b[idx])
  );
}

function isListInSet(set, list) {
  for (const item of set) {
    if (arrayEquals(item, list)) return true;
  }
  return false;
}

const trioMap = new Map();

function extractNum(node) {
  const match = node.match(/-(\d+)/);
  return match ? parseInt(match[1], 10) : null;
}

function getEdgeColor(ptA, ptB, horiEdgesRef) {
  const entry = horiEdgesRef.current.get(ptA);
  if (!entry) return null;
  const [outMap, inMap] = entry;
  if (outMap.has(ptB)) return outMap.get(ptB);
  if (inMap.has(ptB)) return inMap.get(ptB);
  return null;
}

function getOrientationForEdge(nonCommon, common) {
  const nNon = extractNum(nonCommon);
  const nCommon = extractNum(common);
  if (nNon === null || nCommon === null) return undefined;
  return nNon < nCommon ? "in" : "out";
}

export const buildTrioMap = (horiEdgesRef) => {
  trioMap.clear();
  horiEdgesRef.current.forEach((edgeArray, common) => {
    if (!common.startsWith("top") && !common.startsWith("bottom")) return;
    const row = common.split("-")[0];
    const [outMap, inMap] = edgeArray;
    const neighbors = new Set([
      ...Array.from(outMap.keys()).filter((n) => n.startsWith(row)),
      ...Array.from(inMap.keys()).filter((n) => n.startsWith(row))
    ]);
    const arr = Array.from(neighbors);
    for (let i = 0; i < arr.length; i++) {
      for (let j = i + 1; j < arr.length; j++) {
        const pt1 = arr[i];
        const pt3 = arr[j];
        const orientation1 = getOrientationForEdge(pt1, common);
        const orientation2 = getOrientationForEdge(pt3, common);
        const color1 = getEdgeColor(pt1, common, horiEdgesRef);
        const color2 = getEdgeColor(common, pt3, horiEdgesRef);
        const key = `${orientation1}|${color1}|${orientation2}|${color2}`;
        const tuple = { pt1, orientation1, color1, pt2: common, orientation2, color2, pt3 };
        if (trioMap.has(key)) {
          console.error("No-pattern violation for key", key);
          alert(
            "No Pattern rule violation – duplicate horizontal trio found."
          );
        } else {
          trioMap.set(key, tuple);
        }
      }
    }
  });
  console.log("Rebuilt trioMap:", Array.from(trioMap.entries()));
};

/**
 * updates horizontal connections (only true horizontal connections like bottom-bottom or top-top)
 */
export const updateHorizontalEdges = (
  connectionPairs,
  horiEdgesRef,
  topOrientation,
  botOrientation,
  flippedConnectionsPerMove
) => {
  connectionPairs.forEach((pair) => {
    if (pair.length !== 2) return;
    const [
      { nodes: [top1, bottom1] },
      { nodes: [top2, bottom2], color }
    ] = pair;

    const record = (from, to, orientation, clr) => {
      if (!horiEdgesRef.current.has(from)) {
        horiEdgesRef.current.set(from, [new Map(), new Map()]);
      }
      const [outMap, inMap] = horiEdgesRef.current.get(from);
      if (orientation === "out") outMap.set(to, clr);
      else inMap.set(to, clr);
    };

    const topCombo = [top1, top2].sort().join(",");
    const topDir = topOrientation.current.get(topCombo) || "out";
    record(top1, top2, topDir, color);
    record(top2, top1, topDir === "out" ? "in" : "out", color);
    const botCombo = [bottom1, bottom2].sort().join(",");
    const botDir = botOrientation.current.get(botCombo) || "out";
    record(bottom1, bottom2, botDir, color);
    record(bottom2, bottom1, botDir === "out" ? "in" : "out", color);
    buildTrioMap(horiEdgesRef);
  });
};
