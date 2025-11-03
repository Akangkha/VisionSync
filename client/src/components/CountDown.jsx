import React, { useState, useEffect } from "react";

const CountdownTimer = () => {
  const [time, setTime] = useState(60); // 60 sec

  useEffect(() => {
    if (time <= 0) return; // stop at 0

    const timer = setInterval(() => {
      setTime((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [time]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  return (
    <div
      style={{
        fontSize: "48px",
        fontWeight: "bold",
        textAlign: "center",
        padding: "20px",
        backgroundColor: "#222",
        color: "#fff",
        borderRadius: "10px",
        width: "200px",
        margin: "0 auto",
      }}
      className="counter"
    >
      {formatTime(time)}
    </div>
  );
};

export default CountdownTimer;
