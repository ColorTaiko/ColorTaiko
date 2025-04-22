import { getConnectedNodes } from "./getConnectedNodes";
import { updateHorizontalEdges } from "./updateHorizontalEdges";

export const checkAndGroupConnections = (
    newPair,
    groupMapRef,
    setConnectionGroups,
    connections,
    setConnections,
    connectionPairs,
    mergedColornodesPerMove,
    setCurrMergeColor,
    currMergeColor,
    topOrientation,
    botOrientation,
    flippedConnectionsPerMove,
    foldsFound,
    horiEdgesRef
  ) => {
    // clear the list containing all color swapped nodes
    mergedColornodesPerMove.length = 0;

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
          // console.log("cnzzsbd ", connection)
          // console.log("slbbc ", getConnectedNodes(connection.nodes[0], connectionPairs))
          connection.color = mergedGroup.color;
          // console.log("connn = ", connection)
          mergedColornodesPerMove.add(connection.nodes[0])
          mergedColornodesPerMove.add(connection.nodes[1])
        });
        setCurrMergeColor(mergedGroup.color);
        currMergeColor = mergedGroup.color;
        console.log("Initting mergeColor as ", currMergeColor)
        mergedGroup.nodes = Array.from(
          new Set([...mergedGroup.nodes, ...groupToMerge.nodes])
        );
        mergedGroup.pairs = Array.from(
          new Set([...mergedGroup.pairs, ...groupToMerge.pairs])
        );
        // console.log("mgp ", [...mergedGroup.pairs, ...groupToMerge.pairs]);
        mergedGroup.combinations = new Set([...mergedGroup.combinations, ...groupToMerge.combinations]);
        // console.log("mgc ", mergedGroup)
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
      newPair.forEach((connection) => (connection.color = groupColor));
  
      const newGroup = {
        nodes: [top1, top2, bottom1, bottom2],
        pairs: [...newPair],
        color: groupColor,
        combinations: new Set([topCombination, bottomCombination]),
      };
      // console.log("NEW GROUP = ", newGroup)
      groupMapRef.current.set(topCombination, newGroup);
      groupMapRef.current.set(bottomCombination, newGroup);
  
      setConnectionGroups((prevGroups) => [...prevGroups, newGroup]);
    }
    setConnections([...connections]);
    updateHorizontalEdges(
      newPair,
      connectionPairs,
      horiEdgesRef,
      topOrientation,
      botOrientation,
      flippedConnectionsPerMove,
      foldsFound,
      mergedColornodesPerMove,
      currMergeColor
    );
  };
  