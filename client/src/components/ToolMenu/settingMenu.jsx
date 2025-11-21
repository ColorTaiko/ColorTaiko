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
}) => {
  const handleOffsetInput = (e) => {
    const newOffset = parseInt(e.target.value, 10);
    onOffsetChange(newOffset);
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
      <div className="settings-toggle-row">
        <span>Sound</span>
        <span style={{ fontWeight: 600 }}>{soundbool ? "ON" : "OFF"}</span>
        <input type="checkbox" checked={soundbool} onChange={onSoundControl} />
      </div>
      <div className="settings-toggle-row">
        <span>Black Dot</span>
        <span style={{ fontWeight: 600 }}>{blackDotEffect ? "ON" : "OFF"}</span>
        <input
          type="checkbox"
          checked={blackDotEffect}
          onChange={onToggleBlackDotEffect}
        />
      </div>
      <div className="settings-toggle-row">
        <span>Light Mode</span>
        <span style={{ fontWeight: 600 }}>{lightMode ? "ON" : "OFF"}</span>
        <input
          type="checkbox"
          checked={lightMode}
          onChange={onToggleLightMode}
        />
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
};

export default SettingsMenu;