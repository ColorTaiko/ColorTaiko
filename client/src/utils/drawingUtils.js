let _conflictEdges = [];
export function drawConnections(
  svgRef,
  connections,
  connectionPairs,
  offset,
  topOrientation,
  botOrientation,
  arrowOptions = { color: "red", size: 10 }
) {
  if (!svgRef.current) return;
  const svg = svgRef.current;
  // Clear any existing children.
  while (svg.firstChild) svg.removeChild(svg.firstChild);
  const svgRect = svg.getBoundingClientRect();
  // Helper: Move a point toward another by "dist".
  const adjustPoint = (x1, y1, x2, y2, dist) => {
    const dx = x2 - x1, dy = y2 - y1;
    const len = Math.hypot(dx, dy);
    const t = (len - dist) / len;
    return { x: x1 + dx * t, y: y1 + dy * t };
  };
  // Draw straight (Vertical / diagonal) edges.
  connections.forEach(({ nodes: [a, b], color }) => {
    const A = document.getElementById(a), B = document.getElementById(b);
    if (!A || !B) return;
    const rA = A.getBoundingClientRect(), rB = B.getBoundingClientRect();
    const x1 = rA.left + rA.width / 2  - svgRect.left;
    const y1 = rA.top  + rA.height / 2 - svgRect.top;
    const x2 = rB.left + rB.width / 2  - svgRect.left;
    const y2 = rB.top  + rB.height / 2 - svgRect.top;
    const p1 = adjustPoint(x1, y1, x2, y2, offset);
    const p2 = adjustPoint(x2, y2, x1, y1, offset);
    const line = document.createElementNS("http://www.w3.org/2000/svg","line");
    line.setAttribute("x1", p1.x);
    line.setAttribute("y1", p1.y);
    line.setAttribute("x2", p2.x);
    line.setAttribute("y2", p2.y);
    line.setAttribute("stroke", color);
    line.setAttribute("stroke-width", "4");
    line.setAttribute("stroke-linecap", "round");
    svg.appendChild(line);
  });
  // Draw curved (Horizontal) connections.
  connectionPairs.forEach(pair => {
    if (pair.length !== 2) return;
    const [cA, cB] = pair;
    const [[t1, b1], [t2, b2]] = [cA.nodes, cB.nodes];
    const topKey = [t1, t2].sort().join(",");
    const botKey = [b1, b2].sort().join(",");
    const topDir = topOrientation.current.get(topKey) || "out";
    const botDir = botOrientation.current.get(botKey) || "out";
    const makeCurve = (fromId, toId, isTop, dir, color) => {
      const F = document.getElementById(fromId);
      const T = document.getElementById(toId);
      if (!F || !T) return null;
      const rF = F.getBoundingClientRect(), rT = T.getBoundingClientRect();
      const x1 = rF.left + rF.width / 2  - svgRect.left;
      const y1 = rF.top  + rF.height / 2 - svgRect.top;
      const x2 = rT.left + rT.width / 2  - svgRect.left;
      const y2 = rT.top  + rT.height / 2 - svgRect.top;
      const p1 = adjustPoint(x1, y1, x2, y2, offset);
      const p2 = adjustPoint(x2, y2, x1, y1, offset);
      const dist = Math.hypot(p2.x - p1.x, p2.y - p1.y);
      const cx = (p1.x + p2.x) / 2;
      const cy = isTop
        ? Math.min(p1.y, p2.y) - dist / 5
        : Math.max(p1.y, p2.y) + dist / 5;
      // Build path.
      const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
      path.setAttribute("d", `M ${p1.x}, ${p1.y} Q ${cx}, ${cy} ${p2.x}, ${p2.y}`);
      path.setAttribute("stroke", color);
      path.setAttribute("fill", "none");
      path.setAttribute("stroke-width", "4");
      path.setAttribute("stroke-linecap", "round");
      // Build arrowhead.
      const L = path.getTotalLength();
      const m1 = path.getPointAtLength(L / 2 - 1);
      const m2 = path.getPointAtLength(L / 2 + 1);
      const ang = Math.atan2(m2.y - m1.y, m2.x - m1.x) * 180 / Math.PI;
      const mid = path.getPointAtLength(L / 2);
      const arrow = document.createElementNS("http://www.w3.org/2000/svg","polygon");
      const s = arrowOptions.size;
      const pts = dir === "out"
        ? `${mid.x}, ${mid.y - s} ${mid.x - s}, ${mid.y} ${mid.x}, ${mid.y + s}`
        : `${mid.x}, ${mid.y - s} ${mid.x + s}, ${mid.y} ${mid.x}, ${mid.y + s}`;
      arrow.setAttribute("points", pts);
      arrow.setAttribute("transform", `rotate(${ang}, ${mid.x}, ${mid.y})`);
      arrow.setAttribute("fill", color);
      if (_conflictEdges.some(e =>
        (e.from === fromId && e.to === toId) ||
        (e.from === toId && e.to === fromId)
      )) {
        path.classList.add("flash-horizontal");
        arrow.classList.add("flash-horizontal");
      }
      return { path, arrow };
    };
    const [st1, st2] = [t1, t2].sort((A, B) => +A.split("-")[1] - +B.split("-")[1]);
    const [sb1, sb2] = [b1, b2].sort((A, B) => +A.split("-")[1] - +B.split("-")[1]);
    const topCurve = makeCurve(st1, st2, true,  topDir, cA.color);
    const botCurve = makeCurve(sb1, sb2, false, botDir, cA.color);
    if (topCurve) {
      svg.appendChild(topCurve.path);
      svg.appendChild(topCurve.arrow);
    }
    if (botCurve) {
      svg.appendChild(botCurve.path);
      svg.appendChild(botCurve.arrow);
    }
  });
}
const trioMap = new Map();
function getEdgeColor(a, b, horiEdgesRef) {
  const entry = horiEdgesRef.current.get(a);
  if (!entry) return null;
  const [outM, inM] = entry;
  return outM.get(b) || inM.get(b) || null;
}
export function buildTrioMap(horiEdgesRef, topOrientation, botOrientation) {
  _conflictEdges = [];
  trioMap.clear();
  horiEdgesRef.current.forEach(([outMap, inMap], center) => {
    const row = center.split("-")[0];
    if (row !== "top" && row !== "bottom") return;
    const neighbors = Array.from(new Set([
      ...outMap.keys(),
      ...inMap.keys()
    ]))
      .filter(id => id.startsWith(row))
      .sort((A, B) => +A.split("-")[1] - +B.split("-")[1]);
    neighbors.forEach((n1, i) => {
      neighbors.slice(i + 1).forEach(n2 => {
        const idx = id => +id.split("-")[1];
        const ic = idx(center), i1 = idx(n1), i2 = idx(n2);
        let pt1, pt3;
        if ((ic < i1 && ic < i2) || (ic > i1 && ic > i2)) {
          if (i1 > i2) { pt1 = n1; pt3 = n2; }
          else         { pt1 = n2; pt3 = n1; }
        } else {
          if (i1 < i2) { pt1 = n1; pt3 = n2; }
          else         { pt1 = n2; pt3 = n1; }
        }
        const combo12 = [pt1, center].sort().join(",");
        const raw1 = (row === "top"
                      ? topOrientation.current.get(combo12)
                      : botOrientation.current.get(combo12)
                    ) || "out";
        const o1 = combo12 === `${pt1},${center}` ? raw1 : (raw1 === "out" ? "in" : "out");
        const combo23 = [center, pt3].sort().join(",");
        const raw2 = (row === "top"
                      ? topOrientation.current.get(combo23)
                      : botOrientation.current.get(combo23)
                    ) || "out";
        const o2 = combo23 === `${center},${pt3}` ? raw2 : (raw2 === "out" ? "in" : "out");
        const c1 = getEdgeColor(pt1, center, horiEdgesRef);
        const c2 = getEdgeColor(center, pt3, horiEdgesRef);
        const key = `${o1} | ${c1} | ${o2} | ${c2}`;
        if (trioMap.has(key)) {
          const old = trioMap.get(key);
          const oldT = `${old.pt1}-${old.pt2}-${old.pt3}`;
          const newT = `${pt1}-${center}-${pt3}`;
          // const msg = `No Pattern rule violation – conflict between trio ${oldT} & trio ${newT}`;
          const msg = `No-Pattern fails! Check the flashing edges to see your mistake.`
          console.error(msg);
          // Flash both old & new horizontal edges.
          _conflictEdges = [
            { from: old.pt1, to: old.pt2 },
            { from: old.pt2, to: old.pt3 },
            { from: pt1,     to: center  },
            { from: center,  to: pt3    }
          ];
          throw new Error(msg);
        }
        trioMap.set(key, { pt1, pt2: center, pt3, orientation1: o1, color1: c1, orientation2: o2, color2: c2 });
      });
    });
  });
  console.log("Current trioMap entries:");
  trioMap.forEach(({pt1, pt2, pt3, orientation1, color1, orientation2, color2}, key) => {
    console.log(
      `  key = ${key} → trio: ` +
      `${pt1} (${orientation1}, ${color1}) → ` +
      `${pt2} → (${orientation2}, ${color2}) → ` +
      `${pt3}`
    );
  });
}
export function updateHorizontalEdges(
  connectionPairs,
  horiEdgesRef,
  topOrientation,
  botOrientation
) {
  horiEdgesRef.current.clear();
  connectionPairs.forEach(pair => {
    if (pair.length !== 2) return;
    const [{ nodes: [t1, b1] }, { nodes: [t2, b2], color }] = pair;
    const record = (from, to, ori) => {
      if (!horiEdgesRef.current.has(from)) {
        horiEdgesRef.current.set(from, [new Map(), new Map()]);
      }
      const [outM, inM] = horiEdgesRef.current.get(from);
      if (ori === "out") {
        inM.delete(to);
        outM.set(to, color);
      } else {
        outM.delete(to);
        inM.set(to, color);
      }
    };
    const topKey = [t1, t2].sort().join(",");
    const topOri = topOrientation.current.get(topKey) || "out";
    record(t1, t2, topOri);
    record(t2, t1, topOri === "out" ? "in" : "out");
    const botKey = [b1, b2].sort().join(",");
    const botOri = botOrientation.current.get(botKey) || "out";
    record(b1, b2, botOri);
    record(b2, b1, botOri === "out" ? "in" : "out");
  });
  buildTrioMap(horiEdgesRef, topOrientation, botOrientation);
}