import { useState, useRef } from 'react';
import PropTypes from 'prop-types';

export const Uploader = ({ setModelData: setGraphData }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const fileInputRef = useRef(null); // Ref for the file input

  const handleChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();

      reader.onload = (e) => {
        try {
          const jsonData = JSON.parse(e.target.result);
          setGraphData(jsonData);
          console.log('File read and parsed');
        } catch (error) {
          console.error('Failed to parse JSON:', error);
        }
      };

      reader.readAsText(file); // Read as text for JSON parsing
      event.target.value = null; // Reset input value
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current.click(); // Trigger file input click
  };

  return (
    <div className="uploader-container">
      <div className="ui-padding ui-border header-element">
        <p className="title-text" style={{ textAlign: 'left' }}>
          Visualisation File
        </p>
        <div className="upload-info">
          <button onClick={handleButtonClick} className="custom-upload-button">
            Upload
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleChange}
            style={{ display: 'none' }}
          />
          {selectedFile && <p>{selectedFile.name}</p>}
        </div>
      </div>
    </div>
  );
};

Uploader.propTypes = {
  setModelData: PropTypes.func.isRequired
};
