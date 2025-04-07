
// sets connection for incoming/outgoing edges 
export const setConnectionHER = (horiEdgesRef, ai, bi, color) => {
    // console.log("0HELLO")
    // outgoing edges map
    console.log("SCHER, ", ai, bi)
    if (!horiEdgesRef.current.has(ai)) {
        horiEdgesRef.current.set(ai, [new Map([[bi, color]]), new Map()]);
    } else {
        horiEdgesRef.current.get(ai)[0].set(bi, color);
    }
    horiEdgesRef.current.get(ai)[0].set(color, bi);
    // console.log("1HELLO")
    // incoming edges map
    if (!horiEdgesRef.current.has(bi)) {
        horiEdgesRef.current.set(bi, [new Map(), new Map([[ai, color]])]);
    } else {
        horiEdgesRef.current.get(bi)[1].set(ai, color);
    }
    horiEdgesRef.current.get(bi)[1].set(color, ai);
}

export const handleOrientationSwapHER = (horiEdgesRef, ai, bi) => {
    // ai -> bi
    // turns into
    // ai <- bi
    let oldColor = horiEdgesRef.current.get(ai)[0].get(bi);
    horiEdgesRef.current.get(ai)[0].delete(oldColor);
    horiEdgesRef.current.get(ai)[0].delete(bi);

    horiEdgesRef.current.get(bi)[1].delete(oldColor);
    horiEdgesRef.current.get(bi)[1].delete(ai);
    setConnectionHER(bi, ai, oldColor)
}



export const checkOrientation = (newPair, groupMapRef, topOrientation, botOrientation, flippedConnectionsPerMove, horiEdgesRef) => {
    if (newPair.length !== 2) return;

    const [firstConnection, secondConnection] = newPair;
    let [top1_, bottom1_] = firstConnection.nodes;
    let [top2_, bottom2_] = secondConnection.nodes;
    let color = firstConnection.color

    const getNodeNumber = (nodeId) => {
        const parts = nodeId.split('-');
        return parseInt(parts[1], 10);
    };
    

    const topCombination = [top1_, top2_].sort().join(',');
    const bottomCombination = [bottom1_, bottom2_].sort().join(',');
    console.log("TCBC = ", firstConnection, secondConnection)
    const top1 = getNodeNumber(top1_)
    const top2 = getNodeNumber(top2_)
    const bottom1 = getNodeNumber(bottom1_)
    const bottom2 = getNodeNumber(bottom2_)


    
    // t1 = "top-" + top1
    // t2 = "top-" + top2
    // b1 = "bottom-" + bottom1
    // b2 = "bottom-" + bottom2
    /*case 1
    */
//    console.log("TOPO=", topOrientation)
   // if the top and bottom connection is new
    if (!topOrientation.current.has(topCombination) && !botOrientation.current.has(bottomCombination)) {
        
        if(top1 > top2) {
            topOrientation.current.set(topCombination, "left");
            setConnectionHER(horiEdgesRef, top2_, top1_, color);
        } else {
            topOrientation.current.set(topCombination, "right");
            setConnectionHER(horiEdgesRef, top1_, top2_, color);
        }
        let b1 = "bottom-" + bottom1
        let b2 = "bottom-" + bottom2
        if(bottom1 > bottom2) {
            botOrientation.current.set(bottomCombination, "left");
            console.log("Going crazy 1: ", bottomCombination, b1, b2)
            setConnectionHER(horiEdgesRef, b1, b2, color);
        } else {
            botOrientation.current.set(bottomCombination, "right");
            console.log("Going crazy 2: ", bottomCombination, b1, b2)
            setConnectionHER(horiEdgesRef, b1, b2, color);
        }
        console.log("topO, botO", topOrientation, botOrientation)
        console.log("1HER CO.JS ", structuredClone(horiEdgesRef.current));
        return 0;
    }
    // console.log("HELLO")
    /*case 2
    */
   // if the top connection exists but the bottom doesnt
    if(!botOrientation.current.get(bottomCombination) && topOrientation.current.get(topCombination)) {
        if(((top1 > top2) && (bottom1 > bottom2))
        || ((top1 < top2) && (bottom1 < bottom2))) {
            botOrientation.current.set(bottomCombination, topOrientation.current.get(topCombination));
            if (topOrientation.current.get(topCombination) == "left") {
                setConnectionHER(horiEdgesRef, bottom1_, bottom2_, color)
            } else {
                setConnectionHER(horiEdgesRef, bottom2_, bottom1_, color)
            }

        } else if(
        (   (top1 > top2) && (bottom1 < bottom2))
        || ((top1 < top2) && (bottom1 > bottom2))
        ) {
            botOrientation.current.set(bottomCombination, 
            topOrientation.current.get(topCombination) === "right" ? "left" : "right");
            if (topOrientation.current.get(topCombination) == "left") {
                setConnectionHER(horiEdgesRef, bottom2_, bottom1_, color)
            } else {
                setConnectionHER(horiEdgesRef, bottom1_, bottom2_, color)
            }
        }
        console.log("2HER CO.JS ", structuredClone(horiEdgesRef.current));
        return 0;
    } 
    /*case 3
    */
   // if the bottom exists and top doesnt
   else if (botOrientation.current.get(bottomCombination) && !topOrientation.current.get(topCombination)) {
        if(((top1 > top2) && (bottom1 > bottom2))
        || ((top1 < top2) && (bottom1 < bottom2))) {
            topOrientation.current.set(topCombination, botOrientation.current.get(bottomCombination));
            if (botOrientation.current.get(bottomCombination) == "left") {
                setConnectionHER(horiEdgesRef, top2_, top1_, color)
            } else {
                setConnectionHER(horiEdgesRef, top1_, top2_, color)
                
            }
        } else if(
        (   (top1 > top2) && (bottom1 < bottom2))
        || ((top1 < top2) && (bottom1 > bottom2))
        ) {
            topOrientation.current.set(topCombination, 
            botOrientation.current.get(bottomCombination) === "right" ? "left" : "right");
            if (botOrientation.current.get(bottomCombination) == "left") {
                setConnectionHER(horiEdgesRef, top1_, top2_, color)
            } else {
                setConnectionHER(horiEdgesRef, top2_, top1_, color)
            }
        }
        console.log("3HER CO.JS ", structuredClone(horiEdgesRef.current));
        return 0;
    }
    
    /*case 4
    */

    // flip triplet: [nodeA, nodeB, directionThatGetsFlipped]
    // connectionsToFlip = []
    // if both connections already exist
    flippedConnectionsPerMove.length = 0;
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
                const separator = ",";
                const substrings = combo.split(separator, 2);

                const topA = substrings[0];
                const topB = substrings[1];
                if (topOrientation.current.has(combo)) {
                    console.log("flipping ", topA, " and ", topB)
                    const dir = topOrientation.current.get(combo);
                    // flippedConnectionsPerMove.push([topA, topB, dir]);
                    topOrientation.current.set(combo, dir === "right" ? "left" : "right");
                    if (dir === "right") {
                        handleOrientationSwapHER(horiEdgesRef, topA, topB)
                    } else {
                        handleOrientationSwapHER(horiEdgesRef, topB, topA)
                    }
                    
                }
                if (botOrientation.current.has(combo)) {
                    console.log("flipping ", topA, " and ", topB)
                    const dir = botOrientation.current.get(combo);
                    // flippedConnectionsPerMove.push([topA, topB, dir]);
                    botOrientation.current.set(combo, dir === "right" ? "left" : "right");
                    if (dir === "right") {
                        handleOrientationSwapHER(horiEdgesRef, topA, topB)
                    } else {
                        handleOrientationSwapHER(horiEdgesRef, topB, topA)
                    }
                }
            }
        }
        console.log("4HER CO.JS ", structuredClone(horiEdgesRef.current));
        return 0;
    }
};

