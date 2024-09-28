import GraphNode from '../GraphNode';
import { select } from 'd3-selection';
import GraphViewType from '../../../../../enums/GraphViewType';
import GraphSelection from '../../../../../enums/GraphSelection';

export default class BPMNGateway extends GraphNode {
  constructor(viewType, options, graphDiagram, scaleFactor = 1) {
    super(viewType, options, graphDiagram, scaleFactor);

    const size = 42;
    this.width = size;
    this.height = size;
    // Debug
    this.lineIntersections = [];

    const { x, y, width, height } = this;
    this.vertices = [
      { x: x, y: y - height / 2 }, // Top midpoint
      { x: x + width / 2, y: y }, // Right midpoint
      { x: x, y: y + height / 2 }, // Bottom midpoint
      { x: x - width / 2, y: y } // Left midpoint
    ];
    this.edges = [
      { start: this.vertices[0], end: this.vertices[1] },
      { start: this.vertices[1], end: this.vertices[2] },
      { start: this.vertices[2], end: this.vertices[3] },
      { start: this.vertices[3], end: this.vertices[0] }
    ];
  }

  _getNodeLabel() {
    if (this.type === 'ExclusiveGateway') {
      return 'X';
    } else if (this.type === 'ParallelGateway') {
      return '+';
    } else {
      return '';
    }
  }

  shiftPosition(dx, dy) {
    // Shift the position of the object itself
    this.x += dx;
    this.y += dy;

    // Shift the vertices
    this.vertices.forEach((vertex) => {
      vertex.x += dx;
      vertex.y += dy;
    });

    // Shift the intersection points
    this.lineIntersections.forEach((intersection) => {
      if (intersection.intersection) {
        intersection.intersection[0] += dx;
        intersection.intersection[1] += dy;
      }
    });
  }

  getIntersection(lineStart, lineEnd) {
    let intersection = null;
    let minDistance = Infinity;

    this.edges.forEach((edge) => {
      const candidateIntersection = this.lineIntersection(lineStart, lineEnd, edge.start, edge.end);
      let pointToConsider = candidateIntersection || this.closestPointOnEdge(lineStart, edge);

      let distanceToEnd = Math.hypot(
        pointToConsider.x - lineEnd[0],
        pointToConsider.y - lineEnd[1]
      );
      if (distanceToEnd < minDistance) {
        intersection = [pointToConsider.x, pointToConsider.y];
        minDistance = distanceToEnd;
      }
    });

    // return this.applyArrowOffset(intersection, lineStart, lineEnd);
    return intersection;
  }

  lineIntersection(point1, point2, edgeStart, edgeEnd) {
    let dir1 = { x: point2[0] - point1[0], y: point2[1] - point1[1] };
    let dir2 = { x: edgeEnd.x - edgeStart.x, y: edgeEnd.y - edgeStart.y };

    let denom = dir1.x * dir2.y - dir1.y * dir2.x;

    if (Math.abs(denom) < 1e-14) {
      // Lines are parallel or nearly parallel
      return null;
    }

    let diff = { x: edgeStart.x - point1[0], y: edgeStart.y - point1[1] };
    let t1 = (diff.x * dir2.y - diff.y * dir2.x) / denom;
    let t2 = (diff.x * dir1.y - diff.y * dir1.x) / denom;

    // Check if the intersection point lies within the edge segment
    if (t2 >= 0 && t2 <= 1) {
      return {
        x: point1[0] + t1 * dir1.x,
        y: point1[1] + t1 * dir1.y
      };
    }

    return null;
  }

  closestPointOnEdge(linePoint, edge) {
    let edgeDir = { x: edge.end.x - edge.start.x, y: edge.end.y - edge.start.y };
    let edgeLengthSquared = edgeDir.x * edgeDir.x + edgeDir.y * edgeDir.y;
    let t =
      ((linePoint[0] - edge.start.x) * edgeDir.x + (linePoint[1] - edge.start.y) * edgeDir.y) /
      edgeLengthSquared;
    t = Math.max(0, Math.min(1, t));

    return {
      x: edge.start.x + t * edgeDir.x,
      y: edge.start.y + t * edgeDir.y
    };
  }

  applyArrowOffset(intersection, lineStart, lineEnd) {
    // Assuming the intersection point is close to an edge, find the direction of the edge
    // This requires knowledge of which edge the intersection is closest to
    // For simplicity, assuming it's a straight line from lineStart to lineEnd

    const arrowSize = 10;
    let dir = {
      x: lineEnd[0] - lineStart[0],
      y: lineEnd[1] - lineStart[1]
    };
    let length = Math.hypot(dir.x, dir.y);

    // Normalize the direction vector
    dir.x /= length;
    dir.y /= length;

    // Offset the intersection point
    return {
      x: intersection.x - dir.x * arrowSize,
      y: intersection.y - dir.y * arrowSize
    };
  }

  draw(g) {
    // const { x, y, width, height } = this.getScaledBounds();
    const { x, y, width, height } = this;

    // if (this.viewType === GraphViewType.CONTRAST) {
    //   this.cachedColors['count_A'] = this._calculateColor(graphdetails, 'A');
    //   this.cachedColors['count_B'] = this._calculateColor(graphdetails, 'B');
    //   this.cachedColors['count_Difference'] = this._calculateColor(graphdetails, 'Difference');
    // } else if (this.viewType === GraphViewType.SINGLE) {
    //   this.cachedColors['count'] = this._calculateColor(graphdetails);
    // }

    const vertices = [
      { x: x, y: y - height / 2 }, // Top midpoint
      { x: x + width / 2, y: y }, // Right midpoint
      { x: x, y: y + height / 2 }, // Bottom midpoint
      { x: x - width / 2, y: y } // Left midpoint
    ];

    const diamondPath = `M ${vertices[0].x},${vertices[0].y} L ${vertices[1].x},${vertices[1].y} L ${vertices[2].x},${vertices[2].y} L ${vertices[3].x},${vertices[3].y} Z`;

    // Create a group for this place
    const gatewayGroup = g.append('g').attr('id', `gatewayGroup-${this.id}`);

    // Main shape (diamond)
    gatewayGroup
      .append('path')
      .attr('id', `node-${this.id}`)
      .attr('d', diamondPath)
      .classed('bpmn-node', true);

    const label = this._getNodeLabel();
    gatewayGroup
      .append('text')
      .attr('x', x)
      .attr('y', y)
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'middle')
      .attr('font-weight', 'bold')
      .text(label)
      .classed('bpmn-node-text', true);

    // gatewayGroup
    //   .append('text')
    //   .attr('id', `count-label-${this.id}`)
    //   .attr('x', x - width)
    //   .attr('y', y - height)
    //   .attr('text-anchor', 'end')
    //   .attr('dominant-baseline', 'middle')
    //   .classed('bpmn-node-text', true);

    // DEBUG
    // gatewayGroup
    //   .append('circle')
    //   .attr('class', `waypoint ${this.id}`)
    //   .attr('cx', x)
    //   .attr('cy', y)
    //   .attr('r', 3.5)
    //   .attr('fill', 'pink');

    // this.lineIntersections.forEach((item) => {
    //   // Draw the line
    //   g.append('line')
    //     .attr('x1', item.line.start[0])
    //     .attr('y1', item.line.start[1])
    //     .attr('x2', item.line.end[0])
    //     .attr('y2', item.line.end[1])
    //     .attr('stroke', 'blue')
    //     .attr('stroke-width', 2);

    //   // Draw the intersection point
    //   g.append('circle')
    //     .attr('cx', item.intersection[0])
    //     .attr('cy', item.intersection[1])
    //     .attr('r', 4)
    //     .attr('fill', 'red');
    // });

    // // Draw vertices
    // this.vertices.forEach((vertex) => {
    //   g.append('circle')
    //     .attr('cx', vertex.x)
    //     .attr('cy', vertex.y)
    //     .attr('r', 3) // Radius of the vertex marker
    //     .attr('fill', 'green'); // Customize the vertex color as needed
    // });

    // // Draw edges
    // this.edges.forEach((edge) => {
    //   g.append('line')
    //     .attr('x1', edge.start.x)
    //     .attr('y1', edge.start.y)
    //     .attr('x2', edge.end.x)
    //     .attr('y2', edge.end.y)
    //     .attr('stroke', 'orange') // Customize the edge color as needed
    //     .attr('stroke-width', 2); // Customize the edge width as needed
    // });
  }

  updateNodeStyles(graphSelection, graphDetails, drawOptions, legendOptions) {
    const gatewayGroup = select(`#gatewayGroup-${this.id}`);
    const node = gatewayGroup.select(`#node-${this.id}`);
    node.style('fill', null);

    gatewayGroup
      .classed(
        'graph-difference-A graph-difference-B graph-default graph-hidden added-in-graph-B',
        false
      )
      .classed('ghost-graph-node', false);

    switch (graphSelection) {
      case GraphSelection.SINGLE:
        gatewayGroup.classed('graph-default', true);
        break;

      case GraphSelection.GRAPH_A:
        if (this.in_A) {
          gatewayGroup.classed('graph-default', true);
        } else {
          gatewayGroup.classed('graph-hidden', true);
          // gatewayGroup.lower().classed('ghost-graph-node', true);
        }
        break;

      case GraphSelection.GRAPH_B:
        if (this.in_B) {
          gatewayGroup.classed('graph-default', true);
          if (!this.in_A) {
            gatewayGroup.classed('added-in-graph-B', true);
          }
        } else {
          gatewayGroup.lower().classed('ghost-graph-node', true);
        }
        break;

      case GraphSelection.BOTH:
        if (drawOptions.showStructureDifference) {
          const className =
            this.in_A && this.in_B
              ? 'graph-default'
              : this.in_A
              ? 'graph-difference-A'
              : 'graph-difference-B';
          gatewayGroup.classed(className, true);
        } else {
          gatewayGroup.classed('graph-default', true);
        }
        break;
    }

    // let color;
    // switch (graphSelection) {
    //   case GraphSelection.SINGLE:
    //   case GraphSelection.GRAPH_A:
    //   case GraphSelection.GRAPH_B:
    //   case GraphSelection.BOTH:
    //     if (drawOptions.showCountGradient) {
    //       ({ color } = this.getCountAndColor(graphDetails, graphSelection));
    //       this.applyColor(gatewayGroup, color);
    //     } else {
    //       gatewayGroup.classed('graph-default', true);
    //     }
    //     break;
    // }
  }
  applyColor(gatewayGroup, color) {
    gatewayGroup.select(`#node-${this.id}`).style('fill', color || null);
    gatewayGroup.classed('ghost-graph-node', !color);
  }
}
