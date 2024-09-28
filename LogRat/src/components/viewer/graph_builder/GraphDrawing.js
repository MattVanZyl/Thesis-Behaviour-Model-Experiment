import * as d3 from 'd3';
import BlackBoxGraph from './graph_elements/BlackBoxGraph';
import { drawConvexHull, drawSquare, pointsInStraightLine } from './helper/RoundedConvexHull';

function hexToRgba(hex, alpha) {
  const [r, g, b] = [
    parseInt(hex.slice(1, 3), 16),
    parseInt(hex.slice(3, 5), 16),
    parseInt(hex.slice(5, 7), 16)
  ];
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// ================================================================================
// Draw Graph
// ================================================================================
export function drawGraphs(graphDiagrams, rootGroup) {
  const serviceNodes = {};

  graphDiagrams.forEach((graph) => {
    const graphId = graph.id;

    if (!serviceNodes[graph.serviceName]) {
      serviceNodes[graph.serviceName] = [];
    }

    serviceNodes[graph.serviceName] = serviceNodes[graph.serviceName].concat(graph.nodes);

    const g = rootGroup.append('g').attr('class', graphId);

    Object.values(graph.nodes).forEach((node) => {
      node.draw(g);
    });

    Object.values(graph.edges).forEach((edge) => {
      edge.draw(g);
    });
  });
}

export function updateGraphs(
  graphDiagrams,
  graphDetails,
  graphSelection,
  drawOptions,
  legendOptions
) {
  graphDiagrams.forEach((graph) => {
    // console.log(graph.id);

    // Update nodes
    Object.values(graph.nodes).forEach((node) => {
      node.updateNodeStyles(graphSelection, graphDetails, drawOptions, legendOptions);
    });

    // Update edges
    Object.values(graph.edges).forEach((edge) => {
      edge.updateEdgeStyles(graphSelection, graphDetails, drawOptions, legendOptions);
    });
  });
}
// ================================================================================
// Draw Links
// ================================================================================
export function drawLinks(graphLinks, rootGroup, drawOptions) {
  rootGroup.selectAll('.link').remove();

  if (drawOptions.showGraphLinks) {
    graphLinks.forEach((link) => {
      link.draw(rootGroup);
    });
  }
}
// ================================================================================
// Draw Hulls
// ================================================================================
// let classColorScale = d3.scaleOrdinal(d3.schemeCategory10);
// let methodColorScale = d3.scaleOrdinal(d3.schemeTableau10);
// let fileColorScale = d3.scaleOrdinal(d3.schemeAccent);
// let subprocessColorScale = d3.scaleOrdinal(d3.schemeCategory10);

export function drawHulls(graphDiagrams, rootGroup, drawOptions) {
  rootGroup.selectAll('.hull').remove();
  rootGroup.selectAll('.classGroup').remove();
  rootGroup.selectAll('.methodGroup').remove();
  rootGroup.selectAll('.fileGroup').remove();

  let serviceColorScale = d3.scaleOrdinal(d3.schemeTableau10); // Bright color scale for services

  let aggregatedServiceTasks = {};
  let serviceColors = {};

  graphDiagrams.forEach((graphDiagram) => {
    if (graphDiagram instanceof BlackBoxGraph) {
      return;
    }

    const id = graphDiagram.id;
    const group = rootGroup.select(`.${id}`); // Assuming class names are now graph ids

    graphDiagram.services.forEach((serviceName) => {
      if (!serviceColors[serviceName]) {
        serviceColors[serviceName] = serviceColorScale(serviceName);
      }

      const tasksByService = graphDiagram.findNodesByField('service', serviceName);
      if (aggregatedServiceTasks[serviceName]) {
        aggregatedServiceTasks[serviceName] =
          aggregatedServiceTasks[serviceName].concat(tasksByService);
      } else {
        aggregatedServiceTasks[serviceName] = tasksByService;
      }
    });

    // Draw subprocess hulls using service colors
    if (drawOptions.showSubprocessGroups) {
      graphDiagram.subprocesses.forEach((subprocessName) => {
        const tasksBySubprocess = graphDiagram.findNodesByField('subprocess', subprocessName);
        const serviceName = tasksBySubprocess[0]?.service; // Assuming service is a property of task
        const color = serviceColors[serviceName] || d3.rgb('gray'); // Fallback to gray if no service color
        drawConvexHull(
          group,
          tasksBySubprocess,
          `Subprocess: ${subprocessName}`,
          color,
          0,
          0.5,
          0.05,
          1,
          100,
          false,
          '170px'
        );
      });
    }
  });

  // Draw service hulls
  if (drawOptions.showServiceGroups) {
    Object.keys(aggregatedServiceTasks).forEach((serviceName) => {
      const color = serviceColors[serviceName];
      drawSquare(
        rootGroup,
        aggregatedServiceTasks[serviceName],
        `Service: ${serviceName}`,
        color,
        100,
        0.03,
        '270px',
        500
      );
    });
  }
}
