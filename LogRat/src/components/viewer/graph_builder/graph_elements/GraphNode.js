import GraphElement from './GraphElement';
import GraphEdge from './GraphEdge';

export default class GraphNode extends GraphElement {
  // Parent variables: id, graphDiagram, in_A, in_B, count_A, count_B, pos, viewType
  constructor(viewType, options, graphDiagram, scaleFactor = 1) {
    const { _gvid, in_graph, count, pos, type, name, height, width, label } = options;

    const id = `graph-${graphDiagram.id}-node-${_gvid}`;

    const countParams = viewType === 'contrast' ? { A: count.A, B: count.B } : count;
    super(viewType, id, graphDiagram, in_graph, countParams, pos);

    if (pos) {
      [this.x, this.y] = pos.split(',').map(Number);
    } else {
      this.x = 0;
      this.y = 0;
    }

    this.type = type;
    this.name = name;
    this.scaleFactor = scaleFactor; // Default scale factor, modify if needed
    this.height = height;
    this.width = width;
    this.label = label;

    // Initialize other properties
    this.incomingEdges = {};
    this.outgoingEdges = {};
    this.cachedColors = {};
  }

  getScaledBounds() {
    // Use x and y directly from this object
    const { x, y } = this;
    const scaledWidth = this.width * this.scaleFactor;
    const scaledHeight = this.height * this.scaleFactor;

    return {
      x: x + (this.width - scaledWidth) / 2,
      y: y + (this.height - scaledHeight) / 2,
      width: scaledWidth,
      height: scaledHeight
    };
  }

  getIntersection(lineStart, lineEnd) {
    return lineEnd;
  }

  addIncomingEdge(edge) {
    if (!(edge instanceof GraphEdge)) {
      throw new Error('Parameter must be an instance of GraphEdge.');
    }
    this.incomingEdges[edge.id] = edge;
  }

  addOutgoingEdge(edge) {
    if (!(edge instanceof GraphEdge)) {
      throw new Error('Parameter must be an instance of GraphEdge.');
    }
    this.outgoingEdges[edge.id] = edge;
  }

  _getNodeLabel() {
    throw new Error('You have to implement the method getNodeLabel!');
  }

  shiftPosition(dx, dy) {
    this.x += dx;
    this.y += dy;
  }

  updateNodeStyles() {
    throw new Error('You have to implement the method updateNodeStyles!');
  }
}
