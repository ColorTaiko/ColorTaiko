export const updateHorizontalEdges = (
  latestPair, connectionPairs, horiEdgesRef, topOrientation, botOrientation, 
  foldsFound) => {
  horiEdgesRef.current = new Map();
  connectionPairs.forEach((pair) => {
    if (pair.length === 2) {
      const [
        {
          nodes: [startNode1, bottomNode1],
        },
        {
          nodes: [startNode2, bottomNode2],
          color,
        },
      ] = pair;
      // console.log("LP = ", pair)
      
      const [firstConnection, secondConnection] = pair;
      const [top1, bottom1] = firstConnection.nodes;
      const [top2, bottom2] = secondConnection.nodes;
    
      const topCombination = [top1, top2].sort().join(',');
      const bottomCombination = [bottom1, bottom2].sort().join(',');
      const topDirection = topOrientation.current.get(topCombination);
      const bottomDirection = botOrientation.current.get(bottomCombination);
      // let connColors = getAllConnColors(connectionPairs)
      let tops = topCombination.split(",")
      let bottoms = bottomCombination.split(",")
      let n1 = [tops[0], bottoms[0]]
      let n2 = [tops[1], bottoms[1]]
      // n2[i]
      // let combos = [topCombination, bottomCombination]
      
      if (horiEdgesRef && horiEdgesRef.current) {
        for (let i = 0; i < 2; i += 1) {
          var direction;
          // console.log("Handling ", n1[i], n2[i])
          if (n1[i][0] == "t") {
            // console.log("1. dir check, n1 = ", n1[i], "n1 f = ", n1[i][0], "d = ", topDirection)
            direction = topDirection;
          } else {
            // console.log("2. dir check, n1 = ", n1[i], "n1 f = ", n1[i][0], "d = ", topDirection)
            direction = bottomDirection;
          }
          if (direction == "right") {
            if (horiEdgesRef.current.has(n1[i]) == false)  { // top1 not logged
              // log top1 for the first time and initialize maps
              horiEdgesRef.current.set(n1[i], [new Map([[n2[i], color]]), new Map()]);
            } else {
              horiEdgesRef.current.get(n1[i])[0].set(n2[i], color)
            }
            if (horiEdgesRef.current.has(n2[i]) == false) { // top2 not logged
              // log top2 for the first time and initialize maps
              horiEdgesRef.current.set(n2[i], [new Map(), new Map([[n1[i], color]])]);
            } else {
              horiEdgesRef.current.get(n2[i])[1].set(n1[i], color)
            }
              horiEdgesRef.current.get(n1[i])[0].set(color, n2[i]);
              horiEdgesRef.current.get(n2[i])[1].set(color, n1[i]);
          } else {
            if (horiEdgesRef.current.has(n2[i]) == false)  { // top1 not logged
              // log top1 for the first time and initialize maps
              horiEdgesRef.current.set(n2[i], [new Map([[n1[i], color]]), new Map()]);
            } else {
              horiEdgesRef.current.get(n2[i])[0].set(n1[i], color)
            }
            if (horiEdgesRef.current.has(n1[i]) == false) { // top2 not logged
              // log top2 for the first time and initialize maps
              horiEdgesRef.current.set(n1[i], [new Map(), new Map([[n2[i], color]])]);
            } else {
              horiEdgesRef.current.get(n1[i])[1].set(n2[i], color)
            }
              horiEdgesRef.current.get(n2[i])[0].set(color, n1[i]);
              horiEdgesRef.current.get(n1[i])[1].set(color, n2[i]);
          }
          // console.log("HER: ", structuredClone(horiEdgesRef.current));
        }

        // now look for folds

        for (let [mapNode, mapNodeLists] of horiEdgesRef.current) {
          // iterature through outgoing/incoming lists
          for (let i = 0; i < 2; i += 1) {
            // edgeMap = outgoing edges or incoming edges
            let edgeMap = mapNodeLists[i]
            // ≠ 0 --> there is a fold in this map
            if (edgeMap.size % 2 != 0) {
              // sort the map by value
              for (let [otherNode, currColor] of edgeMap) {
                if (currColor[0] == "#") {
                  let trueNode = horiEdgesRef.current.get(mapNode)[i].get(currColor)
                  if (trueNode != otherNode) {
                    let l = [mapNode, otherNode];
                    l.sort();
                    let a = "" + l[0] + "," + l[1]
                    foldsFound.add(a)
                    l = [mapNode, trueNode];
                    l.sort();
                    let b = "" + l[0] + "," + l[1]
                    foldsFound.add(b)
                  }
                }
              }
            }
          }
        }
        // console.log("foldsFound = ",structuredClone(foldsFound))
      }
    }
  })
};
