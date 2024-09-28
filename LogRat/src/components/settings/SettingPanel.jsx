const SettingsPanel = ({ lightMode, toggleLightMode }) => {
  return (
    <div className="ui-padding ui-border header-element">
      <p className="title-text" style={{ textAlign: 'left' }}>
        Settings
      </p>
      <div className="dark-mode-toggle">
        <span className="toggle-label">{lightMode ? 'Light Mode' : 'Dark Mode'}</span>
        <label className="switch">
          <input type="checkbox" checked={lightMode} onChange={toggleLightMode} />
          <span className="slider round"></span>
        </label>
      </div>
    </div>
  );
};
export default SettingsPanel;
