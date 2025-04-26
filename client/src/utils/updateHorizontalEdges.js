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
      console.log("LP = ", pair)
      
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
          console.log("Handling ", n1[i], n2[i])
          if (n1[i][0] == "t") {
            console.log("1. dir check, n1 = ", n1[i], "n1 f = ", n1[i][0], "d = ", topDirection)
            direction = topDirection;
          } else {
            console.log("2. dir check, n1 = ", n1[i], "n1 f = ", n1[i][0], "d = ", topDirection)
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
            // if (horiEdgesRef.current.get(n1[i])[0].has(color) && horiEdgesRef.current.get(n1[i])[0].get(color) != n2[i]) {
            //   // top1 already has another outgoing connection of the same color
            //   foldsFound.push(n1[i], n2[i])
            //   console.log("1. New Fold found at ", n1[i], n2[i])
            // } else {
              horiEdgesRef.current.get(n1[i])[0].set(color, n2[i]);
            // }
            // if (horiEdgesRef.current.get(n2[i])[1].has(color) && horiEdgesRef.current.get(n2[i])[1].get(color) != n1[i]) {
            //   // top2 already has another incoming connection of the same color
            //   foldsFound.push(n1[i], n2[i])
            //   console.log("2. New Fold found at ", n1[i], n2[i])
            // } else {
              horiEdgesRef.current.get(n2[i])[1].set(color, n1[i]);
            // }
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
            // if (horiEdgesRef.current.get(n2[i])[0].has(color) && horiEdgesRef.current.get(n2[i])[0].get(color) != n1[i]) {
            //   // top1 already has another outgoing connection of the same color
            //   foldsFound.push(n2[i], n1[i])
            //   console.log("New Fold found at ", n2[i], n1[i])
            // } else {
              horiEdgesRef.current.get(n2[i])[0].set(color, n1[i]);
            // }
            // if (horiEdgesRef.current.get(n1[i])[1].has(color) && horiEdgesRef.current.get(n1[i])[1].get(color) != n2[i]) {
            //   // top2 already has another incoming connection of the same color
            //   foldsFound.push(n2[i], n1[i])
            //   console.log("New Fold found at ", n1[i], n2[i])
            // } else {
              horiEdgesRef.current.get(n1[i])[1].set(color, n2[i]);
            // }
          }
          console.log("HER: ", structuredClone(horiEdgesRef.current));
          // console.log("April Tops: ", topOrientation)
          // console.log("April Bots: ", botOrientation)
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
              // console.log("Sorted map = ", sortedMap)
              for (let [otherNode, currColor] of edgeMap) {
                if (currColor[0] == "#") {
                  let trueNode = horiEdgesRef.current.get(mapNode)[i].get(currColor)
                  if (trueNode != otherNode) {
                    foldsFound.add(mapNode);
                    foldsFound.add(otherNode);
                    foldsFound.add(trueNode);
                  }
                }
              }
            }
          }
        }
        console.log("foldsFound = ",structuredClone(foldsFound))
      }
    }
  })
};
