import { useState, useMemo, useEffect } from "react";
import { generateMaze, solve } from "./components/util.js";
import "./App.css";
import CountdownTimer from "./components/CountDown.jsx";
import OpacityControl from "./components/OpacityControl.jsx";
import panelBg from "./assets/panelBg.png";
import Bgpanel from "./assets/BgPanel.png";
import CameraCapture from "./components/CameraFeed.jsx";
import AlertBox from "./components/AlertBox.jsx";
import { gameProgress } from "./components/util.js";
import { getWallColor } from "./components/util.js";
import MazeSizeSlider from "./components/Slider.jsx";
export default function App() {
  const [gameId, setGameId] = useState(1);
  const [status, setStatus] = useState("playing");
  const [wallColor, setWallColor] = useState("cyan");
  const [size, setSize] = useState(25); //set maze size to 30
  const [cheatMode, setCheatMode] = useState(false);
  const [direction, setDirection] = useState(null);
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
  }, [size, userPosition[0], userPosition[1], gameId]);

  useEffect(() => {
    const lastRowIndex = maze.length - 1;
    const lastColIndex = maze[0].length - 1;
    if (userPosition[0] === lastRowIndex && userPosition[1] === lastColIndex) {
      setStatus("won");
    }
  }, [userPosition[0], userPosition[1]]);

  const makeClassName = (i, j) => {
    const rows = maze.length;
    const cols = maze[0].length;
    let arr = [];
    if (maze[i][j][0] === 0) {
      arr.push("topWall");
    }
    if (maze[i][j][1] === 0) {
      arr.push("rightWall");
    }
    if (maze[i][j][2] === 0) {
      arr.push("bottomWall");
    }
    if (maze[i][j][3] === 0) {
      arr.push("leftWall");
    }
    if (i === rows - 1 && j === cols - 1) {
      arr.push("destination");
    }
    if (i === userPosition[0] && j === userPosition[1]) {
      arr.push("currentPosition");
    }

    if (cheatMode && solution.has(String(i) + "-" + String(j))) {
      arr.push("sol");
    }
    return arr.join(" ");
  };

  const handleMove = (e) => {
    e.preventDefault();
    if (status !== "playing") {
      return;
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
    const ws = new WebSocket("ws://localhost:4000");
    ws.onopen = () =>
      console.log("✅ Connected to WebSocket server for direction");
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log("Results", data);
        if (data.alert) {
          setAlert("Center your view!");

        } else if (data.direction && !data.alert) {
          setDirection(data.direction);
        } else console.log(data.message);
      } catch (err) {
        console.error("Invalid JSON:", err);
      }
    };

    ws.onclose = () => console.log("❌ WebSocket disconnected");
    ws.onerror = (err) => console.error("⚠️ WebSocket error:", err);

    return () => ws.close();
  }, []);
  useEffect(() => {
    if (!direction || status !== "playing") return;

    const [i, j] = userPosition;

    switch (direction) {
      case "up":
        if (maze[i][j][0] === 1) setUserPosition([i - 1, j]);
        break;
      case "right":
        if (maze[i][j][1] === 1) setUserPosition([i, j + 1]);
        break;
      case "down":
        if (maze[i][j][2] === 1) setUserPosition([i + 1, j]);
        break;
      case "left":
        if (maze[i][j][3] === 1) setUserPosition([i, j - 1]);
        break;
      default:
        break;
    }
  }, [direction]);

  const handleUpdateSettings = (size) => {
    // setSize(Number(document.querySelector("input[name='mazeSize']").value));
    setSize(size);
    setUserPosition([0, 0]);
    setStatus("playing");
    setGameId(gameId + 1);
  };
  return (
    <div
      onKeyDown={handleMove}
      tabIndex={-1}
      className="App relative flex   w-screen h-screen outline-none items-center  justify-around"
    >
      {/* Overlay */}
      {/* <div
    className="eye-overlay"
    style={{
      position: "absolute",
      top: 0,
      left: 0,
      width: "100%",
      height: "100%",
      pointerEvents: "none", // so clicks still go through
      background: "linear-gradient(to right, rgba(255,0,0,0.5) 50%, rgba(0,255,255,0.5) 50%)",
      zIndex: 10,
    }}
  /> */}
      {/* <div className="setting">
        <label htmlFor="mazeSize">Size of maze (5-40):</label>
        <input
          type="number"
          name="mazeSize"
          min="5"
          max="40"
          defaultValue="10"
        />
      </div> */}
      {/* bg-[#71737f5f]  */}
      <div
        className="setting flex flex-col items-center mb-4 w-[308px] h-[90vh] p-6"
        style={{
          backgroundImage: `url(${panelBg})`,
          backgroundSize: "100% 100%", // stretches image to fill container
          backgroundRepeat: "no-repeat", // prevent tiling
          backgroundPosition: "center",
          borderRadius: "20px",
        }}
      >
        <CameraCapture />
       {alert && <AlertBox message={alert} /> }
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

      <table id="maze" className="w-[60vw] h-[80vh] ">
        <tbody>
          {maze.map((row, i) => (
            <tr key={`row-${i}`}>
              {row.map((cell, j) => (
                <td
                  key={`cell-${i}-${j}`}
                  className={`${makeClassName(i, j)}`}
                  style={{ borderColor: wallColor }}
                >
                  <div />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {status !== "playing" && (
        <div className="info" onClick={size}>
          <p>you won (click here to play again)</p>
        </div>
      )}
    </div>
  );
}
