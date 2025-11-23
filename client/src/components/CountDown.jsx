import React, { useState, useEffect } from "react";

const CountdownTimer = () => {
  const [time, setTime] = useState(60);
  const totalTime = 60;

  useEffect(() => {
    if (time <= 0) return;
    const timer = setInterval(() => setTime((t) => t - 1), 1000);
    return () => clearInterval(timer);
  }, [time]);

  const formatTime = (s) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, "0")}:${sec
      .toString()
      .padStart(2, "0")}`;
  };

  const radius = 80;
  const circumference = 2 * Math.PI * radius;
  const progress = (time / totalTime) * circumference;

  // Color transition: green → yellow → red
  const getColor = () => {
    const percent = time / totalTime;
    if (percent > 0.6) return "#0b9582a2";
    if (percent > 0.3) return "#FFC107";
    return "#F44336";
  };

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <svg width="200" height="200">
        {/* Background circle */}
        <circle
          cx="100"
          cy="100"
          r={radius}
          fill="none"
          stroke="#333"
          strokeWidth="15"
        />

        {/* Progress circle */}
        <circle
          cx="100"
          cy="100"
          r={radius}
          fill="none"
          stroke={getColor()}
          strokeWidth="15"
          strokeDasharray={circumference}
          strokeDashoffset={circumference - progress}
          strokeLinecap="round"
          style={{
            transition: "stroke-dashoffset 1s linear, stroke 0.5s ease",
          }}
          transform="rotate(-90 100 100)"
        />

        {/* Centered text */}
        <text
          x="50%"
          y="50%"
          dominantBaseline="middle"
          textAnchor="middle"
          fontSize="20"
          fill="#fff"
          fontWeight="bold" className="counter"
        >
          {formatTime(time)}
        </text>
      </svg>
    </div>
  );
};

export default CountdownTimer;
