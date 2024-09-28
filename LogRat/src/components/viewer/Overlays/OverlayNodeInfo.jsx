import React, { useState } from 'react';

export const OverlayNodeInfo = ({ selectedNode }) => {
  const [isContentExpanded, setIsContentExpanded] = useState(true);

  return (
    <div className="ui-padding ui-border overlay-element">
      <div onClick={() => setIsContentExpanded(!isContentExpanded)}>
        <span>{isContentExpanded ? '▼' : '▶'}&#9;</span>
        <strong>Node Selection</strong>
      </div>
      <div className={`options-container ${isContentExpanded ? '' : 'hidden'}`}>
        {selectedNode && (
          <>
            <div className="node-name">
              <strong>Name:</strong> {selectedNode.name}
            </div>
            <div className="static-log-details">
              <div>
                <strong>Process:</strong> {selectedNode.logs_A[0]?.process}
              </div>
              <div>
                <strong>Subprocess:</strong> {selectedNode.logs_A[0]?.subprocess}
              </div>
              <div>
                <strong>Class:</strong> {selectedNode.logs_A[0]?.class}
              </div>
              <div>
                <strong>Method:</strong> {selectedNode.logs_A[0]?.method}
              </div>
              <div>
                <strong>File:</strong> {selectedNode.logs_A[0]?.file}
              </div>
              <div>
                <strong>Line:</strong> {selectedNode.logs_A[0]?.line}
              </div>
              <div>
                <strong>User:</strong> {selectedNode.logs_A[0]?.user}
              </div>
              <div>
                <strong>Service:</strong> {selectedNode.logs_A[0]?.service}
              </div>
            </div>
            <hr />
            <ul style={{ listStyleType: 'none', padding: 0 }}>
              {selectedNode.logs_A.map((log, index) => (
                <li key={index} style={{ marginBottom: '1em' }}>
                  <div>
                    <strong>Message:</strong> {log.message}
                  </div>
                  <div>
                    <strong>Thread:</strong> {log.thread}
                  </div>
                  <div>
                    <strong>PID:</strong> {log.pid}
                  </div>
                  <div>
                    <strong>ID:</strong> {log.id}
                  </div>
                  {index !== selectedNode.logs_A.length - 1 && <hr />}
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </div>
  );
};
