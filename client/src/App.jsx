import { useState, useRef, useEffect, useCallback } from "react";

import { generateColor } from "./utils/colorUtils";
import { getPreviewColor } from "./utils/colorUtils";
import { drawConnections } from "./utils/drawingUtils";
import { checkAndGroupConnections, predictPairFinalColor } from "./utils/MergeUtils";
import { calculateProgress } from "./utils/calculateProgress";
import { checkAndAddNewNodes } from "./utils/checkAndAddNewNodes";
import { getConnectedNodes } from "./utils/getConnectedNodes";
import { appendHorizontalEdges, clearPatternLog, rebuildPatternLog } from "./utils/patternLog";
// import { checkOrientation } from "./utils/checkOrientation";
import { generateRandomGraph } from "./utils/randomGraph";

import SettingIconImage from "./assets/setting-icon.png";

import TaikoNode from "./components/TaikoNodes/TaikoNode";
import ErrorModal from "./components/ErrorModal";
import SettingsMenu from "./components/ToolMenu/settingMenu";
import ProgressBar from "./components/ProgressBar/progressBar";
import Title from "./components/title";
import { useAudio } from "./hooks/useAudio";
import { useSettings } from "./hooks/useSetting";

// import {checkGirth} from "./utils/girth"
import { runLevelChecks } from "./utils/levels";

const buildPairKey = (pair) => {
  if (!Array.isArray(pair)) return "";

  const normalized = pair
    .map((connection) => {
      const nodes = Array.isArray(connection?.nodes)
        ? [...connection.nodes].sort()
        : ["__missing__"];
      return nodes.join("|");
    })
    .sort();

  return JSON.stringify(normalized);
};

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
  const [flashingNodes, setFlashingNodes] = useState([]);
  const topOrientation = useRef(new Map());
  const botOrientation = useRef(new Map());

  const [isDraggingLine, setIsDraggingLine] = useState(false);
  const [currentLineEl, setCurrentLineEl] = useState(null);
  const [level, setLevel] = useState("level");

  const [selectedLevel, setSelectedLevel] = useState(null);
  const [isDropdownDisabled, setIsDropdownDisabled] = useState(false);

  const [history, setHistory] = useState([
    {
      connections: [],
      connectionPairs: [],
      connectionGroups: [],
      topRowCount: 1,
      bottomRowCount: 1,
      edgeState: null,
      groupMap: new Map(),
      topOrientationMap: new Map(),
      botOrientationMap: new Map(),
    },
  ]);
  const [currentStep, setCurrentStep] = useState(0);

  // Maintain an append‑only log of connection actions.
  // Each entry is an object: { type: "connect"|"undo", conn: "..." }
  const connectionLogRef = useRef([]);
  const processedPairKeysRef = useRef(new Set());
  
  // Pattern log for noFold/noPattern checks
  const patternLogRef = useRef({
    topSequence: [],
    bottomSequence: []
  });

  const handleLevelChange = (event) => {
    setSelectedLevel(event.target.value);
    setLevel(event.target.value);
    setIsDropdownDisabled(true); // Disable dropdown after selection.
  };

  // Custom hooks for managing audio and settings.
  const { clickAudio, errorAudio, connectsuccess, perfectAudio } = useAudio();
  const {
    offset,
    setOffset,
    soundBool,
    setSoundBool,
    blackDotEffect,
    setBlackDotEffect,
    lightMode,
    setLightMode,
  } = useSettings();

  // References for SVG elements and connection groups.
  const [showSettings, setShowSettings] = useState(false);
  const [welcomeMessage, setWelcomeMessage] = useState(false);
  const [Percent100Message, setPercent100Message] = useState(false);

  // Function to save current state to history.
  const saveToHistory = () => {
    const newState = {
      connections: structuredClone(connections),
      connectionPairs: structuredClone(connectionPairs),
      connectionGroups: structuredClone(connectionGroups),
      topRowCount,
      bottomRowCount,
      edgeState,
      groupMap: structuredClone(groupMapRef.current),
      topOrientationMap: structuredClone(topOrientation.current),
      botOrientationMap: structuredClone(botOrientation.current),
    };

    setHistory([...history, newState]);
    setCurrentStep(currentStep + 1);
  };

  // Helper to print the full connection log.
  const printFullConnectionLog = useCallback(() => {
    const fullLog = connectionLogRef.current
      .map((entry) =>
        entry.type === "undo" ? `UNDID ${entry.conn}` : entry.conn
      )
      .join(", ");
    console.log(`Updated connection order: ${fullLog}`);
  }, []);

  // Updated handleUndo function with console logging.
  const handleUndo = useCallback(() => {
    if (currentStep > 0) {
      console.log("Before undo:");
      console.log("connections:", connections);
      console.log("connectionPairs:", connectionPairs);
      console.log("connectionGroups:", connectionGroups);
      console.log(
        "topRowCount:",
        topRowCount,
        "bottomRowCount:",
        bottomRowCount
      );
      console.log("edgeState:", edgeState);
      console.log("groupMap:", groupMapRef.current);
      console.log("topOrientation:", topOrientation.current);
      console.log("botOrientation:", botOrientation.current);

      const previousState = history[currentStep];

      const processedKeys = new Set();
      previousState.connectionPairs.forEach((pair) => {
        if (Array.isArray(pair) && pair.length === 2) {
          const key = buildPairKey(pair);
          if (key) {
            processedKeys.add(key);
          }
        }
      });
      processedPairKeysRef.current = processedKeys;
      
      // Rebuild pattern log from previous state
      rebuildPatternLog(
        patternLogRef.current,
        previousState.connectionPairs,
        { current: new Map(previousState.topOrientationMap) },
        { current: new Map(previousState.botOrientationMap) }
      );

      // Restore state variables.
      setConnections(previousState.connections);
      setConnectionPairs(previousState.connectionPairs);
      setConnectionGroups(previousState.connectionGroups);
      setTopRowCount(previousState.topRowCount);
      setBottomRowCount(previousState.bottomRowCount);
      setEdgeState(previousState.edgeState);

      // Restore ref values.
      groupMapRef.current = new Map(previousState.groupMap);
      topOrientation.current = new Map(previousState.topOrientationMap);
      botOrientation.current = new Map(previousState.botOrientationMap);

      setHistory((prev) => prev.slice(0, -1));
      setCurrentStep(currentStep - 1);

      console.log("After undo (restored state):");
      console.log("connections:", previousState.connections);
      console.log("connectionPairs:", previousState.connectionPairs);
      console.log("connectionGroups:", previousState.connectionGroups);
      console.log(
        "topRowCount:",
        previousState.topRowCount,
        "bottomRowCount:",
        previousState.bottomRowCount
      );
      console.log("edgeState:", previousState.edgeState);
      console.log("groupMap:", previousState.groupMap);
      console.log("topOrientation:", previousState.topOrientationMap);
      console.log("botOrientation:", previousState.botOrientationMap);

      // Find the last "connect" entry that is considered active.
      // We scan backwards and assume the most recent connect is the one to undo.
      let lastIndex = -1;
      for (let i = connectionLogRef.current.length - 1; i >= 0; i--) {
        if (connectionLogRef.current[i].type === "connect") {
          lastIndex = i;
          break;
        }
      }
      // Append an "undo" record for that connection, leaving the previous connect entry intact.
      if (lastIndex !== -1) {
        const connStr = connectionLogRef.current[lastIndex].conn;
        connectionLogRef.current.push({ type: "undo", conn: connStr });
        printFullConnectionLog();
      }
    }
  }, [
    currentStep,
    connections,
    connectionPairs,
    connectionGroups,
    topRowCount,
    bottomRowCount,
    edgeState,
    history,
    printFullConnectionLog,
  ]);

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
    drawConnections(
      svgRef,
      connections,
      connectionPairs,
      offset,
      topOrientation,
      botOrientation
    );
  }, [
    connectionGroups,
    connections,
    topRowCount,
    bottomRowCount,
    connectionPairs,
    offset,
  ]);

  /**
   * Checks if new nodes should be added based on current connections.
   */
  useEffect(() => {
    checkAndAddNewNodes(
      topRowCount,
      bottomRowCount,
      connections,
      setTopRowCount,
      setBottomRowCount
    );
  }, [connections, topRowCount, bottomRowCount]);

  /**
   * Calculates progress as a percentage based on completed connections.
   */
  useEffect(() => {
    const timer = setTimeout(() => {
      const newProgress = calculateProgress(
        connections,
        topRowCount,
        bottomRowCount
      );
      setProgress(newProgress);

      if (newProgress === 100) {
        setPercent100Message(true);
        if (soundBool) {
          perfectAudio.play();
        }
      } else if (newProgress > previousProgressRef.current && soundBool) {
        connectsuccess.play();
      }

      previousProgressRef.current = newProgress;
    }, 100);
    return () => clearTimeout(timer);
  }, [connections, topRowCount, bottomRowCount, soundBool, perfectAudio, connectsuccess]);

  /**
   * Handles window resize events to redraw connections.
   */
  useEffect(() => {
    const handleResize = () => {
      drawConnections(svgRef, connections, connectionPairs, offset);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [svgRef, connections, connectionPairs, offset]);

  /**
   * Updates the temporary dragging line on mouse move.
   */
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (isDraggingLine && currentLineEl) {
        const svgRect = svgRef.current.getBoundingClientRect();
        const mouseX = e.clientX - svgRect.left;
        const mouseY = e.clientY - svgRect.top;
        currentLineEl.setAttribute("x2", mouseX);
        currentLineEl.setAttribute("y2", mouseY);

        const defaultColor = "grey";

        /* try to predict the final color accounting for potential folds/merges. */
        const el = document.elementFromPoint(e.clientX, e.clientY);
        
        if (el && el.id && typeof el.id === "string") {
          const hoveredId = el.id;
          if (edgeState && (hoveredId.startsWith("top-") || hoveredId.startsWith("bottom-"))) {

            const startNode = selectedNodes[0];

            if (startNode) {
              const isTopStart = startNode.startsWith("top");
              const node1 = isTopStart ? startNode : hoveredId;
              const node2 = isTopStart ? hoveredId : startNode;

              if ((isTopStart && hoveredId.startsWith("bottom-")) || (!isTopStart && hoveredId.startsWith("top-"))) {
                const simulatedSecond = { nodes: [node1, node2], color: edgeState.color };
                const predicted = predictPairFinalColor([edgeState, simulatedSecond], groupMapRef.current);
                if (predicted) {
                  currentLineEl.setAttribute("stroke", predicted);
                } else {
                  currentLineEl.setAttribute("stroke", edgeState.color || defaultColor);
                }
              }
            }
          }
        }
      }
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [isDraggingLine, currentLineEl]);

  useEffect(() => {
    const handleMouseUp = () => {
      if (isDraggingLine && !selectedNodes[1]) {
        if (currentLineEl && svgRef.current.contains(currentLineEl)) {
          svgRef.current.removeChild(currentLineEl);
        }
        setIsDraggingLine(false);
  // setStartNode(null);
        setCurrentLineEl(null);
      }
    };
    window.addEventListener("mouseup", handleMouseUp);
    return () => window.removeEventListener("mouseup", handleMouseUp);
  }, [isDraggingLine, currentLineEl, selectedNodes]);

  // Removes flashing effect after timeout

  useEffect(() => {
    const timer = setTimeout(() => {
      setFlashingNodes([]);
    }, 12000);

    // TODO: change to flash until fixed?

    return () => {
      clearTimeout(timer);
    };
  }, [flashingNodes]);

  /**
   * Groups connections when a new connection pair is completed.
   */
  useEffect(() => {
    const latestPair = connectionPairs[connectionPairs.length - 1];
    if (latestPair && latestPair.length === 2) {
      const pairKey = buildPairKey(latestPair);
      if (!processedPairKeysRef.current.has(pairKey)) {
        // Unified level checks: run all constraints for the selected level
        const validation = runLevelChecks(level, latestPair, {
          groupMapRef,
          topOrientation,
          botOrientation,
          connections,
          connectionPairs,
          topRowCount,
          bottomRowCount,
          patternLog: patternLogRef.current,
        }, setFlashingNodes);
        if (!validation.ok) {
          setErrorMessage(validation.message || "Level condition failed!");
          setSelectedNodes([]);
          handleUndo();
          return;
        }
        processedPairKeysRef.current.add(pairKey);
        
        // Add to pattern log after successful validation
        const [firstConnection, secondConnection] = latestPair;
        const [top1, bottom1] = firstConnection.nodes;
        const [top2, bottom2] = secondConnection.nodes;
        const color = secondConnection.color;
        
        const topNodes = [top1, top2].sort();
        const bottomNodes = [bottom1, bottom2].sort();
        const topKey = topNodes.join(',');
        const bottomKey = bottomNodes.join(',');
        
        const topDir = topOrientation.current.get(topKey);
        const botDir = botOrientation.current.get(bottomKey);
        
        appendHorizontalEdges(patternLogRef.current, pairKey, {
          topNodes,
          bottomNodes,
          color,
          topOrientation: topDir,
          bottomOrientation: botDir
        });
        
        checkAndGroupConnections(
          latestPair,
          groupMapRef,
          setConnectionGroups,
          connections,
          setConnections,
          connectionPairs
        );
      }
    }
    console.log("topOrientation", topOrientation);
    console.log("botOrientation", botOrientation);
    console.log("groupMapRef", groupMapRef);
  }, [connectionPairs, level, connections, topRowCount, bottomRowCount, handleUndo]);

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
        isFlashing={flashingNodes.includes(`top-${i}`)}
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
        isFlashing={flashingNodes.includes(`bottom-${i}`)}
      />
    ));

  // Updated node click handler.
  const handleNodeClick = (nodeId) => {
    setErrorMessage("");

    if (soundBool) clickAudio.play();

    if (!selectedLevel) {
      setErrorMessage("Please select a level and try again!!!!");
      return;
    }

    // Deselect if node is already selected.
    if (selectedNodes.includes(nodeId)) {
      setSelectedNodes(selectedNodes.filter((id) => id !== nodeId));
      setHighlightedNodes([]);
      return;
    }

    const newSelectedNodes = [...selectedNodes, nodeId];
    setSelectedNodes(newSelectedNodes);

    if (newSelectedNodes.length === 1) {
      const connectedNodes = getConnectedNodes(nodeId, connectionPairs);
      setHighlightedNodes(connectedNodes);
      setIsDraggingLine(true);
  // setStartNode(nodeId);

      const nodeElem = document.getElementById(nodeId);
      const nodeRect = nodeElem.getBoundingClientRect();
      const svgRect = svgRef.current.getBoundingClientRect();
      const startX = nodeRect.left + nodeRect.width / 2 - svgRect.left;
      const startY = nodeRect.top + nodeRect.height / 2 - svgRect.top;

      const line = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "line"
      );
      line.setAttribute("x1", startX);
      line.setAttribute("y1", startY);
      line.setAttribute("x2", startX);
      line.setAttribute("y2", startY);

  const initialPreview = edgeState ? edgeState.color : getPreviewColor(connectionPairs);
  line.setAttribute("stroke", initialPreview || "gray");
      line.setAttribute("stroke-width", "4");
      line.setAttribute("stroke-dasharray", "5,5");

      svgRef.current.appendChild(line);
      setCurrentLineEl(line);
    } else if (newSelectedNodes.length === 2) {
      if (currentLineEl && svgRef.current.contains(currentLineEl)) {
        svgRef.current.removeChild(currentLineEl);
      }
      setIsDraggingLine(false);
      tryConnect(newSelectedNodes);
      setSelectedNodes([]);
      setHighlightedNodes([]);
    }
  };

  // const handleToolMenuClick = () => setShowSettings((prev) => !prev);

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
    processedPairKeysRef.current = new Set();
    clearPatternLog(patternLogRef.current);    // Reset history and clear the connection log.
    setHistory([
      {
        connections: [],
        connectionPairs: [],
        connectionGroups: [],
        topRowCount: 1,
        bottomRowCount: 1,
        edgeState: null,
        groupMap: new Map(),
        topOrientationMap: new Map(),
        botOrientationMap: new Map(),
      },
    ]);
    setCurrentStep(0);
    connectionLogRef.current = [];
  };

  const handleSoundClick = () => {
    setSoundBool((prev) => !prev);
  };

  const handleOffsetChange = (newOffset) => {
    setOffset(newOffset);
    localStorage.setItem("offset", newOffset);
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

    if (isBottomNode(node1) && isTopNode(node2)) {
      [node1, node2] = [node2, node1];
    }

    if (
      (isTopNode(node1) && isTopNode(node2)) ||
      (isBottomNode(node1) && isBottomNode(node2))
    ) {
      if (soundBool) errorAudio.play();
      setErrorMessage("Can't connect two vertices from the same row.");
      setSelectedNodes([]);
      return;
    }

    const isDuplicate = connections.some(
      (conn) =>
        (conn.nodes.includes(node1) && conn.nodes.includes(node2)) ||
        (conn.nodes.includes(node2) && conn.nodes.includes(node1))
    );
    if (isDuplicate) {
      if (soundBool) errorAudio.play();
      setErrorMessage("These vertices are already connected.");
      setSelectedNodes([]);
      return;
    }

    if (
      edgeState &&
      (edgeState.nodes.includes(node1) || edgeState.nodes.includes(node2))
    ) {
      if (soundBool) errorAudio.play();
      setErrorMessage(
        "Two vertical edges in each pair should not share a common vertex"
      );
      setSelectedNodes([]);
      return;
    }

    // Save current state before updating.
    saveToHistory();

    let newColor;
    if (edgeState) {
      newColor = edgeState.color;
      const newConnection = { nodes: [node1, node2], color: newColor };
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
        return updatedPairs;
      });
      setEdgeState(null);

      // Always record connection without pending text.
      const connectionStr = `${node1} -> ${node2}`;
      connectionLogRef.current.push({ type: "connect", conn: connectionStr });
      console.log(`Added connection: ${connectionStr}`);
      printFullConnectionLog();
    } else {
      newColor = generateColor(currentColor, setCurrentColor, connectionPairs);
      const newConnection = { nodes: [node1, node2], color: newColor };
      setConnections([...connections, newConnection]);
      setConnectionPairs([...connectionPairs, [newConnection]]);
      setEdgeState(newConnection);

      const connectionStr = `${node1} -> ${node2}`;
      connectionLogRef.current.push({ type: "connect", conn: connectionStr });
      console.log(`Added connection: ${connectionStr}`);
      printFullConnectionLog();
    }
    setSelectedNodes([]);
  };

  if (lightMode) {
    document.body.classList.add("light-mode");
  } else {
    document.body.classList.remove("light-mode");
  }

  return (
    <div className={`app-container ${lightMode ? "light-mode" : "dark-mode"}`}>
      <Title />
      <ProgressBar
        progress={progress}
        connections={connections}
        topRowCount={topRowCount}
        bottomRowCount={bottomRowCount}
        lightMode={lightMode}
      />
      {welcomeMessage && (
        <div className="welcome-message fade-message">
          Connect the vertices!
        </div>
      )}
      {Percent100Message && (
        <div className="welcome-message fade-message">You did it! 100%!</div>
      )}
      <img
        src={SettingIconImage}
        alt="Settings Icon"
        className="icon"
        onClick={() => setShowSettings((prev) => !prev)}
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
            value={selectedLevel ?? ""}
            onChange={handleLevelChange}
            disabled={isDropdownDisabled}
            className="level-dropdown"
            defaultValue=""
          >
            <option value="" disabled>
              Choose a level
            </option>
            <option value="Level 1">Level 1</option>
            <option value="Level 2">Level 2</option>
            <option value="Level 3">Level 3</option>
            <option value="Level 4NP">Level 4NP</option>
            <option value="Level 4.6">Level 4.6</option>
          </select>
        </div>
      ) : (
        <div
          className="level-selected"
          style={{ color: lightMode ? "black" : "white" }}
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
          <div className="game-row bottom-row">
            {createBottomRow(bottomRowCount)}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
