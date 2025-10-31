import { buildPairKey } from "./patternLog.js";

/**
 * Draws connection lines and curved paths between nodes on an SVG canvas.
 * @param {Object} svgRef - Reference to the SVG element where connections will be drawn.
 * @param {Array} connections - Array of connections, each containing nodes to connect and the color of the line.
 * @param {Array} connectionPairs - Array of connection pairs to be drawn with curved paths.
 * @param {number} offset - Distance to offset connection lines from node centers.
 */
export const drawConnections = (
  svgRef,
  connections,
  connectionPairs,
  offset,
  topOrientation,
  botOrientation,
  arrowOptions = { size: 10 }
) => {
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

      const pairId = buildPairKey(pair);

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
      const createCurvedPath = (startNode, endNode, isTopCurve, orientation, edgeMeta) => {
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
        if (edgeMeta?.edgeId) {
          path.setAttribute("data-edge-id", edgeMeta.edgeId);
        }
        if (edgeMeta?.pairId) {
          path.setAttribute("data-pair-id", edgeMeta.pairId);
        }
        path.setAttribute("data-sequence", isTopCurve ? "top" : "bottom");
        path.setAttribute("data-edge-marker", "path");

        const pathLength = path.getTotalLength();
        const midPoint = path.getPointAtLength(pathLength / 2);
        const midX = midPoint.x;
        const midY = midPoint.y;

        const tangentPoint1 = path.getPointAtLength(pathLength / 2 - 1);
        const tangentPoint2 = path.getPointAtLength(pathLength / 2 + 1);
        const tangentAngle = Math.atan2(tangentPoint2.y - tangentPoint1.y, tangentPoint2.x - tangentPoint1.x) * (180 / Math.PI);

        let arrow = null;
        if (orientation === "right" || orientation === "left") {
          arrow = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
          const arrowSize = arrowOptions?.size ?? 10;
          const horizontalOffset = orientation === "right" ? -arrowSize : arrowSize;
          const arrowPoints = [
            `${midX},${midY - arrowSize}`,
            `${midX + horizontalOffset},${midY}`,
            `${midX},${midY + arrowSize}`,
          ].join(" ");
          arrow.setAttribute("points", arrowPoints);
          arrow.setAttribute("fill", arrowOptions?.color ?? color);
          arrow.setAttribute(
            "transform",
            `rotate(${tangentAngle}, ${midX}, ${midY})`
          );
          if (edgeMeta?.edgeId) {
            arrow.setAttribute("data-edge-id", edgeMeta.edgeId);
          }
          if (edgeMeta?.pairId) {
            arrow.setAttribute("data-pair-id", edgeMeta.pairId);
          }
          arrow.setAttribute("data-sequence", isTopCurve ? "top" : "bottom");
          arrow.setAttribute("data-edge-marker", "arrow");
        }
  
        return { path, arrow };

      };

      // Create and append top and bottom curves for each connection pair
      const topEdgeId = [sortedTopNode1, sortedTopNode2].join(',');
      const topCurve = createCurvedPath(
        sortedTopNode1,
        sortedTopNode2,
        true, // isTopCurve
        topDirection,
        { edgeId: topEdgeId, pairId }
      );
      if (topCurve) {
        svgRef.current.appendChild(topCurve.path);
        if (topCurve.arrow) {
          svgRef.current.appendChild(topCurve.arrow);
        }
      }
  
      const bottomEdgeId = [sortedBottomNode1, sortedBottomNode2].join(',');
      const bottomCurve = createCurvedPath(
        sortedBottomNode1,
        sortedBottomNode2,
        false, // isBottomCurve
        bottomDirection,
        { edgeId: bottomEdgeId, pairId }
      );
      if (bottomCurve) {
        svgRef.current.appendChild(bottomCurve.path);
        if (bottomCurve.arrow) {
          svgRef.current.appendChild(bottomCurve.arrow);
        }
      }
    }
  });
  
};
