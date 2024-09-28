import BPMNGraph from './graph_elements/bpmn/BPMNGraph';
import GraphLink from './graph_elements/graph_links/GraphLink';
import BPMNTask from './graph_elements/bpmn/BPMNTask';
import BlackBoxGraph from './graph_elements/BlackBoxGraph';
import GraphViewType from '../../../enums/GraphViewType';

// ================================================================================
function finalizeGraphLayout(viewType, graphs, xSpacing = 1600, ySpacing = 900, padding = 400) {
  let currentXOffset = padding;
  let currentYOffset = padding;
  let maxWidth = 0; // Variable to keep track of the maximum width of graphs within a service

  let preferredOrder;
  if (viewType === GraphViewType.CONTRAST)
    preferredOrder = ['web-app', 'experiment-service', 'pcm-service'];
  else preferredOrder = ['web-app', 'pcm-service', 'experiment-service'];

  graphs.sort((a, b) => {
    // Handle cases where either graph is not a BlackBoxGraph
    if (!a.serviceName || !b.serviceName) {
      return 0; // If one or both don't have serviceName, keep original order
    }

    // Determine order based on preferred service names
    const orderA = preferredOrder.indexOf(a.serviceName);
    const orderB = preferredOrder.indexOf(b.serviceName);

    if (orderA !== -1 || orderB !== -1) {
      if (orderA !== -1 && orderB !== -1) {
        return orderA - orderB; // Both are in preferred order
      }
      return orderA !== -1 ? -1 : 1; // One is in preferred order
    }

    // For services not in preferred list, sort by serviceName
    if (a.serviceName === b.serviceName) {
      return a.subProcessName.localeCompare(b.subProcessName); // Then by subProcessName
    }
    return a.serviceName.localeCompare(b.serviceName);
  });

  for (let i = 0; i < graphs.length; i++) {
    const graph = graphs[i];
    const nextGraph = graphs[i + 1] || null;

    // Adjust node and edge positions
    Object.values(graph.nodes).forEach((node) => {
      node.shiftPosition(currentXOffset, currentYOffset);
    });

    Object.values(graph.edges).forEach((edge) => {
      edge.shiftWaypoints(currentXOffset, currentYOffset);
    });

    // Recalculate bounds
    const bounds = graph.calculateBounds();
    maxWidth = Math.max(maxWidth, bounds.maxX - bounds.minX); // Update maxWidth

    if (nextGraph && graph.serviceName === nextGraph.serviceName) {
      // Same service but different subprocess, adjust Y offset
      currentYOffset = bounds.maxY + ySpacing;
    } else {
      // Different service, adjust X offset using the maxWidth of the previous service
      currentXOffset += maxWidth + xSpacing;
      maxWidth = 0; // Reset maxWidth for the next service
      currentYOffset = padding; // Reset Y offset
    }
  }
}
// ================================================================================
// Parse Graph
// ================================================================================
const parseViewType = (input) => {
  const normalizedInput = input.toLowerCase();

  switch (normalizedInput) {
    case 'contrast':
      return GraphViewType.CONTRAST;
    case 'single':
      return GraphViewType.SINGLE;
    default:
      console.error(`Unknown GraphViewType: ${input}`);
      return;
  }
};

export async function parseGraphs(graphData, handleNodeClick) {
  // const parser = new DOMParser();
  const graphs = [];

  // Assuming graphData is a single object with required properties
  const viewType = parseViewType(graphData.viewType);
  const graphType = graphData.graphType;
  const servicesData = graphData.data;
  const services = graphData.services;

  const subProcessPromises = [];

  for (const [serviceName, serviceSubProcesses] of Object.entries(servicesData)) {
    for (const [subProcessName, subProcessData] of Object.entries(serviceSubProcesses)) {
      const graphData = subProcessData.graphData;
      const logData = subProcessData.logData;

      if (graphType === 'BPMN') {
        const promise = BPMNGraph.createInstance(
          viewType,
          logData,
          serviceName,
          subProcessName,
          graphData,
          handleNodeClick
        ).then((graphDiagram) => {
          graphs.push(graphDiagram);
        });

        subProcessPromises.push(promise);
      }
      // Add other conditions for different graph types if needed
    }
  }
  // Await for all subprocess promises to be processed
  await Promise.all(subProcessPromises);

  // Identify missing services and create BlackBoxGraph for them
  const servicesInData = Object.keys(servicesData);
  const missingServices = services.filter((service) => !servicesInData.includes(service));

  missingServices.forEach((serviceName) => {
    const blackBoxGraph = new BlackBoxGraph(serviceName);
    graphs.push(blackBoxGraph);
  });

  // Finalize graph layout with all graphs
  finalizeGraphLayout(viewType, graphs);

  const links = createLinksFromLogData(viewType, graphs);

  return { viewType, graphs, links };
}

// ================================================================================
// Links
// ================================================================================

function parseLinkLog(log) {
  const parts = log.message.split(' - ');
  const logType = parts[0].split(' ')[1]; // 'API' or 'RabbitMQ'

  if (logType === 'API') {
    return {
      type: 'API',
      action: parts[1],
      sourceService: parts[2].split(': ')[1],
      destinationService: parts[3].split(': ')[1]
    };
  } else if (logType === 'RabbitMQ') {
    // Handle RabbitMQ logs
    const actionAndChannel = parts[1].match(/(Publish|Subscribe) "(.*?)"/);
    if (!actionAndChannel) {
      console.error('Invalid RabbitMQ log format:', log.message);
      return null; // Return null for invalid log format
    }

    return {
      type: 'RabbitMQ',
      action: actionAndChannel[1], // 'Publish' or 'Subscribe'
      channel: actionAndChannel[2] // The channel name
    };
  }

  return null; // for logs that do not match the expected format
}

function createLinksFromLogData(viewType, graphs) {
  const linkMap = {};

  graphs.forEach((graph) => {
    if (graph instanceof BPMNGraph) {
      Object.values(graph.nodes).forEach((node) => {
        if (node instanceof BPMNTask) {
          let logsToProcess = [];

          if (viewType === GraphViewType.CONTRAST) {
            if (node.in_A && !node.in_B) {
              logsToProcess = node.logs.A || [];
            } else if (!node.in_A && node.in_B) {
              logsToProcess = node.logs.B || [];
            } else if (node.in_A && node.in_B) {
              // // Compare A and B logs for consistency
              // if (JSON.stringify(node.logs.A) !== JSON.stringify(node.logs.B)) {
              //   console.error('Mismatch in A and B logs for node:', node);
              //   return; // Skip processing this node due to log inconsistency
              // }
              logsToProcess = node.logs.A || [];
            }
          } else {
            // In 'single' mode, use logs directly
            logsToProcess = node.logs;
          }

          logsToProcess.forEach((log) => {
            if (log.message && log.message.startsWith('[LINK]')) {
              const logDetails = parseLinkLog(log);
              if (!logDetails) return; // Skip logs that do not match the expected format

              let linkKey;

              if (logDetails.type === 'API') {
                // For API links, use a combination of source and destination services as the key
                linkKey = `${logDetails.sourceService}-${logDetails.destinationService}`;
              } else if (logDetails.type === 'RabbitMQ') {
                // For RabbitMQ, use the channel as the key and differentiate between Publish and Subscribe
                linkKey = `RabbitMQ-${logDetails.action}-${logDetails.channel}`;
              }

              if (!linkKey) return; // Skip if no valid key is generated

              if (!linkMap[linkKey]) {
                linkMap[linkKey] = [];
              }

              linkMap[linkKey].push({ node, ...logDetails });
            }
          });
        }
      });
    }
  });

  const links = [];
  const processedActions = new Set();

  Object.values(linkMap).forEach((linkNodes) => {
    linkNodes.forEach((linkNode) => {
      let source, target;

      if (linkNode.type === 'API') {
        // Check if a link with this action has already been processed
        if (processedActions.has(linkNode.action)) {
          return; // Skip this link as its action has already been handled
        }

        const sourceServiceMatch = linkNode.sourceService.match(/{(.*?)}/);
        const targetServiceMatch = linkNode.destinationService.match(/{(.*?)}/);

        const sourceService = sourceServiceMatch ? sourceServiceMatch[1] : null;
        const targetService = targetServiceMatch ? targetServiceMatch[1] : null;

        if (!sourceService || !targetService) {
          // Handle cases where service names are not found
          return;
        }

        // Check if the current node is the source or target
        if (linkNode.node.graphDiagram.serviceName === sourceService) {
          source = linkNode.node;
        } else if (linkNode.node.graphDiagram.serviceName === targetService) {
          target = linkNode.node;
        }

        // If the current node is not the source, find the source node
        if (!source) {
          source = findMatchingNode(linkNodes, sourceService, 'source', linkNode.action);
          if (!source) {
            source = findBlackBoxServiceNode(sourceService, graphs);
          }
        }

        // If the current node is not the target, find the target node
        if (!target) {
          target = findMatchingNode(linkNodes, targetService, 'target', linkNode.action);
          if (!target) {
            target = findBlackBoxServiceNode(targetService, graphs);
          }
        }

        if (source && target) {
          const sourceGraph = source.graphDiagram.id; // Assuming this is how you get the graph ID
          const targetGraph = target.graphDiagram.id; // Assuming this is how you get the graph ID

          const action = linkNode.action;
          const linkType = linkNode.type;

          const link = addLinkFromSourceToTarget(
            source,
            target,
            sourceGraph,
            targetGraph,
            linkType,
            action
          );
          // Add the created link to your links collection or perform additional operations
          links.push(link); // Assuming 'links' is your collection of links

          processedActions.add(linkNode.action);
        }
      } else if (linkNode.type === 'RabbitMQ') {
        // Handle RabbitMQ links
        if (linkNode.action === 'Publish') {
          // Find a corresponding Subscribe action within the same service
          let subscribeNode = linkNodes.find(
            (node) =>
              node.type === 'RabbitMQ' &&
              node.action === 'Subscribe' &&
              node.channel === linkNode.channel
          );

          if (!subscribeNode) {
            // If no matching Subscribe action, try finding in other services
            for (const otherLinkNodes of Object.values(linkMap)) {
              const potentialSubscribeNode = otherLinkNodes.find(
                (node) =>
                  node.type === 'RabbitMQ' &&
                  node.action === 'Subscribe' &&
                  node.channel === linkNode.channel
              );
              if (potentialSubscribeNode) {
                subscribeNode = potentialSubscribeNode;
                break;
              }
            }
          }

          // console.log(linkMap);

          if (!subscribeNode) return; // If no matching Subscribe action, disregard the link

          source = linkNode.node;
          target = subscribeNode.node;
        } else {
          // For Subscribe actions, corresponding Publish action will handle link creation
          return;
        }

        if (!source || !target) return; // If either source or target is missing, disregard the link

        // Rest of the logic for creating the link remains the same
        const sourceGraph = source.graphDiagram.id;
        const targetGraph = target.graphDiagram.id;
        const action = linkNode.action;
        const linkType = linkNode.type;

        const link = addLinkFromSourceToTarget(
          source,
          target,
          sourceGraph,
          targetGraph,
          linkType,
          action
        );
        links.push(link);
        processedActions.add(linkNode.action);
      }
    });
  });

  return links;
}

function findMatchingNode(linkNodes, serviceName, role, action) {
  return linkNodes.find((node) => {
    const isMatchingService = node.node.graphDiagram.serviceName === serviceName;
    const isMatchingAction = node.action === action;
    return role === 'source' ? isMatchingService && isMatchingAction : isMatchingService;
  })?.node;
}

function findBlackBoxServiceNode(serviceName, graphs) {
  for (const graph of graphs) {
    if (graph instanceof BlackBoxGraph && graph.serviceName === serviceName) {
      return graph.nodes['blackBoxNode'];
    }
  }
  return null; // Return null if no matching black box service is found
}

const addLinkFromSourceToTarget = (
  sourceTask,
  targetTask,
  sourceGraph,
  targetGraph,
  linkType,
  action
) => {
  const sourceBounds = sourceTask.getScaledBounds();
  const targetBounds = targetTask.getScaledBounds();
  const waypoints = createStraightLineWaypoints(sourceBounds, targetBounds);

  const id = `link_${sourceTask.id}_${targetTask.id}`;

  let link;

  link = new GraphLink(
    id,
    sourceTask.id,
    targetTask.id,
    sourceGraph,
    targetGraph,
    linkType,
    action,
    waypoints
  );
  return link;
};

const createStraightLineWaypoints = (sourceBounds, targetBounds) => {
  const sourceCenter = [
    sourceBounds.x + sourceBounds.width / 2,
    sourceBounds.y + sourceBounds.height / 2
  ];

  const targetCenter = [
    targetBounds.x + targetBounds.width / 2,
    targetBounds.y + targetBounds.height / 2
  ];

  return [sourceCenter, targetCenter];
};
