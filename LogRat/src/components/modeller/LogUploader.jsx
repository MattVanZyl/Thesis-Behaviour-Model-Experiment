import React, { useState } from "react";

export const LogUploader = ({ onFilesLoaded }) => {
  const [selectedFiles, setSelectedFiles] = useState([]);

  const handleChange = (event) => {
    const files = Array.from(event.target.files);

    if (files.length) {
      setSelectedFiles(files);
      const readers = files.map((file) => {
        return new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = (e) =>
            resolve({ name: file.name, data: e.target.result });
          reader.readAsText(file);
        });
      });
      Promise.all(readers).then((fileDatas) => onFilesLoaded(fileDatas));
    }
  };

  return (
    <div>
      <input type="file" accept=".log" onChange={handleChange} multiple />
      {selectedFiles.length > 0 && (
        <p>
          Selected files: {selectedFiles.map((file) => file.name).join(", ")}
        </p>
      )}
    </div>
  );
};
