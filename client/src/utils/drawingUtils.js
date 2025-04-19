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

  // Clear existing SVG children
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

  // Draw straight-line connections
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

  // Draw curved paths for connection pairs
  connectionPairs.forEach((pair) => {
    if (pair.length !== 2) return;
    const [firstConn, secondConn] = pair;
    const [t1, b1] = firstConn.nodes;
    const [t2, b2] = secondConn.nodes;
    const sortNodes = (a, b) => {
      const na = parseInt(a.split("-")[1], 10);
      const nb = parseInt(b.split("-")[1], 10);
      return na < nb ? [a, b] : [b, a];
    };
    const [sT1, sT2] = sortNodes(t1, t2);
    const [sB1, sB2] = sortNodes(b1, b2);
    const topKey = [t1, t2].sort().join(",");
    const botKey = [b1, b2].sort().join(",");
    const topDir = topOrientation.current.get(topKey);
    const botDir = botOrientation.current.get(botKey);

    const makeCurve = (from, to, isTop, dir) => {
      const fEl = document.getElementById(from);
      const tEl = document.getElementById(to);
      if (!fEl || !tEl) return null;
      const fRect = fEl.getBoundingClientRect();
      const tRect = tEl.getBoundingClientRect();
      const x1 = fRect.left + fRect.width / 2 - svgRect.left;
      const y1 = fRect.top + fRect.height / 2 - svgRect.top;
      const x2 = tRect.left + tRect.width / 2 - svgRect.left;
      const y2 = tRect.top + tRect.height / 2 - svgRect.top;
      const a1 = adjustPoint(x1, y1, x2, y2, offset);
      const a2 = adjustPoint(x2, y2, x1, y1, offset);
      const dx = a2.x - a1.x;
      const dy = a2.y - a1.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const cX = (a1.x + a2.x) / 2;
      const cY = isTop ? Math.min(a1.y, a2.y) - dist / 5 : Math.max(a1.y, a2.y) + dist / 5;
      const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
      path.setAttribute("d", `M ${a1.x},${a1.y} Q ${cX},${cY} ${a2.x},${a2.y}`);
      path.setAttribute("stroke", firstConn.color);
      path.setAttribute("fill", "none");
      path.setAttribute("stroke-width", "4");
      path.setAttribute("stroke-linecap", "round");
      const len = path.getTotalLength();
      const p1 = path.getPointAtLength(len / 2 - 1);
      const p2 = path.getPointAtLength(len / 2 + 1);
      const ang = (Math.atan2(p2.y - p1.y, p2.x - p1.x) * 180) / Math.PI;
      const mid = path.getPointAtLength(len / 2);
      const poly = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
      const sz = arrowOptions.size || 10;
      const points =
        dir === "right"
          ? `${mid.x},${mid.y - sz} ${mid.x - sz},${mid.y} ${mid.x},${mid.y + sz}`
          : `${mid.x},${mid.y - sz} ${mid.x + sz},${mid.y} ${mid.x},${mid.y + sz}`;
      poly.setAttribute("points", points);
      poly.setAttribute("fill", firstConn.color);
      poly.setAttribute("transform", `rotate(${ang},${mid.x},${mid.y})`);
      return { path, poly };
    };

    const tc = makeCurve(sT1, sT2, true, topDir);
    if (tc) {
      svgRef.current.appendChild(tc.path);
      svgRef.current.appendChild(tc.poly);
    }
    const bc = makeCurve(sB1, sB2, false, botDir);
    if (bc) {
      svgRef.current.appendChild(bc.path);
      svgRef.current.appendChild(bc.poly);
    }
  });
};

// Global trio map
const trioMap = new Map();

// Get directed color from horiEdgesRef
function getEdgeColor(a, b, ref) {
  const ent = ref.current.get(a);
  if (!ent) return null;
  const [o, i] = ent;
  return o.get(b) || i.get(b) || null;
}

export const buildTrioMap = (horiEdgesRef) => {
  trioMap.clear();
  horiEdgesRef.current.forEach(([outMap, inMap], center) => {
    const row = center.split("-")[0];
    if (row !== "top" && row !== "bottom") return;
    const neigh = [...outMap.keys(), ...inMap.keys()].filter(n => n.startsWith(row));
    for (let i = 0; i < neigh.length; i++) {
      for (let j = i + 1; j < neigh.length; j++) {
        const pt1 = neigh[i];
        const pt3 = neigh[j];
        const ori1 = inMap.has(pt1) ? "in" : "out";
        const ori2 = outMap.has(pt3) ? "out" : "in";
        const col1 = getEdgeColor(pt1, center, horiEdgesRef);
        const col2 = getEdgeColor(center, pt3, horiEdgesRef);
        const key = `${ori1}|${col1}|${ori2}|${col2}`;
        const tup = { pt1, orientation1: ori1, color1: col1, pt2: center, orientation2: ori2, color2: col2, pt3 };
        if (trioMap.has(key)) {
          console.error("No-pattern violation for key", key);
          alert("No Pattern rule violation – duplicate trio.");
        } else {
          trioMap.set(key, tup);
        }
      }
    }
  });
  console.log("trioMap entries:", Array.from(trioMap.entries()));
};

// updated hori edges
export const updateHorizontalEdges = (
  connectionPairs,
  horiEdgesRef,
  topOrientation,
  botOrientation,
  flippedConnectionsPerMove
) => {
  connectionPairs.forEach(pair => {
    if (pair.length !== 2) return;
    const [{ nodes: [t1, b1] }, { nodes: [t2, b2], color }] = pair;

    const rec = (from, to, ori, clr) => {
      if (!horiEdgesRef.current.has(from)) {
        horiEdgesRef.current.set(from, [new Map(), new Map()]);
      }
      const [o, i] = horiEdgesRef.current.get(from);
      if (ori === "out") { i.delete(to); o.set(to, clr); }
      else { o.delete(to); i.set(to, clr); }
    };

    const tKey = [t1, t2].sort().join(",");
    const newT = topOrientation.current.get(tKey);
    const entT = horiEdgesRef.current.get(t1) || [new Map(), new Map()];
    const oldT = entT[0].has(t2) ? "out" : entT[1].has(t2) ? "in" : null;
    rec(t1, t2, newT, color);
    rec(t2, t1, newT === "out" ? "in" : "out", color);

    const bKey = [b1, b2].sort().join(",");
    const newB = botOrientation.current.get(bKey);
    const entB = horiEdgesRef.current.get(b1) || [new Map(), new Map()];
    const oldB = entB[0].has(b2) ? "out" : entB[1].has(b2) ? "in" : null;
    rec(b1, b2, newB, color);
    rec(b2, b1, newB === "out" ? "in" : "out", color);

    buildTrioMap(horiEdgesRef);
  });
};
