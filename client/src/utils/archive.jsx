// try bound of 21 by 21 on last level
// remove music on different branch

// if not greedy, backtracking?

import { useState, useRef, useEffect, useCallback } from "react";

import { generateColor } from "./utils/colorUtils";
import { getPreviewColor } from "./utils/colorUtils";
import { drawConnections } from "./utils/drawingUtils";
import { checkAndGroupConnections, predictPairFinalColor } from "./utils/MergeUtils";
import { calculateProgress } from "./utils/calculateProgress";
import { calculateScore } from "./utils/calculateScore";
import { checkAndAddNewNodes } from "./utils/checkAndAddNewNodes";
import { getConnectedNodes } from "./utils/getConnectedNodes";
import { appendHorizontalEdges, clearPatternLog, rebuildPatternLog } from "./utils/patternLog";
// import { checkOrientation } from "./utils/checkOrientation";
// import { generateRandomGraph } from "./utils/randomGraph";

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
  const connectionsRef = useRef(connections);
  const connectionPairsRef = useRef(connectionPairs);
  const connectionGroupsRef = useRef(connectionGroups);
  const topRowCountRef = useRef(topRowCount);
  const bottomRowCountRef = useRef(bottomRowCount);
  const edgeStateRef = useRef(edgeState);
  const currentColorRef = useRef(currentColor);
  const levelRef = useRef("level");
  const previousProgressRef = useRef(progress);
  const [highlightedNodes, setHighlightedNodes] = useState([]);
  const [flashingNodes, setFlashingNodes] = useState([]);
  const [endpointStatusMap, setEndpointStatusMap] = useState({}); // id -> { status: 'valid'|'invalid', reason?: string }
  const topOrientation = useRef(new Map());
  const botOrientation = useRef(new Map());
  const maxTopRef = useRef(null);
  const maxBottomRef = useRef(null);

  const [isDraggingLine, setIsDraggingLine] = useState(false);
  const [isRandomizing, setIsRandomizing] = useState(false);
  const [randomizingTimer, setRandomizingTimer] = useState(null);
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
    maxTopNodes,
    setMaxTopNodes,
    maxBottomNodes,
    setMaxBottomNodes,
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

  const saveToHistoryNow = () => {
    const newState = {
      connections: structuredClone(connectionsRef.current),
      connectionPairs: structuredClone(connectionPairsRef.current),
      connectionGroups: structuredClone(connectionGroupsRef.current),
      topRowCount: topRowCountRef.current,
      bottomRowCount: bottomRowCountRef.current,
      edgeState: edgeStateRef.current,
      groupMap: structuredClone(groupMapRef.current),
      topOrientationMap: structuredClone(topOrientation.current),
      botOrientationMap: structuredClone(botOrientation.current),
    };

    setHistory((h) => [...h, newState]);
    setCurrentStep((s) => s + 1);
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

  useEffect(() => {
    connectionsRef.current = connections;
  }, [connections]);
  useEffect(() => {
    connectionPairsRef.current = connectionPairs;
  }, [connectionPairs]);
  useEffect(() => {
    connectionGroupsRef.current = connectionGroups;
  }, [connectionGroups]);
  useEffect(() => {
    topRowCountRef.current = topRowCount;
  }, [topRowCount]);
  useEffect(() => {
    bottomRowCountRef.current = bottomRowCount;
  }, [bottomRowCount]);
  useEffect(() => {
    edgeStateRef.current = edgeState;
  }, [edgeState]);
  useEffect(() => {
    currentColorRef.current = currentColor;
  }, [currentColor]);
  useEffect(() => {
    levelRef.current = level;
  }, [level]);

  // Begin timeout events for randomize
  const startRandomize = () => {
    const timer = setInterval(() => {
      const maxAttempts = 20000;
      const candidates = [];

      // Precompute node degrees to bias sampling towards higher-degree vertices.
      const tCount = topRowCountRef.current;
      const bCount = bottomRowCountRef.current;
      if (tCount <= 0 || bCount <= 0) {
        // nothing to do
      } else {
        const topDegrees = Array.from({ length: tCount }, (_, i) => 0);
        const botDegrees = Array.from({ length: bCount }, (_, i) => 0);
        for (const c of connectionsRef.current) {
          if (!Array.isArray(c.nodes)) continue;
          for (const nid of c.nodes) {
            if (typeof nid !== 'string') continue;
            if (nid.startsWith('top-')) {
              const idx = parseInt(nid.split('-')[1], 10);
              if (!Number.isNaN(idx) && idx >= 0 && idx < tCount) topDegrees[idx]++;
            } else if (nid.startsWith('bottom-')) {
              const idx = parseInt(nid.split('-')[1], 10);
              if (!Number.isNaN(idx) && idx >= 0 && idx < bCount) botDegrees[idx]++;
            }
          }
        }

        // Build sampling weights (degree + 1) so higher-degree nodes are more likely.
        const topWeights = topDegrees.map((d) => d + 1);
        const botWeights = botDegrees.map((d) => d + 1);

        const sampleIndexByWeights = (weights) => {
          const total = weights.reduce((s, w) => s + w, 0);

          let r = Math.random() * total;
          for (let i = 0; i < weights.length; i++) {
            r -= weights[i];
            if (r <= 0) return i;
          }

          return Math.floor(Math.random() * (weights.length - 0));
        };

        for (let attempt = 0; attempt < maxAttempts && candidates.length < 10000; attempt++) {
          const topIdx = sampleIndexByWeights(topWeights);
          const botIdx = sampleIndexByWeights(botWeights);
          const topId = `top-${topIdx}`;
          const botId = `bottom-${botIdx}`;

        const alreadyConnected = connectionsRef.current.some(
          (c) => c.nodes.includes(topId) && c.nodes.includes(botId)
        );
        if (alreadyConnected) continue;

        const pending = edgeStateRef.current;

        if (pending) {
          if (pending.nodes.includes(topId) || pending.nodes.includes(botId)) continue;

          const newConnection = { nodes: [topId, botId], color: pending.color };
          const candidatePair = [pending, newConnection];
          const validation = runLevelChecks(levelRef.current, candidatePair, {
            groupMapRef,
            topOrientation,
            botOrientation,
            connections: connectionsRef.current,
            connectionPairs: connectionPairsRef.current,
            topRowCount: topRowCountRef.current,
            bottomRowCount: bottomRowCountRef.current,
            patternLog: patternLogRef.current,
          }, setFlashingNodes);

          if (!validation.ok) continue;

          // simulate resulting state for scoring
          const simulatedConnections = [...connectionsRef.current, newConnection];
          const prevPairs = connectionPairsRef.current;
          const lastPair = prevPairs[prevPairs.length - 1];
          const simulatedPairs = lastPair && lastPair.length === 1
            ? [...prevPairs.slice(0, -1), [...lastPair, newConnection]]
            : [...prevPairs, [pending, newConnection]];


          let simulatedTopCount = topRowCountRef.current;
          let simulatedBottomCount = bottomRowCountRef.current;
          for (const conn of simulatedConnections) {
            const [node1, node2] = conn.nodes;
            const topIndex = parseInt(node1.startsWith('top-') ? node1.split('-')[1] : node2.split('-')[1], 10);
            const bottomIndex = parseInt(node1.startsWith('bottom-') ? node1.split('-')[1] : node2.split('-')[1], 10);
            simulatedTopCount = Math.max(simulatedTopCount, topIndex + 2);
            simulatedBottomCount = Math.max(simulatedBottomCount, bottomIndex + 2);
          }

          const score = calculateScore(simulatedConnections, simulatedTopCount, simulatedBottomCount);
          // respect max bounds while collecting candidates
          const maxTop = maxTopRef.current ?? maxTopNodes;
          const maxBottom = maxBottomRef.current ?? maxBottomNodes;
          if (!(simulatedTopCount > maxTop || simulatedBottomCount > maxBottom)) {
            candidates.push({ score, newConnection, simulatedConnections, simulatedPairs, type: 'pair' });
          }
        } else {
          const newColor = generateColor(currentColorRef.current, setCurrentColor, connectionPairsRef.current);
          const newConnection = { nodes: [topId, botId], color: newColor };

          const simulatedConnections = [...connectionsRef.current, newConnection];
          const simulatedPairs = [...connectionPairsRef.current, [newConnection]];
          
          let simulatedTopCount = topRowCountRef.current;
          let simulatedBottomCount = bottomRowCountRef.current;
          for (const conn of simulatedConnections) {
            const [node1, node2] = conn.nodes;
            const topIndex = parseInt(node1.startsWith('top-') ? node1.split('-')[1] : node2.split('-')[1], 10);
            const bottomIndex = parseInt(node1.startsWith('bottom-') ? node1.split('-')[1] : node2.split('-')[1], 10);
            simulatedTopCount = Math.max(simulatedTopCount, topIndex + 2);
            simulatedBottomCount = Math.max(simulatedBottomCount, bottomIndex + 2);
          }

          const score = calculateScore(simulatedConnections, simulatedTopCount, simulatedBottomCount);
          const maxTop = maxTopRef.current ?? maxTopNodes;
          const maxBottom = maxBottomRef.current ?? maxBottomNodes;
          if (!(simulatedTopCount > maxTop || simulatedBottomCount > maxBottom)) {
            candidates.push({ score, newConnection, simulatedConnections, simulatedPairs, type: 'single' });
          }
        }
  }
  }

  candidates.sort((a, b) => b.score - a.score);

  if (candidates.length > 0) {
        const best = candidates[0];

        console.log(best);

        // commit the best candidate atomically
        saveToHistoryNow();
        setConnections(best.simulatedConnections);
        setConnectionPairs(best.simulatedPairs);
        if (best.type === 'single') {
          setEdgeState(best.newConnection);
          connectionLogRef.current.push({ type: 'connect', conn: `${best.newConnection.nodes[0]} -> ${best.newConnection.nodes[1]}` });
        } else {
          setEdgeState(null);
          connectionLogRef.current.push({ type: 'connect', conn: `${best.newConnection.nodes[0]} -> ${best.newConnection.nodes[1]}` });
        }
        printFullConnectionLog();
      }
    }, 2000);

    setRandomizingTimer(timer);
  };

  const stopRandomize = () => {
    if (randomizingTimer) {
      clearInterval(randomizingTimer);
      setIsRandomizing(false);
    }
    setRandomizingTimer(null);
  };

  const handleRandomize = () => {
    if (isRandomizing) {
      stopRandomize();
    } else {
      startRandomize();
    }

    setIsRandomizing(!isRandomizing);
  };

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
      setBottomRowCount,
      maxTopNodes,
      maxBottomNodes
    );
  }, [connections, topRowCount, bottomRowCount]);

  // keep refs of maxes for interval closure
  useEffect(() => {
    maxTopRef.current = maxTopNodes;
  }, [maxTopNodes]);

  useEffect(() => {
    maxBottomRef.current = maxBottomNodes;
  }, [maxBottomNodes]);

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
        clearInterval(randomizingTimer);
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

  // Compute endpoint validity border
  useEffect(() => {
    const map = {};
    if (selectedNodes.length === 1) {
      const startNode = selectedNodes[0];
      const isTopStart = startNode.startsWith("top");
      const tCount = topRowCountRef.current;
      const bCount = bottomRowCountRef.current;

      const checkCandidate = (candidateId) => {
        if (!candidateId || candidateId === startNode) return { status: 'invalid', reason: 'Same node' };

        const isTopCand = candidateId.startsWith("top");
        if ((isTopStart && isTopCand) || (!isTopStart && !isTopCand)) return { status: 'invalid', reason: 'Cannot connect nodes in the same row' };

        const dup = connectionsRef.current.some(
          (c) => c.nodes.includes(startNode) && c.nodes.includes(candidateId)
        );
        if (dup) return { status: 'invalid', reason: 'These vertices are already connected' };

        const pending = edgeStateRef.current;
        if (pending) {
          if (pending.nodes.includes(startNode) || pending.nodes.includes(candidateId)) return { status: 'invalid', reason: 'Pending edge shares a vertex' };

          const newConn = { nodes: [startNode, candidateId], color: pending.color };
          const validation = runLevelChecks(levelRef.current, [pending, newConn], {
            groupMapRef,
            topOrientation,
            botOrientation,
            connections: connectionsRef.current,
            connectionPairs: connectionPairsRef.current,
            topRowCount: topRowCountRef.current,
            bottomRowCount: bottomRowCountRef.current,
            patternLog: patternLogRef.current,
          }, () => {});
          if (validation && validation.ok) return { status: 'valid' };

          const reason = validation && validation.message ? validation.message : 'Rule check failed';
          return { status: 'invalid', reason };
        }

        return { status: 'valid' };
      };

      if (isTopStart) {
        for (let i = 0; i < bCount; i++) {
          const id = `bottom-${i}`;
          map[id] = checkCandidate(id);
        }
      } else {
        for (let i = 0; i < tCount; i++) {
          const id = `top-${i}`;
          map[id] = checkCandidate(id);
        }
      }
    }

    setEndpointStatusMap(map);
  }, [selectedNodes, connections, connectionPairs, edgeState, topRowCount, bottomRowCount]);

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
    }, 8000);

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
        }, setFlashingNodes, false);
        if (!validation.ok) {
          let message = validation.message;
          
          if (validation.patterns && Array.isArray(validation.patterns) && validation.patterns.length > 0) {
            const parts = validation.patterns.map((p, idx) => {
              const toName = (pt) => {
                const q = pt.split('-');

                if (q[0] == 'top') {
                  return `b${parseInt(q[1]) + 1}`;
                }

                return `a${parseInt(q[1]) + 1}`;
              }

              return `Pattern ${idx + 1}: <div style="background: ${p.color1}; width: 18px; height: 18px; display: inline-block;"></div> ${p.orientation1} and <div style="background: ${p.color2}; width: 18px; height: 18px; display: inline-block;"></div> ${p.orientation2} at ${toName(p.pt2)}`;
            });
            message = `${message} \n ${parts.join('; ')}`;
          }

          setErrorMessage(message);
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
        endpointStatus={endpointStatusMap[`top-${i}`]?.status}
        endpointReason={endpointStatusMap[`top-${i}`]?.reason}
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
        endpointStatus={endpointStatusMap[`bottom-${i}`]?.status}
        endpointReason={endpointStatusMap[`bottom-${i}`]?.reason}
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
          maxTop={maxTopNodes}
          onMaxTopChange={setMaxTopNodes}
          maxBottom={maxBottomNodes}
          onMaxBottomChange={setMaxBottomNodes}
        />
      )}
      <button onClick={handleClear} className="clear-button">
        Clear
      </button>
      <button onClick={handleUndo} className="undo-button">
        Undo
      </button>
      <button onClick={handleRandomize} className="randomize-button">
        {isRandomizing ? 'Stop Generating' : 'Random Taiko'}
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
