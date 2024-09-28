import PropTypes from 'prop-types';

import GraphSelection from '../../../enums/GraphSelection';
import GraphViewType from '../../../enums/GraphViewType';

export const OverlayGraphSelection = ({ graphViewType, graphSelection, setGraphSelection }) => {
  if (graphViewType === GraphViewType.CONTRAST) {
    return (
      <div className="ui-padding ui-border overlay-element">
        <div className="overlay-heading">
          <strong>Graph Selection</strong>
        </div>
        <div className="options-container">
          <div className="radio-container">
            <input
              type="radio"
              id="graphA"
              name="graphSelection"
              checked={graphSelection === GraphSelection.GRAPH_A}
              onChange={() => setGraphSelection(GraphSelection.GRAPH_A)}
            />
            <label htmlFor="graphA">Graph A &quot;Expected&quot;</label>
          </div>
          <div className="radio-container">
            <input
              type="radio"
              id="graphB"
              name="graphSelection"
              checked={graphSelection === GraphSelection.GRAPH_B}
              onChange={() => setGraphSelection(GraphSelection.GRAPH_B)}
            />
            <label htmlFor="graphB">Graph B &quot;Faulty&quot;</label>
          </div>
          {/* <div className="radio-container">
            <input
              type="radio"
              id="both"
              name="graphSelection"
              checked={graphSelection === GraphSelection.BOTH}
              onChange={() => setGraphSelection(GraphSelection.BOTH)}
            />
            <label htmlFor="both">Both</label>
          </div> */}
        </div>
      </div>
    );
  } else if (graphViewType === GraphViewType.SINGLE) {
    return (
      <div className="ui-padding ui-border overlay-element">
        <div className="overlay-heading">
          <strong>Graph Selection</strong>
        </div>
        <div className="options-container">
          <div className="radio-container">
            <input type="radio" id="single" name="graphSelection" checked readOnly />
            <label htmlFor="single">Single Graph View</label>
          </div>
        </div>
      </div>
    );
  }

  // Return null to render nothing for other graphViewTypes
  return null;
};

OverlayGraphSelection.propTypes = {
  graphViewType: PropTypes.oneOf(Object.values(GraphViewType)).isRequired,
  graphSelection: PropTypes.oneOf(Object.values(GraphSelection)).isRequired,
  setGraphSelection: PropTypes.func.isRequired
};
