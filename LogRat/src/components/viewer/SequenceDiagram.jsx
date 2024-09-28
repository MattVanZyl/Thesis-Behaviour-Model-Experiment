import React, { useEffect, useRef } from "react";
import * as d3 from "d3";

export const SequenceDiagram = ({ processedLogData }) => {
  const ref = useRef();

  useEffect(() => {
    const svg = d3.select(ref.current);
    svg.selectAll("*").remove(); // remove previous diagram

    if (processedLogData && processedLogData.length > 0) {
      const margin = { top: 20, right: 30, bottom: 30, left: 40 };
      const width = 1200 - margin.left - margin.right;
      const height = 600 - margin.top - margin.bottom;

      // Define scales
      const xScale = d3
        .scaleTime()
        .domain(d3.extent(processedLogData, (d) => new Date(d.timestamp)))
        .range([margin.left, width - margin.right]);

      const yScale = d3
        .scalePoint()
        .domain(processedLogData.map((d) => d.emitter_id))
        .range([height - margin.bottom, margin.top]);

      // Define line generator
      const line = d3
        .line()
        .x((d) => xScale(new Date(d.timestamp)))
        .y((d) => yScale(d.emitter_id));

      // Add lines
      svg
        .append("path")
        .datum(processedLogData)
        .attr("fill", "none")
        .attr("stroke", "#bdbdbd")
        .attr("d", line);

      // Add circles
      svg
        .selectAll("circle")
        .data(processedLogData)
        .join("circle")
        .attr("cx", (d) => xScale(new Date(d.timestamp)))
        .attr("cy", (d) => yScale(d.emitter_id))
        .attr("r", 3)
        .style("fill", "white");

      // Add axes
      svg
        .append("g")
        .attr("transform", `translate(0,${height - margin.bottom})`)
        .call(d3.axisBottom(xScale));

      svg
        .append("g")
        .attr("transform", `translate(${margin.left},0)`)
        .call(d3.axisLeft(yScale));
    }
  }, [processedLogData]);

  if (!processedLogData) {
    return (
      <div
        style={{ height: "200px", width: "100%", border: "3px solid #3b3b3b" }}
      >
        <div style={{ padding: "1em" }}>No node selected</div>
      </div>
    );
  }

  return (
    <svg ref={ref} style={{ width: "100%", border: "3px solid #3b3b3b" }}></svg>
  );
};
