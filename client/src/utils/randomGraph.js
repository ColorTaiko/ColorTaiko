const COLORS = [
  "#e6194b", "#3cb44b", "#ffe119", "#f58231", "#dcbeff", "#9a6324",
  "#fabebe", "#7f00ff", "#f032e6", "#42d4f4", "#800000", "#469990",
  "#bfef45", "#808000", "#ffd8b1", "#aaffc3", "#c8ad7f", "#4363d8", "#4b0082"
];

function randInt(max) {
  return Math.floor(Math.random() * max);
}

function pickTwoDistinct(n) {
  if (n <= 1) return null;
  const a = randInt(n);
  let b = randInt(n - 1);
  if (b >= a) b += 1;
  return [a, b];
}

function idTop(i) {
  return `top-${i}`;
}
function idBottom(i) {
  return `bottom-${i}`;
}

export function generateRandomGraph({ topCount = 6, bottomCount = 6, density = 0.12, seed = null } = {}) {
  const totalPossible = topCount * bottomCount;
  const targetEdges = Math.max(1, Math.floor(totalPossible * density));

  const connections = [];
  const connectionPairs = [];
  const connectionGroups = [];
  const groupMap = {};
  const topOrientationMap = {};
  const botOrientationMap = {};

  const usedEdges = new Set();
  let colorIndex = 0;
  const nextColor = () => {
    const c = COLORS[colorIndex % COLORS.length];
    colorIndex += 1;
    return c;
  };

  const makeConn = (topIdx, botIdx, color) => {
    const conn = { nodes: [idTop(topIdx), idBottom(botIdx)], color };
    connections.push(conn);
    usedEdges.add(`${topIdx},${botIdx}`);
    return conn;
  };

  const maxPairs = Math.min(Math.floor(Math.min(topCount, bottomCount) / 2), Math.floor(targetEdges / 2));

  let pairsCreated = 0;
  const attempts = maxPairs * 3 + 10;
  for (let a = 0; a < attempts && pairsCreated < maxPairs; a++) {
    const tops = pickTwoDistinct(topCount);
    const bots = pickTwoDistinct(bottomCount);

    if (!tops || !bots) {
        break;
    }
    
    const [t1, t2] = tops;
    const [b1, b2] = bots;

    if (usedEdges.has(`${t1},${b1}`) || usedEdges.has(`${t2},${b2}`) || (t1===t2) || (b1===b2)) {
        continue;
    }

    const color = nextColor();
    const connA = makeConn(t1, b1, color);
    const connB = makeConn(t2, b2, color);

    connectionPairs.push([connA, connB]);

    const topKey = [idTop(t1), idTop(t2)].sort().join(',');
    const botKey = [idBottom(b1), idBottom(b2)].sort().join(',');

    const group = {
      nodes: [idTop(t1), idTop(t2), idBottom(b1), idBottom(b2)],
      pairs: [connA, connB],
      color,
      combinations: [topKey, botKey]
    };
    connectionGroups.push(group);
    groupMap[topKey] = group;
    groupMap[botKey] = group;

    topOrientationMap[topKey] = Math.random() > 0.5 ? 'left' : 'right';
    botOrientationMap[botKey] = Math.random() > 0.5 ? 'left' : 'right';

    pairsCreated += 1;
  }

  // TODO: Add single edges until reach target

  const graph = {
    topRowCount: topCount,
    bottomRowCount: bottomCount,
    connections,
    connectionPairs,
    connectionGroups,
    groupMap,
    topOrientationMap,
    botOrientationMap,
  };

  return graph;
}

console.log(generateRandomGraph({topCount: 10, bottomCount: 10, seed: 4}))