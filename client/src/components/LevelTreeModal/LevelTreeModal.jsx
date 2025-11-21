import { useEffect, useState } from "react";
import PropTypes from "prop-types";

import LevelCard from "../LevelCard";
import "./levelTreeModal.css";

const LevelTreeModal = ({
  isOpen,
  onClose,
  graph,
  selectedLevel,
  onSelect,
  descriptions,
}) => {
  const [hoveredNode, setHoveredNode] = useState(null);

  useEffect(() => {
    if (!isOpen) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen) {
      setHoveredNode(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const nodes = graph?.nodes ?? [];
  const edges = graph?.edges ?? [];

  const descriptionsMap = descriptions || {};

  const handleOverlayClick = (event) => {
    if (event.target === event.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="level-modal__overlay" role="presentation" onClick={handleOverlayClick}>
      <div
        className="level-modal__container"
        role="dialog"
        aria-modal="true"
        aria-labelledby="level-modal-title"
      >
        <div className="level-modal__header">
          <h2 id="level-modal-title">Choose a Level</h2>
          <button type="button" className="level-modal__close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>
        <div className="level-modal__body">
          <div className="level-modal__graph">
            <svg className="level-modal__edges" role="presentation" aria-hidden="true">
              {edges.map(([fromId, toId]) => {
                const from = nodes.find((node) => node.id === fromId);
                const to = nodes.find((node) => node.id === toId);
                if (!from || !to) return null;
                return (
                  <line
                    key={`${fromId}-${toId}`}
                    x1={`${from.xPercent}%`}
                    y1={`${from.yPercent}%`}
                    x2={`${to.xPercent}%`}
                    y2={`${to.yPercent}%`}
                    stroke="currentColor"
                    strokeWidth="2"
                    vectorEffect="non-scaling-stroke"
                  />
                );
              })}
            </svg>

            {nodes.map((node) => (
              <div
                key={node.id}
                className="level-modal__node"
                style={{ left: `${node.xPercent}%`, top: `${node.yPercent}%` }}
              >
                <LevelCard
                  level={node}
                  onClick={onSelect}
                  onHover={setHoveredNode}
                  isSelected={selectedLevel === node.name}
                />
              </div>
            ))}

            {hoveredNode && descriptionsMap[hoveredNode.name] && (() => {
              // Clamp tooltip vertical shift to avoid going off the top when node is near the top edge
              const yShift = hoveredNode.yPercent < 15 ? "0" : (hoveredNode.yPercent > 85 ? "-100%" : "-50%");
              const xShift = hoveredNode.xPercent > 65 ? "-100%" : "0";
              const leftPos = hoveredNode.xPercent > 65
                ? `calc(${hoveredNode.xPercent}% - 45px)`
                : `calc(${hoveredNode.xPercent}% + 45px)`;
              const topPos = `calc(${hoveredNode.yPercent}% + 20px)`;
              return (
              <div
                className="level-modal__tooltip"
                style={{
                  left: leftPos,
                  top: topPos,
                  transform: `translate(${xShift}, ${yShift})`,
                }}
              >
                <ul>
                  {descriptionsMap[hoveredNode.name].map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>

                {hoveredNode.name === "Level 5.NF+NP+G6" && (
                  <div className="level-modal__tooltip-extras" role="note" aria-live="polite">
                    Completing this level may lead to a counterexample — either the unit conjecture or the zero-divisor conjecture.
                  </div>
                )}
              </div>
              );
            })()}
          </div>
        </div>
      </div>
    </div>
  );
};

LevelTreeModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  graph: PropTypes.shape({
    nodes: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.string.isRequired,
        name: PropTypes.string.isRequired,
        unlocked: PropTypes.bool,
        xPercent: PropTypes.number.isRequired,
        yPercent: PropTypes.number.isRequired,
      })
    ),
    edges: PropTypes.arrayOf(
      PropTypes.arrayOf(PropTypes.string.isRequired).isRequired
    ),
  }),
  selectedLevel: PropTypes.string,
  onSelect: PropTypes.func.isRequired,
  descriptions: PropTypes.objectOf(PropTypes.arrayOf(PropTypes.string)),
};

LevelTreeModal.defaultProps = {
  graph: { nodes: [], edges: [] },
  selectedLevel: null,
  descriptions: {},
};

export default LevelTreeModal;
