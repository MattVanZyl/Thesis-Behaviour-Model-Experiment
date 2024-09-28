import GraphEvent from '../graph_elements/node_types/GraphEvent';
import GraphGateway from '../graph_elements/node_types/GraphGateway';
import GraphTask from '../graph_elements/node_types/GraphTask';

export function traverseGraph(graph) {
  const nodes = graph.nodes;
  const [startEventNode, endEventNode] = ['bpmn:startEvent', 'bpmn:endEvent'].map((type) =>
    Object.values(nodes).find((node) => node.type === type)
  );

  let result = [];

  graph.sequenceCount = 0;
  graph.highestTraversalCount = 0;

  const orderedLogs = graph.logs.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

  let currentNodeID = startEventNode.id;
  const firstLog = orderedLogs[0];
  const firstNodeId = findNodeIdFromLog(graph, firstLog.logging_statement_id);

  const startDijkstraResult = dijkstraAlgorithm(graph, currentNodeID, firstNodeId);
  console.log(startDijkstraResult);
  updateCounts(startDijkstraResult, graph, nodes, [startEventNode.id]);
  result.push(startDijkstraResult);

  orderedLogs.forEach((log) => {
    const nextNodeId = findNodeIdFromLog(graph, log.logging_statement_id);

    if (nextNodeId) {
      const dijkstraResult = dijkstraAlgorithm(graph, currentNodeID, nextNodeId);
      updateCounts(dijkstraResult, graph, nodes);
      result.push(dijkstraResult);
      currentNodeID = nextNodeId;
    }
  });

  const endDijkstraResult = dijkstraAlgorithm(graph, currentNodeID, endEventNode.id); // Find path from last node to end
  updateCounts(endDijkstraResult, graph, nodes, [endEventNode.id]);
  result.push(endDijkstraResult);

  return result;
}

function updateCounts(dijkstraResult, graph, nodes, excludeNodes = []) {
  dijkstraResult.path.forEach((nodeId) => {
    if (excludeNodes.includes(nodeId)) return;

    let node = nodes[nodeId];
    node.traversalCount = (node.traversalCount || 0) + 1;
    node.sequenceCount = ++graph.sequenceCount;

    if (node.traversalCount > graph.highestTraversalCount) {
      graph.highestTraversalCount = node.traversalCount;
    }
  });

  dijkstraResult.path.slice(0, -1).forEach((nodeId, index) => {
    let nextNodeId = dijkstraResult.path[index + 1];
    let edgeId = findEdgeIdBetweenNodes(nodes[nodeId], nodes[nextNodeId]);

    if (edgeId) {
      let edge = nodes[nodeId].outgoingEdges[edgeId];
      edge.sequenceCount = ++graph.sequenceCount;
      edge.traversalCount = (edge.traversalCount || 0) + 1;

      if (edge.traversalCount > graph.highestTraversalCount) {
        graph.highestTraversalCount = edge.traversalCount;
      }
    }
  });
}

function findNodeIdFromLog(graph, loggingStatementId) {
  return Object.keys(graph.nodes).find(
    (nodeId) => graph.nodes[nodeId].loggingStatement?.logging_statement_id === loggingStatementId
  );
}

function findEdgeIdBetweenNodes(sourceNode, targetNode) {
  for (const edgeId in sourceNode.outgoingEdges) {
    const edge = sourceNode.outgoingEdges[edgeId];
    if (edge.targetId === targetNode.id) {
      return edgeId;
    }
  }
  return null;
}

function dijkstraAlgorithm(graph, startNodeID, endNodeID) {
  const distances = {};
  const prev = {};
  const pq = new PriorityQueue();

  for (const nodeID in graph.nodes) {
    distances[nodeID] = Infinity;
    pq.enqueue(nodeID, Infinity);
    prev[nodeID] = null;
  }
  distances[startNodeID] = 0;
  pq.enqueue(startNodeID, 0);

  while (!pq.isEmpty()) {
    const dequeued = pq.dequeue();
    if (!dequeued) break;

    const current = dequeued[0];
    if (current === endNodeID) break;

    const currentNode = graph.nodes[current];

    // Include all node types as intermediaries, but restrict start and end to GraphTask
    if (
      (current === startNodeID || current === endNodeID) &&
      !(currentNode instanceof GraphTask || currentNode instanceof GraphEvent)
    )
      continue;

    for (const edgeID in currentNode.outgoingEdges) {
      const edge = currentNode.outgoingEdges[edgeID];
      const neighbourID = edge.targetId; // Use edge's targetId to find the neighbour

      const alt = distances[current] + 1;
      if (alt < distances[neighbourID]) {
        distances[neighbourID] = alt;
        prev[neighbourID] = current;
        pq.enqueue(neighbourID, alt);
      }
    }
  }

  let path = [];
  let u = endNodeID;
  while (u !== null) {
    path.unshift(u);
    u = prev[u];
  }

  return {
    distance: distances[endNodeID],
    path: path
  };
}

class PriorityQueue {
  constructor() {
    this.collection = [];
  }

  enqueue(element, priority) {
    for (let i = 0; i < this.collection.length; i++) {
      if (this.collection[i][1] > priority) {
        this.collection.splice(i, 0, [element, priority]);
        return;
      }
    }
    this.collection.push([element, priority]);
  }

  dequeue() {
    return this.collection.shift();
  }

  isEmpty() {
    return this.collection.length === 0;
  }
}

// ===========================================================================
// ===========================================================================

// const isEventOrTask = (node) => node instanceof GraphTask || node instanceof GraphEvent;

// export function traverseGraph(graph) {
//   const { logs, nodes, edges } = graph;
//   const orderedLogs = logs.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
//   console.log(orderedLogs);
//   const [startEventNode, endEventNode] = ['bpmn:startEvent', 'bpmn:endEvent'].map((type) =>
//     Object.values(nodes).find((node) => node.type === type)
//   );

//   if (!startEventNode || !endEventNode) {
//     console.error('Start or end event node not found.');
//     return;
//   }

//   let currentNode = updateNode(startEventNode, graph);
//   orderedLogs.forEach((log) => {
//     const nextNodeId = findNodeIdFromLog(graph, log.logging_statement_id);
//     if (!nextNodeId) return console.error(`nextNodeId: ${nextNodeId}`);

//     const [nextNode, currNode] = [nodes[nextNodeId], nodes[currentNode.id]];
//     if (isEventOrTask(nextNode) && isEventOrTask(currNode)) {
//       const path = findPath(graph, currentNode.id, nextNodeId);
//       if (path) {
//         path.forEach((edgeId) => updateEdge(edges[edgeId], graph, nodes));
//         currentNode = updateNode(nextNode, graph);
//       }
//     }
//   });

//   findPath(graph, currentNode.id, endEventNode.id)?.forEach((edgeId) =>
//     updateEdge(edges[edgeId], graph, nodes)
//   );
//   updateNode(endEventNode, graph);
// }

// function updateNode(node, graph) {
//   node.traversalCount = (node.traversalCount || 0) + 1;
//   node.sequenceCount = ++graph.sequenceCount;

//   if (node.traversalCount > graph.highestTraversalCount) {
//     graph.highestTraversalCount = node.traversalCount;
//   }

//   return node;
// }

// function updateEdge(edge, graph, nodes) {
//   edge.sequenceCount = ++graph.sequenceCount;
//   edge.traversalCount = (edge.traversalCount || 0) + 1;

//   if (edge.traversalCount > graph.highestTraversalCount) {
//     graph.highestTraversalCount = edge.traversalCount;
//   }

//   updateNode(nodes[edge.targetId], graph);
// }

// function findNodeIdFromLog(graph, loggingStatementId) {
//   return Object.keys(graph.nodes).find(
//     (nodeId) => graph.nodes[nodeId].loggingStatement?.logging_statement_id === loggingStatementId
//   );
// }

// // findPath function incorporating loop and gateway support
// function findPath(graph, startNodeId, endNodeId) {
//   const distances = {};
//   const prevNodes = {};
//   const unvisited = new Set(Object.keys(graph.nodes));
//   let iterationCount = 0;
//   const maxIterations = 1000;

//   // Initialization
//   for (const nodeId in graph.nodes) {
//     distances[nodeId] = Infinity;
//     prevNodes[nodeId] = null;
//   }
//   distances[startNodeId] = 0;

//   while (unvisited.size > 0 && iterationCount < maxIterations) {
//     iterationCount++;

//     let currNodeId = Array.from(unvisited).reduce((acc, nodeId) => {
//       return distances[nodeId] < distances[acc] ? nodeId : acc;
//     }, Array.from(unvisited)[0]);

//     unvisited.delete(currNodeId);

//     if (currNodeId === endNodeId) {
//       return reconstructPath(graph, startNodeId, endNodeId, prevNodes);
//     }

//     if (graph.nodes[currNodeId] instanceof GraphGateway) {
//       handleGateway(graph, currNodeId, distances, prevNodes);
//       continue;
//     }

//     for (const edgeId in graph.nodes[currNodeId].outgoingEdges) {
//       const edge = graph.edges[edgeId];
//       const targetNode = graph.nodes[edge.targetId];
//       const alt = distances[currNodeId] + 1;

//       if (alt < distances[edge.targetId]) {
//         distances[edge.targetId] = alt;
//         prevNodes[edge.targetId] = currNodeId;
//       }
//     }
//   }

//   return null;
// }

// // Reconstruct path from end node back to start node
// function reconstructPath(graph, startNodeId, endNodeId, prevNodes) {
//   let path = [];
//   let node = endNodeId;

//   while (node !== startNodeId) {
//     const edgeId = Object.keys(graph.nodes[node].incomingEdges).find((edgeId) => {
//       return graph.edges[edgeId].sourceId === prevNodes[node];
//     });

//     if (!edgeId) {
//       return null;
//     }

//     path.unshift(edgeId);
//     node = prevNodes[node];
//   }

//   return path;
// }

// // Function to handle different types of BPMN gateways
// function handleGateway(graph, nodeId, distances, prevNodes) {
//   // Custom logic to handle different types of gateways
//   // Example: Update distances and prevNodes based on some condition
//   for (const edgeId in graph.nodes[nodeId].outgoingEdges) {
//     const edge = graph.edges[edgeId];
//     const targetNode = graph.nodes[edge.targetId];
//     const alt = distances[nodeId] + 1; // Custom weight based on gateway type

//     if (alt < distances[edge.targetId]) {
//       distances[edge.targetId] = alt;
//       prevNodes[edge.targetId] = nodeId;
//     }
//   }
// }
