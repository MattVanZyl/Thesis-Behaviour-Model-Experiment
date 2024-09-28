import * as d3 from 'd3';

function addPadding(points, padding) {
  const centroid = [d3.mean(points, (d) => d[0]), d3.mean(points, (d) => d[1])];
  return points.map((point) => [
    centroid[0] + (point[0] - centroid[0]) * (1 + padding),
    centroid[1] + (point[1] - centroid[1]) * (1 + padding)
  ]);
}

function getBoundingBox(points) {
  const xMin = d3.min(points, (d) => d[0]);
  const xMax = d3.max(points, (d) => d[0]);
  const yMin = d3.min(points, (d) => d[1]);
  const yMax = d3.max(points, (d) => d[1]);
  const padding = 10; // Adjust as needed

  return [
    [xMin - padding, yMin - padding],
    [xMax + padding, yMin - padding],
    [xMax + padding, yMax + padding],
    [xMin - padding, yMax + padding]
  ];
}

export function pointsInStraightLine(points, threshold = 30) {
  let sumX = 0,
    sumY = 0,
    sumXY = 0,
    sumXX = 0,
    n = points.length;

  // Calculate sums needed for linear regression
  for (let i = 0; i < n; i++) {
    sumX += points[i][0];
    sumY += points[i][1];
    sumXY += points[i][0] * points[i][1];
    sumXX += points[i][0] * points[i][0];
  }

  // Calculate slope (m) and intercept (c) for y = mx + c
  const m = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  const c = (sumY - m * sumX) / n;

  // Calculate residuals and check if they're within the threshold
  for (let i = 0; i < n; i++) {
    const residual = Math.abs(points[i][1] - (m * points[i][0] + c));
    if (residual > threshold) {
      return false;
    }
  }

  return true;
}

function getRotatedBoundingBox(points, threshold) {
  const m = calculateSlope(points);
  const angle = Math.atan(m);
  const [centroid_x, centroid_y] = calculateCentroid(points);

  let min_x_rot = Infinity,
    max_x_rot = -Infinity;
  let min_y_rot = Infinity,
    max_y_rot = -Infinity;

  for (const [x, y] of points) {
    const x_translated = x - centroid_x;
    const y_translated = y - centroid_y;
    const x_rot = x_translated * Math.cos(-angle) - y_translated * Math.sin(-angle);
    const y_rot = x_translated * Math.sin(-angle) + y_translated * Math.cos(-angle);

    min_x_rot = Math.min(min_x_rot, x_rot);
    max_x_rot = Math.max(max_x_rot, x_rot);
    min_y_rot = Math.min(min_y_rot, y_rot);
    max_y_rot = Math.max(max_y_rot, y_rot);
  }

  const width = max_x_rot - min_x_rot + threshold;
  const height = max_y_rot - min_y_rot + threshold;

  const min_x = min_x_rot - threshold / 2;
  const max_x = max_x_rot + threshold / 2;
  const min_y = min_y_rot - threshold / 2;
  const max_y = max_y_rot + threshold / 2;

  let corners = [
    [min_x, min_y],
    [max_x, min_y],
    [max_x, max_y],
    [min_x, max_y]
  ];

  for (let i = 0; i < corners.length; i++) {
    let [x_rot, y_rot] = corners[i];
    corners[i] = [
      x_rot * Math.cos(angle) - y_rot * Math.sin(angle) + centroid_x,
      x_rot * Math.sin(angle) + y_rot * Math.cos(angle) + centroid_y
    ];
  }

  return corners;
}

function calculateCentroid(points) {
  let sum_x = 0;
  let sum_y = 0;
  const n = points.length;

  for (const [x, y] of points) {
    sum_x += x;
    sum_y += y;
  }

  return [sum_x / n, sum_y / n];
}

function calculateSlope(points) {
  const n = points.length;
  let sumX = 0,
    sumY = 0,
    sumXY = 0,
    sumX2 = 0;

  for (const [x, y] of points) {
    sumX += x;
    sumY += y;
    sumXY += x * y;
    sumX2 += x * x;
  }

  const m = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX ** 2);
  return m;
}

//================================================================================================

// Credit: Sylvain Lesage
// https://observablehq.com/@severo/graham-scan-algorithm?collection=@severo/algorithms
function grahamScanAlgorithm(points) {
  const getSlope = (p1, p2) => (p1[0] === p2[0] ? +Infinity : (p1[1] - p2[1]) / (p1[0] - p2[0]));

  const getCrossProduct = (p1, p2, p3) =>
    (p2[0] - p1[0]) * (p3[1] - p1[1]) - (p2[1] - p1[1]) * (p3[0] - p1[0]);

  const start = [...points].sort((a, b) => a[0] - b[0] || a[1] - b[1])[0];

  const sortedPoints = [...points].sort(
    (a, b) => getSlope(a, start) - getSlope(b, start) || b[1] - a[1] || a[0] - b[0]
  );

  const hull = [];
  for (const p of sortedPoints) {
    hull.push(p);
    while (
      hull.length > 2 &&
      getCrossProduct(hull[hull.length - 3], hull[hull.length - 2], hull[hull.length - 1]) <= 0
    ) {
      hull.splice(-2, 1);
    }
  }
  return hull;
}

// Credit: https://www.gorillasun.de/blog/an-algorithm-for-polygons-with-rounded-corners/
function drawRoundedPolygon(g, points, r) {
  const pathData = [];

  for (let i = 0; i < points.length; i++) {
    const a = points[i];
    const b = points[(i + 1) % points.length];
    const c = points[(i + 2) % points.length];
    const ba = { x: a[0] - b[0], y: a[1] - b[1] };
    const bc = { x: c[0] - b[0], y: c[1] - b[1] };

    // Normalize vectors
    const normBa = Math.sqrt(ba.x * ba.x + ba.y * ba.y);
    const normBc = Math.sqrt(bc.x * bc.x + bc.y * bc.y);
    ba.x /= normBa;
    ba.y /= normBa;
    bc.x /= normBc;
    bc.y /= normBc;

    // Points in the direction the corner is accelerating towards
    const normal = { x: ba.x + bc.x, y: ba.y + bc.y };
    const normNormal = Math.sqrt(normal.x * normal.x + normal.y * normal.y);
    normal.x /= normNormal;
    normal.y /= normNormal;

    // Shortest angle between the two edges
    const dotProduct = ba.x * bc.x + ba.y * bc.y;
    const theta = Math.acos(dotProduct);

    // Calculate maximum possible radius for the corner
    const aDistB = Math.sqrt(Math.pow(a[0] - b[0], 2) + Math.pow(a[1] - b[1], 2));
    const cDistB = Math.sqrt(Math.pow(c[0] - b[0], 2) + Math.pow(c[1] - b[1], 2));
    const maxR = (Math.min(aDistB, cDistB) / 2) * Math.abs(Math.sin(theta / 2));
    const cornerR = Math.min(r, maxR);

    // Calculate control points for the Bezier curve
    const distance = Math.abs(cornerR / Math.sin(theta / 2));
    const c1 = [b[0] + ba.x * distance, b[1] + ba.y * distance];
    const c2 = [b[0] + bc.x * distance, b[1] + bc.y * distance];
    const bezierDist = 0.5523;
    const p1 = [c1[0] - ba.x * 2 * cornerR * bezierDist, c1[1] - ba.y * 2 * cornerR * bezierDist];
    const p2 = [c2[0] - bc.x * 2 * cornerR * bezierDist, c2[1] - bc.y * 2 * cornerR * bezierDist];

    pathData.push(`L ${c1[0]} ${c1[1]}`);
    pathData.push(`C ${p1[0]} ${p1[1]}, ${p2[0]} ${p2[1]}, ${c2[0]} ${c2[1]}`);
  }

  // Close the path explicitly
  pathData.push('Z');

  // Remove the first 'L' to start the path correctly
  pathData[0] = `M ${pathData[0].substring(2)}`;

  return pathData;
}

//================================================================================================
//================================================================================================

export function drawConvexHull(
  g,
  nodes,
  name,
  color,
  strokeWidth = 4,
  strokeOpacity = 0.5,
  fillOpacity = 0.2,
  scaleFactor = 1,
  r = 0,
  drawCircles = false,
  fontSize = '46px'
) {
  // Extract x and y coordinates from nodes' bounding boxes

  let points = nodes.map((node) => {
    const { x, y, width, height } = node.getScaledBounds();
    return [x + width / 2, y + height / 2];
  });

  let hull;
  const threshold = 50; // Adjust as needed

  if (points.length === 1) {
    hull = getBoundingBox(points);
  } else if (pointsInStraightLine(points, threshold)) {
    hull = getRotatedBoundingBox(points, threshold);
  } else {
    let paddedPoints = addPadding(points, 0.075);
    hull = grahamScanAlgorithm(paddedPoints);
  }

  // Calculate the centroid of the hull
  const centroid = [d3.mean(hull, (d) => d[0]), d3.mean(hull, (d) => d[1])];

  // Scale the hull points from the centroid
  const scaledHull = hull.map((point) => [
    centroid[0] + scaleFactor * (point[0] - centroid[0]),
    centroid[1] + scaleFactor * (point[1] - centroid[1])
  ]);

  const hullGroup = g.append('g').attr('class', 'hull').lower();

  if (drawCircles) {
    // Draw circles at each hull point
    hullGroup
      .selectAll(null)
      .data(points)
      .enter()
      .append('circle')
      .attr('cx', (d) => d[0])
      .attr('cy', (d) => d[1])
      .attr('r', 20)
      .attr('fill', color)
      .attr('fill-opacity', 0.5);
  }
  // .attr("fill-opacity", fillOpacity);

  // Draw the rounded polygon
  const pathData = drawRoundedPolygon(g, scaledHull, r);

  // Find the highest point in the hull
  const highestPoint = Math.min(...scaledHull.map((point) => point[1]));
  // Fixed distance above the highest point
  const textDistanceAbove = 70; // Adjust this value as needed

  hullGroup
    .append('text')
    .attr('x', centroid[0])
    .attr('y', highestPoint - textDistanceAbove)
    .attr('text-anchor', 'middle')
    .attr('font-size', fontSize)
    .attr('fill', color)
    .text(name);

  // Draw the rounded polygon
  hullGroup
    .append('path')
    .attr('d', pathData.join(' '))
    .attr('stroke', color)
    .attr('stroke-width', strokeWidth)
    .attr('stroke-opacity', strokeOpacity)
    .attr('fill', color)
    .attr('fill-opacity', fillOpacity);

  return hullGroup;
}

export function drawSquare(
  g,
  nodes,
  name,
  color,
  strokeWidth = 4,
  strokeOpacity = 0.5,
  fontSize = '46px',
  padding = 250 // Default padding value
) {
  // Determine the bounding box for the nodes
  let minX = Infinity,
    maxX = -Infinity,
    minY = Infinity,
    maxY = -Infinity;

  nodes.forEach((node) => {
    const { x, y, width, height } = node.getScaledBounds();
    minX = Math.min(minX, x);
    maxX = Math.max(maxX, x + width);
    minY = Math.min(minY, y);
    maxY = Math.max(maxY, y + height);
  });

  // Apply padding
  minX -= padding;
  maxX += padding;
  minY -= padding;
  maxY += padding;

  // Create the rectangle
  const squareGroup = g.append('g').attr('class', 'hull');
  squareGroup
    .append('line') // Add a line instead of a rectangle
    .attr('x1', minX) // Start x-coordinate
    .attr('y1', minY) // Start y-coordinate (top of the rectangle)
    .attr('x2', maxX) // End x-coordinate
    .attr('y2', minY) // End y-coordinate (same as start to make it horizontal)
    .attr('stroke', color)
    .attr('stroke-width', strokeWidth)
    .attr('stroke-opacity', 1);

  squareGroup
    .append('rect')
    .attr('x', minX)
    .attr('y', minY)
    .attr('width', maxX - minX)
    .attr('height', maxY - minY)
    // .attr('stroke', color)
    // .attr('stroke-width', strokeWidth)
    // .attr('stroke-opacity', 1)
    .attr('opacity', strokeOpacity)
    .attr('fill', color)
    .lower(); // No fill for the rectangle

  // Place the label
  const textX = (minX + maxX) / 2;
  const textY = minY - 150; // Adjust label position above the rectangle

  squareGroup
    .append('text')
    .attr('x', textX)
    .attr('y', textY)
    .attr('text-anchor', 'middle')
    .attr('font-size', fontSize)
    .attr('fill', color)
    .text(name);

  return squareGroup;
}
