import React, { useState, useEffect } from 'react';
import './App.css';
import './styles/viewer.css';
import './styles/utility.css';
import './styles/header.css';
import './styles/overlays.css';
import './styles/graph.css';
import { ViewerRoot } from './components/viewer/ViewerRoot';

function App() {
  const [lightMode, setLightMode] = useState(
    () => JSON.parse(localStorage.getItem('lightMode')) || false
  );

  useEffect(() => {
    localStorage.setItem('lightMode', JSON.stringify(lightMode));

    if (lightMode) {
      document.body.classList.add('light-theme');
    } else {
      document.body.classList.remove('light-theme');
    }
  }, [lightMode]);

  const toggleLightMode = () => setLightMode((prevMode) => !prevMode);

  return (
    <div className="App">
      <g className="title">
        <h1>LogRat!</h1>
        <a target="_blank">
          <img src="lograt.svg" className="logo" alt="LogRat logo" />
        </a>
      </g>
      <ViewerRoot lightMode={lightMode} toggleLightMode={toggleLightMode} />
    </div>
  );
}

export default App;
