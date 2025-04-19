// trioMap: Map<"orientation1|color1|orientation2|color2", { pt1, orientation1, color1, pt2, orientation2, color2, pt3 }>
export const trioMap = new Map();

/**
 * Call this whenever a horizontal edge between nodeA and nodeB is added or its color/orientation changes.
 * It will extract all new horizontal trios involving this edge and update trioMap.
 * @param {{ current: Map<string, [Map<string,string>, Map<string,string>]> }} horiEdgesRef
 *        Reference to horizontal edges: for each node -> [outgoingMap, incomingMap]
 * @param {string} nodeA  First node of the changed edge (e.g., "top-1")
 * @param {string} nodeB  Second node of the changed edge (same row: both top or both bottom)
 */
export function updateTrioMapOnEdgeChange(horiEdgesRef, nodeA, nodeB) {
  const rowA = nodeA.split('-')[0];
  const rowB = nodeB.split('-')[0];
  if (rowA !== rowB) return;

  const extractNum = id => parseInt(id.split('-')[1], 10);
  const processCenter = (center, other) => {
    const maps = horiEdgesRef.current.get(center);
    if (!maps) return;
    const [outMap, inMap] = maps;
    const neighbors = [...outMap.keys(), ...inMap.keys()].filter(n => n !== other);

    neighbors.forEach(neighbor => {
      const numOther = extractNum(other);
      const numNei   = extractNum(neighbor);
      const pt1 = numOther < numNei ? other : neighbor;
      const pt3 = numOther < numNei ? neighbor : other;
      const pt2 = center;
      const maps2 = horiEdgesRef.current.get(pt2);
      const [out2, in2] = maps2;
      let orientation1 = '';
      let color1 = '';
      if (in2.has(pt1)) {
        orientation1 = 'in';
        color1 = in2.get(pt1);
      } else if (out2.has(pt1)) {
        orientation1 = 'out';
        color1 = out2.get(pt1);
      }
      let orientation2 = '';
      let color2 = '';
      if (out2.has(pt3)) {
        orientation2 = 'out';
        color2 = out2.get(pt3);
      } else if (in2.has(pt3)) {
        orientation2 = 'in';
        color2 = in2.get(pt3);
      }

      const key = `${orientation1}|${color1}|${orientation2}|${color2}`;

      if (trioMap.has(key)) {
        trioMap.delete(key);
        throw new Error('No-pattern violation detected');
      } else {
        trioMap.set(key, { pt1, orientation1, color1, pt2, orientation2, color2, pt3 });
      }
    });
  };

  processCenter(nodeA, nodeB);
  processCenter(nodeB, nodeA);
}
