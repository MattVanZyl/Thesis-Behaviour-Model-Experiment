import React, { useState, useEffect } from 'react';
import * as d3 from 'd3';

const drawExclusiveGateway = (container) => {
  const [x, y, width, height] = [0, 0, 40, 40]; // Example dimensions
  const diamondPath = `M ${x} ${y + height / 2} L ${x + width / 2} ${y} L ${x + width} ${
    y + height / 2
  } L ${x + width / 2} ${y + height} Z`;

  container.append('path').attr('d', diamondPath).classed('bpmn-node', true);
  container
    .append('text')
    .attr('x', x + width / 2)
    .attr('y', y + height / 2)
    .attr('text-anchor', 'middle')
    .attr('dominant-baseline', 'middle')
    .attr('font-weight', 'bold')
    .text('X')
    .classed('bpmn-node-text', true);
  container.classed('graph-default', true);
};

const drawParallelGateway = (container) => {
  const [x, y, width, height] = [0, 0, 40, 40]; // Example dimensions
  const diamondPath = `M ${x} ${y + height / 2} L ${x + width / 2} ${y} L ${x + width} ${
    y + height / 2
  } L ${x + width / 2} ${y + height} Z`;

  container.append('path').attr('d', diamondPath).classed('bpmn-node', true);
  container
    .append('text')
    .attr('x', x + width / 2)
    .attr('y', y + height / 2)
    .attr('text-anchor', 'middle')
    .attr('dominant-baseline', 'middle')
    .attr('font-weight', 'bold')
    .text('+')
    .style('font-size', 22)
    .classed('bpmn-node-text', true);
  container.classed('graph-default', true);
};

const drawStartEvent = (container) => {
  const [x, y, diameter] = [20, 20, 37]; // Example dimensions
  container
    .append('circle')
    .attr('cx', x)
    .attr('cy', y)
    .attr('r', diameter / 2)
    .attr('fill', 'lightgreen')
    .classed('bpmn-node', true);

  container
    .append('text')
    .attr('x', x)
    .attr('y', y)
    .attr('text-anchor', 'middle')
    .attr('dominant-baseline', 'middle')
    .attr('font-weight', 'bold')
    .text('Start')
    .style('font-size', 12)
    .classed('bpmn-node-text', true);
};

const drawEndEvent = (container) => {
  const [x, y, diameter] = [20, 20, 37]; // Example dimensions
  container
    .append('circle')
    .attr('cx', x)
    .attr('cy', y)
    .attr('r', diameter / 2)
    .attr('fill', 'orange')
    .classed('bpmn-node', true);

  container
    .append('text')
    .attr('x', x)
    .attr('y', y)
    .attr('text-anchor', 'middle')
    .attr('dominant-baseline', 'middle')
    .attr('font-weight', 'bold')
    .text('End')
    .style('font-size', 12)
    .classed('bpmn-node-text', true);
};

const drawTask = (container) => {
  const [x, y, width, height] = [1.5, 5, 37, 30]; // Example dimensions
  container
    .append('rect')
    .attr('x', x)
    .attr('y', y)
    .attr('width', width)
    .attr('height', height)
    .classed('bpmn-node graph-default', true);

  container
    .append('text')
    .attr('x', x + width / 2)
    .attr('y', y + height / 2)
    .attr('text-anchor', 'middle')
    .attr('dominant-baseline', 'middle')
    .text('Log')
    .style('font-size', 12)
    .classed('bpmn-node-text', true);
};

const drawFlow = (container) => {
  const arrowScaleFactor = 1; // Adjust as needed
  const lineWidth = 4; // Line width
  const edgeLength = 32; // Edge length (you might need to adjust this based on your layout)

  // Arrow path
  const scaledArrowPath = `M0,0 L0,${10 * arrowScaleFactor} L${10 * arrowScaleFactor},5 L0,0`;

  // Append defs and marker for arrowhead
  const defs = container.append('defs');
  defs
    .append('marker')
    .attr('id', `arrow-notation-edge`)
    .attr('viewBox', `0 0 ${10 * arrowScaleFactor} ${10 * arrowScaleFactor}`)
    .attr('refX', 5 * arrowScaleFactor)
    .attr('refY', 5 * arrowScaleFactor)
    .attr('markerWidth', 4 * arrowScaleFactor)
    .attr('markerHeight', 3 * arrowScaleFactor)
    .attr('orient', 'auto')
    .append('path')
    .attr('d', scaledArrowPath);

  // Append the path for the edge
  container
    .append('path')
    .attr('d', `M2,20 L${edgeLength + 2},20`)
    .attr('stroke-width', lineWidth)
    .attr('marker-end', `url(#arrow-notation-edge`);

  container.classed('graph-edge-default', true);
};

const drawLink = (container) => {
  const strokeColor = '#2694fc';

  const arrowScaleFactor = 1; // Adjust as needed
  const lineWidth = 4; // Line width
  const edgeLength = 32; // Edge length (you might need to adjust this based on your layout)

  // Arrow path
  const scaledArrowPath = `M0,0 L0,${10 * arrowScaleFactor} L${10 * arrowScaleFactor},5 L0,0`;

  // Append defs and marker for arrowhead
  const defs = container.append('defs');
  defs
    .append('marker')
    .attr('id', `arrow-notation-link`)
    .attr('viewBox', `0 0 ${10 * arrowScaleFactor} ${10 * arrowScaleFactor}`)
    .attr('refX', 5 * arrowScaleFactor)
    .attr('refY', 5 * arrowScaleFactor)
    .attr('markerWidth', 4 * arrowScaleFactor)
    .attr('markerHeight', 3 * arrowScaleFactor)
    .attr('orient', 'auto')
    .append('path')
    .attr('fill', strokeColor)
    .attr('d', scaledArrowPath);

  // Append the path for the edge
  container
    .append('path')
    .attr('d', `M2,20 L${edgeLength + 2},20`)
    .attr('stroke-width', lineWidth)
    .attr('stroke', strokeColor)
    .attr('stroke-dasharray', '5')
    .attr('marker-end', `url(#arrow-notation-link`);

  // container.classed('graph-edge-default', true);
};

export const BPMNNotation = ({ isLegendExpanded }) => {
  const notations = [
    {
      id: 'exclusive-gateway',
      type: 'exclusive-gateway',
      name: 'Exclusive Gateway',
      description:
        "Determines the flow of a process based on conditions, directing to a single path in the system's workflow."
    },
    {
      id: 'parallel-gateway',
      type: 'parallel-gateway',
      name: 'Parallel Gateway',
      description:
        "Splits the system's workflow into simultaneous paths or combines parallel paths, representing concurrent operations."
    },
    {
      id: 'start-event',
      type: 'start-event',
      name: 'Start Event',
      description:
        'Marks the initiation of a workflow in the system, indicating the beginning of log entries for a process.'
    },
    {
      id: 'end-event',
      type: 'end-event',
      name: 'End Event',
      description:
        "Signifies the termination of a workflow within the system, marking the end of the process's log entries."
    },
    {
      id: 'task',
      type: 'task',
      name: 'Log Statement (Task)',
      description:
        'Represents a logged activity or event in the system, grouping logs from the same source or operation.'
    },
    {
      id: 'flow',
      type: 'flow',
      name: 'Flow',
      description:
        'Illustrates the sequence of activities or operations in the system, as captured in the logs'
    },
    {
      id: 'link',
      type: 'link',
      name: 'Link',
      description:
        'Shows connections across different system services, illustrating how the process propagates through them.'
    }
  ];

  const notationDrawFunctions = {
    'exclusive-gateway': drawExclusiveGateway,
    'parallel-gateway': drawParallelGateway,
    'start-event': drawStartEvent,
    'end-event': drawEndEvent,
    task: drawTask,
    flow: drawFlow,
    link: drawLink
    // Add mappings for other notation types
  };

  const drawNotation = (notation) => {
    const container = d3.select(`#notation-${notation.id}`);
    container.selectAll('*').remove();

    const drawFunction = notationDrawFunctions[notation.type];

    if (drawFunction) {
      drawFunction(container);
    } else {
      console.error(`No drawing function defined for type: ${notation.type}`);
    }
  };

  // Call drawNotation for each notation
  notations.forEach(drawNotation);

  const [hoveredNotation, setHoveredNotation] = useState(null);

  useEffect(() => {
    if (isLegendExpanded) {
      notations.forEach((notation) => {
        const container = d3.select(`#notation-${notation.id}`);
        container.selectAll('*').remove();
        const drawFunction = notationDrawFunctions[notation.type];
        if (drawFunction) {
          drawFunction(container);
        }
      });
    }
  }, [isLegendExpanded]);

  return (
    <div className="bpmn-notation-container">
      {notations.map((notation) => (
        <div
          key={notation.id}
          className="bpmn-notation"
          onMouseEnter={() => setHoveredNotation(notation.id)}
          onMouseLeave={() => setHoveredNotation(null)}>
          <div className="notation-header">
            <svg id={`notation-${notation.id}`} width="40" height="40"></svg>
            <p>{notation.name}</p>
          </div>
          {hoveredNotation === notation.id && (
            <div className="notation-description-popup ui-border ui-padding">
              <p>{notation.description}</p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};
