export const checkOrientation = (
    newPair,
    groupMapRef,
    topOrientation,
    botOrientation
  ) => {
    if (newPair.length !== 2) return;
    const [c1, c2] = newPair;
    let [t1_, b1_] = c1.nodes;
    let [t2_, b2_] = c2.nodes;
    const num = id => parseInt(id.split("-")[1], 10);
    const topCombo = [t1_, t2_].sort().join(",");
    const botCombo = [b1_, b2_].sort().join(",");
    const t1 = num(t1_), t2 = num(t2_);
    const b1 = num(b1_), b2 = num(b2_);
    // Case 1: Neither exists yet.
    if (!topOrientation.current.has(topCombo) && !botOrientation.current.has(botCombo)) {
      topOrientation.current.set(topCombo, "out");
      botOrientation.current.set(botCombo, "out");
      if (t1 > t2) topOrientation.current.set(topCombo, "in");
      if (b1 > b2) botOrientation.current.set(botCombo, "in");
      return 0;
    }
    // Case 2: top exists, bottom missing.
    if (topOrientation.current.get(topCombo) && !botOrientation.current.get(botCombo)) {
      const topDir = topOrientation.current.get(topCombo);
      const same = (t1 > t2 && b1 > b2) || (t1 < t2 && b1 < b2);
      const flipped = topDir === "out" ? "in" : "out";
      botOrientation.current.set(botCombo, same ? topDir : flipped);
      return 0;
    }
    // Case 3: bottom exists, top missing.
    if (!topOrientation.current.get(topCombo) && botOrientation.current.get(botCombo)) {
      const botDir = botOrientation.current.get(botCombo);
      const same = (t1 > t2 && b1 > b2) || (t1 < t2 && b1 < b2);
      const flipped = botDir === "out" ? "in" : "out";
      topOrientation.current.set(topCombo, same ? botDir : flipped);
      return 0;
    }
    // Case 4: Both exist → maybe flip an entire group.
    if (topOrientation.current.get(topCombo) && botOrientation.current.get(botCombo)) {
      const topDir = topOrientation.current.get(topCombo);
      const botDir = botOrientation.current.get(botCombo);
      const crossed = (b1 < b2 && t1 > t2) || (b1 > b2 && t1 < t2);
      const sameDir = topDir === botDir;
      const shouldFlip = (sameDir && crossed) || (!sameDir && !crossed);
      if (shouldFlip) {
        // If they’re in the same group, that’s a hard violation.
        if (groupMapRef.current.get(topCombo) === groupMapRef.current.get(botCombo)) {
          return -1;
        }
        // Otherwise flip every combo in both groups.
        const flip = d => d === "out"?"in":"out";
        for (let combo of groupMapRef.current.get(topCombo).combinations) {
          if (topOrientation.current.has(combo)) {
            topOrientation.current.set(combo, flip(topOrientation.current.get(combo)));
          }
          if (botOrientation.current.has(combo)) {
            botOrientation.current.set(combo, flip(botOrientation.current.get(combo)));
          }
        }
      }
      return 0;
    }
  };