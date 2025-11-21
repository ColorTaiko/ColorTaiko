// Centralized level validation mapping and runner.
// Each check has signature: (latestPair, context) => ({ ok: boolean, message?: string })

import { checkOrientation } from "./checkOrientation.js";
import { checkGirth } from "./girth.js";
import { noFold } from "./noFold.js"; // runtime noFold
import { noPattern } from "./noPattern.js"; // stubbed; replace with your real implementation later
import { checkAndGroupConnections } from "./MergeUtils.js";

export const levelGraph = {
  nodes: [
  { id: "level-1", name: "Level 1", unlocked: true, xPercent: 50, yPercent: 92 },
  { id: "level-2", name: "Level 2", unlocked: true, xPercent: 50, yPercent: 74 },
  { id: "level-3-nf", name: "Level 3.NF", unlocked: true, xPercent: 50, yPercent: 54 },
  { id: "level-3-g4", name: "Level 3.G4", unlocked: true, xPercent: 84, yPercent: 54 },
  { id: "level-4-nf-np", name: "Level 4.NF+NP", unlocked: true, xPercent: 26, yPercent: 32 },
  { id: "level-4-nf-g4", name: "Level 4.NF+G4", unlocked: true, xPercent: 74, yPercent: 32 },
  { id: "level-5-nf-np-g4", name: "Level 5.NF+NP+G4", unlocked: true, xPercent: 50, yPercent: 12 },
  { id: "level-5-nf-np-g6", name: "Level 5.NF+NP+G6", unlocked: true, xPercent: 88, yPercent: 8 },
  ],
  edges: [
    ["level-1", "level-2"],
    ["level-2", "level-3-nf"],
    ["level-2", "level-3-g4"],
    ["level-3-nf", "level-4-nf-np"],
    ["level-3-nf", "level-4-nf-g4"],
    ["level-4-nf-np", "level-5-nf-np-g4"],
    ["level-4-nf-g4", "level-5-nf-np-g4"],
    ["level-5-nf-np-g4", "level-5-nf-np-g6"],
    ["level-3-g4", "level-5-nf-np-g6"],
  ],
};

export const levelDescriptions = {
  "Level 1": ["color merging"],
  "Level 2": ["color merging", "orientation"],
  "Level 3.NF": ["color merging", "orientation", "no-fold"],
  "Level 3.G4": ["color merging", "orientation", "girth-4"],
  "Level 4.NF+NP": ["color merging", "orientation", "no-fold", "no-pattern"],
  "Level 4.NF+G4": ["color merging", "orientation", "no-fold", "girth-4"],
  "Level 5.NF+NP+G4": ["color merging", "orientation", "no-fold", "no-pattern", "girth-4"],
  "Level 5.NF+NP+G6": ["color merging", "orientation", "no-fold", "no-pattern", "girth-6"],
};

// Levels that include the No-Pattern constraint
export const levelsWithNoPattern = new Set([
  "Level 4.NF+NP",
  "Level 5.NP+G4",
  "Level 5.NP+G6",
]);

// Adapters to normalize existing check functions to a unified { ok, message } interface
const orientationCheck = (latestPair, ctx) => {
  const res = checkOrientation(
    latestPair,
    ctx.groupMapRef,
    ctx.topOrientation,
    ctx.botOrientation,
    { patternLog: ctx.patternLog }
  );
  if (res === -1) {
    // Build violation details similar to noFold so UI can flash and show modal
    try {
      const [c1, c2] = Array.isArray(latestPair) ? latestPair : [];
      if (!c1 || !c2) return { ok: false, message: "Orientation condition failed!", code: "ORIENTATION" };

      const [top1, bottom1] = c1.nodes;
      const [top2, bottom2] = c2.nodes;
      const topNodes = [top1, top2].sort();
      const bottomNodes = [bottom1, bottom2].sort();
      const topId = topNodes.join(",");
      const bottomId = bottomNodes.join(",");

      const topDir = ctx.topOrientation?.current?.get(topId);
      const botDir = ctx.botOrientation?.current?.get(bottomId);

      // Color is optional; if grouping exists, try to pull it, else leave undefined
      const topColor = ctx.groupMapRef?.current?.get(topId)?.color;
      const bottomColor = ctx.groupMapRef?.current?.get(bottomId)?.color;

      const violations = [
        {
          sequence: "top",
          type: "orientation-conflict",
          edges: [
            {
              id: topId,
              nodes: topNodes,
              color: topColor,
              orientation: topDir || "right",
            },
          ],
        },
        {
          sequence: "bottom",
          type: "orientation-conflict",
          edges: [
            {
              id: bottomId,
              nodes: bottomNodes,
              color: bottomColor,
              orientation: botDir || "right",
            },
          ],
        },
      ];

      return {
        ok: false,
        code: "ORIENTATION",
        message: "Orientation condition failed!",
        violations,
      };
    } catch (_) {
      return { ok: false, code: "ORIENTATION", message: "Orientation condition failed!" };
    }
  }
  return { ok: true };
}; 

const girthCheck = (minGirth) => (latestPair, ctx) => {
  const res = checkGirth(ctx.topOrientation, ctx.botOrientation, minGirth);
  if (res === -1)
    return { ok: false, message: `Girth length should be at least ${minGirth}!` };
  return { ok: true };
};

const noFoldCheck = (latestPair, ctx) => {
  // Align with preflight: clone group map and simulate colour merge for latestPair
  const groupMapCloneRef = { current: new Map(ctx.groupMapRef?.current || []) };
  try {
    const noop = () => {};
    const connectionsClone = [];
    const connectionPairsClone = [];
    checkAndGroupConnections(
      latestPair,
      groupMapCloneRef,
      noop,
      connectionsClone,
      noop,
      connectionPairsClone
    );
  } catch {
    // ignore: merge simulation failure shouldn't block checks
  }

  const res = noFold(latestPair, { ...ctx, groupMapRef: groupMapCloneRef });
  if (res && res.ok === false)
    return {
      ok: false,
      message: res.message || "No-Fold condition failed!",
      code: res.code ?? "NO_FOLD",
      violations: res.violations,
    };
  return { ok: true };
};

const noPatternCheck = (latestPair, ctx) => {
  const res = noPattern(latestPair, ctx);
  if (res && res.ok === false)
    return { ok: false, message: res.message || "No-Pattern condition failed!" };
  return { ok: true };
};

// Level -> cumulative checks
// Per user: Levels are progressive through Level 3, then branch: 4NP and 4.6 are parallel.
export function getChecksForLevel(level) {
  switch (level) {
    case "Level 1":
      return [];
    case "Level 2":
      return [orientationCheck];
    case "Level 3.NF":
      return [orientationCheck, noFoldCheck];
    case "Level 3.G4":
      return [orientationCheck, girthCheck(4)];
    case "Level 4.NF+NP":
      return [orientationCheck, noFoldCheck, noPatternCheck];
    case "Level 4.NF+G4":
      return [orientationCheck, noFoldCheck, girthCheck(4)];
    case "Level 5.NF+NP+G4":
      return [orientationCheck, noFoldCheck, noPatternCheck, girthCheck(4)];
    case "Level 5.NF+NP+G6":
      return [orientationCheck, noFoldCheck, noPatternCheck, girthCheck(6)];

    default:
      return [];
  }
}

// Run all checks for a given level; stop at first failure.
export function runLevelChecks(level, latestPair, context) {
  const checks = getChecksForLevel(level);
  for (const check of checks) {
    const result = check(latestPair, context) || { ok: true };
    if (!result.ok) return result;
  }
  return { ok: true };
}
