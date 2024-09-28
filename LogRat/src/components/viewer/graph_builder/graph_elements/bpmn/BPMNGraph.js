import { instance } from '@viz-js/viz';
import BaseGraph from '../BaseGraph';
import BPMNEvent from './BPMNEvent';
import BPMNTask from './BPMNTask';
import BPMNGateway from './BPMNGateway';
import GraphNode from '../GraphNode';
import GraphEdge from '../GraphEdge';

export default class BPMNGraph extends BaseGraph {
  constructor(viewType, logData, serviceName, subProcessName) {
    super(viewType, logData, serviceName, subProcessName);
  }

  static async createInstance(
    viewType,
    logData,
    serviceName,
    subProcessName,
    graphData,
    handleNodeClick
  ) {
    const instance = new BPMNGraph(viewType, logData, serviceName, subProcessName);
    await instance.parseGraph(graphData, handleNodeClick);
    return instance;
  }

  async parseGraph(graphData, handleNodeClick) {
    const viz = await instance();

    try {
      const parsedGraphData = viz.renderJSON(graphData);

      // Initialize variables to find y-min and y-max
      let yMin = Infinity;
      let yMax = -Infinity;

      // Parsing Nodes
      for (const node of parsedGraphData.objects) {
        let graphNode;

        if (node.type === 'Task') {
          const logsResult = this.findLogsByLogStatementId(node.name);

          graphNode = new BPMNTask(
            this.viewType,
            node,
            this,
            70,
            // 62.5,
            logsResult ? logsResult.logs : null,
            logsResult ? logsResult.logStatement : null,
            handleNodeClick
          );
        } else if (node.type === 'NormalEndEvent' || node.type === 'StartEvent') {
          graphNode = new BPMNEvent(this.viewType, node, this, 3);
        } else if (node.type === 'ExclusiveGateway' || node.type === 'ParallelGateway') {
          graphNode = new BPMNGateway(this.viewType, node, this, 3);
        }

        // Update y-min and y-max
        yMin = Math.min(yMin, graphNode.y);
        yMax = Math.max(yMax, graphNode.y);

        this.addNode(graphNode);
      }

      // Parsing Edges
      for (const edge of parsedGraphData.edges) {
        const graphEdge = new GraphEdge(this.viewType, edge, this);

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
