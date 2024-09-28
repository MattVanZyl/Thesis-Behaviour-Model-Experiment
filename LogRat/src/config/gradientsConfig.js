import * as d3 from 'd3';
import GraphSelection from '../enums/GraphSelection';

// const getColorFromCSS = (varName) => {
//   let color = getComputedStyle(document.documentElement).getPropertyValue(varName);
//   return color.trim(); // Trim to remove any leading/trailing spaces
// };

// let contrastColors = {
//   A: getColorFromCSS('--graph-contrast-color-A'),
//   B: getColorFromCSS('--graph-contrast-color-B'),
//   Both: getColorFromCSS('--color-count-contrast-mid')
// };

// export const getContrastColor = (type) => {
//   return contrastColors[type];
// };

const steps = 10;

// Shared color scale with custom hex colors
const customColorScale = () => {
  return d3
    .scaleLinear()
    .domain([0, 1 / 6, 2 / 6, 3 / 6, 4 / 6, 5 / 6, 1])
    .range([
      '#1f4cff', // Blue
      '#61d1ff', // Sky Blue
      '#00ffe5', // Cyan
      '#4af507', // Green
      '#FFFF00', // Yellow
      '#ff9a0d', // Orange
      '#ff2121' // Red
    ]);
};

const customBothColorScale = (min, max) => {
  return d3.scaleLinear().domain([min, 0, max]).range(['#0000FF', '#FFFFFF', '#FF0000']); // Blue to White to Red
};

/**
 * Generates a rainbow color gradient.
 * @param {number} steps - Number of steps in the gradient.
 * @returns {string[]} An array of color strings for the gradient.
 */
const generateColorGradient = (steps) => {
  const colorScale = customColorScale();
  return Array.from({ length: steps }, (_, i) => colorScale(i / (steps - 1)));
};

/**
 * Gets the color for a count value based on a rainbow gradient.
 * @param {GraphSelection} graphSelection - The graph selection type.
 * @param {number} count - The count value.
 * @param {number} min - The minimum count value.
 * @param {number} max - The maximum count value.
 * @returns {string} The color corresponding to the count.
 */
export const getCountColor = ({ graphSelection, count, min, max }) => {
  // Gray color for untraversed nodes in SINGLE mode
  if (graphSelection === GraphSelection.SINGLE && count === 0) {
    return 'gray';
  }

  let colorScale;

  if (graphSelection === GraphSelection.BOTH) {
    // Special scale for BOTH mode
    const bothColors = getGradientStepInfo(min, max, steps, GraphSelection.BOTH).map(
      (info) => info.color
    );
    colorScale = d3.scaleQuantize().domain([min, max]).range(bothColors);
  } else {
    // Original rainbow gradient for other modes
    const rainbowColors = generateColorGradient(steps);
    colorScale = d3.scaleQuantize().domain([min, max]).range(rainbowColors);
  }

  return colorScale(count);
};

export const getGradientStepInfo = (min, max, steps, graphSelection) => {
  let colorScale;

  if (graphSelection === GraphSelection.BOTH) {
    colorScale = customBothColorScale(min, max);

    const stepValues = [];
    const totalSteps = steps - 1; // Adjust for an even distribution around 0
    const negativeStepSize = Math.abs(min) / (totalSteps / 2);
    const positiveStepSize = max / (totalSteps / 2);

    // Calculate negative steps (excluding zero)
    for (let i = 0; i < totalSteps / 2; i++) {
      stepValues.push(min + i * negativeStepSize);
    }

    // Add zero once
    stepValues.push(0);

    // Calculate positive steps (excluding max)
    for (let i = 1; i < totalSteps / 2; i++) {
      stepValues.push(i * positiveStepSize);
    }

    // Add max at the end
    stepValues.push(max);

    return stepValues.map((value) => {
      return {
        color: colorScale(value),
        value: value
      };
    });
  } else {
    colorScale = customColorScale(); // Your existing scale function
    const stepScale = d3
      .scaleLinear()
      .domain([0, steps - 1])
      .range([min, max]);

    return Array.from({ length: steps + 1 }, (_, i) => ({
      color: colorScale(i / steps),
      value: stepScale(i)
    }));
  }
};
