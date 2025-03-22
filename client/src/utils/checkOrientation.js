export const checkOrientation = (newPair, groupMapRef, topOrientation, botOrientation, horiEdgesRef) => {
    if (newPair.length !== 2) return;

    const [firstConnection, secondConnection] = newPair;
    let [top1_, bottom1_] = firstConnection.nodes;
    let [top2_, bottom2_] = secondConnection.nodes;

    const getNodeNumber = (nodeId) => {
        const parts = nodeId.split('-');
        return parseInt(parts[1], 10);
    };
    

    const topCombination = [top1_, top2_].sort().join(',');
    const bottomCombination = [bottom1_, bottom2_].sort().join(',');

    const top1 = getNodeNumber(top1_)
    const top2 = getNodeNumber(top2_)
    const bottom1 = getNodeNumber(bottom1_)
    const bottom2 = getNodeNumber(bottom2_)

    /*case 1
    */
    if (!topOrientation.current.has(topCombination) && !botOrientation.current.has(bottomCombination)) {
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

    /*case 2
    */
    if(!botOrientation.current.get(bottomCombination) && topOrientation.current.get(topCombination)) {
        if(((top1 > top2) && (bottom1 > bottom2))
        || ((top1 < top2) && (bottom1 < bottom2))) {
            botOrientation.current.set(bottomCombination, topOrientation.current.get(topCombination));
        } else if(
        (   (top1 > top2) && (bottom1 < bottom2))
        || ((top1 < top2) && (bottom1 > bottom2))
        ) {
            botOrientation.current.set(bottomCombination, 
            topOrientation.current.get(topCombination) === "right" ? "left" : "right");
        }
        return 0;
    } 
    /*case 3
    */
   else if (botOrientation.current.get(bottomCombination) && !topOrientation.current.get(topCombination)) {
        if(((top1 > top2) && (bottom1 > bottom2))
        || ((top1 < top2) && (bottom1 < bottom2))) {
            topOrientation.current.set(topCombination, botOrientation.current.get(bottomCombination));
        } else if(
        (   (top1 > top2) && (bottom1 < bottom2))
        || ((top1 < top2) && (bottom1 > bottom2))
        ) {
            topOrientation.current.set(topCombination, 
            botOrientation.current.get(bottomCombination) === "right" ? "left" : "right");
        }
        return 0;
    }

    /*case 4
    */
    if (topOrientation.current.get(topCombination) && botOrientation.current.get(bottomCombination)) {
        const topGroup = groupMapRef.current.get(topCombination);
        const bottomGroup = groupMapRef.current.get(bottomCombination);
    
        if (!topGroup || !bottomGroup) {
            console.error("One of the groups is missing in groupMapRef");
            return 0;
        }
        const topDir = topOrientation.current.get(topCombination);
        const botDir = botOrientation.current.get(bottomCombination);
    
        const isCrossed = (bottom1 < bottom2 && top1 > top2) || (bottom1 > bottom2 && top1 < top2);
        const sameDirection = (topDir === botDir);
    
        const shouldFlip = (sameDirection && isCrossed) || (!sameDirection && !isCrossed);
    
        if (shouldFlip) {
            if (topGroup === bottomGroup) {
                return -1;
            }
    
            for (const combo of topGroup.combinations) {
                if (topOrientation.current.has(combo)) {
                    const dir = topOrientation.current.get(combo);
                    // if (horiEdgesRef && horiEdgesRef.current) {
                    //     if (dir == "right") {
                    //         let connColor = horiEdgesRef.current.get(top1)[0].get(top2);
                    //         horiEdgesRef.current.get(top1)[0].delete(top2);
                    //         horiEdgesRef.current.get(top2)[1].delete(top1);
                    //         horiEdgesRef.current.get(top2)[0].set(top1, connColor);
                    //         horiEdgesRef.current.get(top1)[1].set(top2, connColor);
                    //     } else if (dir == "left") {
                    //         let connColor = horiEdgesRef.current.get(top1)[1].get(top2);
                    //         horiEdgesRef.current.get(top1)[1].delete(top2);
                    //         horiEdgesRef.current.get(top2)[0].delete(top1);
                    //         horiEdgesRef.current.get(top2)[1].set(top1, connColor);
                    //         horiEdgesRef.current.get(top1)[0].set(top2, connColor);
                    //     }
                    // }
                    topOrientation.current.set(combo, dir === "right" ? "left" : "right");
                }
                if (botOrientation.current.has(combo)) {
                    const dir = botOrientation.current.get(combo);
                    // if (horiEdgesRef && horiEdgesRef.current) {
                    //     if (dir == "right") {
                    //         let connColor = horiEdgesRef.current.get(bottom1)[0].get(bottom2);
                    //         horiEdgesRef.current.get(bottom1)[0].delete(bottom2);
                    //         horiEdgesRef.current.get(bottom2)[1].delete(bottom1);
                    //         horiEdgesRef.current.get(bottom2)[0].set(bottom1, connColor);
                    //         horiEdgesRef.current.get(bottom1)[1].set(bottom2, connColor);
                    //     } else if (dir == "left") {
                    //         let connColor = horiEdgesRef.current.get(bottom1)[1].get(bottom2);
                    //         horiEdgesRef.current.get(bottom1)[1].delete(bottom2);
                    //         horiEdgesRef.current.get(bottom2)[0].delete(bottom1);
                    //         horiEdgesRef.current.get(bottom2)[1].set(bottom1, connColor);
                    //         horiEdgesRef.current.get(bottom1)[0].set(bottom2, connColor);
                    //     }
                    // }
                    botOrientation.current.set(combo, dir === "right" ? "left" : "right");
                }
            }
        }
    
        return 0;
    }
};

