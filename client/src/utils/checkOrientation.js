import { updatePatternLogOrientations } from "./patternLog";

export const checkOrientation = (
    newPair,
    groupMapRef,
    topOrientation,
    botOrientation,
    options = {}
) => {
    const { patternLog } = options;
    if (newPair.length !== 2) return;

    const [firstConnection, secondConnection] = newPair;
    let [top1_, bottom1_] = firstConnection.nodes;
    let [top2_, bottom2_] = secondConnection.nodes;

    const getNodeNumber = (nodeId) => +nodeId.slice(nodeId.indexOf("-") + 1);

    const flipDir = (dir) => (dir === "right" ? "left" : "right");

    const topCombination = [top1_, top2_].sort().join(',');
    const bottomCombination = [bottom1_, bottom2_].sort().join(',');

    const top1 = getNodeNumber(top1_);
    const top2 = getNodeNumber(top2_);
    const bottom1 = getNodeNumber(bottom1_);
    const bottom2 = getNodeNumber(bottom2_);

    const topDirection = topOrientation.current.get(topCombination);
    const botDirection = botOrientation.current.get(bottomCombination);

    const isAligned = (top1 > top2 && bottom1 > bottom2) || (top1 < top2 && bottom1 < bottom2);

    /*
    case 1:
    Neither orientation known.
    */
    if (!topDirection && !botDirection) {
        botOrientation.current.set(bottomCombination, "right");
        topOrientation.current.set(topCombination, "right");

        if(top1 > top2) {
            topOrientation.current.set(topCombination, "left");
        }

        if(bottom1 > bottom2) {
            botOrientation.current.set(bottomCombination, "left");
        }

        return 0;
    }

    /*
    case 2:
    Only one orientation known.
    */

    if (!botDirection && topDirection) {
        botOrientation.current.set(bottomCombination, isAligned ? topDirection : flipDir(topDirection));
        return 0;
    }

    if (!topDirection && botDirection) {
        topOrientation.current.set(topCombination, isAligned ? botDirection : flipDir(botDirection));
        return 0;
    }

    /*
    case 3:
    Both orientations known.
    */

    if (topDirection && botDirection) {
        const topGroup = groupMapRef.current.get(topCombination);
        const bottomGroup = groupMapRef.current.get(bottomCombination);
    
        if (!topGroup || !bottomGroup) {
            console.error("One of the groups is missing in groupMapRef");
            return 0;
        }
    
        const isCrossed = (bottom1 < bottom2 && top1 > top2) || (bottom1 > bottom2 && top1 < top2);
        const sameDirection = (topDirection === botDirection);
    
        const shouldFlip = (sameDirection && isCrossed) || (!sameDirection && !isCrossed);
    
        if (shouldFlip) {
            if (topGroup === bottomGroup) {
                return -1;
            }
            const orientationUpdates = [];
            for (const combo of topGroup.combinations) {
                if (topOrientation.current.has(combo)) {
                    topOrientation.current.set(combo, flipDir(topOrientation.current.get(combo)));
                }
                
                if (botOrientation.current.has(combo)) {
                    botOrientation.current.set(combo, flipDir(botOrientation.current.get(combo)));
                }
            }
            if (patternLog && orientationUpdates.length > 0) {
                updatePatternLogOrientations(patternLog, orientationUpdates);
            }
        }
    
        return 0;
    }
};

