// new broken code

/**
 * Draws connection lines and curved paths between nodes on an SVG canvas.
 * @param {Object} svgRef - Reference to the SVG element where connections will be drawn.
 * @param {Array} connections - Array of connections, each containing nodes to connect and the color of the line.
 * @param {Array} connectionPairs - Array of connection pairs to be drawn with curved paths.
 * @param {number} offset - Distance to offset connection lines from node centers.
 */
export const drawConnections = (svgRef, connections, connectionPairs, offset, topOrientation, botOrientation, arrowOptions = { color: "red", size: 10 }, horiEdgesRef) => {
  if (!svgRef.current) return;

  // Clear existing connections by removing all child elements of the SVG
  while (svgRef.current.firstChild) {
    svgRef.current.removeChild(svgRef.current.firstChild);
  }

  // Retrieve SVG container dimensions to calculate relative node positions
  const svgRect = svgRef.current.getBoundingClientRect();
  
  /**
   * Adjusts start and end points of a line to offset from node centers.
   * @param {number} x1 - X-coordinate of the starting point.
   * @param {number} y1 - Y-coordinate of the starting point.
   * @param {number} x2 - X-coordinate of the ending point.
   * @param {number} y2 - Y-coordinate of the ending point.
   * @param {number} distance - Offset distance from the center.
   * @returns {Object} Adjusted coordinates {x, y}.
   */
  const adjustPoint = (x1, y1, x2, y2, distance) => {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const len = Math.sqrt(dx * dx + dy * dy);
    const scale = (len - distance) / len;
    return {
        x: x1 + dx * scale,
        y: y1 + dy * scale
    };
  };

  // Iterate over direct connections to create straight lines between nodes
  connections.forEach(({ nodes: [start, end], color }) => {
    const startElement = document.getElementById(start);
    const endElement = document.getElementById(end);

    if (startElement && endElement) {
      const startRect = startElement.getBoundingClientRect();
      const endRect = endElement.getBoundingClientRect();

      let startX = startRect.left + startRect.width / 2 - svgRect.left;
      let startY = startRect.top + startRect.height / 2 - svgRect.top;
      let endX = endRect.left + endRect.width / 2 - svgRect.left;
      let endY = endRect.top + endRect.height / 2 - svgRect.top;

      // Adjust points to be offset from node centers
      const adjustedStart = adjustPoint(startX, startY, endX, endY, offset);
      const adjustedEnd = adjustPoint(endX, endY, startX, startY, offset);

      // Create an SVG line element for each connection
      const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
      line.setAttribute("x1", adjustedStart.x);
      line.setAttribute("y1", adjustedStart.y);
      line.setAttribute("x2", adjustedEnd.x);
      line.setAttribute("y2", adjustedEnd.y);
      line.setAttribute("stroke", color);
      line.setAttribute("stroke-width", "4");
      line.setAttribute("stroke-linecap", "round");

      svgRef.current.appendChild(line);
      
    }
  });

  // Create curved paths for paired connections, representing grouped edges
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

      const sortNodes = (nodeA, nodeB) => {
        const numberA = parseInt(nodeA.split('-')[1], 10);
        const numberB = parseInt(nodeB.split('-')[1], 10);
        return numberA < numberB ? [nodeA, nodeB] : [nodeB, nodeA];
      };
  
      // Sort top and bottom nodes
      const [sortedTopNode1, sortedTopNode2] = sortNodes(startNode1, startNode2);
      const [sortedBottomNode1, sortedBottomNode2] = sortNodes(bottomNode1, bottomNode2);
  

      const [firstConnection, secondConnection] = pair;
      const [top1, bottom1] = firstConnection.nodes;
      const [top2, bottom2] = secondConnection.nodes;
    
      const topCombination = [top1, top2].sort().join(',');
      const bottomCombination = [bottom1, bottom2].sort().join(',');
      const topDirection = topOrientation.current.get(topCombination);
      const bottomDirection = botOrientation.current.get(bottomCombination);

      /**
       * Generates an SVG path for a curved connection between two nodes.
       * @param {string} startNode - ID of the starting node.
       * @param {string} endNode - ID of the ending node.
       * @param {boolean} isTopCurve - Whether the curve arches upwards or downwards.
       * @returns {Object} SVG path element or null if nodes are missing.
       */
      const createCurvedPath = (startNode, endNode, isTopCurve, orientation) => {
        const startElement = document.getElementById(startNode);
        const endElement = document.getElementById(endNode);
        if (!startElement || !endElement) return null;

        const startRect = startElement.getBoundingClientRect();
        const endRect = endElement.getBoundingClientRect();

        // Calculate center points for the start and end nodes within SVG bounds
        let startX = startRect.left + startRect.width / 2 - svgRect.left;
        let startY = startRect.top + startRect.height / 2 - svgRect.top;
        let endX = endRect.left + endRect.width / 2 - svgRect.left;
        let endY = endRect.top + endRect.height / 2 - svgRect.top;

        // Adjust points to be offset from node centers
        const adjustedStart = adjustPoint(startX, startY, endX, endY, offset);
        const adjustedEnd = adjustPoint(endX, endY, startX, startY, offset);

        const dx = adjustedEnd.x - adjustedStart.x;
        const dy = adjustedEnd.y - adjustedStart.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        const controlX = (adjustedStart.x + adjustedEnd.x) / 2;
        const controlY = isTopCurve
          ? Math.min(adjustedStart.y, adjustedEnd.y) - distance / 5
          : Math.max(adjustedStart.y, adjustedEnd.y) + distance / 5;

        // Construct SVG path element with quadratic bezier curve
        const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
        const d = `M ${adjustedStart.x},${adjustedStart.y} Q ${controlX},${controlY} ${adjustedEnd.x},${adjustedEnd.y}`;
        path.setAttribute("d", d);
        path.setAttribute("stroke", color);
        path.setAttribute("fill", "none");
        path.setAttribute("stroke-width", "4");
        path.setAttribute("stroke-linecap", "round");

        const pathLength = path.getTotalLength();
        const midPoint = path.getPointAtLength(pathLength / 2);
        const midX = midPoint.x;
        const midY = midPoint.y;

        const tangentPoint1 = path.getPointAtLength(pathLength / 2 - 1);
        const tangentPoint2 = path.getPointAtLength(pathLength / 2 + 1);
        const tangentAngle = Math.atan2(tangentPoint2.y - tangentPoint1.y, tangentPoint2.x - tangentPoint1.x) * (180 / Math.PI);

        // Create arrow
        const arrow = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
        const arrowSize = 10; // Arrow size
        let arrowPoints;
        if (orientation === "right") {
          arrowPoints = `
            ${midX},${midY - arrowSize} 
            ${midX - arrowSize},${midY} 
            ${midX},${midY + arrowSize}`;
        } else if (orientation === "left") {
          arrowPoints = `
            ${midX},${midY - arrowSize} 
            ${midX + arrowSize},${midY} 
            ${midX},${midY + arrowSize}`;
        } else {
         
        }
        arrow.setAttribute("points", arrowPoints);
        arrow.setAttribute("fill", color);
        arrow.setAttribute(
          "transform",
          `rotate(${tangentAngle}, ${midX}, ${midY})`
        );
  
        return { path, arrow };

      };

      // Create and append top and bottom curves for each connection pair
      const topCurve = createCurvedPath(
        sortedTopNode1,
        sortedTopNode2,
        true, // isTopCurve
        topDirection
      );
      if (topCurve) {
        svgRef.current.appendChild(topCurve.path);
        svgRef.current.appendChild(topCurve.arrow);
      }
  
      const bottomCurve = createCurvedPath(
        sortedBottomNode1,
        sortedBottomNode2,
        false, // isBottomCurve
        bottomDirection
      );
      if (bottomCurve) {
        svgRef.current.appendChild(bottomCurve.path);
        svgRef.current.appendChild(bottomCurve.arrow);
      }
    }
  });
  
};

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

export const updateHorizontalEdges = (connectionPairs, horiEdgesRef, topOrientation, botOrientation, flippedConnectionsPerMove) => {
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

    // handle the flipped connections
    // for each flipped connection, nodeA->nodeB:
      // update the list
      // let newColor be the color of the flipped connection that connection
      // for every connection of color newColor containing nodeA:
        // check if ok
      // for every connection of color newColor containing nodeB:
        // check if ok
    let foldsFound = []
    let seen = new Set();
    let flipped = 0;
    console.log("FCPM = ", flippedConnectionsPerMove, " length = ", flippedConnectionsPerMove.length)
    if (flippedConnectionsPerMove.length > 0 && flippedConnectionsPerMove[0].length > 0) {
    for (let i = 0; i < flippedConnectionsPerMove.length; i += 1) {
      let conn = flippedConnectionsPerMove[i]
      let nodeA = conn[0]; let nodeB = conn[1];
      let nodes = [nodeA, nodeB]
      console.log("Curr nodes = ", structuredClone(nodes))
      // console.log("seen = ", seen)
      // if (isListInSet(seen, nodes)) {
      //   console.log("Skipping nodes = ", nodes)
      //   continue;
      // } else {
      //   console.log("Flipped nodes = ", nodes)
      //   seen.add(nodes)
      //   console.log("seen after flipping = ", seen)
      // }
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
          if (horiEdgesRef.current.get(nodeB)[1].get(connColor) == nodeB) {
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
          foldsFound.push([nodeA, nodeB])
          break;
        }
      }
      // nodeA incoming
      for (const key of horiEdgesRef.current.get(nodeA)[1].entries()) {
        if (key != nodeB && horiEdgesRef.current.get(nodeA)[1].get(key) == connColor) {
          foldsFound.push([nodeA, nodeB])
          break;
        }
      }
      // nodeB outgoing
      for (const key of horiEdgesRef.current.get(nodeB)[0].entries()) {
        if (key != nodeA && horiEdgesRef.current.get(nodeB)[0].get(key) == connColor) {
          foldsFound.push([nodeB, nodeA])
          break;
        }
      }
      // nodeB incoming
      for (const key of horiEdgesRef.current.get(nodeB)[1].entries()) {
        if (key != nodeA && horiEdgesRef.current.get(nodeB)[1].get(key) == connColor) {
          foldsFound.push([nodeB, nodeA])
          break;
        }
      }
      }
    }
  }
    
    if (foldsFound.length >= 1) {
      console.log("FOLDS FOUND = ", foldsFound)
      alert("Dev debug: Check console for folds found.")
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
              let oldColor = horiEdgesRef.current.get(ai)[1].get(bi);
              horiEdgesRef.current.get(ai)[1].delete(oldColor);
              horiEdgesRef.current.get(ai)[1].delete(bi);
              nodesFlipped = 1;
            }
            
            // if nodeB is a seen node, and the color got merged
            if (horiEdgesRef.current.get(ai)[0].get(bi) != color) { 
              // delete the old color of nodeA -> nodeB
              let oldColor = horiEdgesRef.current.get(ai)[0].get(bi);
              horiEdgesRef.current.get(ai)[0].delete(oldColor);
              colorMerged = 1;
            } 

            // set color of the connection, nodeA --[newColor]--> nodeB
            horiEdgesRef.current.get(ai)[0].set(bi, color);
            // newColor already exists in another outgoing connection
            if (!nodesFlipped && (!colorMerged || horiEdgesRef.current.get(ai)[0].has(color)) && horiEdgesRef.current.get(ai)[0].get(color) != bi) { 
              console.log("1: Fold found at", ai, " ", bi, "; Undo to remove the fold.");
              alert("1: Fold found at", ai, " ", bi, "; Undo to remove the fold.");
            } else { // newColor is a new outgoing color for nodeA
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
              let oldColor = horiEdgesRef.current.get(bi)[0].get(ai);
              horiEdgesRef.current.get(bi)[0].delete(oldColor);
              horiEdgesRef.current.get(bi)[0].delete(ai);
              nodesFlipped = 1;
            }

            // if nodeA is a seen node, and the color got merged
            
            if (horiEdgesRef.current.get(bi)[1].get(ai) != color) { 
              // delete the old color of nodeA -> nodeB
              let oldColor = horiEdgesRef.current.get(bi)[1].get(ai);
              horiEdgesRef.current.get(bi)[1].delete(oldColor);
              colorMerged = 1;
            } 
            // set color of the connection, nodeA --[newColor]--> nodeB
            horiEdgesRef.current.get(bi)[1].set(ai, color);
            // newColor already exists in another outgoing connection
            if (!nodesFlipped && (!colorMerged || horiEdgesRef.current.get(bi)[1].has(color)) && horiEdgesRef.current.get(bi)[1].get(color) != ai) { 
              console.log("2: Fold found at", ai, " ", bi, "; Undo to remove the fold.");
              alert("2: Fold found at", ai, " ", bi, "; Undo to remove the fold.");
            } else { // newColor is a new outgoing color for nodeA
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
