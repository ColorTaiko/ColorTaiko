
var foldFound = 0;
var foldFoundThisTurn = 0;

function arrayEquals(a, b) {
  return Array.isArray(a) &&
    Array.isArray(b) &&
    a.length === b.length &&
    a.every((val, index) => val === b[index]);
}

function isListInSet(set, list) {
  for (const item of set) {
    if (arrayEquals(item, list)) {
      return true;
    }
  }
  return false;
}

export const updateHorizontalEdges = (connectionPairs, horiEdgesRef, topOrientation, botOrientation, flippedConnectionsPerMove, foldsFound) => {
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
  
      const [firstConnection, secondConnection] = pair;
      const [top1, bottom1] = firstConnection.nodes;
      const [top2, bottom2] = secondConnection.nodes;
    
      const topCombination = [top1, top2].sort().join(',');
      const bottomCombination = [bottom1, bottom2].sort().join(',');
      const topDirection = topOrientation.current.get(topCombination);
      const bottomDirection = botOrientation.current.get(bottomCombination);
  
    let horiEdgeTop = [top1, top2, color];
    let horiEdgeBottom = [bottom1, bottom2, color];
    console.log("Updated new horizontal edges: ", horiEdgeTop, horiEdgeBottom);

    let a = [top1, bottom1];
    let b = [top2, bottom2];

    // let foldsFound = []
    let seen = new Set();
    let flipped = 0;
    console.log("FCPM = ", flippedConnectionsPerMove, " length = ", flippedConnectionsPerMove.length)
    if (flippedConnectionsPerMove.length > 0 && flippedConnectionsPerMove[0].length > 0) {
      console.log("Hello")
    for (let i = 0; i < flippedConnectionsPerMove.length; i += 1) {
      let conn = flippedConnectionsPerMove[i]
      let nodeA = conn[0]; let nodeB = conn[1];
      let nodes = [nodeA, nodeB]
      console.log("Curr nodes = ", structuredClone(nodes))
 
      let connDir = conn[2]
      var connColor;
      if (connDir == "right") {
        connColor = horiEdgesRef.current.get(nodeA)[0].get(nodeB);
        // console.log("right0 horiEdges list: ", horiEdgesRef.current);
        if (connColor != undefined) {
          console.log("right case, conn color = ", connColor, " nodeA = ", nodeA, " nodeB = ", nodeB)
          console.log("pre right swap: ", structuredClone(horiEdgesRef.current));
          horiEdgesRef.current.get(nodeA)[0].delete(nodeB);
          horiEdgesRef.current.get(nodeB)[1].delete(nodeA);
          if (horiEdgesRef.current.get(nodeA)[0].get(connColor) == nodeB) {
            horiEdgesRef.current.get(nodeA)[0].delete(connColor);
          }
          if (horiEdgesRef.current.get(nodeB)[1].get(connColor) == nodeA) {
            horiEdgesRef.current.get(nodeB)[1].delete(connColor);
          }
          // horiEdgesRef.current.get(nodeA)[0].set("Hellooooo", connColor);
          horiEdgesRef.current.get(nodeB)[0].set(nodeA, connColor);
          horiEdgesRef.current.get(nodeA)[1].set(nodeB, connColor);
          horiEdgesRef.current.get(nodeB)[0].set(connColor, nodeA);
          horiEdgesRef.current.get(nodeA)[1].set(connColor, nodeB);
          console.log("post right swap: ", structuredClone(horiEdgesRef.current));
          flipped = 1;
        }
      } else if (connDir == "left") {
        connColor = horiEdgesRef.current.get(nodeA)[1].get(nodeB);
        if (connColor != undefined) {
          console.log("left case, color = ", connColor, " nodeA = ", nodeA, " nodeB = ", nodeB)
          console.log("pre left swap: ", structuredClone(horiEdgesRef.current));
          horiEdgesRef.current.get(nodeA)[1].delete(nodeB);
          horiEdgesRef.current.get(nodeB)[0].delete(nodeA);
          if (horiEdgesRef.current.get(nodeA)[1].get(connColor) == nodeB) {
            horiEdgesRef.current.get(nodeA)[1].delete(connColor);
          }
          if (horiEdgesRef.current.get(nodeB)[0].get(connColor) == nodeA) {
            horiEdgesRef.current.get(nodeB)[0].delete(connColor);
          }
          horiEdgesRef.current.get(nodeB)[1].set(nodeA, connColor);
          horiEdgesRef.current.get(nodeA)[0].set(nodeB, connColor);
          horiEdgesRef.current.get(nodeB)[1].set(connColor, nodeA);
          horiEdgesRef.current.get(nodeA)[0].set(connColor, nodeB);
          console.log("post left swap: ", structuredClone(horiEdgesRef.current));
          flipped = 1;
        }
      }
      if (connColor != undefined) {
      // nodeA outgoing
      for (const key of horiEdgesRef.current.get(nodeA)[0].entries()) {
        if (key != nodeB && horiEdgesRef.current.get(nodeA)[0].get(key) == connColor) {
          foldsFound.push(nodeA, nodeB)
          break;
        }
      }
      // nodeA incoming
      for (const key of horiEdgesRef.current.get(nodeA)[1].entries()) {
        if (key != nodeB && horiEdgesRef.current.get(nodeA)[1].get(key) == connColor) {
          foldsFound.push(nodeA, nodeB)
          break;
        }
      }
      // nodeB outgoing
      for (const key of horiEdgesRef.current.get(nodeB)[0].entries()) {
        if (key != nodeA && horiEdgesRef.current.get(nodeB)[0].get(key) == connColor) {
          foldsFound.push(nodeB, nodeA)
          break;
        }
      }
      // nodeB incoming
      for (const key of horiEdgesRef.current.get(nodeB)[1].entries()) {
        if (key != nodeA && horiEdgesRef.current.get(nodeB)[1].get(key) == connColor) {
          foldsFound.push(nodeB, nodeA)
          break;
        }
      }
      }
    }
  }
    
    if (foldsFound.length >= 1) {
      console.log("FOLDS FOUND = ", foldsFound)
      // alert("Dev debug: Check console for folds found.")
    }

    // if (flipped == 0) {
      for (let i = 0; i < 2; i += 1) { // check for a fold for top and bottom horizontal connections
        let ai = a[i];
        let bi = b[i];
        console.log("Handling ", ai, ",", bi, color)
        console.log("pre handle: ", structuredClone(horiEdgesRef.current));
        if (horiEdgesRef && horiEdgesRef.current) {
          // handle outgoing connections for nodeA:
          // if we have made a connection with nodeA before
          if (horiEdgesRef.current.has(ai)) { 
            let colorMerged = 0;
            let nodesFlipped = 0;

            // orientation swap; delete old connection
            if (horiEdgesRef.current.get(ai)[1].has(bi)) {
              console.log("outgoing ori connection found", ai, bi)
              let oldColor = horiEdgesRef.current.get(ai)[1].get(bi);
              horiEdgesRef.current.get(ai)[1].delete(oldColor);
              horiEdgesRef.current.get(ai)[1].delete(bi);
              nodesFlipped = 1;
            }
            
            // if nodeB is a seen node, and the color got merged
            // horiEdgesRef.current.get(ai)[0].has(bi) && 
            if (horiEdgesRef.current.get(ai)[0].get(bi) != color) { 
              // delete the old color of nodeA -> nodeB
              console.log("outgoing color merge found", ai, bi) 
              let oldColor = horiEdgesRef.current.get(ai)[0].get(bi);
              horiEdgesRef.current.get(ai)[0].delete(oldColor);
              horiEdgesRef.current.get(ai)[0].delete(bi);
              colorMerged = 1;
            } 

            // set color of the connection, nodeA --[newColor]--> nodeB
            horiEdgesRef.current.get(ai)[0].set(bi, color);
            // newColor already exists in another outgoing connection
            if (foldFound == 0 && !nodesFlipped && (!colorMerged) && horiEdgesRef.current.get(ai)[0].get(color) != bi) { 
              console.log("1: Fold found at", ai, " ", bi, "; Undo to remove the fold.");
              // alert("1: Fold found at", ai, " ", bi, "; Undo to remove the fold.");
              foldsFound.push(ai, bi)
              foldFound = 1;

            } else { // newColor is a new outgoing color for nodeA
              console.log("new color made", ai, bi)
              horiEdgesRef.current.get(ai)[0].set(color, bi);
            }
          // nodeA is an unseen node, initialize its dictionaries
          } else { 
            horiEdgesRef.current.set(ai, [new Map([[bi, color]]), new Map()]);
            horiEdgesRef.current.get(ai)[0].set(color, bi);
          }

          // handle incoming connections for nodeB

          // if we have made a connection with nodeB before
          if (horiEdgesRef.current.has(bi)) { 
            let colorMerged = 0;
            let nodesFlipped = 0;
            // orientation swap; delete old connection
            if (horiEdgesRef.current.get(bi)[0].has(ai)) {
              console.log("incoming ori connection found", ai, bi)
              let oldColor = horiEdgesRef.current.get(bi)[0].get(ai);
              horiEdgesRef.current.get(bi)[0].delete(oldColor);
              horiEdgesRef.current.get(bi)[0].delete(ai);
              nodesFlipped = 1;
            }

            // if nodeA is a seen node, and the color got merged
            // horiEdgesRef.current.get(bi)[1].has(ai) && 
            if (horiEdgesRef.current.get(bi)[1].get(ai) != color) { 
              // delete the old color of nodeA -> nodeB
              console.log("incoming color merge found", ai, bi)
              let oldColor = horiEdgesRef.current.get(bi)[1].get(ai);
              horiEdgesRef.current.get(bi)[1].delete(oldColor);
              horiEdgesRef.current.get(bi)[1].delete(ai);
              colorMerged = 1;
            } 
            // set color of the connection, nodeA --[newColor]--> nodeB
            horiEdgesRef.current.get(bi)[1].set(ai, color);
            // newColor already exists in another outgoing connection
            if (foldFound == 0 && !nodesFlipped && (!colorMerged) && horiEdgesRef.current.get(bi)[1].get(color) != ai) { 
              console.log("2: Fold found at", ai, " ", bi, "; Undo to remove the fold.");
              // alert("2: Fold found at", ai, " ", bi, "; Undo to remove the fold.");
              foldsFound.push(ai, bi)
              foldFound = 1
            } else { // newColor is a new outgoing color for nodeA
              console.log("incoming new color made", ai, bi)
              horiEdgesRef.current.get(bi)[1].set(color, ai);
            }
          // nodeA is an unseen node, initialize its dictionaries
          } else { 
            horiEdgesRef.current.set(bi, [new Map(), new Map([[ai, color]])]);
            horiEdgesRef.current.get(bi)[1].set(color, ai);
          }
        }
      }
    // } 
    // else {
    //   flippedConnectionsPerMove.length = 0
    // }
    // console.log("horiEdges list: ", horiEdgesRef.current);
    console.log("post handling horiEdges list: ", structuredClone(horiEdgesRef.current));
  }
  })
};
