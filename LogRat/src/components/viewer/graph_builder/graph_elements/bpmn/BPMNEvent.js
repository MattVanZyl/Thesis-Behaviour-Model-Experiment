import GraphNode from '../GraphNode';

export default class BPMNEvent extends GraphNode {
  constructor(options, graphDiagram, scaleFactor = 1) {
    super(options, graphDiagram, scaleFactor);

    const size = 50;
    this.width = size;
    this.height = size;
  }

  _getNodeLabel() {
    if (this.type === 'StartEvent') {
      return 'Start';
    } else if (this.type === 'NormalEndEvent') {
      return 'End';
    } else {
      return '';
    }
  }

  getIntersection(lineStart, lineEnd) {
    const { x, y, width, height } = this;

    // Calculate the radius of the circle
    const radius = Math.max(width, height) / 2;

    // Direction vector of the line
    const dir = { x: lineEnd[0] - lineStart[0], y: lineEnd[1] - lineStart[1] };

    // Vector from line start to the circle center
    const f = { x: lineStart[0] - x, y: lineStart[1] - y };

    // Quadratic formula coefficients
    const a = dir.x * dir.x + dir.y * dir.y;
    const b = 2 * (f.x * dir.x + f.y * dir.y);
    const c = f.x * f.x + f.y * f.y - radius * radius;

    // Solve the quadratic equation
    const discriminant = b * b - 4 * a * c;
    if (discriminant >= 0) {
      // Discriminant is positive; there are intersections
      const t = (-b - Math.sqrt(discriminant)) / (2 * a);
      const nearestIntersection = {
        x: lineStart[0] + t * dir.x,
        y: lineStart[1] + t * dir.y
      };
      return [nearestIntersection.x, nearestIntersection.y];
    }

    // If there's no intersection, return null or handle as required
    console.error('No intersection found with the circle.');
    return null;
  }

  draw(g) {
    const { x, y, width, height } = this;

    // if (this.viewType === GraphViewType.CONTRAST) {
    //   this.cachedColors['count_A'] = this._calculateColor(graphdetails, 'A');
    //   this.cachedColors['count_B'] = this._calculateColor(graphdetails, 'B');
    //   this.cachedColors['count_Difference'] = this._calculateColor(graphdetails, 'Difference');
    // } else if (this.viewType === GraphViewType.SINGLE) {
    // this.cachedColors['count'] = this._calculateColor(graphdetails);
    // }

    // Create a group for this place
    const eventGroup = g.append('g').attr('id', `eventGroup-${this.id}`);

    // Main
    eventGroup
      .append('circle')
      .attr('id', `node-${this.id}`)
      .attr('cx', x)
      .attr('cy', y)
      .attr('r', Math.max(width, height) / 2)
      .classed('bpmn-node', true);

    const label = this._getNodeLabel();
    eventGroup
      .append('text')
      .attr('x', x)
      .attr('y', y)
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'middle')
      .attr('font-weight', 'bold')
      .text(label);

    if (this.type === 'NormalEndEvent') {
      eventGroup.select(`#node-${this.id}`).attr('fill', 'orange');
    } else if (this.type === 'StartEvent') {
      eventGroup.select(`#node-${this.id}`).attr('fill', 'lightgreen');
    }

    // // DEBUG waypoints
    // eventGroup
    //   .append('circle')
    //   .attr('class', `waypoint ${this.id}`)
    //   .attr('cx', x)
    //   .attr('cy', y)
    //   .attr('r', 3.5)
    //   .attr('fill', 'pink');
  }

  updateNodeStyles() {
    return;
  }
}
