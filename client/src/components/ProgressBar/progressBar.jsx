import PropTypes from "prop-types";
import { useState } from 'react';
import './progressBar.css';


const ProgressBar = ({ progress, connections, topRowCount, bottomRowCount, lightMode}) => {
  const [panelOpen, setPanelOpen] = useState(false);

  const togglePanel = () => setPanelOpen((v) => !v);

  const onKeyToggle = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      togglePanel();
    }
  };

  const topCount = Math.max(topRowCount - 1, 0);
  const bottomCount = Math.max(bottomRowCount - 1, 0);
  const edgeCount = connections.length;
  const denom = topCount * bottomCount || 1; // avoid divide by zero
  const successPct = Number((edgeCount / denom) * 100).toPrecision(4);

  return (
    <div style={{ marginTop: '-55px' }}>
      <p className="text" style={{ color: lightMode ? 'black' : '#837b7b', fontSize: '14px', textAlign: 'left', marginBottom: '0px' }}>
        Can you get to 100%?
      </p>

      <div className="progress-bar-wrapper">
        <div
          className={`progress-bar-container ${panelOpen ? 'is-open' : ''}`}
          role="button"
          tabIndex={0}
          onClick={togglePanel}
          onKeyDown={onKeyToggle}
          aria-expanded={panelOpen}
          aria-controls="progress-info-panel"
          title={panelOpen ? 'Hide progress details' : 'Show progress details'}
        >
          <div className="progress-bar-fill" style={{ width: `${progress}%` }}>
            <span className="progress-bar-text">{Math.round(progress)}%</span>
          </div>
        </div>

        {panelOpen && (
            <div id="progress-info-panel" className="progress-info-panel" role="region" aria-label="Progress details">
              <div className="progress-info-header">
                <div className="metric-block">
                  <div className="metric-label metric-label--split">
                    <span>VERTICAL</span>
                    <span>EDGES</span>
                  </div>
                  <span className="metric-value var-e">{edgeCount}</span>
                </div>
                <div className="metric-block metric-block--split">
                  <div className="metric-label metric-label--split">
                    <span>TOP</span>
                    <span>VERTICES</span>
                  </div>
                  <span className="metric-value var-m">{topCount}</span>
                </div>
                <div className="metric-block">
                  <div className="metric-label metric-label--split">
                    <span>BOTTOM</span>
                    <span>VERTICES</span>
                  </div>
                  <span className="metric-value var-n">{bottomCount}</span>
                </div>
              </div>
              <div className="progress-math">
                <div className="equation-area" aria-label="success formula">
                  <div className="primary-row">
                    <div className="success-title" aria-hidden="true">success rate =</div>
                    <div className="equation-line primary-symbolic symbolic-box">
                      <span className="sym sym-e">{edgeCount}</span>
                      <span className="sym sym-div">/</span>
                      <span className="sym sym-paren">(</span>
                      <span className="sym sym-m">{topCount}</span>
                      <span className="sym sym-dot">·</span>
                      <span className="sym sym-n">{bottomCount}</span>
                      <span className="sym sym-paren">)</span>
                      <span className="sym sym-eq inline">=</span>
                      <span className="result-value final-result">{successPct}%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
        )}
      </div>
    </div>
  );
};
ProgressBar.propTypes = {
  progress: PropTypes.number.isRequired,
  connections: PropTypes.array.isRequired,
  topRowCount: PropTypes.number.isRequired,
  bottomRowCount: PropTypes.number.isRequired,
  lightMode: PropTypes.bool.isRequired
};

export default ProgressBar;
