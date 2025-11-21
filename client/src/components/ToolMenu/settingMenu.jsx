import PropTypes from "prop-types";
import "./settingMenu.css";

const SettingsMenu = ({
  offset,
  onOffsetChange,
  soundbool,
  onSoundControl,
  blackDotEffect,
  onToggleBlackDotEffect,
  lightMode,
  onToggleLightMode,
  maxTop,
  onMaxTopChange,
  maxBottom,
  onMaxBottomChange,
  randomMethod,
  onRandomMethodChange,
}) => {
  const handleRandomMethodChange = (e) => {
    if (onRandomMethodChange) onRandomMethodChange(e.target.value);
  };
  const handleOffsetInput = (e) => {
    const newOffset = parseInt(e.target.value, 10);
    onOffsetChange(newOffset);
  };

  const handleMaxTopInput = (e) => {
    const v = parseInt(e.target.value, 10);
    if (!Number.isNaN(v)) onMaxTopChange(v);
  };

  const handleMaxBottomInput = (e) => {
    const v = parseInt(e.target.value, 10);
    if (!Number.isNaN(v)) onMaxBottomChange(v);
  };

  return (
    <div className="settings-menu">
      <h3>Settings</h3>
      <label>
        <span>Edge Offset</span>
        <input
          type="range"
          value={offset}
          onChange={handleOffsetInput}
          min="0"
          max="50"
          step="1"
        />
      </label>
      <label style={{ marginTop: '10px', display: 'block' }}>
        Max Top Nodes (m):
        <input
          type="number"
          value={maxTop}
          onChange={handleMaxTopInput}
          min="1"
          max="50"
          style={{ marginLeft: '10px', width: '70px' }}
        />
      </label>
      <label style={{ marginTop: '10px', display: 'block' }}>
        Max Bottom Nodes (n):
        <input
          type="number"
          value={maxBottom}
          onChange={handleMaxBottomInput}
          min="1"
          max="50"
          style={{ marginLeft: '10px', width: '70px' }}
        />
      </label>
      <div style={{ marginTop: "10px" }}>
        <label style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          Sound Control:
          <span>{soundbool ? "ON" : "OFF"}</span>
          <input
            type="checkbox"
            checked={soundbool}
            onChange={onSoundControl}
            style={{ transform: "scale(1.5)" }}
          />
        </label>
      </div>
      <div style={{ marginTop: "10px" }}>
        <label style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          Black Dot Effect:
          <span>{blackDotEffect ? "ON" : "OFF"}</span>
          <input
            type="checkbox"
            checked={blackDotEffect}
            onChange={onToggleBlackDotEffect}
            style={{ transform: "scale(1.5)" }}
          />
        </label>
        </div>
        <div style={{ marginTop: "10px" }}>
          <label style={{ display: 'block', marginBottom: '8px' }}>
            Randomization Method:
          </label>
          <select value={randomMethod} onChange={handleRandomMethodChange} style={{ width: '100%', padding: '6px' }}>
            <option value="greedy">Greedy</option>
            <option value="greedy-backtrack">Greedy Backtrack</option>
          </select>
        </div>
        <div style={{ marginTop: "10px" }}>
        <label style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          Light Mode:
          <span>{lightMode ? "ON" : "OFF"}</span>
          <input
            type="checkbox"
            checked={lightMode}
            onChange={onToggleLightMode}
            style={{ transform: "scale(1.5)" }}
          />
        </label>
      </div>
    </div>
  );
};

SettingsMenu.propTypes = {
  offset: PropTypes.number.isRequired,
  onOffsetChange: PropTypes.func.isRequired,
  soundbool: PropTypes.bool.isRequired,
  onSoundControl: PropTypes.func.isRequired,
  blackDotEffect: PropTypes.bool.isRequired,
  onToggleBlackDotEffect: PropTypes.func.isRequired,
  lightMode: PropTypes.bool.isRequired,
  onToggleLightMode: PropTypes.func.isRequired,
  maxTop: PropTypes.number.isRequired,
  onMaxTopChange: PropTypes.func.isRequired,
  maxBottom: PropTypes.number.isRequired,
  onMaxBottomChange: PropTypes.func.isRequired,
  randomMethod: PropTypes.string,
  onRandomMethodChange: PropTypes.func,
};

export default SettingsMenu;