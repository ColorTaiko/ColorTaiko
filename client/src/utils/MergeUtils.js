
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
  
    const matchingGroups = [];
    const groupTop = groupMapRef.current.get(topCombination);
    const groupBottom = groupMapRef.current.get(bottomCombination);
    //console.log('ok');
    if (groupBottom) {
      //console.log('Group Bottom:', groupBottom);
      matchingGroups.push(groupBottom);
    }
    if (groupTop && groupTop !== groupBottom) matchingGroups.push(groupTop);

    // Helper to update color in the connections array
    const updateConnectionColorInConnections = (targetConnection, newColor) => {
      connections.forEach((conn) => {
        if (
          (conn.nodes[0] === targetConnection.nodes[0] && conn.nodes[1] === targetConnection.nodes[1]) ||
          (conn.nodes[0] === targetConnection.nodes[1] && conn.nodes[1] === targetConnection.nodes[0])
        ) {
          conn.color = newColor;
        }
      });
    };

    // Helper to update color in the connectionPairs array
    const updateConnectionColorInPairs = (targetConnection, newColor) => {
      connectionPairs.forEach(pair => {
        pair.forEach(connection => {
          if (
            (connection.nodes[0] === targetConnection.nodes[0] && connection.nodes[1] === targetConnection.nodes[1]) ||
            (connection.nodes[0] === targetConnection.nodes[1] && connection.nodes[1] === targetConnection.nodes[0])
          ) {
            connection.color = newColor;
          }
        });
      });
    };
  
    //console.log('Matching Groups:', matchingGroups);
    let mergedGroup = null;
    if (matchingGroups.length > 0) {
      mergedGroup = matchingGroups[0];
  
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
        groupToMerge.pairs.forEach((connection) => {
          connection.color = mergedGroup.color;
          updateConnectionColorInConnections(connection, mergedGroup.color);
          updateConnectionColorInPairs(connection, mergedGroup.color); 
        });
        mergedGroup.nodes = Array.from(
          new Set([...mergedGroup.nodes, ...groupToMerge.nodes])
        );
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
      // console.log('ok63');
      //console.log('Merged Group:', mergedGroup);
      //console.log('GroupMap', groupMapRef.current);
    } else {
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
  
      setConnectionGroups((prevGroups) => [...prevGroups, newGroup]);
    }
    setConnections([...connections]);
  };

  export const predictPairFinalColor = (newPair, groupMap) => {
    if (!Array.isArray(newPair) || newPair.length !== 2) {
      return null;
    }

    const [firstConnection, secondConnection] = newPair;
    const [top1, bottom1] = firstConnection.nodes;
    const [top2, bottom2] = secondConnection.nodes;

    const topCombination = [top1, top2].sort().join(',');
    const bottomCombination = [bottom1, bottom2].sort().join(',');

    const groupTop = groupMap.get(topCombination);
    const groupBottom = groupMap.get(bottomCombination);

    if (groupBottom) {
      return groupBottom.color
    }

    if (groupTop) {
      return groupTop.color      
    }

    return firstConnection.color ?? null;
  };
  