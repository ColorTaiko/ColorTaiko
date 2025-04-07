import { useState, useRef, useEffect } from "react";
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
  // Game state management.
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
  const [level, setLevel] = useState("level")
  const [selectedLevel, setSelectedLevel] = useState(null);
  const [isDropdownDisabled, setIsDropdownDisabled] = useState(false);
  const handleLevelChange = (event) => {
    setSelectedLevel(event.target.value);
    setLevel(event.target.value)
    setIsDropdownDisabled(true); // Disable dropdown after selection.
  };
  // Custom hooks for managing audio & settings.
  const { clickAudio, errorAudio, connectsuccess, perfectAudio} = useAudio();
  const { offset, setOffset, soundBool, setSoundBool, blackDotEffect, setBlackDotEffect,
          lightMode, setLightMode
        }  = useSettings();
  // References for SVG elements & connection groups.
  const [showSettings, setShowSettings] = useState(false);
  const [welcomeMessage, setWelcomeMessage] = useState(false);
  const [Percent100Message, setPercent100Message] = useState(false);
  const handleUndo = () => {
    if (connectionPairs.length === 0) return;
    // Get the last connection pair.
    const lastConnectionPair = connectionPairs[connectionPairs.length - 1];
    if (lastConnectionPair.length === 1) {
      // If the last pair has only 1 connection, remove it completely.
      setConnectionPairs(prev => prev.slice(0, -1));
      setConnections(prev => prev.slice(0, -1));
      setEdgeState(null);
    } else if (lastConnectionPair.length === 2) {
      // If the last pair has 2 connections, remove only the last connection.
      const updatedConnectionPairs = [
        ...connectionPairs.slice(0, -1),
        [lastConnectionPair[0]]
      ];
      setConnectionPairs(updatedConnectionPairs);
      // Remove the last connection from connections.
      setConnections(prev => prev.slice(0, -1));
      // Restore the edge state to the 1st connection in the pair.
      setEdgeState(lastConnectionPair[0]);
      // Reset orientation & group maps for the removed connection.
      const nodes = lastConnectionPair[1].nodes;
      const topCombination = nodes
        .filter(node => node.startsWith('top'))
        .sort()
        .join(',');
      const bottomCombination = nodes
        .filter(node => node.startsWith('bottom'))
        .sort()
        .join(',');
      // Remove orientation for this specific combination.
      topOrientation.current.delete(topCombination);
      botOrientation.current.delete(bottomCombination);
      // Remove the corresponding group from groupMapRef.
      groupMapRef.current.delete(topCombination);
    }
    // Recalculate connection groups.
    setConnectionGroups(prevGroups => {
      // Remove the last group or modify as needed.
      return prevGroups.slice(0, -1);
    });
    // Reduce node rows if necessary.
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
        connectsuccess.play();
      }
      previousProgressRef.current = newProgress;
    }, 100);
    return () => clearTimeout(timer);
  }, [connections,topRowCount, bottomRowCount]);
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
      // Play click audio if sound is enabled.
      if (soundBool) clickAudio.play();
      if(selectedLevel == null) {
        setErrorMessage("Please select a level & try again!")
      }
      else {
      // If the node is already selected, deselect it & clear highlights.
      if (selectedNodes.includes(nodeId)) {
        setSelectedNodes(selectedNodes.filter((id) => id !== nodeId));
        setHighlightedNodes([]); // Clear highlighted nodes.
      }
      // If less than 2 nodes are selected, process the selection.
      else if (selectedNodes.length < 2) {
        const newSelectedNodes = [...selectedNodes, nodeId];
        setSelectedNodes(newSelectedNodes);
        // If 1 node is selected, highlight connected nodes.
        if (newSelectedNodes.length === 1) {
          const connectedNodes = getConnectedNodes(nodeId, connectionPairs); // Use refined utility function.
          setHighlightedNodes(connectedNodes); // Highlight nodes connected to the 1st selected node.
          setIsDraggingLine(true);
          setStartNode(nodeId);
          const nodeElem = document.getElementById(nodeId);
          const nodeRect = nodeElem.getBoundingClientRect();
          const svgRect = svgRef.current.getBoundingClientRect();
          const startX = nodeRect.left + nodeRect.width / 2 - svgRect.left;
          const startY = nodeRect.top + nodeRect.height / 2 - svgRect.top;
          const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
          line.setAttribute("x1", startX);
          line.setAttribute("y1", startY);
          line.setAttribute("x2", startX);
          line.setAttribute("y2", startY);
          line.setAttribute("stroke", "gray");
          line.setAttribute("stroke-width", "2");
          line.setAttribute("stroke-dasharray", "5,5");
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
          setHighlightedNodes([]); // Clear highlights after a connection attempt.
        }
        // If 2 nodes are selected, attempt a connection.
        if (newSelectedNodes.length === 2) {
          tryConnect(newSelectedNodes);
          setHighlightedNodes([]); // Clear highlights after a connection attempt.
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
    // Toggle the soundBool.
    setSoundBool((prev) => !prev);
  };
  const handleOffsetChange = (newOffset) => {
    setOffset(newOffset);
    localStorage.setItem("offset", newOffset); // Store to localStorage.
  };
  const toggleBlackDotEffect = () => {
    setBlackDotEffect((prev) => !prev);
  };
  const toggleLightMode = () => {
    setLightMode((prevMode) => !prevMode);
  };
  const tryConnect = (nodes) => {
    if (nodes.length !== 2) return;
    let [node1, node2] = nodes;
    const isTopNode = (id) => id.startsWith("top");
    const isBottomNode = (id) => id.startsWith("bottom");
    console.log(`Attempting to connect ${node1} & ${node2}.`);
    if (isBottomNode(node1) && isTopNode(node2)) {
        [node1, node2] = [node2, node1];
    }
    if (
        (isTopNode(node1) && isTopNode(node2)) ||
        (isBottomNode(node1) && isBottomNode(node2))
    ) {
        if (soundBool) {
            errorAudio.play();
        }
        setErrorMessage("Can't connect 2 vertices from the same row.");
        setSelectedNodes([]);
        return;
    }
    const isDuplicate = connections.some(
        (conn) =>
            (conn.nodes.includes(node1) && conn.nodes.includes(node2)) ||
            (conn.nodes.includes(node2) && conn.nodes.includes(node1))
    );
    if (isDuplicate) {
        if (soundBool) {
            errorAudio.play();
        }
        setErrorMessage("These vertices are already connected.");
        setSelectedNodes([]);
        return;
    }
    if (
        edgeState &&
        (edgeState.nodes.includes(node1) || edgeState.nodes.includes(node2))
    ) {
        if (soundBool) {
            errorAudio.play();
        }
        setErrorMessage("2 vertical edges in each pair shouldn't share a common vertex.");
        setSelectedNodes([]);
        return;
    }
    let newColor;
    const getOrientation = (node) => isTopNode(node) ? 'out' : 'in';
    const colorMap = {
      "#e6194b": "Red",
      "#ffffff": "White",
      "#a9a9a9": "Dark Grey",
      "#3cb44b": "Green",
      "#ffe119": "Yellow",
      "#f58231": "Orange",
      "#dcbeff": "Lavender",
      "#9a6324": "Brown",
      "#fabebe": "Pink",
      "#7f00ff": "Violet",
      "#f032e6": "Magenta",
      "#42d4f4": "Cyan",
      "#800000": "Maroon",
      "#469990": "Teal",
      "#bfef45": "Lime",
      "#808000": "Olive",
      "#ffd8b1": "Apricot",
      "#aaffc3": "Mint",
      "#c8ad7f": "Light French Beige",
    };
    const formatPatternWithColorNames = (pattern) => {
      return pattern.map(edge => ({
          color: colorMap[edge.color] || edge.color,
          orientation: edge.orientation
      }));
    }; 
    const checkNoPattern = (newConn) => {
        const allConnections = [...connections, newConn];
        const patternMap = new Map();
        const vertexConnections = new Map();
        for (const conn of allConnections) {
            const [v1, v2] = conn.nodes;
            if (!vertexConnections.has(v1)) vertexConnections.set(v1, []);
            if (!vertexConnections.has(v2)) vertexConnections.set(v2, []);
            vertexConnections.get(v1).push({ 
                node: v2, 
                color: conn.color,
                orientation: getOrientation(v1)
            });
            vertexConnections.get(v2).push({ 
                node: v1, 
                color: conn.color,
                orientation: getOrientation(v2)
            });
        } 
        console.log("Vertex Connections Map:");
        vertexConnections.forEach((connections, vertex) => {
            console.log(`${vertex}:`, connections.map(c => 
                `${c.node} (${colorMap[c.color] || c.color}, ${c.orientation})`).join(", "));
        });
        for (const [vertex, edges] of vertexConnections.entries()) {
            if (edges.length >= 2) {
                for (let i = 0; i < edges.length - 1; i++) {
                    for (let j = i + 1; j < edges.length; j++) {
                        const edge1 = edges[i];
                        const edge2 = edges[j];
                        if (edge1.color === edge2.color) continue;
                        if (edge1.orientation === edge2.orientation) continue;
                        const pattern = [
                            { color: edge1.color, orientation: edge1.orientation },
                            { color: edge2.color, orientation: edge2.orientation }
                        ].sort((a, b) => 
                            a.color.localeCompare(b.color) || 
                            a.orientation.localeCompare(b.orientation)
                        );
                        const patternKey = JSON.stringify(pattern);
                        if (!patternMap.has(patternKey)) {
                            patternMap.set(patternKey, []);
                        }
                        const patternInfo = {
                            centralVertex: vertex,
                            edge1: {
                                node: edge1.node,
                                color: edge1.color,
                                orientation: edge1.orientation
                            },
                            edge2: {
                                node: edge2.node,
                                color: edge2.color,
                                orientation: edge2.orientation
                            }
                        };
                        patternMap.get(patternKey).push(patternInfo);
                        if (patternMap.get(patternKey).length > 1) {
                            const formattedPattern = formatPatternWithColorNames(pattern);
                            const locations = patternMap.get(patternKey)
                                .map(info => {
                                    const color1 = colorMap[info.edge1.color] || info.edge1.color;
                                    const color2 = colorMap[info.edge2.color] || info.edge2.color;
                                    return `Central vertex ${info.centralVertex} with edges to:
                                    - ${info.edge1.node} (${color1}, ${info.edge1.orientation})
                                    - ${info.edge2.node} (${color2}, ${info.edge2.orientation})`;
                                })
                                .join("\nAND\n");
                            console.log(`No-pattern failed: Pattern ${JSON.stringify(formattedPattern)} repeats at:\n${locations}.`);
                            return { 
                                passes: false, 
                                pattern: formattedPattern,
                                locations: patternMap.get(patternKey)
                            };
                        }
                    }
                }
            }
        }
        console.log("Pattern Map:");
        for (const [pattern, locations] of patternMap.entries()) {
            const formattedPattern = formatPatternWithColorNames(JSON.parse(pattern));
            console.log(`Pattern ${JSON.stringify(formattedPattern)} found at:`, locations);
        }
        return { passes: true };
    };
    if (edgeState) {
        // If there's a pending edge, use the same color & create a pair.
        newColor = edgeState.color;
        const newConnection = {
            nodes: [node1, node2],
            color: newColor,
        };
        const patternCheck = checkNoPattern(newConnection);
        if (!patternCheck.passes) {
            if (soundBool) {
                errorAudio.play();
            }
            const errorDetails = patternCheck.locations.map(loc => {
                const color1 = colorMap[loc.edge1.color] || loc.edge1.color;
                const color2 = colorMap[loc.edge2.color] || loc.edge2.color;
                return `Central vertex ${loc.centralVertex} with edges to:
                - ${loc.edge1.node} (${color1}, ${loc.edge1.orientation})
                - ${loc.edge2.node} (${color2}, ${loc.edge2.orientation})`;
            }).join("\nAND\n");
            
            setErrorMessage(`No-pattern failed: Pattern ${JSON.stringify(patternCheck.pattern)} repeats at:\n${errorDetails}`);
            setSelectedNodes([]);
            return;
        }
        setConnections([...connections, newConnection]);
        setConnectionPairs((prevPairs) => {
            const lastPair = prevPairs[prevPairs.length - 1];
            let updatedPairs;
            if (lastPair && lastPair.length === 1) {
                updatedPairs = [
                    ...prevPairs.slice(0, -1),
                    [...lastPair, newConnection],
                ];
            } else {
                updatedPairs = [...prevPairs, [edgeState, newConnection]];
            }
            console.log("Updated connection pairs:", updatedPairs);
            return updatedPairs;
        });
        setEdgeState(null);
    } else {
        // If no pending edge, create a new edge & add to edgeState.
        newColor = generateColor(currentColor, setCurrentColor, connectionPairs);
        const newConnection = {
            nodes: [node1, node2],
            color: newColor,
        };
        const patternCheck = checkNoPattern(newConnection);
        if (!patternCheck.passes) {
            if (soundBool) {
                errorAudio.play();
            }
            const errorDetails = patternCheck.locations.map(loc => {
                const color1 = colorMap[loc.edge1.color] || loc.edge1.color;
                const color2 = colorMap[loc.edge2.color] || loc.edge2.color;
                return `Central vertex ${loc.centralVertex} with edges to:
                - ${loc.edge1.node} (${color1}, ${loc.edge1.orientation})
                - ${loc.edge2.node} (${color2}, ${loc.edge2.orientation})`;
            }).join("\nAND\n");
            
            setErrorMessage(`No-pattern failed: Pattern ${JSON.stringify(patternCheck.pattern)} repeats at:\n${errorDetails}`);
            setSelectedNodes([]);
            return;
        }
        setConnections([...connections, newConnection]);
        setConnectionPairs([...connectionPairs, [newConnection]]);
        console.log("New connection:", newConnection);
        console.log("Current connection pairs:", connectionPairs);
        setEdgeState(newConnection);
    }
    setSelectedNodes([]);
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