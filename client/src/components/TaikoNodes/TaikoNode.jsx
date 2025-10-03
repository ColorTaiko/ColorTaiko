import PropTypes from "prop-types";
import { useState, useEffect } from 'react';
import './taikoNode.css';

const TaikoNode = ({ id, onClick, isSelected, index, totalCount, isFaded, position, blackDotEffect, lightMode, isHighlighted, isFlashing}) => {
  const [entering, setEntering] = useState(true);

  useEffect(() => {
    const timeout = setTimeout(() => setEntering(false), 500); 
    return () => clearTimeout(timeout);
  }, []);

  const nodeSize = Math.max(30, 100 / totalCount);
  const label = position === "top" ? `b${index + 1}` : `a${index + 1}`;
  const [backgroundColor, setBackgroundColor] = useState("red")

  useEffect(()=> {
    if(lightMode == true) {
      setBackgroundColor("black")
    }
    else {
      setBackgroundColor("white")
    }
  }, [lightMode])

  const classNames = `${isFlashing ? 'flash' : ''} taiko-node ${entering ? 'taiko-node-enter' : ''}${isSelected ? ' selected' : ''}`;

  return (
    <div
      id={id}
      onClick={onClick}
      className={classNames}
      style={{
        backgroundColor: isSelected
          ? "#FF69B4"
          : isHighlighted
          ? "#FF69B4"
          : isFaded
          ? "#939799"
          : `${backgroundColor}`,
        opacity: isSelected ? 1 : isFaded ? 0.5 : 1,
        width: `${nodeSize}px`,
        height: `${nodeSize}px`,
      }}
    >
      {position === "top" && (
        <span style={{ position: "absolute", top: "-30px", fontSize: '20px', color: lightMode ? 'black' : 'white', fontFamily: "'STIX Two Math', serif", userSelect: "none" }}>
          {label}
        </span>
      )}
      <div style={{ width: '100%', height: '100%' }} />
      {position === "bottom" && (
        <span style={{ position: "absolute", bottom: "-30px", fontSize: '20px', color: lightMode ? 'black' : 'white', fontFamily: "'STIX Two Math', serif", userSelect: "none" }}>
          {label}
        </span>
      )}

      {blackDotEffect && !isSelected && <div className="black-dot"></div>}
    </div>
  );
};

TaikoNode.propTypes = {
  id: PropTypes.string.isRequired,
  onClick: PropTypes.func.isRequired,
  isSelected: PropTypes.bool.isRequired,
  index: PropTypes.number.isRequired,
  totalCount: PropTypes.number.isRequired,
  isFaded: PropTypes.bool.isRequired,
  position: PropTypes.oneOf(["top", "bottom"]).isRequired,
  blackDotEffect: PropTypes.bool.isRequired,
  lightMode: PropTypes.bool.isRequired,
  isHighlighted: PropTypes.bool.isRequired,
};
export default TaikoNode;