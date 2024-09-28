import { getCountColor } from '../../../../config/gradientsConfig';
import GraphSelection from '../../../../enums/GraphSelection';
import GraphViewType from '../../../../enums/GraphViewType';

export default class GraphElement {
  constructor(viewType, id, graphDiagram, in_graph = {}, count, pos) {
    this.viewType = viewType;
    this.id = id;
    this.graphDiagram = graphDiagram;
    this.service = graphDiagram.serviceName;
    this.subProcess = graphDiagram.subProcessName;

    if (pos) {
      const [x, y] = pos.split(',').map(Number);
      this.pos = { x, y };
    } else {
      this.pos = null;
    }

    if (this.viewType === GraphViewType.CONTRAST) {
      // Convert Python-style booleans to JSON-compatible format and replace single quotes with double quotes
      const formattedString = in_graph
        .replace(/'/g, '"')
        .replace(/True/g, 'true')
        .replace(/False/g, 'false');

      try {
        const in_graph_object = JSON.parse(formattedString);
        this.in_A = in_graph_object.A;
        this.in_B = in_graph_object.B;
      } catch (error) {
        console.error('Error parsing in_graph:', error);
        // Handle error or set default values
        this.in_A = false;
        this.in_B = false;
      }

      let countObject;
      if (typeof count === 'string') {
        try {
          const formattedCount = count.replace(/'/g, '"');
          countObject = JSON.parse(formattedCount);
        } catch (error) {
          console.error('Error parsing count:', error);
          // Handle error or set default values
          countObject = { A: 0, B: 0 };
        }
      } else if (typeof count === 'object' && count !== null) {
        countObject = count;
      } else {
        console.error('Invalid count format:', count);
        countObject = { A: 0, B: 0 };
      }

      this.count_A = parseInt(countObject.A, 10);
      this.count_B = parseInt(countObject.B, 10);
      this.countDifference = this.count_B - this.count_A;
    } else if (this.viewType === GraphViewType.SINGLE) {
      this.count = parseInt(count, 10);
    }
  }

  /**
   * Process or handle settings based on the selected graph and view type.
   * @param {GraphSelection} graphSelection - The selected graph.
   */
  getCountAndColor(graphDetails, graphSelection) {
    let color, count;
    let min = 1; // Default min value
    let max = 1; // Default max value

    switch (graphSelection) {
      case GraphSelection.SINGLE:
        count = this.count;
        max = graphDetails.maxCount;
        break;

      case GraphSelection.GRAPH_A:
        count = this.count_A;
        max = graphDetails.maxCountA;
        break;

      case GraphSelection.GRAPH_B:
        count = this.count_B;
        max = graphDetails.maxCountB;
        break;

      case GraphSelection.BOTH:
        count = this.countDifference;
        min = Math.min(graphDetails.minCountDifference, -1);
        max = Math.max(graphDetails.maxCountDifference, 1);
        break;

      default:
        console.error('Unknown graph selection type');
        break;
    }

    color = getCountColor({
      graphSelection: graphSelection,
      count: count,
      min: min,
      max: max
    });

    return { count, color }; // Return both count and color
  }

  // _calculateColor(graphdetails, graph = null) {
  //   if (this.viewType === GraphViewType.CONTRAST && graphdetails && graph) {
  //     // Case for individual graphs A and B
  //     // if (['A', 'B'].includes(graph)) {
  //     //   return getCountGradientColor({
  //     //     current: this[`count_${graph}`],
  //     //     max: graphdetails[`maxCount${graph}`],
  //     //     graph: graph
  //     //   });
  //     // }

  //     // Case for the "Difference" graph
  //     if (graph === 'Difference') {
  //       return getCountGradientColor({
  //         current: this.countDifference,
  //         min: graphdetails.minCountDifference,
  //         max: graphdetails.maxCountDifference,
  //         graph: 'Difference'
  //       });
  //     }
  //   } else if (this.viewType === GraphViewType.SINGLE) {
  //     // Logic for single viewType
  //     return getCountGradientColor({
  //       current: this.count,
  //       max: graphdetails.maxCount,
  //       graph: 'Single'
  //     });
  //   }
  //   return getContrastColor('Both');
  // }

  draw() {
    throw new Error('You have to implement the method draw!');
  }
}
