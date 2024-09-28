import React from 'react';
import { getGradientStepInfo } from '../../../../config/gradientsConfig';
import GraphSelection from '../../../../enums/GraphSelection';

export const SteppedColorGradient = ({ graphSelection, graphDetails }) => {
  let min = 1; // Default min value
  let max = 1; // Default max value

  console.log(graphDetails);
  switch (graphSelection) {
    case GraphSelection.SINGLE:
      max = graphDetails.maxCount;
      break;

    case GraphSelection.GRAPH_A:
      max = graphDetails.maxCountA;
      break;

    case GraphSelection.GRAPH_B:
      max = graphDetails.maxCountB;
      break;

    case GraphSelection.BOTH:
      min = Math.min(graphDetails.minCountDifference, -1);
      max = Math.max(graphDetails.maxCountDifference, 1);
      break;

    default:
      console.error('Unknown graph selection type');
      break;
  }

  const steps = 10; // Number of gradient steps

  const gradientSteps = getGradientStepInfo(min, max, steps, graphSelection);

  return (
    <div className="legend-section">
      <div className="legend-section-title">
        <strong>Log Count</strong>
      </div>
      <div className="gradient-bar" style={{ position: 'relative', height: '20px' }}>
        {gradientSteps.map((step, index) => (
          <div
            key={index}
            style={{
              display: 'inline-block',
              width: `${100 / steps - 1}%`,
              backgroundColor: step.color,
              height: '100%'
            }}
          />
        ))}
      </div>
      <div
        style={{ textAlign: 'center', marginTop: '5px', fontSize: '0.7em', position: 'relative' }}>
        {gradientSteps.map((step, index) => (
          <React.Fragment key={index}>
            <span
              style={{
                position: 'absolute',
                left: `${(index / steps) * 100}%`,
                transform: 'translateX(-100%)' // Center align the label
              }}>
              {step.value.toFixed(0)}
            </span>
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};
