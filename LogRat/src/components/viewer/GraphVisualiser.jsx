import { useEffect, useState, useRef } from 'react';
import * as d3 from 'd3';
import { drawGraphs, updateGraphs, drawHulls, drawLinks } from './graph_builder/GraphDrawing';
import { parseGraphs } from './graph_builder/GraphParser';
import { OverlayControls } from './Overlays/OverlayControls';
import { OverlayLegend } from './Overlays/OverlayLegend';
import { OverlayGraphSelection } from './Overlays/OverlayGraphSelection';
import { OverlayNodeInfo } from './overlays/OverlayNodeInfo';
import { allLogLevels } from '../../config/logLevelConfig';
import BPMNGraph from './graph_builder/graph_elements/bpmn/BPMNGraph';
// import { SetColors } from '../../config/gradientsConfig';

import GraphViewType from '../../enums/GraphViewType';
import GraphSelection from '../../enums/GraphSelection';

const drawGrid = (svg) => {
  svg.select('#grid').remove();
  const defs = svg.select('defs').empty() ? svg.append('defs') : svg.select('defs');

  const gridSize = 60;

  const pattern = defs
    .append('pattern')
    .attr('id', 'grid')
    .attr('width', gridSize)
    .attr('height', gridSize)
    .attr('patternUnits', 'userSpaceOnUse')
    .attr('class', 'grid-pattern');

  pattern.append('path').attr('d', `M ${gridSize} 0 L 0 0 0 ${gridSize}`);
};

const initializeZoom = (svg) => {
  const zoom = d3
    .zoom()
    .scaleExtent([0.075, 6.75])
    .on('zoom', (event) => {
      svg.select('g').attr('transform', event.transform);
    });

  svg.call(zoom);
  return zoom;
};

export const GraphVisualiser = ({ lightMode, graphData }) => {
  const [selectedNode, setSelectedNode] = useState(null);

  const handleNodeClick = (nodeData) => {
    setSelectedNode(nodeData);
  };
  // useEffect(() => {
  //   selectedNode?.highlight();
  //   return () => selectedNode?.unhighlight();
  // }, [selectedNode]);

  const [graphViewType, setGraphViewType] = useState(GraphViewType.NONE);
  const [graphSelection, setGraphSelection] = useState(GraphSelection.NONE);

  const [graphDetails, setGraphdetails] = useState({
    minCountDifference: 0,
    maxCountDifference: 0,
    maxCountA: 0,
    maxCountB: 0,
    maxCount: 0,
    graphType: ''
  });

  const [drawOptions, setDrawOptions] = useState({
    showServiceGroups: false,
    showSubprocessGroups: false,
    showGraphLinks: false,
    showCountGradient: false,
    showLogLevels: false,
    showStructureDifference: false
  });
  const [legendOptions, setLegendOptions] = useState({
    activeLevels: allLogLevels
  });

  const [graphs, setGraphs] = useState(null);
  const [graphLinks, setGraphLinks] = useState(null);

  const svgRef = useRef();

  const padding = 300;

  const setGraphViewTypeAndInitialSelection = (viewType) => {
    let graphSelection;

    switch (viewType) {
      case GraphViewType.CONTRAST:
        graphSelection = GraphSelection.GRAPH_A;
        break;
      case GraphViewType.SINGLE:
        graphSelection = GraphSelection.SINGLE;
        break;
      default:
        console.error(`Unknown viewType: ${viewType}`);
        return;
    }

    setGraphViewType(viewType);
    setGraphSelection(graphSelection);
  };

  useEffect(() => {
    (async () => {
      if (graphData) {
        const { viewType, graphs, links } = await parseGraphs(graphData, handleNodeClick);
        setGraphViewTypeAndInitialSelection(viewType);

        // Initialize variables
        let globalMinCountDifference = Infinity;
        let globalMaxCountDifference = -Infinity;
        let globalMaxCountA = -Infinity;
        let globalMaxCountB = -Infinity;
        let globalMaxCount = -Infinity; // For single view type
        let graphType = '';

        // Loop through each model to find the counts and differences
        graphs.forEach((graph) => {
          if (!(graph instanceof BPMNGraph)) return;

          if (viewType === GraphViewType.CONTRAST) {
            console.log(graph);

            globalMinCountDifference = Math.min(globalMinCountDifference, graph.minCountDifference);
            globalMaxCountDifference = Math.max(globalMaxCountDifference, graph.maxCountDifference);
            globalMaxCountA = Math.max(globalMaxCountA, graph.highestCount_A);
            globalMaxCountB = Math.max(globalMaxCountB, graph.highestCount_B);
          } else if (viewType === GraphViewType.SINGLE) {
            globalMaxCount = Math.max(globalMaxCount, graph.highestCount);
          }
        });

        // Update the state based on the viewType
        if (viewType === GraphViewType.CONTRAST) {
          setGraphdetails({
            minCountDifference: globalMinCountDifference,
            maxCountDifference: globalMaxCountDifference,
            maxCountA: globalMaxCountA,
            maxCountB: globalMaxCountB,
            graphType: graphType
          });
        } else if (viewType === GraphViewType.SINGLE) {
          setGraphdetails({
            maxCount: globalMaxCount,
            graphType: graphType
          });
        }

        setGraphs(graphs);
        setGraphLinks(links);
      }
    })();
  }, [graphData]);

  useEffect(() => {
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    // drawGrid(svg);

    const zoom = initializeZoom(svg);

    const rootGroup = svg.append('g').attr('class', 'root-group');
    rootGroup
      .append('rect')
      .attr('width', '100%')
      .attr('height', '100%')
      .attr('fill', 'url(#grid)');

    if (graphs) drawGraphs(graphs, rootGroup);

    // Update grid size
    const bbox = rootGroup.node().getBBox();
    const paddedWidth = bbox.width + 2 * padding;
    const paddedHeight = bbox.height + 2 * padding;

    rootGroup.select('rect').attr('width', paddedWidth).attr('height', paddedHeight);

    // Center and set initial zoom
    const svgNode = svg.node();
    const svgWidth = svgNode.clientWidth || svgNode.parentNode.clientWidth;
    const svgHeight = svgNode.clientHeight || svgNode.parentNode.clientHeight;

    const initialScale = Math.min(svgWidth / paddedWidth, svgHeight / paddedHeight);
    const xCenter = (svgWidth - bbox.width * initialScale) / 2 - bbox.x * initialScale;
    const yCenter = (svgHeight - bbox.height * initialScale) / 2 - bbox.y * initialScale;

    zoom.transform(svg, d3.zoomIdentity.translate(xCenter, yCenter).scale(initialScale));
  }, [graphs]);

  useEffect(() => {
    const svg = d3.select(svgRef.current);
    const rootgroup = svg.select('.root-group');

    if (graphs) {
      updateGraphs(graphs, graphDetails, graphSelection, drawOptions, legendOptions);
      drawHulls(graphs, rootgroup, drawOptions);
      drawLinks(graphLinks, rootgroup, drawOptions);
    }
  }, [drawOptions, legendOptions, graphs, graphSelection]);

  return (
    <div className="ui-border model-visualiser" style={{ position: 'relative' }}>
      <div className="overlay-container overlay-container-right">
        <OverlayGraphSelection
          graphViewType={graphViewType}
          graphSelection={graphSelection}
          setGraphSelection={setGraphSelection}
        />
        <OverlayControls
          drawOptions={drawOptions}
          setDrawOptions={setDrawOptions}
          svgRef={svgRef}
          graphSelection={graphSelection}
          graphDetails={graphDetails}
        />
      </div>
      <div className="overlay-container overlay-container-left">
        <OverlayLegend
          drawOptions={drawOptions}
          graphSelection={graphSelection}
          setLegendOptions={setLegendOptions}
          legendOptions={legendOptions}
          graphDetails={graphDetails}
        />
        {/* <OverlayNodeInfo selectedNode={selectedNode} /> */}
      </div>

      <svg ref={svgRef} style={{ width: '100%', height: '100%' }} />
    </div>
  );
};
