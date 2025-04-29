// src/components/LevelCard.jsx

import React from "react";
import "../styles/LevelCard.css"; // separate styling for the cards

function LevelCard({ level }) {
  const { id, name, unlocked } = level;

  return (
    <div className={`level-card ${unlocked ? "unlocked" : "locked"}`}>
      <div className="text">
        <h2>{name}</h2>
      </div>
      {!unlocked && <div className="lock-overlay">🔒</div>}
    </div>
  );
}

export default LevelCard;
