/**
 * Draws connection lines and curved paths between nodes on an SVG canvas.
 * @param svgRef
 * @param connections
 * @param connectionPairs
 * @param offset
 * @param topOrientation
 * @param botOrientation
 * @param arrowOptions
 * @param horiEdgesRef
 */
export function drawConnections(
  svgRef,
  connections,
  connectionPairs,
  offset,
  topOrientation,
  botOrientation,
  arrowOptions = { color: 'red', size: 10 },
  horiEdgesRef
) {
  if (!svgRef.current) return;
  const svg = svgRef.current;
  while (svg.firstChild) svg.removeChild(svg.firstChild);
  const svgRect = svg.getBoundingClientRect();

  const adjustPoint = (x1, y1, x2, y2, dist) => {
    const dx = x2 - x1,
          dy = y2 - y1,
          len = Math.hypot(dx, dy),
          t = (len - dist) / len;
    return { x: x1 + dx * t, y: y1 + dy * t };
  };

  connections.forEach(({ nodes: [a,b], color }) => {
    const A = document.getElementById(a),
          B = document.getElementById(b);
    if (!A||!B) return;
    const rA = A.getBoundingClientRect(),
          rB = B.getBoundingClientRect();
    const x1 = rA.left + rA.width/2  - svgRect.left,
          y1 = rA.top  + rA.height/2 - svgRect.top,
          x2 = rB.left + rB.width/2  - svgRect.left,
          y2 = rB.top  + rB.height/2 - svgRect.top;
    const p1 = adjustPoint(x1,y1,x2,y2,offset),
          p2 = adjustPoint(x2,y2,x1,y1,offset);

    const line = document.createElementNS('http://www.w3.org/2000/svg','line');
    line.setAttribute('x1',p1.x);
    line.setAttribute('y1',p1.y);
    line.setAttribute('x2',p2.x);
    line.setAttribute('y2',p2.y);
    line.setAttribute('stroke',color);
    line.setAttribute('stroke-width','4');
    line.setAttribute('stroke-linecap','round');
    svg.appendChild(line);
  });

  connectionPairs.forEach(pair => {
    if (pair.length !== 2) return;
    const [cA,cB] = pair;
    const [[t1,b1],[t2,b2]] = [cA.nodes, cB.nodes];
    const topKey = [t1,t2].sort().join(','),
          botKey = [b1,b2].sort().join(',');
    const topDir = topOrientation.current.get(topKey) || 'out',
          botDir = botOrientation.current.get(botKey) || 'out';

    const makeCurve = (fromId, toId, isTop, dir, color) => {
      const F = document.getElementById(fromId),
            T = document.getElementById(toId);
      if (!F||!T) return null;
      const rF = F.getBoundingClientRect(),
            rT = T.getBoundingClientRect();
      const x1 = rF.left + rF.width/2  - svgRect.left,
            y1 = rF.top  + rF.height/2 - svgRect.top,
            x2 = rT.left + rT.width/2  - svgRect.left,
            y2 = rT.top  + rT.height/2 - svgRect.top;
      const p1 = adjustPoint(x1,y1,x2,y2,offset),
            p2 = adjustPoint(x2,y2,x1,y1,offset);
      const dx = p2.x-p1.x, dy = p2.y-p1.y, dist = Math.hypot(dx,dy);
      const cx = (p1.x+p2.x)/2,
            cy = isTop
              ? Math.min(p1.y,p2.y) - dist/5
              : Math.max(p1.y,p2.y) + dist/5;

      const path = document.createElementNS('http://www.w3.org/2000/svg','path');
      path.setAttribute('d',`M ${p1.x},${p1.y} Q ${cx},${cy} ${p2.x},${p2.y}`);
      path.setAttribute('stroke',color);
      path.setAttribute('fill','none');
      path.setAttribute('stroke-width','4');
      path.setAttribute('stroke-linecap','round');

      const L = path.getTotalLength();
      const m1 = path.getPointAtLength(L/2 - 1),
            m2 = path.getPointAtLength(L/2 + 1),
            ang = Math.atan2(m2.y-m1.y, m2.x-m1.x) * 180 / Math.PI,
            mid = path.getPointAtLength(L/2);

      const arrow = document.createElementNS('http://www.w3.org/2000/svg','polygon');
      const s = arrowOptions.size;
      const pts = dir === 'out'
        ? `${mid.x},${mid.y-s} ${mid.x-s},${mid.y} ${mid.x},${mid.y+s}`
        : `${mid.x},${mid.y-s} ${mid.x+s},${mid.y} ${mid.x},${mid.y+s}`;
      arrow.setAttribute('points',pts);
      arrow.setAttribute('fill',color);
      arrow.setAttribute('transform',`rotate(${ang},${mid.x},${mid.y})`);

      return { path, arrow };
    };

    const [st1,st2] = [t1,t2].sort((a,b)=>+a.split('-')[1]-+b.split('-')[1]),
          [sb1,sb2] = [b1,b2].sort((a,b)=>+a.split('-')[1]-+b.split('-')[1]);
    const topCurve = makeCurve(st1,st2,true,  topDir, cA.color);
    const botCurve = makeCurve(sb1,sb2,false, botDir, cA.color);

    if (topCurve) { svg.appendChild(topCurve.path);  svg.appendChild(topCurve.arrow); }
    if (botCurve) { svg.appendChild(botCurve.path);  svg.appendChild(botCurve.arrow); }
  });
}

const trioMap = new Map();

function getEdgeColor(a,b,horiEdgesRef){
  const entry = horiEdgesRef.current.get(a);
  if (!entry) return null;
  const [outM,inM] = entry;
  return outM.get(b) || inM.get(b) || null;
}

export function buildTrioMap(horiEdgesRef, topOrientation, botOrientation) {
  trioMap.clear();

  horiEdgesRef.current.forEach(([outMap,inMap], center) => {
    const row = center.split('-')[0];
    if (row !== 'top' && row !== 'bottom') return;

    const neighbors = [...new Set([ ...outMap.keys(), ...inMap.keys() ])]
      .filter(n=>n.startsWith(row))
      .sort((a,b)=>+a.split('-')[1] - +b.split('-')[1]);

    for (let i=0; i<neighbors.length; i++){
      for (let j=i+1; j<neighbors.length; j++){
        const pt1 = neighbors[i], pt2 = center, pt3 = neighbors[j];

        // sorted combos for lookup:
        const combo12 = [pt1,pt2].sort().join(','),
              combo23 = [pt2,pt3].sort().join(',');
        let o1 = (row==='top'
                    ? topOrientation.current.get(combo12)
                    : botOrientation.current.get(combo12)
                 ) || 'out';
        let o2 = (row==='top'
                    ? topOrientation.current.get(combo23)
                    : botOrientation.current.get(combo23)
                 ) || 'out';
        const idx = id=>+id.split('-')[1];
        if (idx(pt1) > idx(pt2)) o1 = (o1==='in'?'out':'in');
        if (idx(pt2) > idx(pt3)) o2 = (o2==='in'?'out':'in');

        const c1 = getEdgeColor(pt1,pt2,horiEdgesRef),
              c2 = getEdgeColor(pt2,pt3,horiEdgesRef),
              key = `${o1}|${c1}|${o2}|${c2}`;

        if (trioMap.has(key)) {
          const old = trioMap.get(key),
                oldT = `${old.pt1}-${old.pt2}-${old.pt3}`,
                newT = `${pt1}-${pt2}-${pt3}`;
          console.error(
            `No Pattern rule violation – conflict between trio ${oldT} and trio ${newT}`
          );
          alert(
            `No Pattern rule violation – conflict between trio ${oldT} and trio ${newT}`
          );
        }

        trioMap.set(key, { pt1,pt2,pt3,o1,c1,o2,c2 });
      }
    }
  });

  console.log("Current trioMap entries:");
  trioMap.forEach(({pt1,pt2,pt3,o1,c1,o2,c2}, key) => {
    console.log(
      `  key=${key} → trio: ${pt1} (${o1},${c1}) → ` +
      `${pt2} → (${o2},${c2}) → ${pt3}`
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
    const [{nodes:[t1,b1]},{nodes:[t2,b2],color}] = pair;

    const record = (from,to,ori) => {
      if (!horiEdgesRef.current.has(from)) {
        horiEdgesRef.current.set(from,[new Map(),new Map()]);
      }
      const [outM,inM] = horiEdgesRef.current.get(from);
      if (ori==='out') {
        inM.delete(to);
        outM.set(to,color);
      } else {
        outM.delete(to);
        inM.set(to,color);
      }
    };

    {
      const key = [t1,t2].sort().join(','),
            ori = topOrientation.current.get(key) || 'out';
      record(t1,t2,ori);
      record(t2,t1, ori==='out'?'in':'out');
    }
    {
      const key = [b1,b2].sort().join(','),
            ori = botOrientation.current.get(key) || 'out';
      record(b1,b2,ori);
      record(b2,b1, ori==='out'?'in':'out');
    }
  });

  buildTrioMap(horiEdgesRef, topOrientation, botOrientation);
}
