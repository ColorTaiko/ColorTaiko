// Centralized level validation mapping and runner.
// Each check has signature: (latestPair, context) => ({ ok: boolean, message?: string })

import { checkOrientation } from "./checkOrientation";
import { checkGirth } from "./girth";
import { noFold } from "./noFold"; // stubbed; replace with your real implementation later
import { noPattern } from "./noPattern"; // stubbed; replace with your real implementation later

// Adapters to normalize existing check functions to a unified { ok, message } interface
const orientationCheck = (latestPair, ctx) => {
  const res = checkOrientation(
    latestPair,
    ctx.groupMapRef,
    ctx.topOrientation,
    ctx.botOrientation,
    { patternLog: ctx.patternLog }
  );
  if (res === -1) return { ok: false, message: "Orientation condition failed!" };
  return { ok: true };
};

const girthCheck = (minGirth) => (latestPair, ctx) => {
  const res = checkGirth(ctx.topOrientation, ctx.botOrientation, minGirth);
  if (res === -1)
    return { ok: false, message: `Girth length should be at least ${minGirth}!` };
  return { ok: true };
};

const noFoldCheck = (latestPair, ctx) => {
  const res = noFold(latestPair, ctx);
  if (res && res.ok === false)
    return { ok: false, message: res.message || "No-Fold condition failed!" };
  return { ok: true };
};

const noPatternCheck = (setFlashingNodes) => {
  return  (latestPair, ctx) => {
    const res = noPattern(latestPair, ctx, setFlashingNodes);
    if (res && res.ok === false) {
      return {
        ok: false,
        message: res.message || "No-Pattern condition failed!",
        patterns: res.patterns || null,
      };
    }
    return { ok: true };
  };
};

// Level -> cumulative checks
// Per user: Levels are progressive through Level 3, then branch: 4NP and 4.6 are parallel.
export function getChecksForLevel(level, setFlashingNodes) {
  switch (level) {
    case "Level 1":
      return [];
    case "Level 2":
      return [orientationCheck];
    case "Level 3":
      return [orientationCheck, noFoldCheck];
    case "Level 4NP":
      return [orientationCheck, noFoldCheck, noPatternCheck(setFlashingNodes)];
    case "Level 4.6":
      return [orientationCheck, noFoldCheck, girthCheck(6)];
    default:
      return [];
  }
}

// Run all checks for a given level; stop at first failure.
export function runLevelChecks(level, latestPair, context, setFlashingNodes) {
  const checks = getChecksForLevel(level, setFlashingNodes);
  for (const check of checks) {
    const result = check(latestPair, context) || { ok: true };
    if (!result.ok) return result;
  }
  return { ok: true };
}
