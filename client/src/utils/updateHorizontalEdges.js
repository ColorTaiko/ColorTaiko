
var foldFound = 0;
var foldFoundThisTurn = 0;

function containsArray(collection, target) {
  for (const arr of collection) {
    // Check if the lengths are different.
    if (arr.length !== target.length) continue;
    
    // Check each element for equality.
    const allEqual = arr.every((value, index) => value === target[index]);
    if (allEqual) {
      return true;
    }
  }
  return false;
}

function containsArray2(collection, target) {
  return collection.some(arr => {
    // Ensure both arr and target have at least two elements.
    if (arr.length < 2 || target.length < 2) return false;
    return arr[0] === target[0] && arr[1] === target[1];
  });
}

function getAllConnColors(connectionPairs) {
  let connColors = new Map()
  connectionPairs.forEach((pair) => {
    let connSet = new Set();
    for (let i = 0; i < pair.length; i += 1) {
      connSet.add(pair[0].nodes[i])
      connSet.add(pair[1].nodes[i])
      connColors.set(connSet, pair[0].color)
    }
  })
  return connColors
}

export const updateHorizontalEdges = (
  latestPair, connectionPairs, horiEdgesRef, topOrientation, botOrientation, 
  flippedConnectionsPerMove, foldsFound, mergedColornodesPerMove, currMergeColor) => {
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
            if (horiEdgesRef.current.get(n1[i])[0].has(color) && horiEdgesRef.current.get(n1[i])[0].get(color) != n2[i]) {
              // top1 already has another outgoing connection of the same color
              foldsFound.push(n1[i], n2[i])
              console.log("1. New Fold found at ", n1[i], n2[i])
            } else {
              horiEdgesRef.current.get(n1[i])[0].set(color, n2[i]);
            }
            if (horiEdgesRef.current.get(n2[i])[1].has(color) && horiEdgesRef.current.get(n2[i])[1].get(color) != n1[i]) {
              // top2 already has another incoming connection of the same color
              foldsFound.push(n1[i], n2[i])
              console.log("2. New Fold found at ", n1[i], n2[i])
            } else {
              horiEdgesRef.current.get(n2[i])[1].set(color, n1[i]);
            }
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
            if (horiEdgesRef.current.get(n2[i])[0].has(color) && horiEdgesRef.current.get(n2[i])[0].get(color) != n1[i]) {
              // top1 already has another outgoing connection of the same color
              foldsFound.push(n2[i], n1[i])
              console.log("New Fold found at ", n2[i], n1[i])
            } else {
              horiEdgesRef.current.get(n2[i])[0].set(color, n1[i]);
            }
            if (horiEdgesRef.current.get(n1[i])[1].has(color) && horiEdgesRef.current.get(n1[i])[1].get(color) != n2[i]) {
              // top2 already has another incoming connection of the same color
              foldsFound.push(n2[i], n1[i])
              console.log("New Fold found at ", n1[i], n2[i])
            } else {
              horiEdgesRef.current.get(n1[i])[1].set(color, n2[i]);
            }
          }
          console.log("HER: ", structuredClone(horiEdgesRef.current));
          console.log("April Tops: ", topOrientation)
          console.log("April Bots: ", botOrientation)
        }
      }
    }
  })
};


// export const updateHorizontalEdges = (
//   latestPair, connectionPairs, horiEdgesRef, topOrientation, botOrientation, 
//   flippedConnectionsPerMove, foldsFound, mergedColornodesPerMove, currMergeColor) => {
//   // connectionPairs.forEach((pair) => {
//     if (latestPair.length === 2) {
//       // const [
//       //   {
//       //     nodes: [startNode1, bottomNode1],
//       //   },
//       //   {
//       //     nodes: [startNode2, bottomNode2],
//       //     color,
//       //   },
//       // ] = pair;
//       console.log("LP = ", latestPair)
//       // let pair = latestPair;
      
//       const [firstConnection, secondConnection] = latestPair;
//       let color = firstConnection.color;
//       const [top1, bottom1] = firstConnection.nodes;
//       const [top2, bottom2] = secondConnection.nodes;
    
//       const topCombination = [top1, top2].sort().join(',');
//       const bottomCombination = [bottom1, bottom2].sort().join(',');
//       const topDirection = topOrientation.current.get(topCombination);
//       const bottomDirection = botOrientation.current.get(bottomCombination);
//       let connColors = getAllConnColors(connectionPairs)
//     let horiEdgeTop = [top1, top2, color];
//     let horiEdgeBottom = [bottom1, bottom2, color];
//     console.log("Updated new horizontal edges: ", horiEdgeTop, horiEdgeBottom);

//     // for each node that got color swapped
//     // look at every connection pair
//     // if node in pair[0].nodes or pair[1].nodes
//     // set HER color of that connectionPair to pair.color
//     // 
//     // look at direction
//     console.log("MCPM = ", mergedColornodesPerMove)
//     console.log("April Connection pairs: ", connectionPairs)
//     console.log("April Tops: ", topOrientation)
//     console.log("April Bots: ", botOrientation)
//     var mergedColor; 
//     let mergedConnections = new Set();
//     console.log("NEW MERGE COLOR = ", currMergeColor)
//     if (horiEdgesRef && horiEdgesRef.current && currMergeColor != "") {
//       for (const currNode of mergedColornodesPerMove) {
//         // let currNode = mergedColornodesPerMove[i]
//         mergedColor = currMergeColor;
//         let isBottomNode = 0;
//         if (currNode[0] == 'b') {
//           isBottomNode = 1; 
//         }
//         if (!horiEdgesRef.current.has(currNode)) {
//           horiEdgesRef.current.set(currNode, [new Map(), new Map()]);
//         }
//         connectionPairs.forEach((pair) => {
//           // console.log("p0: ", pair[0], "p1: ", pair[1])
//           // if a pair contains currNode
//           if (pair[0].color == mergedColor && pair[0].nodes.includes(currNode) || pair[1].nodes.includes(currNode)) {
//             let otherTopNode = pair[1].nodes[isBottomNode]
//             if (!horiEdgesRef.current.has(otherTopNode)) {
//               horiEdgesRef.current.set(otherTopNode, [new Map(), new Map()]);
//             }
//             if (pair[0].nodes.includes(currNode)) {
//               otherTopNode = pair[1].nodes[isBottomNode]
//             } else {
//               otherTopNode = pair[0].nodes[isBottomNode]
//             }
//             // if otherNode is in the merged cell and currNode --> otherNode was color swapped
//             if (mergedColornodesPerMove.has(otherTopNode)) {
//             // indicates that currNodePointsToOtherNode
//             let cna = 0;
//             let cnb = 1;
//             let smallerNode = currNode;
//             let biggerNode = otherTopNode;
//             let switched = false;
//             if (currNode > otherTopNode) {
//               smallerNode = otherTopNode;
//               biggerNode = currNode;
//               switched =  true;
//             }
//             let connName = smallerNode + "," + biggerNode;

//             let dir = "UNK"
//             let canonicalColor = "unk"
//             // determine the direction of currNode -- otherNode
//             // if it's a top node, parse topOrientation
//             if (isBottomNode == 0) {
//               dir = topOrientation.current.get(connName);
//             } else { // bottom node -> check bottom orientation
//               dir = botOrientation.current.get(connName);
//             }
//             // the connection between currNode and the other Node hasn't been made yet
//             if (!horiEdgesRef.current.get(currNode)[0].has(otherTopNode) && !horiEdgesRef.current.get(currNode)[1].has(otherTopNode)) {
//               console.log("merge color case 1 ", smallerNode, biggerNode)
//               console.log("pre merge c1: ", structuredClone(horiEdgesRef.current));
//               if (dir == "right") {
//                 horiEdgesRef.current.get(currNode)[0].set(otherTopNode, mergedColor);
//                 horiEdgesRef.current.get(currNode)[0].set(mergedColor, otherTopNode);
//                 horiEdgesRef.current.get(otherTopNode)[1].set(currNode, mergedColor);
//                 horiEdgesRef.current.get(otherTopNode)[1].set(mergedColor, currNode);
//               } else {
//                 horiEdgesRef.current.get(currNode)[1].set(otherTopNode, mergedColor);
//                 horiEdgesRef.current.get(currNode)[1].set(mergedColor, otherTopNode);
//                 horiEdgesRef.current.get(otherTopNode)[0].set(currNode, mergedColor);
//                 horiEdgesRef.current.get(otherTopNode)[0].set(mergedColor, currNode);
//               }
//               console.log("post merge c1: ", structuredClone(horiEdgesRef.current));
//             } else { // there already exists a connection between currNode and otherNode
//               // currNode points to the otherNode
//               if (!containsArray(mergedConnections, [smallerNode, biggerNode])) {
//                 mergedConnections.add([smallerNode, biggerNode])
//                 // if (horiEdgesRef.current.get(currNode)[0].has(otherTopNode)) {

//                 if (dir == "right") {
//                   cna = 0;
//                   cnb = 1;
//                 }
//                 // other node points to the currNode
//                 // else if (horiEdgesRef.current.get(currNode)[1].has(otherTopNode)) {
//                 else {
//                   console.log("dir = ", dir)
//                   cna = 1;
//                   cnb = 0;
//                 }
//                 // if flipped, you wanna reverse it
//                 // switched == false && 
//                 if (switched == false && containsArray2(flippedConnectionsPerMove, [smallerNode, biggerNode])) {
//                   console.log("Clocked for ", smallerNode, biggerNode);
//                   cna = 1 - cna;
//                   cnb = 1 - cnb;
//                 }

//                 let oldColor = horiEdgesRef.current.get(currNode)[cna].get(otherTopNode);
                
//                 console.log("resetting color ", oldColor, " for merge at: ", smallerNode, biggerNode)
//                 // delete the old color
//                 console.log("preSwapFlip: ", structuredClone(horiEdgesRef.current));
//                 // reversed connection exists, then delete it
//                 if (horiEdgesRef.current.get(currNode)[cnb].has(otherTopNode)) {
//                   horiEdgesRef.current.get(currNode)[cnb].delete(oldColor);
//                   horiEdgesRef.current.get(currNode)[cnb].delete(otherTopNode);
//                   horiEdgesRef.current.get(otherTopNode)[cna].delete(oldColor);
//                   horiEdgesRef.current.get(otherTopNode)[cna].delete(currNode);
//                 }
//                 horiEdgesRef.current.get(currNode)[cna].delete(oldColor);
//                 horiEdgesRef.current.get(currNode)[cna].delete(otherTopNode);
//                 horiEdgesRef.current.get(otherTopNode)[cnb].delete(oldColor);
//                 horiEdgesRef.current.get(otherTopNode)[cnb].delete(currNode);
//                 // set currNode's outgoing connection to other node as mergedColor
//                 horiEdgesRef.current.get(currNode)[cna].set(otherTopNode, mergedColor);
//                 horiEdgesRef.current.get(currNode)[cna].set(mergedColor, otherTopNode);
//                 // set other nodes's incoming connection from currNode as mergedColor
//                 horiEdgesRef.current.get(otherTopNode)[cnb].set(currNode, mergedColor);
//                 horiEdgesRef.current.get(otherTopNode)[cnb].set(mergedColor, currNode);
//                 console.log("postSwapFlip: ", structuredClone(horiEdgesRef.current));

//                 for (const [key, value] of horiEdgesRef.current.get(currNode)[cna].entries()) {
//                   if (key[0] == '#' && horiEdgesRef.current.get(currNode)[cna].has(value) == false) {
//                     horiEdgesRef.current.get(currNode)[cna].delete(key);
//                   }
//                 }
//                 for (const [key, value] of horiEdgesRef.current.get(otherTopNode)[cnb].entries()) {
//                   if (key[0] == '#' && horiEdgesRef.current.get(otherTopNode)[cnb].has(value) == false) {
//                     horiEdgesRef.current.get(otherTopNode)[cnb].delete(key);
//                   }
//                 }
//                 for (const [key, value] of horiEdgesRef.current.get(currNode)[1 - cna].entries()) {
//                   if (key[0] == '#' && horiEdgesRef.current.get(currNode)[1 - cna].has(value) == false) {
//                     horiEdgesRef.current.get(currNode)[1 - cna].delete(key);
//                   }
//                 }
//                 for (const [key, value] of horiEdgesRef.current.get(otherTopNode)[1 -cnb].entries()) {
//                   if (key[0] == '#' && horiEdgesRef.current.get(otherTopNode)[1 - cnb].has(value) == false) {
//                     horiEdgesRef.current.get(otherTopNode)[1 - cnb].delete(key);
//                   }
//                 }
//               }
//             }
//           }
//           }
//         })
//       }
//     }


//     let flipped = 0;
//     console.log("FCPM = ", flippedConnectionsPerMove, " length = ", flippedConnectionsPerMove.length)
//     if (flippedConnectionsPerMove.length > 0 && flippedConnectionsPerMove[0].length > 0) {
//       console.log("Hello")
//       for (let i = 0; i < flippedConnectionsPerMove.length; i += 1) {
//         let conn = flippedConnectionsPerMove[i]
//         let nodeA = conn[0]; let nodeB = conn[1];
//         let nodes = [nodeA, nodeB]

//         // if (!mergedConnections.has(nodes)) {
//         // if (!containsArray(mergedConnections, nodes)) {
//           console.log("merged conns = ", mergedConnections)
//           console.log("fr flipping", nodes)
//           // console.log("Curr nodes = ", structuredClone(nodes))
    
//           let connDir = conn[2]
//           var connColor;

//           if (connDir == "right") {
//             // connColor = horiEdgesRef.current.get(nodeA)[0].get(nodeB);
//             let bruhSet = new Set([nodeA, nodeB])
//             connColor = horiEdgesRef.current.get(nodeA)[0].get(nodeB);
//             // connColor = connColors.get(bruhSet)
//             // console.log("right0 horiEdges list: ", horiEdgesRef.current);
//             if (connColor != undefined) {
//               console.log("right case, conn color = ", connColor, " nodeA = ", nodeA, " nodeB = ", nodeB)
//               console.log("pre right swap: ", structuredClone(horiEdgesRef.current));
//               horiEdgesRef.current.get(nodeA)[0].delete(nodeB);
//               horiEdgesRef.current.get(nodeB)[1].delete(nodeA);
//               if (horiEdgesRef.current.get(nodeA)[0].get(connColor) == nodeB) {
//                 horiEdgesRef.current.get(nodeA)[0].delete(connColor);
//               }
//               if (horiEdgesRef.current.get(nodeB)[1].get(connColor) == nodeA) {
//                 horiEdgesRef.current.get(nodeB)[1].delete(connColor);
//               }
//               // horiEdgesRef.current.get(nodeA)[0].set("Hellooooo", connColor);
//               // if (horiEdgesRef.current.get(nodeB)[0].has(connColor)) {
//               //   alert("Fold found at", nodeA, nodeB)
//               //   console.log("Fold found at", nodeA, nodeB)
//               // }
//               // else if (horiEdgesRef.current.get(nodeA)[1].has(connColor)){
//               //   alert("Fold found at", nodeA, nodeB)
//               //   console.log("Fold found at", nodeA, nodeB)
//               // } else {
//                 horiEdgesRef.current.get(nodeB)[0].set(nodeA, connColor);
//                 horiEdgesRef.current.get(nodeA)[1].set(nodeB, connColor);
                
//                 horiEdgesRef.current.get(nodeB)[0].set(connColor, nodeA);
//                 horiEdgesRef.current.get(nodeA)[1].set(connColor, nodeB);

//               // }
//             console.log("post right swap: ", structuredClone(horiEdgesRef.current));
//             flipped = 1;
//             }
//           } else if (connDir == "left") {
//             connColor = horiEdgesRef.current.get(nodeA)[1].get(nodeB);
//             if (connColor != undefined) {
//               console.log("left case, color = ", connColor, " nodeA = ", nodeA, " nodeB = ", nodeB)
//               console.log("pre left swap: ", structuredClone(horiEdgesRef.current));
//               horiEdgesRef.current.get(nodeA)[1].delete(nodeB);
//               horiEdgesRef.current.get(nodeB)[0].delete(nodeA);
//               if (horiEdgesRef.current.get(nodeA)[1].get(connColor) == nodeB) {
//                 horiEdgesRef.current.get(nodeA)[1].delete(connColor);
//               }
//               if (horiEdgesRef.current.get(nodeB)[0].get(connColor) == nodeA) {
//                 horiEdgesRef.current.get(nodeB)[0].delete(connColor);
//               }
//               // if (horiEdgesRef.current.get(nodeB)[1].has(connColor)) {
//               //   alert("Fold found at", nodeA, nodeB)
//               //   console.log("Fold found at", nodeA, nodeB)
//               // }
//               // else if (horiEdgesRef.current.get(nodeA)[0].has(connColor)){
//               //   alert("Fold found at", nodeA, nodeB)
//               //   console.log("Fold found at", nodeA, nodeB)
//               // } else {
//                 horiEdgesRef.current.get(nodeB)[1].set(nodeA, connColor);
//                 horiEdgesRef.current.get(nodeA)[0].set(nodeB, connColor);
//                 horiEdgesRef.current.get(nodeB)[1].set(connColor, nodeA);
//                 horiEdgesRef.current.get(nodeA)[0].set(connColor, nodeB);
//               // }
//               console.log("post left swap: ", structuredClone(horiEdgesRef.current));
//               flipped = 1;
//             }
//           // }
//           }
//         // if (connColor != undefined) {
//         // nodeA outgoing
//         for (let p = 0; p < 2; p += 1) {
//           // console.log("Crazy crazy ", horiEdgesRef.current.get(nodeA)[p].size);
//             if (horiEdgesRef.current.get(nodeA)[p].size % 2 == 1) {
//               console.log("Crazy fold 1")
//               foldsFound.push(nodeA);
//               break;
//             }
//             if (horiEdgesRef.current.get(nodeB)[p].size % 2 == 1) {
//               console.log("Crazy fold 2")
//               foldsFound.push(nodeA);
//               break;
//             }
//         }
//         // for (const key of horiEdgesRef.current.get(nodeA)[0].entries()) {
//         //   if (key != nodeB && horiEdgesRef.current.get(nodeA)[0].get(key) == connColor) {
//         //     foldsFound.push(nodeA, nodeB)
//         //     break;
//         //   }
//         // }
//         // // nodeA incoming
//         // for (const key of horiEdgesRef.current.get(nodeA)[1].entries()) {
//         //   if (key != nodeB && horiEdgesRef.current.get(nodeA)[1].get(key) == connColor) {
//         //     foldsFound.push(nodeA, nodeB)
//         //     break;
//         //   }
//         // }
//         // // nodeB outgoing
//         // for (const key of horiEdgesRef.current.get(nodeB)[0].entries()) {
//         //   if (key != nodeA && horiEdgesRef.current.get(nodeB)[0].get(key) == connColor) {
//         //     foldsFound.push(nodeB, nodeA)
//         //     break;
//         //   }
//         // }
//         // // nodeB incoming
//         // for (const key of horiEdgesRef.current.get(nodeB)[1].entries()) {
//         //   if (key != nodeA && horiEdgesRef.current.get(nodeB)[1].get(key) == connColor) {
//         //     foldsFound.push(nodeB, nodeA)
//         //     break;
//         //   }
//         // }
        
//       }
//     }
    
    
//     if (mergedConnections.length > 0) {
//       console.log("Checking merged connections for folds")
//       for (const conn of mergedConnections) {
//         let nodeA = conn[0]; let nodeB = conn[1];
//         let nodes = new Set([nodeA, nodeB])
//         // console.log("Curr nodes = ", structuredClone(nodes))
//         // make a function that parses connection pairs
//         let connColor = connColors.get(nodes);
//         // if (connColor != undefined) {
//         // nodeA outgoing
//         for (const key of horiEdgesRef.current.get(nodeA)[0].entries()) {
//           if (key != nodeB && horiEdgesRef.current.get(nodeA)[0].get(key) == connColor) {
//             foldsFound.push(nodeA, nodeB)
//             break;
//           }
//         }
//         // nodeA incoming
//         for (const key of horiEdgesRef.current.get(nodeA)[1].entries()) {
//           if (key != nodeB && horiEdgesRef.current.get(nodeA)[1].get(key) == connColor) {
//             foldsFound.push(nodeA, nodeB)
//             break;
//           }
//         }
//         // nodeB outgoing
//         for (const key of horiEdgesRef.current.get(nodeB)[0].entries()) {
//           if (key != nodeA && horiEdgesRef.current.get(nodeB)[0].get(key) == connColor) {
//             foldsFound.push(nodeB, nodeA)
//             break;
//           }
//         }
//         // nodeB incoming
//         for (const key of horiEdgesRef.current.get(nodeB)[1].entries()) {
//           if (key != nodeA && horiEdgesRef.current.get(nodeB)[1].get(key) == connColor) {
//             foldsFound.push(nodeB, nodeA)
//             break;
//           }
//         }
//         // }
//       }
//     }

//     if (foldsFound.length >= 1) {
//       console.log("FOLDS FOUND = ", foldsFound)
//       // alert("Dev debug: Check console for folds found.")
//     }
//     // let a = [top1, bottom1];
//     // let b = [top2, bottom2];
//     let addA = true
//     let addB = true
//     // dont handle the new connection if you just flipped its orientation
//     for (let i = 0; i < flippedConnectionsPerMove.length; i += 1) {
      
//       if (flippedConnectionsPerMove[i][0] == top1 && flippedConnectionsPerMove[i][1] == top2) {
//         addA = false
//       }
//       if (flippedConnectionsPerMove[i][0] == bottom1 && flippedConnectionsPerMove[i][1] == bottom2) {
//         addB = false
//       }
//     }
//     let smallerNode = top1;
//     let biggerNode = top2;
//     if (top1 > top2) {
//       smallerNode = top2;
//       biggerNode = top1;
//     }
//     let topSet = [smallerNode, biggerNode]
//     let smallerNode2 = bottom1;
//     let biggerNode2 = bottom2;
//     if (bottom1 > bottom2) {
//       smallerNode2 = bottom2;
//       biggerNode2 = bottom1;
//     }
//     let botSet = [smallerNode2, biggerNode2]
//     // if (mergedConnections.has(topSet)) {
//     if (containsArray(mergedConnections, topSet)) {
//       addA = false
//     }
//     // if (mergedConnections.has(botSet)) {
//       if (containsArray(mergedConnections, botSet)) {
//       addB = false
//     }
//     let a = []
//     let b = []
//     if (addA) {
//       a.push(top1)
//       b.push(top2)
//     }
//     if (addB) {
//       a.push(bottom1);
//       b.push(bottom2);
//     }
//     // if (flipped == 0) {
//       for (let i = 0; i < a.length; i += 1) { // check for a fold for top and bottom horizontal connections
//         let ai = a[i];
//         let bi = b[i];
//         console.log("Handling ", ai, ",", bi, color)
//         console.log("pre handle: ", structuredClone(horiEdgesRef.current));
//         if (horiEdgesRef && horiEdgesRef.current) {
//           // handle outgoing connections for nodeA:
//           // if we have made a connection with nodeA before
//           if (horiEdgesRef.current.has(ai) && horiEdgesRef.current.get(ai) > 0) { 
//             let colorMerged = 0;
//             let nodesFlipped = 0;

//             // set color of the connection, nodeA --[newColor]--> nodeB
//             horiEdgesRef.current.get(ai)[0].set(bi, color);
//             // newColor already exists in another outgoing connection
//             // && (!colorMerged)
//             // && !nodesFlipped 
//             if (foldFound == 0 && horiEdgesRef.current.get(ai)[0].has(color) && horiEdgesRef.current.get(ai)[0].get(color) != bi) { 
//               console.log("1: Fold found at", ai, " ", bi, "; Undo to remove the fold.");
//               console.log("Boi has blue: ", horiEdgesRef.current.get(ai)[0].has(color))
//               // alert("1: Fold found at", ai, " ", bi, "; Undo to remove the fold.");
//               foldsFound.push(ai, bi)
//               foldFound = 1;

//             } else { // newColor is a new outgoing color for nodeA
//               console.log("new color made", ai, bi)
//               horiEdgesRef.current.get(ai)[0].set(color, bi);
//             }
//           // nodeA is an unseen node, initialize its dictionaries
//           } else { 
//             horiEdgesRef.current.set(ai, [new Map([[bi, color]]), new Map()]);
//             horiEdgesRef.current.get(ai)[0].set(color, bi);
//           }

//           // handle incoming connections for nodeB

//           // if we have made a connection with nodeB before
//           if (horiEdgesRef.current.has(bi)) { 
//             let colorMerged = 0;
//             let nodesFlipped = 0;

//             // set color of the connection, nodeA --[newColor]--> nodeB
//             horiEdgesRef.current.get(bi)[1].set(ai, color);
//             // newColor already exists in another outgoing connection
//             // && (!colorMerged)
//             // && !nodesFlipped 
//             if (foldFound == 0 && horiEdgesRef.current.get(bi)[1].has(color) && horiEdgesRef.current.get(bi)[1].get(color) != ai) { 
//               console.log("2: Fold found at", ai, " ", bi, "; Undo to remove the fold.");
//               console.log("Boi has blue: ", horiEdgesRef.current.get(bi)[1].has(color))
//               // alert("2: Fold found at", ai, " ", bi, "; Undo to remove the fold.");
//               foldsFound.push(ai, bi)
//               foldFound = 1
//             } else { // newColor is a new outgoing color for nodeA
//               console.log("incoming new color made", ai, bi)
//               horiEdgesRef.current.get(bi)[1].set(color, ai);
//             }
//           // nodeA is an unseen node, initialize its dictionaries
//           } else { 
//             horiEdgesRef.current.set(bi, [new Map(), new Map([[ai, color]])]);
//             horiEdgesRef.current.get(bi)[1].set(color, ai);
//           }
//         }
//       }
//     console.log("post handling horiEdges list: ", structuredClone(horiEdgesRef.current));
//   }
//   // })
// };
