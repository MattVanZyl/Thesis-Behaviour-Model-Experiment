import { instance } from '@viz-js/viz';
import BaseGraph from '../BaseGraph';
import GraphPlace from './GraphPlace';
import GraphTransition from './GraphTransition';
import GraphNode from '../GraphNode';
import GraphEdge from '../GraphEdge';

export default class PetriNetGraph extends BaseGraph {
  constructor(logData_A, logData_B, serviceName, subProcessName) {
    super(logData_A, logData_B, serviceName, subProcessName);
  }

  static async createInstance(
    logData_A,
    logData_B,
    serviceName,
    subProcessName,
    graphContent,
    handleNodeClick
  ) {
    const instance = new PetriNetGraph(logData_A, logData_B, serviceName, subProcessName);
    await instance.parseGraph(graphContent, handleNodeClick);
    return instance;
  }

  async parseGraph(graphContent, handleNodeClick) {
    const viz = await instance();

    try {
      const graphData = viz.renderJSON(graphContent);

      // Initialize variables to find y-min and y-max
      let yMin = Infinity;
      let yMax = -Infinity;

      // Parsing Nodes
      for (const node of graphData.objects) {
        let logsResult = null;

        // Only find logs if the node is a transition
        if (node.type === 'transition') {
          logsResult = this.findLogsByLogStatementId(this.logData_A, this.logData_B, node.name);
        }

        const graphNode =
          node.type === 'place'
            ? new GraphPlace(node, this, 3)
            : new GraphTransition(
                node,
                this,
                30,
                logsResult ? logsResult.logs_A : null,
                logsResult ? logsResult.logs_B : null,
                logsResult ? logsResult.logStatement : null,
                handleNodeClick
              );

        // Update y-min and y-max
        yMin = Math.min(yMin, graphNode.y);
        yMax = Math.max(yMax, graphNode.y);

        this.addNode(graphNode);
      }

      // Parsing Edges
      for (const edge of graphData.edges) {
        const graphEdge = new GraphEdge(edge, this);

        // Update y-min and y-max for edge waypoints
        graphEdge.waypoints.forEach((point) => {
          const y = point[1];
          yMin = Math.min(yMin, y);
          yMax = Math.max(yMax, y);
        });

        const sourceNode = this.nodes[graphEdge.sourceId];
        const targetNode = this.nodes[graphEdge.targetId];
        graphEdge.connectNodes(sourceNode, targetNode);

        this.addEdge(graphEdge);
      }

      const flipY = (y) => yMax - (y - yMin);

      // Flip y-coordinates of nodes
      Object.values(this.nodes).forEach((node) => {
        node.y = flipY(node.y);
      });

      // Flip y-coordinates of edge waypoints
      Object.values(this.edges).forEach((edge) => {
        edge.waypoints = edge.waypoints.map((point) => {
          const x = point[0];
          const y = point[1];
          return [x, flipY(y)];
        });
      });
    } catch (error) {
      console.error('Error rendering graph:', error);
    }

    // After parsing, calculate the highest transition counts
    this.calculateCounts();
  }

  addNode(node) {
    if (!(node instanceof GraphNode)) {
      throw new Error('Parameter must be an instance of GraphNode.');
    }
    this.nodes[node.id] = node;
  }

  addEdge(edge) {
    if (!(edge instanceof GraphEdge)) {
      throw new Error('Parameter must be an instance of GraphEdge.');
    }
    this.edges[edge.id] = edge;
  }

  calculateBounds() {
    let maxX = 0,
      maxY = 0,
      minX = Infinity,
      minY = Infinity;

    // Assuming you have a method to get all nodes
    Object.values(this.nodes).forEach((node) => {
      const bounds = node.getScaledBounds(); // Implement this function to get bounds for a node
      maxX = Math.max(maxX, bounds.x + bounds.width);
      maxY = Math.max(maxY, bounds.y + bounds.height);
      minX = Math.min(minX, bounds.x);
      minY = Math.min(minY, bounds.y);
    });

    return { maxX, maxY, minX, minY };
  }
}
