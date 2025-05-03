import React from "react";
import PropTypes from "prop-types";
import "../styles/levelcard.css";
import { useState, useRef, useEffect } from "react";

export default function LevelCard({ level, onClick }) {
  const { name, unlocked } = level;

  return (
    <div
      className={`level-card ${unlocked ? "unlocked" : "locked"}`}
      onClick={unlocked ? onClick : undefined}
      style={{ cursor: unlocked ? "pointer" : "not-allowed" }}
    >
      <div className="level-card-content">
        <h3 className="level-name">{name}</h3>
      </div>
      {!unlocked && (
        <div className="level-lock-overlay">
          <span role="img" aria-label="locked"></span>
        </div>
      )}
    </div>
  );
}

LevelCard.propTypes = {
  level: PropTypes.shape({
    id: PropTypes.number.isRequired,
    name: PropTypes.string.isRequired,
    unlocked: PropTypes.bool.isRequired,
    xPercent: PropTypes.number,
    yPercent: PropTypes.number,
  }).isRequired,
  onClick: PropTypes.func,
};

LevelCard.defaultProps = {
  onClick: () => {},
};
