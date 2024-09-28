import { v4 as uuidv4 } from 'uuid';

export default class BlackBoxGraph {
  constructor(serviceName) {
    this.id = 'graph-' + uuidv4();
    this.serviceName = serviceName;
    this.subProcessName = 'BlackBox';
    this.nodes = {};
    this.nodes['blackBoxNode'] = this.createBlackBoxNode(this, serviceName);
    this.edges = {}; // Empty, but necessary for finalizeGraphLayout

    // Hardcoded values for services and subprocesses
    this.services = [serviceName]; // Assuming serviceName represents a unique service
    this.subprocesses = ['BlackBoxSubprocess']; // Example value for subprocess
  }

  createBlackBoxNode(parentGraphDiagram, serviceName) {
    const node = {
      id: 'blackboxnode-' + uuidv4(),
      graphDiagram: parentGraphDiagram,
      label: 'Black Box Service',
      // Define the dimensions and position properties of the node
      x: 0,
      y: 0,
      width: 1200,
      height: 800,
      shiftPosition: function (x, y) {
        this.x = x;
        this.y = y;
      },
      draw: function (g) {
        const { x, y, width, height } = this; // Use the node's properties

        // Append a group for the black box node
        const blackBoxGroup = g.append('g').attr('id', `blackBoxGroup-${this.id}`);

        // Define a pattern for hatched lines
        const patternId = `hatch-pattern-${this.id}`;
        g.append('defs')
          .append('pattern')
          .attr('id', patternId)
          .attr('width', 40) // Spacing of hatches
          .attr('height', 40)
          .attr('patternUnits', 'userSpaceOnUse')
          .append('path')
          .attr('d', 'M-10,-10 l60,60') // Line from bottom left to top right
          .attr('class', 'blackbox-hatch-pattern'); // Apply CSS class for hatch pattern

        // Draw the main rectangle of the black box
        blackBoxGroup
          .append('rect')
          .attr('class', 'blackbox-style') // Apply CSS class for styling
          .attr('x', x)
          .attr('y', y)
          .attr('width', width)
          .attr('height', height)
          .attr('fill', `url(#${patternId})`); // Apply hatched pattern to fill

        // Add label to the center of the node
        const fontSize = Math.min(width, height) / 5; // Adjust font size based on node size
        blackBoxGroup
          .append('text')
          .attr('class', 'blackbox-text-style') // Apply CSS class for text styling
          .attr('x', x + width / 2) // Center the text horizontally
          .attr('y', y + height / 2) // Center the text vertically
          .attr('text-anchor', 'middle') // Ensure the text is centered
          .attr('dominant-baseline', 'middle') // Vertically center the text
          .text(serviceName) // Set the text to the service name
          .attr('stroke', 'white') // Color of the text outline
          .attr('stroke-width', '20px') // Thickness of the outline
          .attr('paint-order', 'stroke') // Ensures the stroke is painted below the fill
          .style('font-weight', 'bold')
          .style('font-size', fontSize + 'px'); // Set the font size
      },
      updateNodeStyles: function () {
        return;
      },
      getScaledBounds: function () {
        return {
          x: this.x,
          y: this.y,
          width: this.width,
          height: this.height
        };
      }
    };

    return node;
  }

  calculateBounds() {
    // Implement logic to calculate the bounds of the single node
    return {
      minX: 0,
      minY: 0,
      maxX: 1000, // Example values
      maxY: 600
    };
  }
  findNodesByField(fieldName, value) {
    // Return the black box node if it matches the field and value
    if (fieldName === 'service' && value === this.serviceName) {
      return [this.nodes['blackBoxNode']];
    } else if (fieldName === 'subprocess' && value === 'BlackBoxSubprocess') {
      return [this.nodes['blackBoxNode']];
    }
    return []; // Return an empty array if no match
  }
}
