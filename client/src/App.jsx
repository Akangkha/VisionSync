import { useState, useMemo, useEffect } from "react";
import { generateMaze, solve } from "./components/util.js";
import "./App.css";
import CountdownTimer from "./components/CountDown.jsx";
import OpacityControl from "./components/OpacityControl.jsx";
import CameraCapture from "./components/CameraFeed.jsx";

export default function App() {
  const [gameId, setGameId] = useState(1);
  const [status, setStatus] = useState("playing");

  const [size, setSize] = useState(25); //set maze size to 30
  const [cheatMode, setCheatMode] = useState(false);

  const [userPosition, setUserPosition] = useState([0, 0]);

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
  };

  const handleUpdateSettings = () => {
    // setSize(Number(document.querySelector("input[name='mazeSize']").value));
    setSize(25);
    setUserPosition([0, 0]);
    setStatus("playing");
    setGameId(gameId + 1);
  };
  const [brightness, setBrightness] = useState(100);
  const [opacity, setOpacity] = useState(1);


  useEffect(() => {
    document.documentElement.style.setProperty(
      "--wall-brightness",
      `${brightness}%`
    );
    document.documentElement.style.setProperty("--wall-opacity", opacity);
  }, [brightness, opacity]);

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

      <div className="setting  bg-white p-4 rounded-lg flex flex-col items-center mb-4 ">
        <CameraCapture />
        <CountdownTimer />
        <button
          onClick={handleUpdateSettings}
          className="px-5 py-2 bg-[#222] rounded-md m-2 text-white hover:bg-gray-800 font-bold"
        >
          Restart game
        </button>
        <div className="flex items-center justify-center gap-2">
          <label htmlFor="cheatMode">Cheat mode</label>
          <input
            type="checkbox"
            name="cheatMode"
            onChange={(e) => setCheatMode(e.target.checked)}
          />
        </div>
        {/* <OpacityControl /> */}
      </div>

      <table id="maze" className="w-[60vw] h-[80vh] ">
        <tbody>
          {maze.map((row, i) => (
            <tr key={`row-${i}`}>
              {row.map((cell, j) => (
                <td key={`cell-${i}-${j}`} className={`${makeClassName(i, j)}`}>
                  <div />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {status !== "playing" && (
        <div className="info" onClick={handleUpdateSettings}>
          <p>you won (click here to play again)</p>
        </div>
      )}
    </div>
  );
}
