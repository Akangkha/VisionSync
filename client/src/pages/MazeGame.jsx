// src/pages/MazeGame.jsx
import { useState, useMemo, useRef, useEffect } from "react";
import {
  generateMaze,
  solve,
  gameProgress,
  getWallColor,
} from "../components/util.js";
import "../App.css";
import CountdownTimer from "../components/CountDown.jsx";
import OpacityControl from "../components/OpacityControl.jsx";
import jumpAudio from "../audio/jump.mp3";
import goggles from "../assets/image.png";
import panelBg from "../assets/panelBg.png";
import Bgpanel from "../assets/BgPanel.png";
import CameraCapture from "../components/CameraFeed.jsx";
import AlertBox from "../components/AlertBox.jsx";
import MazeSizeSlider from "../components/Slider.jsx";

export default function MazeGame() {
  const [gameId, setGameId] = useState(1);
  const [status, setStatus] = useState("playing");
  const moveSoundRef = useRef(null);
  const [wallColor, setWallColor] = useState("cyan");
  const [size, setSize] = useState(25);
  const [cheatMode, setCheatMode] = useState(false);
  const [direction, setDirection] = useState(null);
  const [filter, setFilter] = useState(false);
  const [userPosition, setUserPosition] = useState([0, 0]);
  const [alert, setAlert] = useState(null);

  const maze = useMemo(() => generateMaze(size, size), [size, gameId]);

  const solution = useMemo(() => {
    const s = new Set();
    const solutionPath = solve(maze, userPosition[0], userPosition[1]);
    solutionPath.forEach((path) => {
      const [x, y] = path;
      s.add(String(x) + "-" + String(y));
    });
    return s;
  }, [size, userPosition[0], userPosition[1], gameId, maze]);

  useEffect(() => {
    const lastRowIndex = maze.length - 1;
    const lastColIndex = maze[0].length - 1;
    if (userPosition[0] === lastRowIndex && userPosition[1] === lastColIndex) {
      setStatus("won");
    }
  }, [userPosition[0], userPosition[1], maze]);

  const makeClassName = (i, j) => {
    const rows = maze.length;
    const cols = maze[0].length;
    let arr = [];
    if (maze[i][j][0] === 0) arr.push("topWall");
    if (maze[i][j][1] === 0) arr.push("rightWall");
    if (maze[i][j][2] === 0) arr.push("bottomWall");
    if (maze[i][j][3] === 0) arr.push("leftWall");
    if (i === rows - 1 && j === cols - 1) arr.push("destination");
    if (i === userPosition[0] && j === userPosition[1])
      arr.push("currentPosition");
    if (cheatMode && solution.has(String(i) + "-" + String(j))) arr.push("sol");
    return arr.join(" ");
  };

  const handleMove = (e) => {
    e.preventDefault();
    if (status !== "playing") return;

    if (moveSoundRef.current) {
      moveSoundRef.current.currentTime = 0;
      moveSoundRef.current.play();
    }

    const key = e.code;
    const [i, j] = userPosition;

    if ((key === "ArrowUp" || key === "KeyW") && maze[i][j][0] === 1) {
      setUserPosition([i - 1, j]);
    }
    if ((key === "ArrowRight" || key === "KeyD") && maze[i][j][1] === 1) {
      setUserPosition([i, j + 1]);
    }
    if ((key === "ArrowDown" || key === "KeyS") && maze[i][j][2] === 1) {
      setUserPosition([i + 1, j]);
    }
    if ((key === "ArrowLeft" || key === "KeyA") && maze[i][j][3] === 1) {
      setUserPosition([i, j - 1]);
    }

    const progress = gameProgress(userPosition[0], userPosition[1], solution);
    setWallColor(getWallColor(progress));
  };

  useEffect(() => {
    const ws = new WebSocket("ws://localhost:5000");
    ws.onopen = () =>
      console.log("✅ Connected to WebSocket server for direction");

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.alert) {
          setAlert("Center your view!");
        } else if (data.direction && !data.alert) {
          setDirection(data.direction);
          console.log(data.direction);
          handleGaze(data.direction);
          setAlert(null);
        } else console.log(data.message);
      } catch (err) {
        console.error("Invalid JSON:", err);
      }
    };

    ws.onclose = () => console.log("❌ WebSocket disconnected");
    ws.onerror = (err) => console.error("⚠️ WebSocket error:", err);

    return () => ws.close();
  }, []);

  const handleGaze = (direction) => {
    if (!direction || direction === "N/A") return;

    setUserPosition(([i, j]) => {
      if (moveSoundRef.current) {
        moveSoundRef.current.currentTime = 0;
        moveSoundRef.current.play();
      }

      switch (direction) {
        case "up":
          return maze[i][j][0] === 1 ? [i - 1, j] : [i, j];
        case "right":
          return maze[i][j][1] === 1 ? [i, j + 1] : [i, j];
        case "down":
          return maze[i][j][2] === 1 ? [i + 1, j] : [i, j];
        case "left":
          return maze[i][j][3] === 1 ? [i, j - 1] : [i, j];
        default:
          return [i, j];
      }
    });
  };

  const handleUpdateSettings = (size) => {
    setSize(size);
    setUserPosition([0, 0]);
    setStatus("playing");
    setGameId((id) => id + 1);
  };

  return (
    <div
      onKeyDown={handleMove}
      tabIndex={-1}
      className="App relative flex w-screen h-screen outline-none items-center justify-around"
    >
      <audio ref={moveSoundRef} src={jumpAudio} preload="auto" />

      <div
        className="setting flex flex-col items-center mb-4 w-[308px] h-[90vh] p-6"
        style={{
          backgroundImage: `url(${panelBg})`,
          backgroundSize: "100% 100%",
          backgroundRepeat: "no-repeat",
          backgroundPosition: "center",
          borderRadius: "20px",
        }}
      >
        <CameraCapture />
        {alert && <AlertBox message={alert} />}

        <div className="flex justify-center items-center gap-4">
          <div className="flex flex-col items-center ">
            <button
              onClick={() => handleUpdateSettings(size)}
              className="w-10 h-10 rounded-full bg-gradient-to-b from-emerald-400 to-emerald-700 
               shadow-[0_6px_0_#14532d] active:translate-y-[6px] 
               active:shadow-[0_0px_0_#14532d] flex items-center justify-center 
               text-8xl text-white transition-all duration-150 hover:brightness-110"
            >
              🚀
            </button>
            <span className="text-white text-sm text-lg mt-2">Restart</span>
          </div>

          <div className="flex flex-col items-center ">
            <button
              onClick={() => setCheatMode(!cheatMode)}
              className="w-10 h-10 rounded-full bg-gradient-to-b from-emerald-400 to-emerald-700 
               shadow-[0_6px_0_#14532d] active:translate-y-[6px] 
               active:shadow-[0_0px_0_#14532d] flex items-center justify-center 
               text-8xl text-white transition-all duration-150 hover:brightness-110"
            >
              🕵️
            </button>
            <span className="text-white text-sm  mt-2">CheatMode</span>
          </div>
        </div>

        <MazeSizeSlider
          size={size}
          handleSizeChange={(e) => setSize(Number(e.target.value))}
        />
      </div>

      <div className="relative w-[60vw] h-[80vh]">
        <table id="maze" className="w-full h-full relative z-10">
          <tbody>
            {maze.map((row, i) => (
              <tr key={`row-${i}`}>
                {row.map((cell, j) => (
                  <td
                    key={`cell-${i}-${j}`}
                    className={makeClassName(i, j)}
                    style={{ borderColor: wallColor }}
                  >
                    <div />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>

        {filter && (
          <div
            className="eye-overlay"
            style={{
              position: "absolute",
              top: 12,
              left: 0,
              width: "100%",
              height: "100%",
              pointerEvents: "none",
              background:
                "linear-gradient(to right, rgba(255,0,0,0.5) 50%, rgba(0,255,255,0.5) 50%)",
              zIndex: 10,
            }}
          />
        )}
      </div>

      <div className="toggle-cheatmode absolute top-4 right-4 flex items-center gap-2">
        <img src={goggles} alt="goggles" className="w-16 h-auto" />
        <label className="switch">
          <input
            type="checkbox"
            onChange={() => setFilter(!filter)}
            checked={filter}
          />
          <span className="slider round"></span>
        </label>
      </div>

      {status !== "playing" && (
        <div className="info">
          <p>you won (press 🚀 to play again)</p>
        </div>
      )}
    </div>
  );
}
