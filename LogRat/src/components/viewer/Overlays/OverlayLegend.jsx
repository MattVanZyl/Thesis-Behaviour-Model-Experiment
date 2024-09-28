import { useState } from 'react';
import { levelColors, fadedLevelColors, allLogLevels } from '../../../config/logLevelConfig';
// import { getLegendGradientInfo, getTraversalColor } from '../../../config/gradientsConfig';
import { BPMNNotation } from './notation/bpmn/BPMNNotation';
import { SteppedColorGradient } from './legend/SteppedColourGradient';

import GraphSelection from '../../../enums/GraphSelection';

export const OverlayLegend = ({
  drawOptions,
  graphSelection,
  setLegendOptions,
  legendOptions,
  graphDetails
}) => {
  const [isLegendExpanded, setIsLegendExpanded] = useState(true);
  const [isNotationExpanded, setIsNotationExpanded] = useState(true);

  const toggleActiveLevel = (level) => {
    setLegendOptions((prevState) => ({
      activeLevels: prevState.activeLevels.includes(level)
        ? prevState.activeLevels.filter((l) => l !== level)
        : [...prevState.activeLevels, level]
    }));
  };

  return (
    <div className="ui-padding ui-border overlay-element">
      <div className="overlay-heading" onClick={() => setIsLegendExpanded(!isLegendExpanded)}>
        <span>{isLegendExpanded ? '▼' : '▶'}&#9;</span>
        <strong>Legend</strong>
      </div>

      <div className={`options-container ${isLegendExpanded ? '' : 'hidden'}`}>
        {/* <div className="legend-section">
          <div
            className="legend-section-title"
            onClick={() => setIsNotationExpanded(!isNotationExpanded)}>
            <span>{isNotationExpanded ? '▼' : '▶'}&#9;</span>
            <strong>Notation</strong>
          </div>
          {isNotationExpanded && (
            <div className="notation-content">
              <BPMNNotation isLegendExpanded={isLegendExpanded} />
            </div>
          )}
        </div> */}

        <div
          className="legend-section"
          style={{ display: drawOptions.showLogLevels && isLegendExpanded ? 'block' : 'none' }}>
          {drawOptions.showLogLevels && (
            <>
              <div className="legend-section-title">
                <strong>Log Levels</strong>
              </div>
              {allLogLevels.map((level) => {
                const isActiveLevel = legendOptions.activeLevels.includes(level);
                const colorToUse = isActiveLevel ? levelColors[level] : fadedLevelColors[level];
                return (
                  <div
                    key={level}
                    style={{ display: 'flex', alignItems: 'center' }}
                    onClick={() => toggleActiveLevel(level)}>
                    <div
                      style={{ backgroundColor: colorToUse, width: '30px', height: '7px' }}></div>
                    <div
                      style={{ color: isActiveLevel ? '#2b2b2b' : '#9e9e9e', marginLeft: '5px' }}>
                      {level}
                    </div>
                  </div>
                );
              })}
            </>
          )}
        </div>

        {/* New section for displaying colors when 'Difference' is active */}
        {graphSelection === GraphSelection.BOTH && drawOptions.showStructureDifference && (
          <div className="legend-section">
            <div className="legend-section-title">
              <strong>Structural difference between graphs</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <div className="legend-difference-A">
                <svg width="100%" height="100%">
                  <text x="50%" y="50%" className="legend-text">
                    Only in A
                  </text>
                </svg>
              </div>

              <div className="legend-difference-Both">
                <svg width="100%" height="100%">
                  <text x="50%" y="50%" className="legend-text">
                    In Both
                  </text>
                </svg>
              </div>
              <div className="legend-difference-B">
                <svg width="100%" height="100%">
                  <text x="50%" y="50%" className="legend-text">
                    Only in B
                  </text>
                </svg>
              </div>
            </div>
          </div>
        )}

        {graphSelection !== GraphSelection.NONE && drawOptions.showCountGradient && (
          <SteppedColorGradient graphSelection={graphSelection} graphDetails={graphDetails} />
        )}
      </div>
    </div>
  );
};
