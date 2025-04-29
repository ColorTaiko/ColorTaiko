import React from "react";
import LevelCard from "./components/LevelCard";
import "./styles/title_page.css";

const levels = [
  { id: 1, name: "1", unlocked: true, xPercent: 50, yPercent: 10 },
  { id: 2, name: "2", unlocked: true, xPercent: 50, yPercent: 30 },
  { id: 3, name: "3NF", unlocked: true, xPercent: 50, yPercent: 50 },
  { id: 4, name: "3.G4", unlocked: true, xPercent: 90, yPercent: 50 },
  { id: 5, name: "4NF+NP", unlocked: true, xPercent: 30, yPercent: 70 },
  { id: 6, name: "4.G4", unlocked: true, xPercent: 70, yPercent: 70 },
  { id: 7, name: "5.NP+G4", unlocked: true, xPercent: 50, yPercent: 90 },
  { id: 8, name: "5.NP+G6", unlocked: true, xPercent: 100, yPercent: 95 },
  // add more levels with x/y positions
];

const edges = [
  [1, 2],
  [2, 3],
  [2, 4],
  [3, 5],
  [3, 6],
  [5, 7],
  [6, 7],
  [7, 8],
  [4, 8],
];

function TitlePage() {
  return (
    <div className="title-page">
      <div className="content">
        <header className="header">
          <h1 className="game-title">ColorTaiko!</h1>
        </header>
        <div className="sidebar"></div>
        <div className="graph-container">
          {/* SVG edges */}
          <svg className="edges">
            {edges.map(([fromId, toId], index) => {
              const from = levels.find((l) => l.id === fromId);
              const to = levels.find((l) => l.id === toId);
              return (
                <line
                  key={index}
                  x1={`${from.xPercent}%`}
                  y1={`${from.yPercent}%`}
                  x2={`${to.xPercent}%`}
                  y2={`${to.yPercent}%`}
                  stroke="white"
                  strokeWidth="2"
                />
              );
            })}
          </svg>

          {/* Level nodes */}
          {levels.map((level) => (
            <div
              key={level.id}
              className="node"
              style={{
                left: `${level.xPercent}%`,
                top: `${level.yPercent}%`,
              }}
            >
              <LevelCard level={level} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default TitlePage;
