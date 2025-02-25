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

      // new horizontal edge: [start, end, color]
      // Chris & Yixu were here
      let horiEdgeTop = [top1, top2, color];
      let horiEdgeBottom = [bottom1, bottom2, color];
      console.log("Updated new horizontal edges: ", horiEdgeTop, horiEdgeBottom)
      
      if (horiEdgesRef && horiEdgesRef.current) {
        // horiEdgesRef map:
        // for all horizontal edge top1 -> top 2 of color ColorA
        // for all horizontal edge top3 -> top 1 of color ColorB
        // horiEdgesRef = {top1: [ map[top2 : ColorA], map[top3 : ColorB] ] }

        // console.log("topIndex = ", topIndex)
        let foldFound = false;
        if (horiEdgesRef.current.has(top1) == true) {
          // first check if we're resetting the color
            // if (horiEdgesRef.current.get(top1) != color) {
              horiEdgesRef.current.get(top1)[0].set(top2, color)
              // now that color is reset, we must check if the new outgoing edge creates a fold from top1
              // check to see if top1 has an outgoing edge of that color first
              if (horiEdgesRef.current.get(top1)[0].has(color) == false) {
                // we don't have an outgoing edge of this color, so we can log this outgoing color
                horiEdgesRef.current.get(top1)[0].set(color, top2)
              } else if (horiEdgesRef.current.get(top1)[0].get(color) != top2) { // else -> this means top1 already has an edge of that color, meaning we found a fold
                console.log("Fold found at", top1, " ", top2)
                alert("Fold found!")
                foldFound = true;
              }
            // }
        } else { // add new vertex to map
          // initialize outgoing/incoming arrays:
          horiEdgesRef.current.set(top1, [new Map([[top2, color]]), new Map()]) // set top1 vertex outgoing // horiEdgeTop.splice(0,1)
          horiEdgesRef.current.get(top1)[0].set(color, top2)
        }
        // top2 is in the horizontal edges map
        if (horiEdgesRef.current.has(top2) == true) { 
          // if (horiEdgesRef.current.get(top2) != color) {
            horiEdgesRef.current.get(top2)[1].set(top1, color)
            // now that color is reset, we must check if the new outgoing edge creates a fold from top1
            // check to see if top1 has an outgoing edge of that color first
            if (horiEdgesRef.current.get(top2)[1].has(color) == false) {
              // we don't have an outgoing edge of this color, so we can log this outgoing color
              horiEdgesRef.current.get(top2)[1].set(color, top1)
            } else if (horiEdgesRef.current.get(top2)[1].get(color) != top1) { // else -> this means top1 already has an edge of that color, meaning we found a fold
              console.log("Fold found at", top2, " ", top1)
              if (foldFound == false) {
                alert("Fold found!!")
              }
            }
          // }
        } else { // add new vertex to map
          // initialize outgoing/incoming arrays:
          horiEdgesRef.current.set(top2, [new Map(), new Map([[top1, color]])]) // set top2 vertex incoming // horiEdgeTop.splice(1,1)
          horiEdgesRef.current.get(top2)[1].set(color, top1)
        }
      }
      console.log("horiEdges list: ", horiEdgesRef.current);
      
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

