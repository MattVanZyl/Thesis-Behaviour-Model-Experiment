// OverlayControls.jsx

import React, { useState } from 'react';
import GraphSelection from '../../../enums/GraphSelection';

const download = (svgNode, scaleFactor = 10) => {
  // Default scaleFactor set to 10
  if (!svgNode) {
    console.error('SVG node is not available.');
    return;
  }

  // Clone the SVG node to avoid modifying the original
  const clonedSvgNode = svgNode.cloneNode(true);

  // Function to embed all relevant CSS styles into the cloned SVG
  const embedStyles = (clonedSvg) => {
    const styleSheets = Array.from(document.styleSheets);
    let cssText = '';

    styleSheets.forEach((styleSheet) => {
      try {
        // Some stylesheets may be cross-origin and not accessible
        const rules = Array.from(styleSheet.cssRules);
        rules.forEach((rule) => {
          cssText += rule.cssText + '\n';
        });
      } catch (e) {
        console.warn('Could not access stylesheet:', styleSheet.href, e);
      }
    });

    // Create a <style> element
    const styleElement = document.createElementNS('http://www.w3.org/2000/svg', 'style');
    styleElement.setAttribute('type', 'text/css');
    styleElement.innerHTML = cssText;

    // Append the <style> element to the cloned SVG's <defs>
    let defs = clonedSvg.querySelector('defs');
    if (!defs) {
      defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
      clonedSvg.insertBefore(defs, clonedSvg.firstChild);
    }
    defs.appendChild(styleElement);
  };

  // Embed the styles into the cloned SVG
  embedStyles(clonedSvgNode);

  // Optional: Create a background rectangle to ensure consistent background color
  const bgRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
  bgRect.setAttribute('width', '100%');
  bgRect.setAttribute('height', '100%');
  bgRect.setAttribute('fill', '#ffffff'); // Match your desired background color

  // Insert the background rectangle as the first child of the cloned SVG
  clonedSvgNode.insertBefore(bgRect, clonedSvgNode.firstChild);

  // Adjust the SVG's dimensions and viewBox based on the scaleFactor
  const originalWidth =
    parseFloat(clonedSvgNode.getAttribute('width')) || svgNode.getBoundingClientRect().width;
  const originalHeight =
    parseFloat(clonedSvgNode.getAttribute('height')) || svgNode.getBoundingClientRect().height;

  // Update the cloned SVG's width and height
  clonedSvgNode.setAttribute('width', originalWidth * scaleFactor);
  clonedSvgNode.setAttribute('height', originalHeight * scaleFactor);

  // Update or set the viewBox attribute
  const viewBox = clonedSvgNode.getAttribute('viewBox');
  if (viewBox) {
    const viewBoxValues = viewBox.split(' ').map(Number);
    clonedSvgNode.setAttribute('viewBox', viewBoxValues.join(' '));
  } else {
    clonedSvgNode.setAttribute('viewBox', `0 0 ${originalWidth} ${originalHeight}`);
  }

  // Serialize the modified SVG to string
  let svgData = new XMLSerializer().serializeToString(clonedSvgNode);

  // Add namespaces if missing
  if (!svgData.match(/^<svg[^>]+xmlns="http\:\/\/www\.w3\.org\/2000\/svg"/)) {
    svgData = svgData.replace(/^<svg/, '<svg xmlns="http://www.w3.org/2000/svg"');
  }
  if (!svgData.match(/^<svg[^>]+"http\:\/\/www\.w3\.org\/1999\/xlink"/)) {
    svgData = svgData.replace(/^<svg/, '<svg xmlns:xlink="http://www.w3.org/1999/xlink"');
  }

  // Encode the SVG string
  const encodedSvg = encodeURIComponent(svgData);
  const svgBlob = `data:image/svg+xml;charset=utf-8,${encodedSvg}`;

  // Create an image from the SVG
  const img = new Image();

  img.onload = () => {
    // Calculate scaled dimensions
    const width = originalWidth * scaleFactor;
    const height = originalHeight * scaleFactor;

    // Create a canvas with scaled dimensions
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext('2d');
    if (!context) {
      console.error('Canvas context is not available.');
      return;
    }

    // Fill the background (ensure it matches the SVG background)
    context.fillStyle = '#454545'; // Match the SVG background
    context.fillRect(0, 0, width, height);

    // Draw the SVG image onto the canvas
    context.drawImage(img, 0, 0, width, height);

    // Convert the canvas to a PNG blob
    canvas.toBlob((blob) => {
      if (blob === null) {
        alert('Failed to create PNG. Please try again.');
        console.error('Canvas is empty or blob creation failed.');
        return;
      }

      // Create a temporary link to trigger the download
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'high_res_view.png'; // Filename for the PNG
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }, 'image/png');
  };

  img.onerror = (e) => {
    console.error('Error loading SVG as image', e);
  };

  img.src = svgBlob;
};

export const OverlayControls = ({
  drawOptions,
  setDrawOptions,
  svgRef,
  graphSelection,
  graphDetails
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [scaleFactor, setScaleFactor] = useState(10); // Default scaleFactor

  const toggleOption = (key) => {
    setDrawOptions({ ...drawOptions, [key]: !drawOptions[key] });
  };

  const toggleViewModifier = (key) => {
    const resetOptions = {
      showStructureDifference: false,
      showCountGradient: false
    };
    setDrawOptions({ ...drawOptions, ...resetOptions, [key]: !drawOptions[key] });
  };

  return (
    <div className="ui-padding ui-border overlay-element">
      <div className="overlay-heading" onClick={() => setIsExpanded(!isExpanded)}>
        <span>{isExpanded ? '▼' : '▶'}&#9;</span>
        <strong>Draw Options</strong>
      </div>

      <div className={`options-container ${isExpanded ? '' : 'hidden'}`}>
        <div className="legend-section">
          <div className="legend-section-title">
            <strong>Show</strong>
          </div>
          <div className="checkbox-container">
            <input
              type="checkbox"
              checked={drawOptions.showServiceGroups}
              onChange={() => toggleOption('showServiceGroups')}
            />
            <label>Service Groups</label>
          </div>
          <div className="checkbox-container">
            <input
              type="checkbox"
              checked={drawOptions.showSubprocessGroups}
              onChange={() => toggleOption('showSubprocessGroups')}
            />
            <label>Subprocess Groups</label>
          </div>
          <div className="checkbox-container">
            <input
              type="checkbox"
              checked={drawOptions.showGraphLinks}
              onChange={() => toggleOption('showGraphLinks')}
            />
            <label>Graph Links</label>
          </div>
          <div className="checkbox-container">
            <input
              type="checkbox"
              checked={drawOptions.showLogLevels}
              onChange={() => toggleOption('showLogLevels')}
            />
            <label>Log Levels</label>
          </div>
        </div>
        <div className="legend-section">
          <div className="legend-section-title">
            <strong>View Modifiers</strong>
          </div>
          {/* Uncomment and modify if needed
          <div className="checkbox-container">
            <input
              type="checkbox"
              className={graphSelection !== GraphSelection.BOTH ? 'disabled-checkbox' : ''}
              checked={
                drawOptions.showStructureDifference && graphSelection === GraphSelection.BOTH
              }
              onChange={() => toggleViewModifier('showStructureDifference')}
            />
            <label className={graphSelection !== GraphSelection.BOTH ? 'disabled-label' : ''}>
              Show Structure Difference
            </label>
          </div>
          */}
          <div className="checkbox-container">
            <input
              type="checkbox"
              checked={drawOptions.showCountGradient}
              onChange={() => toggleViewModifier('showCountGradient')}
            />
            <label>Count Gradient</label>
          </div>
        </div>
        <div className="legend-section">
          {/* Resolution Selector */}
          <div className="resolution-selector" style={{ marginBottom: '10px' }}>
            <label htmlFor="resolution">Resolution:</label>
            <select
              id="resolution"
              value={scaleFactor}
              onChange={(e) => setScaleFactor(parseInt(e.target.value))}
              style={{ marginLeft: '10px' }}>
              <option value={2}>Low (2x)</option>
              <option value={5}>Medium (5x)</option>
              <option value={10}>High (10x)</option>
              <option value={20}>Ultra (20x)</option>
            </select>
          </div>
          {/* Download Button */}
          <button onClick={() => download(svgRef.current, scaleFactor)}>Download as PNG</button>
        </div>
      </div>
    </div>
  );
};

// import React, { useState, useEffect } from 'react';
// import GraphSelection from '../../../enums/GraphSelection';

// const download = (svgNode) => {
//   // Clone the SVG node to avoid modifying the original
//   const clonedSvgNode = svgNode.cloneNode(true);

//   // Create a background rectangle
//   const bgRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
//   bgRect.setAttribute('width', '100%');
//   bgRect.setAttribute('height', '100%');
//   bgRect.setAttribute('fill', '#242424');

//   // Insert the background rectangle as the first child of the SVG
//   clonedSvgNode.insertBefore(bgRect, clonedSvgNode.firstChild);

//   // Function to inline styles from CSS
//   const inlineStyles = (svgElement) => {
//     const cssStyles = window.getComputedStyle(svgElement);
//     let styleString = '';
//     for (const key of cssStyles) {
//       styleString += `${key}:${cssStyles.getPropertyValue(key)};`;
//     }
//     svgElement.setAttribute('style', styleString);
//     for (const child of svgElement.children) {
//       inlineStyles(child);
//     }
//   };

//   // Inline all styles
//   inlineStyles(clonedSvgNode);

//   // Handle patterns and gradients by copying over <defs>
//   const originalDefs = svgNode.querySelector('defs');
//   if (originalDefs) {
//     const clonedDefs = originalDefs.cloneNode(true);
//     clonedSvgNode.insertBefore(clonedDefs, clonedSvgNode.firstChild);
//   }

//   // Explicitly set width and height of the cloned SVG
//   const bbox = svgNode.getBBox();
//   clonedSvgNode.setAttribute('width', bbox.width);
//   clonedSvgNode.setAttribute('height', bbox.height);

//   // Serialize the modified SVG to string
//   const svgData = new XMLSerializer().serializeToString(clonedSvgNode);

//   // Create a blob and download
//   const blob = new Blob([svgData], { type: 'image/svg+xml' });
//   const url = URL.createObjectURL(blob);

//   const link = document.createElement('a');
//   link.href = url;
//   link.download = 'high_res_view.svg';
//   document.body.appendChild(link);
//   link.click();
//   document.body.removeChild(link);

//   URL.revokeObjectURL(url);
// };

// export const OverlayControls = ({
//   drawOptions,
//   setDrawOptions,
//   svgRef,
//   graphSelection,
//   graphDetails
// }) => {
//   const [isExpanded, setIsExpanded] = useState(true);

//   const toggleOption = (key) => {
//     setDrawOptions({ ...drawOptions, [key]: !drawOptions[key] });
//   };

//   const toggleViewModifier = (key) => {
//     const resetOptions = {
//       showStructureDifference: false,
//       showCountGradient: false
//     };
//     setDrawOptions({ ...drawOptions, ...resetOptions, [key]: !drawOptions[key] });
//   };

//   return (
//     <div className="ui-padding ui-border overlay-element">
//       <div className="overlay-heading" onClick={() => setIsExpanded(!isExpanded)}>
//         <span>{isExpanded ? '▼' : '▶'}&#9;</span>
//         <strong>Draw Options</strong>
//       </div>

//       <div className={`options-container ${isExpanded ? '' : 'hidden'}`}>
//         <div className="legend-section">
//           <div className="legend-section-title">
//             <strong>Show</strong>
//           </div>
//           <div className="checkbox-container">
//             <input
//               type="checkbox"
//               checked={drawOptions.showServiceGroups}
//               onChange={() => toggleOption('showServiceGroups')}
//             />
//             <label>Service Groups</label>
//           </div>
//           <div className="checkbox-container">
//             <input
//               type="checkbox"
//               checked={drawOptions.showSubprocessGroups}
//               onChange={() => toggleOption('showSubprocessGroups')}
//             />
//             <label>Subprocess Groups</label>
//           </div>
//           <div className="checkbox-container">
//             <input
//               type="checkbox"
//               checked={drawOptions.showGraphLinks}
//               onChange={() => toggleOption('showGraphLinks')}
//             />
//             <label>Graph Links</label>
//           </div>
//           <div className="checkbox-container">
//             <input
//               type="checkbox"
//               checked={drawOptions.showLogLevels}
//               onChange={() => toggleOption('showLogLevels')}
//             />
//             <label>Log Levels</label>
//           </div>
//         </div>
//         <div className="legend-section">
//           <div className="legend-section-title">
//             <strong>View Modifiers</strong>
//           </div>
//           {/* <div className="checkbox-container">
//             <input
//               type="checkbox"
//               className={graphSelection !== GraphSelection.BOTH ? 'disabled-checkbox' : ''}
//               checked={
//                 drawOptions.showStructureDifference && graphSelection === GraphSelection.BOTH
//               }
//               onChange={() => toggleViewModifier('showStructureDifference')}
//             />
//             <label className={graphSelection !== GraphSelection.BOTH ? 'disabled-label' : ''}>
//               Show Structure Difference
//             </label>
//           </div> */}
//           <div className="checkbox-container">
//             <input
//               type="checkbox"
//               checked={drawOptions.showCountGradient}
//               onChange={() => toggleViewModifier('showCountGradient')}
//             />
//             <label>Count Gradient</label>
//           </div>
//         </div>
//         <div className="legend-section">
//           <button onClick={() => download(svgRef.current)}>Download</button>
//         </div>
//       </div>
//     </div>
//   );
// };
