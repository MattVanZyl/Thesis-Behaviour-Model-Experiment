import React, { useState } from "react";
import axios from "axios";
import { LogUploader } from "./LogUploader";

export const ModellerTab = () => {
  const [logFiles, setLogFiles] = useState([]);

  const regexPattern =
    "(?P<timestamp>\\d{4}-\\d{2}-\\d{2} \\d{2}:\\d{2}:\\d{2}\\.\\d{3}000) (?P<level>[A-Z]+) (?P<pid>\\d+) \\s*---\\s* (?:\\[(?P<task>[^\\]]+)\\])? \\s*---\\s* \\[(?P<thread>[^\\]]+)\\] (?P<logger_name>[^ ]+) \\((?P<file>[^:]+):(?P<line_number>\\d+)\\) \\s*-\\s* (?:\\[(?P<user>[^\\]]+)\\])? \\s*:\\s* (?P<message>.*)";

  const uploadData = () => {
    const formData = new FormData();
    formData.append("regex_pattern", regexPattern);
    logFiles.forEach((file, index) => {
      formData.append(`logs[${index}][name]`, file.name);
      formData.append(`logs[${index}][data]`, file.data);
    });
    axios
      .post("http://localhost:5000/process-data", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        responseType: "blob", // to handle the file as a binary
      })
      .then((response) => {
        console.log(response);
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", "logging_model.gz");
        document.body.appendChild(link);
        link.click();
      })
      .catch((error) => {
        console.error(error);
      });
  };

  return (
    <div>
      <LogUploader onFilesLoaded={setLogFiles} />
      <button onClick={uploadData}>Upload</button>
    </div>
  );
};
