import React, { useState, useEffect } from "react";

function OpacityControl() {
  const [opacities, setOpacities] = useState({
    top: 1,
    right: 1,
    bottom: 1,
    left: 1,
    current: 1,
    destination: 1,
  });

  useEffect(() => {
    Object.entries(opacities).forEach(([key, value]) => {
      document.documentElement.style.setProperty(`--${key}-opacity`, value);
    });
  }, [opacities]);

  const handleOpacityChange = (key, value) => {
    setOpacities((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="settings">
      <h3>⚙️ Opacity Controls</h3>
      <div className="sliders">
        {Object.keys(opacities).map((key) => (
          <div key={key} style={{ marginBottom: "10px" }}>
            <label>
              {key.charAt(0).toUpperCase() + key.slice(1)} Opacity:{" "}
              {opacities[key]}
            </label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={opacities[key]}
              onChange={(e) =>
                handleOpacityChange(key, parseFloat(e.target.value))
              }
            />
          </div>
        ))}
      </div>
    </div>
  );
}

export default OpacityControl;
