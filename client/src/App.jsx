import { useState, useRef, useEffect } from "react";
import InputBox from "./InputBox";
import TaikoNode from "./TaikoNode";
import ErrorModal from "./ErrorModal";
import LargeArcEdge from "./LargeArcEdge";

const edgeTypes = {
  custom: LargeArcEdge, // Register custom arc edge type
};

function App() {
  const [topRowCount, setTopRowCount] = useState(1);
  const [bottomRowCount, setBottomRowCount] = useState(1);
  const [showNodes, setShowNodes] = useState(true);
  const [selectedNodes, setSelectedNodes] = useState([]);
  const [connections, setConnections] = useState([]);
  const [edgeState, setEdgeState] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const svgRef = useRef(null);

  // store the pair of edges
  const [connectionPairs, setConnectionPairs] = useState([]);

  useEffect(() => {
    // console.log("Connections updated:", connections);
    drawConnections();
  }, [connections, topRowCount, bottomRowCount]);

  useEffect(() => {
    checkAndAddNewNodes();
  }, [connections, topRowCount, bottomRowCount]);

  useEffect(() => {
    console.log("CONNECTION PAIRS:", connectionPairs);
  }, [connectionPairs]);

  const checkAndAddNewNodes = () => {
    const allTopNodesConnected = Array.from({ length: topRowCount }, (_, i) =>
      connections.some((conn) => conn.nodes.includes(`top-${i}`))
    ).every(Boolean);

    const allBottomNodesConnected = Array.from(
      { length: bottomRowCount },
      (_, i) => connections.some((conn) => conn.nodes.includes(`bottom-${i}`))
    ).every(Boolean);

    if (allTopNodesConnected || allBottomNodesConnected) {
      if (allTopNodesConnected) {
        setTopRowCount((prev) => prev + 1);
      } else {
        setBottomRowCount((prev) => prev + 1);
      }
    }
  };

  const createTopRow = (count) => {
    return Array.from({ length: count }, (_, i) => (
      <>
        <TaikoNode
          key={`top-${i}`}
          id={`top-${i}`}
          onClick={() => handleNodeClick(`top-${i}`)}
          isSelected={selectedNodes.includes(`top-${i}`)}
          index={i}
          totalCount={topRowCount}
        />
      </>
    ));
  };

  const createBottomRow = (count) => {
    return Array.from({ length: count }, (_, i) => (
      <TaikoNode
        key={`bottom-${i}`}
        id={`bottom-${i}`}
        onClick={() => handleNodeClick(`bottom-${i}`)}
        isSelected={selectedNodes.includes(`bottom-${i}`)}
        index={i}
        totalCount={bottomRowCount}
      />
    ));
  };

  const handleNodeClick = (nodeId) => {
    setErrorMessage("");
    if (selectedNodes.includes(nodeId)) {
      setSelectedNodes(selectedNodes.filter((id) => id !== nodeId));
    } else {
      if (selectedNodes.length < 2) {
        const newSelectedNodes = [...selectedNodes, nodeId];
        setSelectedNodes(newSelectedNodes);
        if (newSelectedNodes.length === 2) {
          tryConnect(newSelectedNodes);
        }
      }
    }
  };

  const generateRandomColor = () => {
    const hue = Math.floor(Math.random() * 360); // Hue ranges from 0 to 360
    const saturation = Math.floor(Math.random() * 100) + 50; // Saturation ranges from 50% to 100%
    const lightness = Math.floor(Math.random() * 20) + 30; // Lightness ranges from 30% to 50%
    return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
  };
  

  const tryConnect = (nodes) => {
    const [node1, node2] = nodes;
    const isTopNode = (id) => id.startsWith("top");
    const isBottomNode = (id) => id.startsWith("bottom");

    if (
      (isTopNode(node1) && isTopNode(node2)) ||
      (isBottomNode(node1) && isBottomNode(node2))
    ) {
      setErrorMessage("Can't connect two nodes from the same row.");
      setSelectedNodes([]);
      return;
    }

    if (
      edgeState &&
      (edgeState.nodes.includes(node1) || edgeState.nodes.includes(node2))
    ) {
      setErrorMessage(
        "Cannot connect to a node that is already part of a pending edge."
      );
      setSelectedNodes([]);
      return;
    }

    let newColor;
    if (edgeState) {
      // If there is a pending edge, use the same color and create a pair
      newColor = edgeState.color;
      const newConnection = {
        nodes: nodes,
        color: newColor,
      };
      setConnections([...connections, newConnection]);
      setConnectionPairs((prevPairs) => {
        const lastPair = prevPairs[prevPairs.length - 1];
        if (lastPair && lastPair.length === 1) {
          // If the last pair has one connection, complete it
          return [...prevPairs.slice(0, -1), [...lastPair, newConnection]];
        } else {
          // Otherwise, create a new pair
          return [...prevPairs, [edgeState, newConnection]];
        }
      });
      setEdgeState(null);
    } else {
      // If no pending edge, create a new edge and add to edgeState
      newColor = generateRandomColor();
      const newConnection = {
        nodes: nodes,
        color: newColor,
      };
      setConnections([...connections, newConnection]);
      // Create a new pair and add to the connection pairs
      setConnectionPairs([...connectionPairs, [newConnection]]);
      setEdgeState(newConnection);
    }

    setSelectedNodes([]);
  };

  const drawArc = (startRect, endRect, svgRect, color, arcHeight) => {
    const midX = (startRect.left + endRect.left) / 2;
    const startY = startRect.top + startRect.height / 2 - svgRect.top;
    const endY = endRect.top + endRect.height / 2 - svgRect.top;

    const line = document.createElementNS("http://www.w3.org/2000/svg", "path");

    // Modify arcHeight: negative for upward arc, positive for downward arc
    const d = `
      M ${startRect.left + startRect.width / 2 - svgRect.left}, ${startY} 
      C ${midX}, ${startY + arcHeight} ${midX}, ${endY + arcHeight} 
      ${endRect.left + endRect.width / 2 - svgRect.left}, ${endY}
    `;

    line.setAttribute("d", d.trim());
    line.setAttribute("stroke", color);
    line.setAttribute("fill", "none");
    line.setAttribute("stroke-width", "4");

    svgRef.current.appendChild(line);
  };

  const drawConnections = () => {
    if (!svgRef.current) return;

    // Clear existing lines
    while (svgRef.current.firstChild) {
      svgRef.current.removeChild(svgRef.current.firstChild);
    }

    connections.forEach(({ nodes: [start, end], color }) => {
      const startElement = document.getElementById(start);
      const endElement = document.getElementById(end);
      if (startElement && endElement) {
        const startRect = startElement.getBoundingClientRect();
        const endRect = endElement.getBoundingClientRect();
        const svgRect = svgRef.current.getBoundingClientRect();

        const line = document.createElementNS(
          "http://www.w3.org/2000/svg",
          "line"
        );
        line.setAttribute(
          "x1",
          startRect.left + startRect.width / 2 - svgRect.left
        );
        line.setAttribute(
          "y1",
          startRect.top + startRect.height / 2 - svgRect.top
        );
        line.setAttribute(
          "x2",
          endRect.left + endRect.width / 2 - svgRect.left
        );
        line.setAttribute("y2", endRect.top + endRect.height / 2 - svgRect.top);
        line.setAttribute("stroke", color);
        line.setAttribute("stroke-width", "4");

        svgRef.current.appendChild(line);
      }
    });

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
    
        let topFirst1 = true;
        if (startNode1.startsWith("bottom")) {
          topFirst1 = false;
        }
    
        let topFirst2 = true;
        if (startNode2.startsWith("bottom")) {
          topFirst2 = false;
        }
    
        const svgRect = svgRef.current.getBoundingClientRect();
    
        const createCurvedPath = (startNode, endNode, isTopCurve) => {
          const startElement = document.getElementById(startNode);
          const endElement = document.getElementById(endNode);
          const startRect = startElement.getBoundingClientRect();
          const endRect = endElement.getBoundingClientRect();
    
          const startX = startRect.left + startRect.width / 2 - svgRect.left;
          const startY = startRect.top + startRect.height / 2 - svgRect.top;
          const endX = endRect.left + endRect.width / 2 - svgRect.left;
          const endY = endRect.top + endRect.height / 2 - svgRect.top;

          const dx = endX - startX;
          const dy = endY - startY;
          const distance = Math.sqrt(dx * dx + dy * dy);
    
 
          const controlX = (startX + endX) / 2;
          const controlY = isTopCurve 
            ? Math.min(startY, endY) - (distance / 3) 
            : Math.max(startY, endY) + (distance / 3); 
    
          const path = document.createElementNS(
            "http://www.w3.org/2000/svg",
            "path"
          );
          const d = `M ${startX},${startY} Q ${controlX},${controlY} ${endX},${endY}`;
          path.setAttribute("d", d);
          path.setAttribute("stroke", color);
          path.setAttribute("fill", "none");
          path.setAttribute("stroke-width", "4");
    
          return path;
        };
    

        const topCurve = createCurvedPath(
          topFirst1 ? startNode1 : bottomNode1,
          topFirst2 ? startNode2 : bottomNode2,
          true 
        );
        svgRef.current.appendChild(topCurve);
    

        const bottomCurve = createCurvedPath(
          topFirst1 ? bottomNode1 : startNode1,
          topFirst2 ? bottomNode2 : startNode2,
          false 
        );
        svgRef.current.appendChild(bottomCurve);
      }
    });
    
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setShowNodes(true);
    setConnections([]);
    setSelectedNodes([]);
    setErrorMessage("");
  };

  const handleClear = () => {
    setConnectionPairs([])
    setConnections([]);
    setSelectedNodes([]);
    setBottomRowCount(1);
    setTopRowCount(1);
  };

  return (
    <div
      style={{
        textAlign: "center",
        position: "relative",
        fontFamily: "Arial, sans-serif",
      }}
      className="AppContainer"
    >
      <h1 className="title">ColorTaiko!</h1>

      <button
        onClick={handleClear}
        style={{
          position: "absolute",
          top: "10px",
          right: "10px",
          padding: "10px 20px",
          fontSize: "16px",
          backgroundColor: "#f44336",
          color: "white",
          border: "none",
          borderRadius: "5px",
          cursor: "pointer",
          fontFamily: "inherit", // This will use the font from the parent element
        }}
      >
        Clear
      </button>

      <ErrorModal message={errorMessage} onClose={() => setErrorMessage("")} />

      {showNodes && (
        <div className="GameBox" style={{ position: "relative" }}>
          <div className="GameRow">{createTopRow(topRowCount)}</div>
          <svg
            ref={svgRef}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              pointerEvents: "none",
            }}
          />
          <div className="GameRow" style={{ marginTop: "100px" }}>
            {createBottomRow(bottomRowCount)}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
