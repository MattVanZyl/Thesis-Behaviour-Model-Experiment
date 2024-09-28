import * as d3 from 'd3';
import GraphElement from './GraphElement';
import GraphViewType from '../../../../enums/GraphViewType';
import GraphSelection from '../../../../enums/GraphSelection';

export default class GraphEdge extends GraphElement {
  constructor(viewType, options, graphDiagram) {
    const { _gvid, tail, head, _draw_, in_graph, count, pos, weight } = options;

    const id = `graph-${graphDiagram.id}-edge-${_gvid}`;
    const sourceId = `graph-${graphDiagram.id}-node-${tail}`;
    const targetId = `graph-${graphDiagram.id}-node-${head}`;

    super(viewType, id, graphDiagram, in_graph, count, pos);

    this.sourceId = sourceId;
    this.targetId = targetId;
    this.weight = weight; // You can add more properties similarly
    this.cachedColors = {};

    // Initialize waypoints as an empty array
    this.waypoints = [];

    if (_draw_ && Array.isArray(_draw_) && _draw_.some((draw) => draw.op === 'b')) {
      const drawWithPoints = _draw_.find((draw) => draw.op === 'b');
      if (drawWithPoints && Array.isArray(drawWithPoints.points)) {
        // Directly assign the points to the waypoints array
        this.waypoints = drawWithPoints.points;
      }
    } else {
      console.warn('No waypoints or invalid waypoint data');
    }
  }

  connectNodes(sourceNode, targetNode) {
    this.sourceId = sourceNode.id;
    sourceNode.addOutgoingEdge(this);

    this.targetId = targetNode.id;
    targetNode.addIncomingEdge(this);

    if (this.waypoints.length > 1) {
      // Adjust the first waypoint based on the source node
      // Use the second waypoint as reference to define the line
      this.waypoints[0] = sourceNode.getIntersection(this.waypoints[1], this.waypoints[0]);

      // Adjust the last waypoint based on the target node
      // Use the second-to-last waypoint as reference to define the line
      this.waypoints[this.waypoints.length - 1] = targetNode.getIntersection(
        this.waypoints[this.waypoints.length - 2],
        this.waypoints[this.waypoints.length - 1]
      );
    }
  }

  _getLabel() {
    // if (this.traversalCount > 0) {
    //   return this.traversalCount;
    // } else {
    return '';
    // }
  }

  _getColor(drawOptions) {
    if (drawOptions.showCountGradient) {
      return this.cachedColors['count'];
    }
    return this.cachedColors['default'];
  }

  shiftWaypoints(dx, dy) {
    this.waypoints = this.waypoints.map(([x, y]) => [x + dx, y + dy]);
  }

  scaledArrowPath(scale) {
    const scaledPath = `M0,${-5 * scale} L${10 * scale},0 L0,${5 * scale}`;
    return scaledPath;
  }

  draw(g) {
    const lineGenerator = d3.line().curve(d3.curveBasis);
    const lineWidth = 5;

    const edgeGroup = g.append('g').attr('id', `edgeGroup-${this.id}`);

    const arrowScaleFactor = lineWidth / 2;

    // Main arrow
    edgeGroup
      .append('defs')
      .append('marker')
      .attr('id', `arrow-${this.id}`)
      .attr(
        'viewBox',
        `0 ${-5 * arrowScaleFactor} ${10 * arrowScaleFactor} ${10 * arrowScaleFactor}`
      )
      .attr('refX', 5)
      .attr('refY', 0)
      .attr('markerWidth', lineWidth / 2) // Adjust marker size based on lineWidth
      .attr('markerHeight', lineWidth / 2)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', this.scaledArrowPath(lineWidth / 2));

    edgeGroup
      .append('path')
      .attr('id', `edgePath-${this.id}`)
      .attr('d', lineGenerator(this.waypoints))
      .attr('fill', 'none')
      .attr('stroke-width', lineWidth) // Adjust line width
      .attr('marker-end', `url(#arrow-${this.id})`);
  }

  updateEdgeStyles(graphSelection, graphDetails, drawOptions, legendOptions) {
    const edgeGroup = d3.select(`#edgeGroup-${this.id}`);
    edgeGroup.classed(
      'ghost-graph-edge graph-difference-A graph-difference-B graph-edge-default graph-hidden',
      false
    );

    const edgePath = edgeGroup.select(`#edgePath-${this.id}`);
    const arrow = edgeGroup.select(`#arrow-${this.id}`);

    edgePath.attr('stroke', null);
    arrow.attr('fill', null);

    switch (graphSelection) {
      case GraphSelection.SINGLE:
        edgeGroup.classed('graph-edge-default', true);
        break;

      case GraphSelection.GRAPH_A:
        if (this.in_A) {
          edgeGroup.classed('graph-edge-default', true);
        } else {
          edgeGroup.classed('graph-hidden', true);
          // edgeGroup.lower().classed('ghost-graph-edge', true);
        }
        break;

      case GraphSelection.GRAPH_B:
        if (this.in_B) {
          edgeGroup.classed('graph-edge-default', true);
          if (!this.in_A) {
            edgeGroup.classed('added-in-graph-B', true);
          }
        } else {
          edgeGroup.lower().classed('ghost-graph-edge', true);
        }
        break;

      case GraphSelection.BOTH:
        if (drawOptions.showStructureDifference) {
          const className =
            this.in_A && this.in_B
              ? 'graph-edge-default'
              : this.in_A
              ? 'graph-difference-A'
              : 'graph-difference-B';
          edgeGroup.classed(className, true);
        } else {
          edgeGroup.classed('graph-edge-default', true);
        }
        break;
    }
  }

  applyStroke(edgeGroup, edgePath, arrow, color) {
    edgePath.attr('stroke', color || null);
    arrow.attr('fill', color || null);
    edgeGroup.classed('ghost-graph-edge', !color);
  }
}
