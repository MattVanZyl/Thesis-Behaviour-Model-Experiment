import React, { useState, useEffect } from 'react';
import { GraphVisualiser } from './GraphVisualiser';
import { Uploader } from '../uploader/Uploader';
import { NodeDetailsPanel } from './NodeDetailsPanel';
import { SequenceDiagram } from './SequenceDiagram';
import SettingsPanel from '../settings/SettingPanel';

export const ViewerRoot = ({ lightMode, toggleLightMode }) => {
  const [graphData, setGraphData] = useState(null);

  return (
    <div className="viewer">
      <div className="header-container">
        <Uploader setModelData={setGraphData} />
        {/* <SettingsPanel lightMode={lightMode} toggleLightMode={toggleLightMode} /> */}
      </div>
      <div className="viewer-container">
        <GraphVisualiser lightMode={lightMode} graphData={graphData} />
      </div>
      {/* <div className="viewer-container">
        <SequenceDiagram processedLogData={processedLogData} />
      </div> */}
    </div>
  );
};
