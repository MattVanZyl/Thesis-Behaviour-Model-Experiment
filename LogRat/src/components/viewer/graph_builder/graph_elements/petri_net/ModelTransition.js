import GraphNode from '../GraphNode';
import { select } from 'd3-selection';
import { levelColors, fadedLevelColors } from '../../../../../config/logLevelConfig';
import { getStructuralDifferenceColor } from '../../../../../config/gradientsConfig';

export default class GraphTransition extends GraphNode {
  constructor(
    options,
    graphDiagram,
    scaleFactor = 1,
    logs_A = null,
    logs_B = null,
    logStatement = null,
    handleNodeClick
  ) {
    super(options, graphDiagram, scaleFactor);

    // Set logs and logStatement only if the name doesn't start with 'hid_'
    if (!this.name.startsWith('hid_')) {
      this.logs_A = logs_A;
      this.logs_B = logs_B;
      this.logStatement = logStatement;
      if (logStatement) {
        this.logLevel = logStatement.level;
      }
    } else {
      // Default settings for transitions that start with 'hid_'
      this.width = 1; // Replace with the size you want
      this.height = 0.75; // Replace with the size you want
      this.logs_A = null;
      this.logs_B = null;
      this.logStatement = null;
      this.logLevel = null;
    }

    this.handleNodeClick = handleNodeClick;
  }

  _getLabel() {
    if (this.name.startsWith('hid_')) {
      return ''; //`${this.name}`;
    } else {
      return `${this.name}`; // (${this.logs.length})`;
    }
  }

  draw(g, graphdetails) {
    const { x, y, width, height } = this.getScaledBounds();
    let fontSize = Math.min(width, height) / 2;

    this.cachedColors['count_A'] = this._calculateColor(graphdetails, 'A');
    this.cachedColors['count_B'] = this._calculateColor(graphdetails, 'B');
    this.cachedColors['count_Difference'] = this._calculateColor(graphdetails, 'Difference');
    this.cachedColors['default'] = this._calculateColor();

    const transitionGroup = g.append('g').attr('id', `transitionGroup-${this.id}`);

    // Outline
    transitionGroup
      .append('rect')
      .attr('id', `node-outline-${this.id}`)
      .attr('x', x)
      .attr('y', y)
      .attr('width', width)
      .attr('height', height)
      .attr('fill', 'none')
      .attr('stroke-width', 6);

    transitionGroup
      .append('rect')
      .attr('id', `node-${this.id}`)
      .attr('x', x)
      .attr('y', y)
      .attr('width', width)
      .attr('height', height);

    if (this.name.startsWith('hid_')) {
      const pixelGap = 5; // Set the pixel gap you want between the original and reduced rectangles
      const reducedWidth = width - 2 * pixelGap;
      const reducedHeight = height - 2 * pixelGap;
      const xOffset = pixelGap;
      const yOffset = pixelGap;

      transitionGroup
        .append('rect')
        .attr('x', x + xOffset)
        .attr('y', y + yOffset)
        .attr('width', reducedWidth)
        .attr('height', reducedHeight)
        .attr('fill', 'black');
    } else {
      transitionGroup
        .append('rect')
        .attr('id', `node-level-${this.id}`)
        .attr('x', x)
        .attr('y', y - 25)
        .attr('width', width)
        .attr('height', 15);
    }

    const textElement = transitionGroup
      .append('text')
      .attr('x', x + width / 2)
      .attr('y', y + height / 2)
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'middle')
      .attr('pointer-events', 'none')
      .text(this._getLabel())
      .style('font-size', fontSize);

    while (textElement.node().getBBox().width > width && fontSize > 0) {
      textElement.style('font-size', --fontSize);
    }

    transitionGroup
      .append('text')
      .attr('id', `count-label-${this.id}`)
      .attr('x', x - 4) // Positioning it to the left of the node
      .attr('y', y - height / 2) // Align vertically with the node
      .attr('text-anchor', 'end') // Right-align the text
      .attr('dominant-baseline', 'middle'); // Vertically center the text

    if (!this.name.startsWith('hid_')) {
      transitionGroup.on('click', () => this.handleNodeClick(this));
    }
  }

  updateNodeStyles(graphSelection, drawOptions, legendOptions) {
    const checkTraversalThreshold = (count) => {
      return count < drawOptions.countDisplayThreshold ? 0.035 : 1;
    };

    let fillColor = 'black';
    let outlineColor = 'none';
    let opacity = 1;

    const { graphA, graphB } = graphSelection;
    const transitionGroup = select(`#transitionGroup-${this.id}`);

    if (graphA && graphB && drawOptions.showStructureDifference) {
      if (!(this.in_A && this.in_B)) {
        outlineColor = this.in_A ? structuralDifferenceColors.A : structuralDifferenceColors.B;
      }
    }
    transitionGroup
      .select(`#node-outline-${this.id}`)
      .attr('stroke', outlineColor)
      .attr('opacity', drawOptions.structureDifferenceOpacity); // Set opacity

    if (drawOptions.showCountGradient) {
      if (graphA && graphB) {
        fillColor = this.cachedColors['count_Difference'];
        // opacity = checkTraversalThreshold(Math.abs(this.countDifference));
      } else if ((graphA && this.in_A) || (graphB && this.in_B)) {
        const selectedGraph = graphA ? 'A' : 'B';
        fillColor = this.cachedColors[`count_${selectedGraph}`];
        // opacity = checkTraversalThreshold(this[`count_${selectedGraph}`]);
      } else {
        // opacity = 0.65;
        transitionGroup.lower();
      }
    } else {
      if ((graphA && graphB) || (graphA && this.in_A) || (graphB && this.in_B)) {
        fillColor = this.cachedColors['default'];
      } else {
        // opacity = 0.65;
        transitionGroup.lower();
      }
    }
    // Setting attributes at the end
    transitionGroup.select(`#node-${this.id}`).attr('fill', fillColor);
    transitionGroup.attr('opacity', opacity);

    // Handle log levels if the option is enabled
    if (
      drawOptions.showLogLevels &&
      ((graphA && graphB) || (graphA && this.in_A) || (graphB && this.in_B))
    ) {
      const isActiveLevel = legendOptions.activeLevels.includes(this.logLevel);
      const fillStyle = isActiveLevel
        ? levelColors[this.logLevel]
        : fadedLevelColors[this.logLevel];
      transitionGroup.select(`#node-level-${this.id}`).style('fill', fillStyle);
    } else {
      transitionGroup.select(`#node-level-${this.id}`).style('fill', 'none');
    }

    // Update count label
    const countLabel = transitionGroup.select(`#count-label-${this.id}`);
    if (
      drawOptions.showCountGradient &&
      ((graphA && graphB) || (graphA && this.in_A) || (graphB && this.in_B))
    ) {
      let count, countColor;
      if (graphA && graphB) {
        count = this.countDifference;
        countColor = this.cachedColors['count_Difference'];
      } else if (graphA && this.in_A) {
        count = this.count_A;
        countColor = this.cachedColors['count_A'];
      } else if (graphB && this.in_B) {
        count = this.count_B;
        countColor = this.cachedColors['count_B'];
      }

      if (count !== undefined) {
        countLabel.text(count).attr('fill', countColor).attr('opacity', 1);
      }
    } else {
      countLabel.attr('opacity', 0); // Hide the label
    }
  }
}
