export const checkAndGroupConnections = (
  newPair,
  groupMapRef,
  setConnectionGroups,
  connections,
  setConnections,
  connectionPairs
) => {
  const [firstConnection, secondConnection] = newPair;
  const [top1, bottom1] = firstConnection.nodes;
  const [top2, bottom2] = secondConnection.nodes;
  
  const topCombination = [top1, top2].sort().join(',');
  const bottomCombination = [bottom1, bottom2].sort().join(',');
  
  // Log incoming pair and combination strings
  console.log('[DEBUG MERGE] Incoming New Pair:', newPair);
  console.log('[DEBUG MERGE] Top Combo:', topCombination);
  console.log('[DEBUG MERGE] Bottom Combo:', bottomCombination);
  
  const matchingGroups = [];
  const groupTop = groupMapRef.current.get(topCombination);
  const groupBottom = groupMapRef.current.get(bottomCombination);
  
  console.log('[DEBUG MERGE] Found groupTop:', groupTop);
  console.log('[DEBUG MERGE] Found groupBottom:', groupBottom);
  
  if (groupBottom) matchingGroups.push(groupBottom);
  if (groupTop && groupTop !== groupBottom) matchingGroups.push(groupTop);
  
  newPair.forEach((conn, index) => {
    console.log(`[DEBUG MERGE] Connection ${index} pre-merge color:`, conn.color);
  });
  
  const updateConnectionColorInConnections = (targetConnection, newColor) => {
    connections.forEach((conn) => {
      if (
        (conn.nodes[0] === targetConnection.nodes[0] && conn.nodes[1] === targetConnection.nodes[1]) ||
        (conn.nodes[0] === targetConnection.nodes[1] && conn.nodes[1] === targetConnection.nodes[0])
      ) {
        console.log('[DEBUG UPDATE] Updating connection in connections:', conn, '->', newColor);
        conn.color = newColor;
      }
    });
  };
  
  const updateConnectionColorInPairs = (targetConnection, newColor) => {
    connectionPairs.forEach(pair => {
      pair.forEach(connection => {
        if (
          (connection.nodes[0] === targetConnection.nodes[0] && connection.nodes[1] === targetConnection.nodes[1]) ||
          (connection.nodes[0] === targetConnection.nodes[1] && connection.nodes[1] === targetConnection.nodes[0])
        ) {
          console.log('[DEBUG UPDATE] Updating connection in connectionPairs:', connection, '->', newColor);
          connection.color = newColor;
        }
      });
    });
  };
  
  let mergedGroup = null;
  if (matchingGroups.length > 0) {
    mergedGroup = matchingGroups[0];
    console.log('[DEBUG MERGE] Merging into existing group:', mergedGroup);
    
    newPair.forEach((connection) => {
      connection.color = mergedGroup.color;
      updateConnectionColorInConnections(connection, mergedGroup.color);
      updateConnectionColorInPairs(connection, mergedGroup.color);
      if (!mergedGroup.pairs.includes(connection)) {
        mergedGroup.pairs.push(connection);
      }
    });
  
    mergedGroup.nodes = Array.from(
      new Set([...mergedGroup.nodes, top1, top2, bottom1, bottom2])
    );
  
    if (matchingGroups.length > 1) {
      const groupToMerge = matchingGroups[1];
      console.log('[DEBUG MERGE] Merging secondary group into primary:', groupToMerge);
      
      groupToMerge.pairs.forEach((connection) => {
        connection.color = mergedGroup.color;
        updateConnectionColorInConnections(connection, mergedGroup.color);
        updateConnectionColorInPairs(connection, mergedGroup.color);
      });
  
      mergedGroup.nodes = Array.from(new Set([...mergedGroup.nodes, ...groupToMerge.nodes]));
  
      mergedGroup.pairs = Array.from(new Set([...mergedGroup.pairs, ...groupToMerge.pairs]));
  
      mergedGroup.combinations = new Set([...mergedGroup.combinations, ...groupToMerge.combinations]);
  
      groupMapRef.current.forEach((group, key) => {
        if (group === groupToMerge) {
          groupMapRef.current.set(key, mergedGroup);
          console.log(`[DEBUG MERGE] Repointing key "${key}" from groupToMerge to mergedGroup`);
        }
      });
    }
  
    groupMapRef.current.set(topCombination, mergedGroup);
    groupMapRef.current.set(bottomCombination, mergedGroup);
    console.log('[DEBUG MERGE] Updated groupMapRef:', groupMapRef.current);
  } else {
    console.log('[DEBUG MERGE] No matching groups found. Creating new group.');
    const groupColor = firstConnection.color;
    newPair.forEach((connection) => {
      connection.color = groupColor;
      updateConnectionColorInConnections(connection, groupColor);
      updateConnectionColorInPairs(connection, groupColor);
    });
  
    const newGroup = {
      nodes: [top1, top2, bottom1, bottom2],
      pairs: [...newPair],
      color: groupColor,
      combinations: new Set([topCombination, bottomCombination]),
    };
  
    groupMapRef.current.set(topCombination, newGroup);
    groupMapRef.current.set(bottomCombination, newGroup);
    console.log('[DEBUG MERGE] New group created:', newGroup);
    setConnectionGroups((prevGroups) => [...prevGroups, newGroup]);
  }
  
  setConnections([...connections]);
  
  newPair.forEach((conn, index) => {
    console.log(`[DEBUG MERGE] Connection ${index} post-merge color:`, conn.color);
  });
  console.log('[DEBUG MERGE] Complete groupMapRef status:', groupMapRef.current);
};
