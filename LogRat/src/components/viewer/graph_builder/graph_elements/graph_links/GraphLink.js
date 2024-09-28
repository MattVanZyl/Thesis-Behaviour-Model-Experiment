import * as d3 from 'd3';

export default class GraphLink {
  constructor(id, sourceId, targetId, sourceGraph, targetGraph, linkType, action, waypoints = []) {
    this.id = id;
    this.sourceId = sourceId;
    this.targetId = targetId;
    this.sourceGraph = sourceGraph;
    this.targetGraph = targetGraph;
    this.linkType = linkType;
    this.action = action;
    this.waypoints = waypoints;

    this.in_A;
    this.in_B;
  }

  draw(g) {
    const lineGenerator = d3.line().curve(d3.curveBasis);

    const arrowId = `arrow-${this.id}`;
    const strokeColor = '#00cfeb';

    const linkGroup = g.append('g').attr('class', 'link');
    const linePath = lineGenerator(this.waypoints);
    const pathElement = linkGroup.append('path').attr('d', linePath).attr('fill', 'none');

    linkGroup
      .append('defs')
      .append('marker')
      .attr('id', arrowId)
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', 9.5)
      .attr('refY', 0)
      .attr('markerWidth', 5)
      .attr('markerHeight', 5)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M0,-5L10,0L0,5')
      .attr('fill', strokeColor);

    linkGroup
      .append('path')
      .attr('id', this.id)
      .attr('d', linePath)
      .attr('stroke', strokeColor)
      .attr('fill', 'none')
      .attr('stroke-width', 15)
      // .attr('stroke-opacity', 1)
      .attr('marker-end', `url(#${arrowId})`)
      .attr('stroke-dasharray', '25');

    const midPoint = pathElement.node().getPointAtLength(pathElement.node().getTotalLength() / 2);

    linkGroup
      .append('text')
      .attr('x', midPoint.x)
      .attr('y', midPoint.y)
      // .attr('dx', '-20') // Adjust the position relative to the line
      .attr('dy', '-200') // Adjust the position relative to the line
      .attr('text-anchor', 'middle') // Center the text at its x,y position
      .attr('fill', strokeColor) // Match the text color with the stroke color
      .attr('stroke', 'white') // Color of the text outline
      .attr('stroke-width', '20px') // Thickness of the outline
      .attr('paint-order', 'stroke') // Ensures the stroke is painted below the fill
      .attr('font-weight', 'bold') // Make the text bold
      .attr('font-size', '140px')
      .text(`${this.linkType}: ${this.action}`);
  }
}
