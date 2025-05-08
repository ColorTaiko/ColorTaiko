function findAllCycles(adjList) {
    const cycles = new Set();
    const visited = new Set();
  
    function dfs(path, node, parent) {
      path.push(node);
      visited.add(node);
  
      for (const neighbor of adjList[node] || []) {
        if (neighbor === parent) continue; // skip the edge we came from
  
        const indexInPath = path.indexOf(neighbor);
        if (indexInPath !== -1) {
          // found a cycle
          const cycle = path.slice(indexInPath);
          const normalized = [...cycle].sort().join(',');
          cycles.add(normalized); // store as sorted string to avoid duplicates
        } else {
          dfs([...path], neighbor, node);
        }
      }
    }
  
    for (const node in adjList) {
      dfs([], node, null);
    }
  
    return Array.from(cycles).map(str => str.split(','));
}
  

export function checkGirth(topOrientationRef, botOrientationRef, num) {

  for (const oriMap of [topOrientationRef.current, botOrientationRef.current]) {
    // getting all the edges
    const edges = [];
    oriMap.forEach((_, horizontalEdge) => {
      const [node1, node2] = horizontalEdge.split(',');
      edges.push([node1, node2])
    });
    console.log("graph edges: ", edges);

    // cycle detection using the custom DFS
    const adjList = {};
    for (const [u, v] of edges) {
        if (!adjList[u]) adjList[u] = [];
        if (!adjList[v]) adjList[v] = [];
        adjList[u].push(v);
        adjList[v].push(u); // undirected!
    }
    
    const cycles = findAllCycles(adjList);
    console.log("cycles: ", cycles);

    // c) find all simple cycles
    if (cycles.length === 0) continue;

    // d) scan for any cycle < 4 nodes
    for (const cycle of cycles) {
      if (cycle.length < num) {
        // too short—signal failure
        return -1;
      }
    }
  }

  // no bad cycles found
  return 1;
}