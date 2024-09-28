import cytoscape from 'cytoscape';
import dagre from 'cytoscape-dagre';

cytoscape.use(dagre);

export function applyCytoscapeLayout(graph) {
  const elements = [];

  Object.values(graph.nodes).forEach((node) => {
    elements.push({
      data: { id: node.id }
    });
  });

  Object.values(graph.edges).forEach((edge) => {
    elements.push({
      data: { id: edge.id, source: edge.sourceId, target: edge.targetId }
    });
  });

  const layoutOptions = {
    name: 'dagre',
    rankDir: 'LR', // Left-to-right layout
    nodeSep: 200, // Horizontal separation between nodes
    rankSep: 70 // Vertical separation between ranks
    // animate: false,
    // fit: true
  };

  const cy = cytoscape({
    elements,
    headless: true
  });

  cy.layout(layoutOptions).run();

  // Update GraphNode bounds based on Cytoscape node positions
  cy.nodes().forEach((cyNode) => {
    const graphNode = graph.nodes[cyNode.id()];
    const position = cyNode.position();

    // Apply the scaling factor
    const scaledBounds = graphNode.getScaledBounds();
    scaledBounds.x = position.x - scaledBounds.width / 2;
    scaledBounds.y = position.y - scaledBounds.height / 2;

    graphNode.bounds = {
      x: scaledBounds.x,
      y: scaledBounds.y,
      width: scaledBounds.width,
      height: scaledBounds.height
    };
  });

  // Update GraphEdge waypoints based on Cytoscape edge positions
  // Note: Cytoscape.js doesn't provide edge waypoints by default.
  // You may need a custom solution or edge-routing algorithm for precise waypoints.
  // Update GraphEdge waypoints
  cy.edges().forEach((cyEdge) => {
    const graphEdge = graph.edges[cyEdge.id()];
    const sourcePosition = cyEdge.source().position();
    const targetPosition = cyEdge.target().position();

    const sourceNode = graph.nodes[cyEdge.source().id()];
    const targetNode = graph.nodes[cyEdge.target().id()];

    const sourceBounds = sourceNode.getScaledBounds();
    const targetBounds = targetNode.getScaledBounds();

    let waypoints = [
      [sourcePosition.x, sourcePosition.y],
      [targetPosition.x, targetPosition.y]
    ];

    adjustWaypoint(waypoints[0], sourceBounds);
    adjustWaypoint(waypoints[waypoints.length - 1], targetBounds);

    graphEdge.waypoints = waypoints;
  });
}

const adjustWaypoint = (waypoint, bounds) => {
  const xCenter = bounds.x + bounds.width / 2;
  const yCenter = bounds.y + bounds.height / 2;

  if (Math.abs(waypoint[0] - xCenter) > Math.abs(waypoint[1] - yCenter)) {
    waypoint[0] = waypoint[0] < xCenter ? bounds.x : bounds.x + bounds.width;
    waypoint[1] = yCenter;
  } else {
    waypoint[0] = xCenter;
    waypoint[1] = waypoint[1] < yCenter ? bounds.y : bounds.y + bounds.height;
  }
};
