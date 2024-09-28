import GraphNode from '../GraphNode';
import { select } from 'd3-selection';
import { getStructuralDifferenceColor } from '../../../../../config/gradientsConfig';

export default class GraphPlace extends GraphNode {
  constructor(options, graphDiagram, scaleFactor = 1) {
    super(options, graphDiagram, scaleFactor);

    const size = this.name === 'sink0' || this.name === 'source0' ? 20 : 10;
    this.width = size;
    this.height = size;
  }

  _getNodeLabel() {
    if (this.name === 'source0') {
      return 'Start';
    } else if (this.name === 'sink0') {
      return 'End';
    } else {
      return '';
    }
  }

  draw(g, graphdetails) {
    const { x, y, width, height } = this.getScaledBounds();

    this.cachedColors['count_A'] = this._calculateColor(graphdetails, 'A');
    this.cachedColors['count_B'] = this._calculateColor(graphdetails, 'B');
    this.cachedColors['count_Difference'] = this._calculateColor(graphdetails, 'Difference');
    this.cachedColors['default'] = this._calculateColor();

    // Create a group for this place
    const placeGroup = g.append('g').attr('id', `placeGroup-${this.id}`);

    //Outline
    placeGroup
      .append('circle')
      .attr('id', `node-outline-${this.id}`)
      .attr('cx', x + width / 2)
      .attr('cy', y + height / 4)
      .attr('r', Math.max(width, height) / 2)
      .attr('fill', 'none')
      .attr('stroke-width', 6);

    placeGroup
      .append('circle')
      .attr('id', `node-${this.id}`)
      .attr('cx', x + width / 2)
      .attr('cy', y + height / 4)
      .attr('r', Math.max(width, height) / 2);

    const label = this._getNodeLabel();
    placeGroup
      .append('text')
      .attr('x', x + width / 2)
      .attr('y', y + height / 4)
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'middle')
      .attr('font-weight', 'bold')
      .text(label);

    placeGroup
      .append('text')
      .attr('id', `count-label-${this.id}`)
      .attr('x', x - 4) // Positioning it to the left of the node
      .attr('y', y - height / 2) // Align vertically with the node
      .attr('text-anchor', 'end') // Right-align the text
      .attr('dominant-baseline', 'middle'); // Vertically center the text
  }

  updateNodeStyles(graphSelection, drawOptions, legendOptions) {
    const checkTraversalThreshold = (count) => {
      return count < drawOptions.countDisplayThreshold ? 0.035 : 1;
    };

    let fillColor = 'black';
    let outlineColor = 'none';
    let opacity = 1;

    const { graphA, graphB } = graphSelection;
    const placeGroup = select(`#placeGroup-${this.id}`);

    // Special cases for sink0 and source0
    if (this.name === 'sink0') {
      placeGroup.select(`#node-${this.id}`).attr('fill', 'orange');
      return;
    }
    if (this.name === 'source0') {
      placeGroup.select(`#node-${this.id}`).attr('fill', 'lightgreen');
      return;
    }

    if (graphA && graphB && drawOptions.showStructureDifference) {
      if (!(this.in_A && this.in_B)) {
        outlineColor = this.in_A ? structuralDifferenceColors.A : structuralDifferenceColors.B;
      }
    }
    placeGroup
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
        placeGroup.lower();
      }
    } else {
      if ((graphA && graphB) || (graphA && this.in_A) || (graphB && this.in_B)) {
        fillColor = this.cachedColors['default'];
      } else {
        // opacity = 0.65;
        placeGroup.lower();
      }
    }
    // Setting attributes at the end
    placeGroup.select(`#node-${this.id}`).attr('fill', fillColor);
    placeGroup.attr('opacity', opacity);

    // Update count label
    const countLabel = placeGroup.select(`#count-label-${this.id}`);
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
