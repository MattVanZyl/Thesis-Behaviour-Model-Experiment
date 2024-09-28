export const NodeDetailsPanel = ({ selectedNode }) => {
  // If no node is selected, return an appropriate message
  if (!selectedNode) {
    return (
      <div className="node-details-panel">
        <div style={{ padding: "1em" }}>No node selected</div>
      </div>
    );
  }

  return (
    <div className="node-details-panel">
      <div style={{ padding: "1em" }}>
        <h2>{selectedNode.name}</h2>
        <ul
          style={{ textAlign: "left", listStyleType: "none", paddingLeft: 0 }}
        >
          {selectedNode.logs.map((log, index) => (
            <li key={index} style={{ marginBottom: "1em" }}>
              <div>
                <strong>Timestamp:</strong> {log.timestamp}
              </div>
              <div>
                <strong>Level:</strong> {log.level}
              </div>
              <div>
                <strong>PID:</strong> {log.pid}
              </div>
              <div>
                <strong>Task:</strong> {log.task}
              </div>
              <div>
                <strong>Thread:</strong> {log.thread}
              </div>
              <div>
                <strong>Logger Name:</strong> {log.logger_name}
              </div>
              <div>
                <strong>Service:</strong> {log.service}
              </div>
              <div>
                <strong>Message:</strong> {log.message}
              </div>
              {/* Add more fields as required */}
              {index !== selectedNode.logs.length - 1 && <hr />}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};
