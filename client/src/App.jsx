import { useState, useRef, useEffect, useCallback } from "react";

import { generateColor } from "./utils/colorUtils";
import { drawConnections } from "./utils/drawingUtils";
import { checkAndGroupConnections } from "./utils/MergeUtils";
import { calculateProgress } from "./utils/calculateProgress";
import { checkAndAddNewNodes } from "./utils/checkAndAddNewNodes";
import { getConnectedNodes } from "./utils/getConnectedNodes";
import { appendHorizontalEdges, clearPatternLog, rebuildPatternLog } from "./utils/patternLog";
import { noFoldPreflightWithPatternLog } from "./utils/noFold";
import { noPatternPreflightWithPatternLog } from "./utils/noPattern";
import { levelsWithNoPattern } from "./utils/levels";
// import { checkOrientation } from "./utils/checkOrientation";

import SettingIconImage from "./assets/setting-icon.png";

import TaikoNode from "./components/TaikoNodes/TaikoNode";
import ErrorModal from "./components/ErrorModal";
import SettingsMenu from "./components/ToolMenu/settingMenu";
import ProgressBar from "./components/ProgressBar/progressBar";
import Title from "./components/title";
import { useAudio } from "./hooks/useAudio";
import { useSettings } from "./hooks/useSetting";

// import {checkGirth} from "./utils/girth"
import LevelTreeModal from "./components/LevelTreeModal/LevelTreeModal";
import MiniLevelSelector from "./components/LevelTreeModal/MiniLevelSelector";
import { levelGraph, levelDescriptions, runLevelChecks } from "./utils/levels";

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

const LAST_LEVEL_KEY = "color-taiko:last-level";

const levelAliasMap = {
  "Level 1": "Level 1",
  "Level 2": "Level 2",
  "Level 3.NF": "Level 3.NF",
  "Level 3.G4": "Level 3.G4",
  "Level 4.NF+NP": "Level 4.NF+NP",
  "Level 4.G4": "Level 4.G4",
  "Level 5.NP+G4": "Level 5.NP+G4",
  "Level 5.NP+G6": "Level 5.NP+G6",
};

const validRuntimeLevels = Object.values(levelAliasMap).filter(Boolean);

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
  const [currentLineEl, setCurrentLineEl] = useState(null);
  const [level, setLevel] = useState(null);

  const [selectedLevel, setSelectedLevel] = useState(null);
  const [isLevelModalOpen, setIsLevelModalOpen] = useState(false);

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

  const handleLevelSelect = (levelLabel) => {
    if (!levelLabel) return;

    const mappedLevel = levelAliasMap[levelLabel];

    if (!mappedLevel) {
      setErrorMessage(`Level "${levelLabel}" is not available yet.`);
      return;
    }

    if (mappedLevel !== level) {
      handleClear();
    }

    setSelectedLevel(levelLabel);
    setLevel(mappedLevel);
    try {
      localStorage.setItem(LAST_LEVEL_KEY, mappedLevel);
    } catch (storageError) {
      console.warn("Unable to persist last level selection", storageError);
    }
    setIsLevelModalOpen(false);
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

  useEffect(() => {
    try {
      const storedLevel = localStorage.getItem(LAST_LEVEL_KEY);
      if (storedLevel && validRuntimeLevels.includes(storedLevel)) {
        const displayLevel = Object.entries(levelAliasMap).find(
          ([, runtime]) => runtime === storedLevel
        )?.[0];
        setSelectedLevel(displayLevel ?? "Level 1");
        setLevel(storedLevel);
      } else {
        setSelectedLevel("Level 1");
        setLevel("Level 1");
      }
    } catch (storageError) {
      console.warn("Unable to read last level selection", storageError);
      setSelectedLevel("Level 1");
      setLevel("Level 1");
    }
  }, []);

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
        });
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

        // Redraw after orientation updates so arrows appear immediately
        try {
          drawConnections(
            svgRef,
            connections,
            connectionPairs,
            offset,
            topOrientation,
            botOrientation
          );
        } catch (e) {
          console.warn('Redraw after orientation update failed', e);
        }
      }
    }
    console.log("topOrientation", topOrientation);
    console.log("botOrientation", botOrientation);
    console.log("groupMapRef", groupMapRef);
  }, [connectionPairs, level, connections, topRowCount, bottomRowCount, handleUndo, offset]);

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

  // Updated node click handler.
  const handleNodeClick = (nodeId) => {
    setErrorMessage("");

    if (soundBool) clickAudio.play();

    if (!level) {
      setErrorMessage("Please choose an available level before connecting nodes.");
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
      line.setAttribute("stroke", "gray");
      line.setAttribute("stroke-width", "2");
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

    let newColor;
    if (edgeState) {
      // Preflight noFold using patternLog before committing the second edge
      newColor = edgeState.color;
      const candidateConnection = { nodes: [node1, node2], color: newColor };
      const candidatePair = [edgeState, candidateConnection];

      const preflight = noFoldPreflightWithPatternLog(candidatePair, {
        topOrientation,
        botOrientation,
        groupMapRef,
        patternLog: patternLogRef.current,
      });
      if (!preflight.ok) {
        if (soundBool) errorAudio.play();
        setErrorMessage(preflight.message || "No-Fold condition failed!");
        setSelectedNodes([]);
        setHighlightedNodes([]);
        // Automatically undo the pending first edge so user can start a fresh pair
        // (we saved history when the first edge was added)
        handleUndo();
        return;
      }

      // Run noPattern preflight only if current level requires it
      if (levelsWithNoPattern.has(level)) {
        const npPreflight = noPatternPreflightWithPatternLog(candidatePair, {
          topOrientation,
          botOrientation,
          groupMapRef,
          patternLog: patternLogRef.current,
        });
        if (!npPreflight.ok) {
          if (soundBool) errorAudio.play();
          setErrorMessage(npPreflight.message || "No-Pattern condition failed!");
          setSelectedNodes([]);
          setHighlightedNodes([]);
          handleUndo();
          return;
        }
      }

      // Save current state before updating (only after preflight success).
      saveToHistory();

      setConnections([...connections, candidateConnection]);
      setConnectionPairs((prevPairs) => {
        const lastPair = prevPairs[prevPairs.length - 1];
        let updatedPairs;
        if (lastPair && lastPair.length === 1) {
          updatedPairs = [
            ...prevPairs.slice(0, -1),
            [...lastPair, candidateConnection],
          ];
        } else {
          updatedPairs = [...prevPairs, [edgeState, candidateConnection]];
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
      // Save current state before updating the first edge of a pair
      saveToHistory();
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
      <div className="level-icon-wrapper">
        <MiniLevelSelector
          graph={levelGraph}
          selectedLevel={selectedLevel}
          onSelect={handleLevelSelect}
          onOpenFull={() => setIsLevelModalOpen(true)}
        />
        {selectedLevel && (
          <span className="level-icon__caption">{selectedLevel}</span>
        )}
      </div>
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
      <ErrorModal
        className="error-container"
        message={errorMessage}
        onClose={() => setErrorMessage("")}
      />
      <LevelTreeModal
        isOpen={isLevelModalOpen}
        onClose={() => setIsLevelModalOpen(false)}
        graph={levelGraph}
        selectedLevel={selectedLevel}
        onSelect={handleLevelSelect}
        descriptions={levelDescriptions}
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
