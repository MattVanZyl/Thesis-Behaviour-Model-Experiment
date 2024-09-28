import React from "react";

export const Tab = ({ title, isActive, onClick }) => {
  return (
    <button
      onClick={onClick}
      style={{
        backgroundColor: isActive ? "#f0bc00" : "#4A4A4A",
        color: isActive ? "black" : "white",
        border: "none",
        padding: "10px",
        cursor: "pointer",
      }}
    >
      {title}
    </button>
  );
};
