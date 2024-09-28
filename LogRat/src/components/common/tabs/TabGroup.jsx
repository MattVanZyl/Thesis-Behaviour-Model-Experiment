import React, { useState } from "react";
import { Tab } from "./Tab";

export const TabGroup = ({ children }) => {
  const [activeTab, setActiveTab] = useState(0);

  return (
    <div className="tab-root">
      <div className="tab-group-header">
        {React.Children.map(children, (child, index) => (
          <Tab
            title={child.props.title}
            isActive={index === activeTab}
            onClick={() => setActiveTab(index)}
          />
        ))}
      </div>
      <div className="tab-group-content">
        {React.Children.toArray(children)[activeTab]}
      </div>
    </div>
  );
};
