import PropTypes from "prop-types";
import "../styles/LevelCard.css";

function LevelCard({ level, onClick, onHover, isSelected }) {
  const { name, unlocked } = level;

  const handleClick = () => {
    if (!unlocked) return;
    onClick(level.name);
  };

  return (
    <div
      className={`level-card ${unlocked ? "unlocked" : "locked"} ${
        isSelected ? "is-selected" : ""
      }`}
      role="button"
      tabIndex={unlocked ? 0 : -1}
      onClick={handleClick}
      onKeyDown={(event) => {
        if ((event.key === "Enter" || event.key === " ") && unlocked) {
          event.preventDefault();
          handleClick();
        }
      }}
      onMouseEnter={() => onHover(level)}
      onMouseLeave={() => onHover(null)}
      style={{ cursor: unlocked ? "pointer" : "not-allowed" }}
      aria-disabled={!unlocked}
      aria-pressed={isSelected}
    >
      <div className="level-card__content">
        <h3 className="level-card__name">{name}</h3>
        {/* Special crown icon for Level 5.NF+NP+G6 (tooltip moved to LevelTreeModal) */}
        {name === "Level 5.NF+NP+G6" && (
          <div className="level-card__warning" aria-hidden={!unlocked}>
            <svg
              className="level-card__warning-icon"
              viewBox="0 0 24 24"
              role="img"
              aria-label="Special note for this level"
            >
              {/* Minimal golden crown */}
              <path d="M3 16l2-8 5 5 4-5 5 5 2-8 0 11H3z" />
              <rect x="3" y="18" width="18" height="2" rx="1" />
            </svg>
          </div>
        )}
      </div>
      {!unlocked && <div className="level-card__lock-overlay" aria-hidden="true" />}
    </div>
  );
}

LevelCard.propTypes = {
  level: PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    unlocked: PropTypes.bool,
    xPercent: PropTypes.number.isRequired,
    yPercent: PropTypes.number.isRequired,
  }).isRequired,
  onClick: PropTypes.func,
  onHover: PropTypes.func,
  isSelected: PropTypes.bool,
};

LevelCard.defaultProps = {
  onClick: () => {},
  onHover: () => {},
  isSelected: false,
};

export default LevelCard;
