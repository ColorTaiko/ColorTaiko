
// for each node in the merged group:
// look through connection pairs:
// if node is in connection pair:
// check for a fold first, (if outgoing/incoming color for that node already exists)
// add to list of folds if possible, 
// then change the color

export const handleMerge = (horiEdgesRef, mergedColor, connectionPairs) => {
  connectionPairs.forEach((pair) => {
    // console.log("Handling merge")
    if (pair.length === 2) {
      const [
        {
          nodes: [startNode1, bottomNode1],
        },
        {
          nodes: [startNode2, bottomNode2],
          color,
        },
      ] = pair;
  
      const [firstConnection, secondConnection] = pair;
      const [top1, bottom1] = firstConnection.nodes;
      const [top2, bottom2] = secondConnection.nodes;

      let a = [top1, bottom1];
      let b = [top2, bottom2];
      // top1 --> top2
      // check if top1 already has an outgoing edge of the new mergedColor
      // check if top2 already has an incoming edge of the new mergedColor
      for (let i = 0; i < 2; i += 1) { 
        let ai = a[i];
        let bi = b[i];
        console.log("Handling ", ai, bi)
        if (color === mergedColor) {
          if ((horiEdgesRef.current.get(ai)[0].has(mergedColor) 
              && horiEdgesRef.current.get(ai)[0].get(mergedColor) != bi) ||
              (horiEdgesRef.current.get(bi)[1].has(mergedColor) 
              && horiEdgesRef.current.get(bi)[1].get(mergedColor) != ai)
              ) {
              alert("Fold found at ", ai, bi);
          }
        }
        // change color
        let oldColor = horiEdgesRef.current.get(ai)[0].get(bi);
        horiEdgesRef.current.get(ai)[0].delete(oldColor);
        horiEdgesRef.current.get(ai)[0].set(bi, mergedColor);
        horiEdgesRef.current.get(ai)[0].set(mergedColor, bi);
        horiEdgesRef.current.get(bi)[1].delete(oldColor);
        horiEdgesRef.current.get(bi)[1].set(mergedColor, ai);

      }
    }
    console.log("Merging ", structuredClone(horiEdgesRef.current));
  })
}

export const checkAndGroupConnections = (
    newPair,
    groupMapRef,
    setConnectionGroups,
    connections,
    setConnections,
    horiEdgesRef,
    connectionPairs
  ) => {
    const [firstConnection, secondConnection] = newPair;
    const [top1, bottom1] = firstConnection.nodes;
    const [top2, bottom2] = secondConnection.nodes;
  
    const topCombination = [top1, top2].sort().join(',');
    const bottomCombination = [bottom1, bottom2].sort().join(',');
  
    const matchingGroups = [];
    const groupTop = groupMapRef.current.get(topCombination);
    const groupBottom = groupMapRef.current.get(bottomCombination);
    //console.log('ok');
    if (groupBottom) {
      //console.log('Group Bottom:', groupBottom);
      matchingGroups.push(groupBottom);
    }
    if (groupTop && groupTop !== groupBottom) matchingGroups.push(groupTop);
  
    //console.log('Matching Groups:', matchingGroups);
    let mergedGroup = null;
    if (matchingGroups.length > 0) {
      mergedGroup = matchingGroups[0];

      newPair.forEach((connection) => {
        connection.color = mergedGroup.color;
        if (!mergedGroup.pairs.includes(connection)) {
          mergedGroup.pairs.push(connection);
        }

      });
  
      mergedGroup.nodes = Array.from(
        new Set([...mergedGroup.nodes, top1, top2, bottom1, bottom2])
      );
  
      if (matchingGroups.length > 1) {
        const groupToMerge = matchingGroups[1];
        // color merging occurs here
        groupToMerge.pairs.forEach((connection) => {
          connection.color = mergedGroup.color;
          // console.log("HIIII ", connection)
        });
        mergedGroup.nodes = Array.from(
          new Set([...mergedGroup.nodes, ...groupToMerge.nodes])
        );
        console.log("HIIII ", mergedGroup.pairs)
        console.log("HIIIII() ", connectionPairs)
        mergedGroup.pairs = Array.from(
          new Set([...mergedGroup.pairs, ...groupToMerge.pairs])
        );
        
        mergedGroup.combinations = new Set([...mergedGroup.combinations, ...groupToMerge.combinations]);

        groupMapRef.current.forEach((group, key) => {
          if (group === groupToMerge) {
            groupMapRef.current.set(key, mergedGroup);
          }
        });
      }
  
  
      groupMapRef.current.set(topCombination, mergedGroup);
      groupMapRef.current.set(bottomCombination, mergedGroup);
      handleMerge(horiEdgesRef, mergedGroup.color, connectionPairs);
      // console.log('ok63');
      //console.log('Merged Group:', mergedGroup);
      //console.log('GroupMap', groupMapRef.current);
    } else {
      const groupColor = firstConnection.color;
      newPair.forEach((connection) => (connection.color = groupColor));
  
      const newGroup = {
        nodes: [top1, top2, bottom1, bottom2],
        pairs: [...newPair],
        color: groupColor,
        combinations: new Set([topCombination, bottomCombination]),
      };
  
      groupMapRef.current.set(topCombination, newGroup);
      groupMapRef.current.set(bottomCombination, newGroup);
  
      setConnectionGroups((prevGroups) => [...prevGroups, newGroup]);
    }
    setConnections([...connections]);

    // update horizontal edges after orientation swaps
    
  };
  