import { useState, useRef, useEffect } from "react";
import { PatternChecker } from "./utils/PatternChecker";
import { generateColor } from "./utils/colorUtils";
import { drawConnections } from "./utils/drawingUtils";
import { checkAndGroupConnections } from "./utils/MergeUtils";
import { calculateProgress } from "./utils/calculateProgress";
import { checkAndAddNewNodes} from "./utils/checkAndAddNewNodes";
import { getConnectedNodes } from "./utils/getConnectedNodes";
import { checkOrientation } from "./utils/checkOrientation";

import SettingIconImage from "./assets/setting-icon.png";

import TaikoNode from "./components/TaikoNodes/TaikoNode";
import ErrorModal from "./components/ErrorModal";
import SettingsMenu from "./components/ToolMenu/settingMenu";
import ProgressBar from "./components/ProgressBar/progressBar";
import Title from "./components/title";
import { useAudio } from './hooks/useAudio';
import { useSettings } from './hooks/useSetting';


function App() {
  // Game state management
  const [topRowCount, setTopRowCount] = useState(1);
  const [bottomRowCount, setBottomRowCount] = useState(1);
  const [showNodes] = useState(true);
  const [selectedNodes, setSelectedNodes] = useState([]);
  const [connections, setConnections] = useState([]);
  const [connectionPairs, setConnectionPairs] = useState([]);
  const [connectionGroups, setConnectionGroups] = useState([]);
  const [edgeState, setEdgeState] = useState(null);
  const [progress, setProgress] = useState(0);
  const [currentColor, setCurrentColor] = useState(0);
  const [errorMessage, setErrorMessage] = useState("");
  const svgRef = useRef(null);
  const groupMapRef = useRef(new Map());
  const previousProgressRef = useRef(progress);
  const [highlightedNodes, setHighlightedNodes] = useState([]);
  const topOrientation = useRef(new Map());
  const botOrientation = useRef(new Map());

  const [isDraggingLine, setIsDraggingLine] = useState(false);
  const [startNode, setStartNode] = useState(null);
  const [currentLineEl, setCurrentLineEl] = useState(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [level, setLevel] = useState("level")


  const [selectedLevel, setSelectedLevel] = useState(null);
  const [isDropdownDisabled, setIsDropdownDisabled] = useState(false);

  const handleLevelChange = (event) => {
    setSelectedLevel(event.target.value);
    setLevel(event.target.value)
    setIsDropdownDisabled(true); // Disable dropdown after selection
  };
  


  // Custom hooks for managing audio and settings
  const { clickAudio, errorAudio, connectsuccess, perfectAudio} = useAudio();
  const { offset, setOffset, soundBool, setSoundBool, blackDotEffect, setBlackDotEffect,
          lightMode, setLightMode
        }  = useSettings();

  // References for SVG elements and connection groups
  const [showSettings, setShowSettings] = useState(false);
  const [welcomeMessage, setWelcomeMessage] = useState(false);
  const [Percent100Message, setPercent100Message] = useState(false);
  const [patternChecker] = useState(() => new PatternChecker()); // Initialize PatternChecker.

  const handleUndo = () => {
    if (connectionPairs.length === 0) return;
  
    // Get the last connection pair
    const lastConnectionPair = connectionPairs[connectionPairs.length - 1];
    
    if (lastConnectionPair.length === 1) {
      // If the last pair has only one connection, remove it completely
      setConnectionPairs(prev => prev.slice(0, -1));
      setConnections(prev => prev.slice(0, -1));
      setEdgeState(null);
    } else if (lastConnectionPair.length === 2) {
      // If the last pair has two connections, remove only the last connection
      const updatedConnectionPairs = [
        ...connectionPairs.slice(0, -1),
        [lastConnectionPair[0]]
      ];
      
      setConnectionPairs(updatedConnectionPairs);
      
      // Remove the last connection from connections
      setConnections(prev => prev.slice(0, -1));
      
      // Restore the edge state to the first connection in the pair
      setEdgeState(lastConnectionPair[0]);
      
      // Reset orientation and group maps for the removed connection
      const nodes = lastConnectionPair[1].nodes;
      const topCombination = nodes
        .filter(node => node.startsWith('top'))
        .sort()
        .join(',');
      const bottomCombination = nodes
        .filter(node => node.startsWith('bottom'))
        .sort()
        .join(',');
  
      // Remove orientation for this specific combination
      topOrientation.current.delete(topCombination);
      botOrientation.current.delete(bottomCombination);
  
      // Remove the corresponding group from groupMapRef
      groupMapRef.current.delete(topCombination);
    }
  
    // Recalculate connection groups
    setConnectionGroups(prevGroups => {
      // Remove the last group or modify as needed
      return prevGroups.slice(0, -1);
    });
  
    // Reduce node rows if necessary
    const checkReduceNodes = () => {
      const currentTopNodes = new Set(
        connections.flatMap(conn => 
          conn.nodes.filter(node => node.startsWith('top'))
        )
      );
      const currentBottomNodes = new Set(
        connections.flatMap(conn => 
          conn.nodes.filter(node => node.startsWith('bottom'))
        )
      );
  
      const maxTopNodeIndex = Math.max(
        ...[...currentTopNodes].map(node => 
          parseInt(node.split('-')[1])
        ),
        -1
      );
      const maxBottomNodeIndex = Math.max(
        ...[...currentBottomNodes].map(node => 
          parseInt(node.split('-')[1])
        ),
        -1
      );
  
      setTopRowCount(Math.max(maxTopNodeIndex + 1, 1));
      setBottomRowCount(Math.max(maxBottomNodeIndex + 1, 1));
    };
  
    checkReduceNodes();
  };

  /**
   * Sets welcome message visibility based on the number of nodes in each row.
   */
  useEffect(() => {
    if (topRowCount === 1 && bottomRowCount === 1) {
      setWelcomeMessage(true);
    }
  }, [topRowCount, bottomRowCount]);
  

  /**
   * Draws connections on the SVG element when related state changes.
   */
  useEffect(() => {
    drawConnections(svgRef, connections, connectionPairs, offset, topOrientation, botOrientation);
  }, [connectionGroups, connections, topRowCount, bottomRowCount, connectionPairs, offset]);

  /**
   * Checks if new nodes should be added based on current connections.
   */
  useEffect(() => {
    checkAndAddNewNodes(topRowCount, bottomRowCount, connections, setTopRowCount, setBottomRowCount);
  }, [connections, topRowCount, bottomRowCount]);

  /**
   * Calculates progress as a percentage based on completed connections.
   * Play connect success sound when progress increases.
   */
  useEffect(() => {
    const timer = setTimeout(() => {
      const newProgress = calculateProgress(connections, topRowCount, bottomRowCount);
      setProgress(newProgress);
  
      if (newProgress === 100) {
        setPercent100Message(true);
        if(soundBool) {
        perfectAudio.play();
        }
      } else if (newProgress > previousProgressRef.current && soundBool) {
        //console.log("connect success sound");
        connectsuccess.play();
      }
  
      previousProgressRef.current = newProgress;
    }, 100);
  
    return () => clearTimeout(timer);

  }, [connections,topRowCount, bottomRowCount]);

  // useEffect(() => {
  //   setProgressToShow(calculateProgress(connections, topRowCount, bottomRowCount));
  // }, [connections, topRowCount, bottomRowCount]);



  /**
   * Handles window resize events to redraw connections, ensuring layout consistency.
   */
  useEffect(() => {
    const handleResize = () => {
      drawConnections(svgRef, connections, connectionPairs, offset);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [svgRef, connections, connectionPairs, offset]);

  /**
   * for debugging purposes
   */

  // useEffect(() => {
  //   console.log("Connections",connections);
  //   console.log("Connection Pairs",connectionPairs);
  //   console.log("Connection Groups",groupMapRef);
  // } , [connections]);

  useEffect(() => {
    const handleMouseMove = (e) => {
      if(isDraggingLine && currentLineEl) {
        const svgRect = svgRef.current.getBoundingClientRect();
        const mouseX = e.clientX - svgRect.left;
        const mouseY = e.clientY - svgRect.top;
        currentLineEl.setAttribute("x2", mouseX);
        currentLineEl.setAttribute("y2", mouseY);
      }
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [isDraggingLine, currentLineEl]);

  useEffect(() => {
    const handleMouseUp = () => {
      if(isDraggingLine && !selectedNodes[1]) {
        if (currentLineEl && svgRef.current.contains(currentLineEl)) {
          svgRef.current.removeChild(currentLineEl);
        }
        setIsDraggingLine(false);
        setStartNode(null);
        setCurrentLineEl(null);
      }
    };
    window.addEventListener('mouseup', handleMouseUp);
    return () => window.removeEventListener('mouseup', handleMouseUp);
  }, [isDraggingLine, currentLineEl, selectedNodes]);
  
  /**
   * Groups connections when a new connection pair is completed.
   */
  useEffect(() => {
    const latestPair = connectionPairs[connectionPairs.length - 1];
    // if(groupMapRef.current.size === 0) {

    // }

    if (latestPair && latestPair.length === 2) {
      if(level === "Level 2") {
        const a = checkOrientation(latestPair, groupMapRef, topOrientation, botOrientation);
        if(a == -1){
          setErrorMessage("Orientation condition failed!");
          setSelectedNodes([]);
          handleUndo()
          return;
        }
      }

      checkAndGroupConnections(
        latestPair,
        groupMapRef,
        setConnectionGroups,
        connections,
        setConnections
      );
    }
    console.log("topOrientation",topOrientation);
    console.log("botOrientation",botOrientation);
    console.log("groupMapRef",groupMapRef);
  }, [connectionPairs]);

  // useEffect(() => {
  //   const latestPair = connectionPairs[connectionPairs.length - 1];)
  //   if (latestPair && latestPair.length === 2){
  //     checkOrientation(latestPair, groupMapRef, topOrientation, botOrientation);
  //     if(checkOrientation(latestPair, groupMapRef, topOrientation, botOrientation) == 1){
  //       setErrorMessage("Flip");
  //     } else if (checkOrientation(latestPair, groupMapRef, topOrientation, botOrientation) == 2){
  //       setErrorMessage("Gnorw");
  //     }
  //   }

  //   console.log(topOrientation);
  //   console.log(botOrientation);
  // }, [connectionPairs]);

  // useEffect(() => {
  //   if(level === "level1") {
  //     setLevel("level2")
  //   }
  //   else {
  //     setLevel("level1")
  //   }
  // }, [level])

  const createTopRow = (count) =>
    Array.from({ length: count }, (_, i) => (
      <TaikoNode
        key={`top-${i}`}
        id={`top-${i}`}
        onClick={() => handleNodeClick(`top-${i}`)}
        isSelected={selectedNodes.includes(`top-${i}`)}
        index={i}
        totalCount={topRowCount}
        isFaded={count > 1 && i === count - 1}
        position="top"
        blackDotEffect={blackDotEffect}
        lightMode={lightMode}
        isHighlighted={highlightedNodes.includes(`top-${i}`)}
      />
    ));

  const createBottomRow = (count) =>
    Array.from({ length: count }, (_, i) => (
      <TaikoNode
        key={`bottom-${i}`}
        id={`bottom-${i}`}
        onClick={() => handleNodeClick(`bottom-${i}`)}
        isSelected={selectedNodes.includes(`bottom-${i}`)}
        index={i}
        totalCount={bottomRowCount}
        isFaded={count > 1 && i === count - 1}
        position="bottom"
        blackDotEffect={blackDotEffect}
        lightMode={lightMode}
        isHighlighted={highlightedNodes.includes(`bottom-${i}`)}
      />
    ));

    const handleNodeClick = (nodeId) => {
      setErrorMessage("");
    
      // Play click audio if sound is enabled
      if (soundBool) clickAudio.play();

      if(selectedLevel == null) {
        setErrorMessage("Please select a level and try again!!!!")
      }
      else {

      
    
      // If the node is already selected, deselect it and clear highlights
      if (selectedNodes.includes(nodeId)) {
        setSelectedNodes(selectedNodes.filter((id) => id !== nodeId));
        setHighlightedNodes([]); // Clear highlighted nodes
      }
      // If less than 2 nodes are selected, process the selection
      else if (selectedNodes.length < 2) {
        const newSelectedNodes = [...selectedNodes, nodeId];
        setSelectedNodes(newSelectedNodes);
    
        // If one node is selected, highlight connected nodes
        if (newSelectedNodes.length === 1) {
          const connectedNodes = getConnectedNodes(nodeId, connectionPairs); // Use refined utility function
          setHighlightedNodes(connectedNodes); // Highlight nodes connected to the first selected node
          setIsDraggingLine(true);
          setStartNode(nodeId);
      
          const nodeElem = document.getElementById(nodeId);
          const nodeRect = nodeElem.getBoundingClientRect();
          const svgRect = svgRef.current.getBoundingClientRect();
          const startX = nodeRect.left + nodeRect.width/2 - svgRect.left;
          const startY = nodeRect.top + nodeRect.height/2 - svgRect.top;
          
          const line = document.createElementNS("http://www.w3.org/2000/svg","line");
          line.setAttribute("x1", startX);
          line.setAttribute("y1", startY);
          line.setAttribute("x2", startX);
          line.setAttribute("y2", startY);
          line.setAttribute("stroke","gray");
          line.setAttribute("stroke-width","2");
          line.setAttribute("stroke-dasharray","5,5");
      
          svgRef.current.appendChild(line);
          setCurrentLineEl(line);
        }
        if (selectedNodes.length === 2 && isDraggingLine && startNode) {

          tryConnect(newSelectedNodes);
          if (currentLineEl && svgRef.current.contains(currentLineEl)) {
            svgRef.current.removeChild(currentLineEl);
          }
          setIsDraggingLine(false);
          setStartNode(null);
          setCurrentLineEl(null);
          setSelectedNodes([]);
          setHighlightedNodes([]); // Clear highlights after a connection attempt
        }
        // If two nodes are selected, attempt a connection
        if (newSelectedNodes.length === 2) {
          
          tryConnect(newSelectedNodes);
          setHighlightedNodes([]); // Clear highlights after a connection attempt
        }
      }
    }
    };

  const handleToolMenuClick = () => setShowSettings((prev) => !prev);

  const handleClear = () => {
    setConnectionPairs([]);
    setConnections([]);
    setSelectedNodes([]);
    setBottomRowCount(1);
    setTopRowCount(1);
    setEdgeState(null);
    setErrorMessage("");
    setProgress(0);
    setConnectionGroups([]);
    setCurrentColor(0);
    groupMapRef.current.clear();
    topOrientation.current.clear();
    botOrientation.current.clear();
    console.log(connectionPairs);
  };

  const handleSoundClick = () => {
    // Toggle the soundBool
    setSoundBool((prev) => !prev);

  };

  const handleOffsetChange = (newOffset) => {
    setOffset(newOffset);
    localStorage.setItem("offset", newOffset); //store to localStorage
  };

  const toggleBlackDotEffect = () => {
    setBlackDotEffect((prev) => !prev);
  };

  const toggleLightMode = () => {
    setLightMode((prevMode) => !prevMode);
  };
  
  // Getter functions for PatternChecker.
  const getHorizontalConnections = (point) => {
    return connections.filter(conn =>
      conn.nodes.includes(point) &&
      conn.nodes.every(node => node.startsWith(point.split('-')[0]))
    ).flatMap(conn => conn.nodes.filter(node => node !== point));
  };

  const getNextPoint = (point) => {
    const [row, index] = point.split('-');
    const nextIndex = parseInt(index) + 1;
    return `${row}-${nextIndex}` in Array.from({ length: topRowCount }, (_, i) => `top-${i}`).concat(Array.from({ length: bottomRowCount }, (_, i) => `bottom-${i}`)) ? `${row}-${nextIndex}` : null;
  };

  const getPreviousPoint = (point) => {
    const [row, index] = point.split('-');
    const prevIndex = parseInt(index) - 1;
    return prevIndex >= 0 ? `${row}-${prevIndex}` : null;
  };

  const getConnectionColor = (pt1, pt2) => {
    return connections.find(conn =>
      conn.nodes.includes(pt1) && conn.nodes.includes(pt2)
    )?.color;
  };

  const getConnectionOrientation = (pt1, pt2) => {
    const [row1] = pt1.split('-');
    const [row2] = pt2.split('-');
    return row1 === row2 ? 'horizontal' : 'vertical';
  };

  const tryConnect = (nodes) => {
    console.log('Connection attempt started with nodes:', nodes);
    if (nodes.length !== 2) {
        console.warn('Invalid node selection - exactly 2 nodes required');
        alert('Please select exactly 2 nodes to connect');
        return;
    }
    let [node1, node2] = nodes;
    console.log(`Processing connection between ${node1} and ${node2}`);
    const isTopNode = (id) => id.startsWith("top");
    const isBottomNode = (id) => id.startsWith("bottom");
    if (isBottomNode(node1) && isTopNode(node2)) {
        console.log(`Swapping nodes: ${node1} <-> ${node2}`);
        [node1, node2] = [node2, node1];
    }
    if ((isTopNode(node1) && isTopNode(node2)) || (isBottomNode(node1) && isBottomNode(node2))) {
        const errorMsg = `Can't connect same-row nodes: ${node1} & ${node2}`;
        console.warn(errorMsg);
        alert(errorMsg);
        if(soundBool) errorAudio.play();
        setErrorMessage(errorMsg);
        setSelectedNodes([]);
        return;
    }

    const isDuplicate = connections.some(conn => 
        (conn.nodes.includes(node1) && conn.nodes.includes(node2)) ||
        (conn.nodes.includes(node2) && conn.nodes.includes(node1))
    );

    if (isDuplicate) {
        const errorMsg = `Duplicate connection: ${node1}-${node2}`;
        console.warn(errorMsg);
        alert(errorMsg);
        if(soundBool) errorAudio.play();
        setErrorMessage(errorMsg);
        setSelectedNodes([]);
        return;
    }

    if (edgeState && (edgeState.nodes.includes(node1) || edgeState.nodes.includes(node2))) {
        const errorMsg = `Shared vertex in vertical edges: ${node1}/${node2}`;
        console.warn(errorMsg);
        alert(errorMsg);
        if(soundBool) errorAudio.play();
        setErrorMessage(errorMsg);
        setSelectedNodes([]);
        return;
    }

    let newColor;
    if (edgeState) {
        newColor = edgeState.color;
        console.log(`Using existing color: ${newColor}`);
    } else {
        newColor = generateColor(currentColor, setCurrentColor, connectionPairs);
        console.log(`Generated new color: ${newColor}`);
    }
    const newConnection = { nodes: [node1, node2], color: newColor };
    console.log('Proposed connection:', newConnection);
    const tempConnections = [...connections, newConnection];
    if (!checkNoPatternCondition(tempConnections, node1, node2)) {
        const errorMsg = `No-Pattern violation: ${node1}-${node2} with color ${newColor}`;
        console.error(errorMsg);
        alert(errorMsg);
        if(soundBool) errorAudio.play();
        setErrorMessage(errorMsg);
        setSelectedNodes([]);
        return;
    }
    console.log('Creating valid connection:', newConnection);
    if (edgeState) {
        console.log('Completing vertical pair');
        setConnections(tempConnections);
        setConnectionPairs(prevPairs => {
            const updatedPairs = updatePairs(prevPairs, newConnection);
            console.log('Updated connection pairs:', updatedPairs);
            return updatedPairs;
        });
        setEdgeState(null);
    } else {
        console.log('Starting new vertical pair');
        setConnections(tempConnections);
        setConnectionPairs([...connectionPairs, [newConnection]]);
        setEdgeState(newConnection);
    }
    setSelectedNodes([]);
    console.log('Connection successful!');
  };

  const checkNoPatternCondition = (connections, newNode1, newNode2) => {
    console.group('Pattern validation started');
    let isValid = true;
    const affectedNodes = [newNode1, newNode2];
    for (const vertex of affectedNodes) {
        console.log(`Checking patterns at ${vertex}`);
        const horizontalConnections = connections.filter(conn => 
            conn.nodes.includes(vertex) && 
            ((conn.nodes[0].startsWith("top") && conn.nodes[1].startsWith("top")) ||
             (conn.nodes[0].startsWith("bottom") && conn.nodes[1].startsWith("bottom")))
        );
        const patterns = new Set();
        console.log(`Found ${horizontalConnections.length} horizontal connections at ${vertex}`);
        for (let i = 0; i < horizontalConnections.length; i++) {
            for (let j = i + 1; j < horizontalConnections.length; j++) {
                const [conn1, conn2] = [horizontalConnections[i], horizontalConnections[j]];
                const orient1 = getOrientation(conn1, vertex);
                const orient2 = getOrientation(conn2, vertex);
                const pattern = createPatternKey(conn1.color, orient1, conn2.color, orient2);
                if (patterns.has(pattern)) {
                    console.error(`Duplicate local pattern at ${vertex}: ${pattern}`);
                    isValid = false;
                }
                patterns.add(pattern);
            }
        }
        getAllVertices().forEach(otherVertex => {
            if (otherVertex === vertex) return;
            const otherPatterns = getVertexPatterns(connections, otherVertex);
            patterns.forEach(pattern => {
                if (otherPatterns.has(pattern)) {
                    console.error(`Global pattern clash: ${pattern} between ${vertex} and ${otherVertex}`);
                    isValid = false;
                }
            });
        });
    }
    console.groupEnd();
    return isValid;
  };

  const getOrientation = (connection, vertex) => {
      const orientation = connection.nodes[0] === vertex ? "out" : "in";
      console.log(`Orientation for ${connection.nodes} at ${vertex}: ${orientation}`);
      return orientation;
  };

  const createPatternKey = (color1, orient1, color2, orient2) => {
      const sorted = [{color: color1, orient: orient1}, {color: color2, orient: orient2}]
          .sort((a, b) => a.color.localeCompare(b.color) || a.orient.localeCompare(b.orient));
      return sorted.map(p => `${p.color}:${p.orient}`).join(',');
  };

  const getVertexPatterns = (connections, vertex) => {
      const patterns = new Set();
      const horizontalConnections = connections.filter(conn => 
          conn.nodes.includes(vertex) && 
          ((conn.nodes[0].startsWith("top") && conn.nodes[1].startsWith("top")) ||
          (conn.nodes[0].startsWith("bottom") && conn.nodes[1].startsWith("bottom")))
      );
      for (let i = 0; i < horizontalConnections.length; i++) {
          for (let j = i + 1; j < horizontalConnections.length; j++) {
              const [conn1, conn2] = [horizontalConnections[i], horizontalConnections[j]];
              const orient1 = getOrientation(conn1, vertex);
              const orient2 = getOrientation(conn2, vertex);
              patterns.add(createPatternKey(conn1.color, orient1, conn2.color, orient2));
          }
      }
      console.log(`Found ${patterns.size} patterns at ${vertex}`);
      return patterns;
  };

  const getAllVertices = () => {
      const vertices = [];
      for (let i = 1; i <= 6; i++) {
          vertices.push(`top${i}`, `bottom${i}`);
      }
      console.log('Total vertices:', vertices);
      return vertices;
  };

  if (lightMode) {
    document.body.classList.add('light-mode');
  } else {
    document.body.classList.remove('light-mode');
  }
  return (
    <div className={`app-container ${lightMode ? 'light-mode' : 'dark-mode'}`}>
      <Title />
  
      <ProgressBar
        progress={progress}
        connections={connections}
        topRowCount={topRowCount}
        bottomRowCount={bottomRowCount}
        lightMode={lightMode}
      />
  
      {welcomeMessage && (
        <div className="welcome-message fade-message">Connect the vertices!</div>
      )}

      {Percent100Message && (
        <div className="welcome-message fade-message">You did it! 100%!</div>
      )}
  
      <img
        src={SettingIconImage}
        alt="Settings Icon"
        className="icon"
        onClick={handleToolMenuClick}
      />
  
      {showSettings && (
        <SettingsMenu
          offset={offset}
          onOffsetChange={handleOffsetChange}
          soundbool={soundBool}
          onSoundControl={handleSoundClick}
          blackDotEffect={blackDotEffect}
          onToggleBlackDotEffect={toggleBlackDotEffect}
          lightMode={lightMode}
          onToggleLightMode={toggleLightMode}
        />
      )}
  

    <button onClick={handleClear} className="clear-button">
      Clear
    </button>
    <button onClick={handleUndo} className="undo-button">
      Undo
    </button>
    {!selectedLevel ? (
        <div className="level-selector">
          <select
            id="level-dropdown"
            onChange={handleLevelChange}
            disabled={isDropdownDisabled}
            className="level-dropdown"
          >
            <option value="" disabled selected>
              Choose a level
            </option>
            <option value="Level 1">Level 1</option>
            <option value="Level 2">Level 2</option>
          </select>
        </div>
      ) : (
        <div
          className="level-selected"
          style={{ color: lightMode ? 'black' : 'white' }}
        >
          Selected Level: {selectedLevel}
        </div>

      )}
   
 
      <ErrorModal
        className="error-container"
        message={errorMessage}
        onClose={() => setErrorMessage("")}
      />
  
      {showNodes && (
      <div className="game-box">
        <div className="game-row">{createTopRow(topRowCount)}</div>
          <svg ref={svgRef} className="svg-overlay" />
        <div className="game-row bottom-row">{createBottomRow(bottomRowCount)}</div>
      </div>
    )}
    </div>
  );
}

export default App;