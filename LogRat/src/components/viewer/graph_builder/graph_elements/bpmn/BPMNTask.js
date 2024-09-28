import GraphNode from '../GraphNode';
import { select } from 'd3-selection';
import { levelColors, fadedLevelColors } from '../../../../../config/logLevelConfig';
import GraphSelection from '../../../../../enums/GraphSelection';

export default class BPMNTask extends GraphNode {
  constructor(
    viewType,
    options,
    graphDiagram,
    scaleFactor = 1,
    logs = null,
    logStatement = null,
    handleNodeClick
  ) {
    super(viewType, options, graphDiagram, scaleFactor);
    this.logs = logs;
    this.logStatement = logStatement;
    if (logStatement) {
      this.logLevel = logStatement.level;
    }
    this.handleNodeClick = handleNodeClick;
  }

  _getLabel() {
    return `${this.name}`;
  }

  draw(g) {
    const { x, y, width, height } = this.getScaledBounds();
    let fontSize = Math.min(width, height) / 2;

    // if (this.viewType === GraphViewType.CONTRAST) {
    //   this.cachedColors['count_A'] = this._calculateColor(graphdetails, 'A');
    //   this.cachedColors['count_B'] = this._calculateColor(graphdetails, 'B');
    //   this.cachedColors['count_Difference'] = this._calculateColor(graphdetails, 'Difference');
    // } else if (this.viewType === GraphViewType.SINGLE) {
    //   this.cachedColors['count'] = this._calculateColor(graphdetails);
    // }

    const taskGroup = g.append('g').attr('id', `taskGroup-${this.id}`);

    taskGroup
      .append('rect')
      .attr('id', `node-${this.id}`)
      .attr('x', x)
      .attr('y', y)
      .attr('width', width + 10)
      .attr('height', height)
      .classed('bpmn-node', true);

    const levelWidth = 100;
    taskGroup
      .append('rect')
      .attr('id', `node-level-${this.id}`)
      .attr('x', x + 1)
      .attr('y', y - 16)
      .attr('width', levelWidth)
      .attr('height', 14);

    const textElement = taskGroup
      .append('text')
      .attr('x', x + width / 2)
      .attr('y', y + height / 2)
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'middle')
      .attr('pointer-events', 'none')
      .text(this._getLabel())
      .attr('font-weight', 'bold') // Make the text bold
      .style('font-size', fontSize)
      .classed('bpmn-node-text', true);

    while (textElement.node().getBBox().width > width && fontSize > 0) {
      textElement.style('font-size', --fontSize);
    }

    taskGroup
      .append('text')
      .attr('id', `count-label-${this.id}`)
      .attr('x', x - 4) // Positioning it to the left of the node
      .attr('y', y - height / 2) // Align vertically with the node
      .attr('text-anchor', 'end') // Right-align the text
      .attr('font-weight', 'bold') // Make the text bold
      .attr('dominant-baseline', 'middle'); // Vertically center the text

    taskGroup.on('click', () => this.handleNodeClick(this));

    // // DEBUG waypoints
    // taskGroup
    //   .append('circle')
    //   .attr('class', `waypoint ${this.id}`)
    //   .attr('cx', x)
    //   .attr('cy', y)
    //   .attr('r', 3.5)
    //   .attr('fill', 'pink');
  }

  updateNodeStyles(graphSelection, graphDetails, drawOptions, legendOptions) {
    const taskGroup = select(`#taskGroup-${this.id}`);
    const node = taskGroup.select(`#node-${this.id}`);
    const countLabel = taskGroup.select(`#count-label-${this.id}`);

    node.classed('graph-difference-A graph-difference-B graph-default', false).attr('fill', null);
    taskGroup.classed('ghost-graph-node graph-hidden', false);

    node.attr('fill', null);

    let color, count;

    // console.log(graphDetails);

    switch (graphSelection) {
      case GraphSelection.SINGLE:
        if (drawOptions.showCountGradient) {
          ({ count, color } = this.getCountAndColor(graphDetails, graphSelection));
          this.applyFill(taskGroup, color);
          countLabel.text(count).attr('fill', color).attr('opacity', 1);
        } else {
          node.classed('graph-default', true);
          countLabel.attr('opacity', 0);
        }

        if (drawOptions.showLogLevels) {
          const isActiveLevel = legendOptions.activeLevels.includes(this.logLevel);
          const fillStyle = isActiveLevel
            ? levelColors[this.logLevel]
            : fadedLevelColors[this.logLevel];
          taskGroup.select(`#node-level-${this.id}`).style('fill', fillStyle);
        } else {
          taskGroup.select(`#node-level-${this.id}`).style('fill', 'none');
        }
        break;

      case GraphSelection.GRAPH_A:
        if (this.in_A) {
          if (drawOptions.showCountGradient) {
            ({ count, color } = this.getCountAndColor(graphDetails, graphSelection));
            this.applyFill(taskGroup, color);
            countLabel.text(count).attr('fill', color).attr('opacity', 1);
          } else {
            node.classed('graph-default', true);
          }
        } else {
          taskGroup.classed('graph-hidden', true);
          // taskGroup.lower().classed('ghost-graph-node', true);
        }

        if (drawOptions.showLogLevels && this.in_A) {
          const isActiveLevel = legendOptions.activeLevels.includes(this.logLevel);
          const fillStyle = isActiveLevel
            ? levelColors[this.logLevel]
            : fadedLevelColors[this.logLevel];
          taskGroup.select(`#node-level-${this.id}`).style('fill', fillStyle);
        } else {
          taskGroup.select(`#node-level-${this.id}`).style('fill', 'none');
        }

        break;

      case GraphSelection.GRAPH_B:
        if (this.in_B) {
          if (drawOptions.showCountGradient) {
            ({ count, color } = this.getCountAndColor(graphDetails, graphSelection));
            this.applyFill(taskGroup, color);
            countLabel.text(count).attr('fill', color).attr('opacity', 1);
          } else {
            node.classed('graph-default', true);
          }
        } else {
          taskGroup.lower().classed('ghost-graph-node', true);
        }

        if (drawOptions.showLogLevels && this.in_B) {
          const isActiveLevel = legendOptions.activeLevels.includes(this.logLevel);
          const fillStyle = isActiveLevel
            ? levelColors[this.logLevel]
            : fadedLevelColors[this.logLevel];
          taskGroup.select(`#node-level-${this.id}`).style('fill', fillStyle);
        } else {
          taskGroup.select(`#node-level-${this.id}`).style('fill', 'none');
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
          node.classed(className, true);
        } else if (drawOptions.showCountGradient) {
          ({ count, color } = this.getCountAndColor(graphDetails, graphSelection));
          this.applyFill(taskGroup, color);
          countLabel.text(count).attr('fill', color).attr('opacity', 1);
        } else {
          node.classed('graph-default', true);
          countLabel.attr('opacity', 0);
        }

        if (drawOptions.showLogLevels && (this.in_A || this.in_B)) {
          const isActiveLevel = legendOptions.activeLevels.includes(this.logLevel);
          const fillStyle = isActiveLevel
            ? levelColors[this.logLevel]
            : fadedLevelColors[this.logLevel];
          taskGroup.select(`#node-level-${this.id}`).style('fill', fillStyle);
        }
        break;
    }
  }

  applyFill(taskGroup, color) {
    taskGroup.select(`#node-${this.id}`).attr('fill', color || null);
    taskGroup.classed('ghost-graph-node', !color);
  }

  updateCountLabel(taskGroup, drawOptions, count, countColor) {
    const countLabel = taskGroup.select(`#count-label-${this.id}`);
    if (drawOptions.showCountGradient) {
      if (count !== undefined) {
        countLabel.text(count).attr('fill', countColor).attr('opacity', 1);
      }
    } else {
      countLabel.attr('opacity', 0);
    }
  }
}
