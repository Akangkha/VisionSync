// src/App.jsx
import { Routes, Route, Navigate } from "react-router-dom";
import WelcomePage from "./pages/WelcomePage.jsx";
import MazeGame from "./pages/MazeGame.jsx";

export default function App() {
  return (
    <Routes>
      <Route path="/welcome" element={<WelcomePage />} />
      <Route path="/playground" element={<MazeGame />} />
      {/* default redirect to /welcome */}
      <Route path="*" element={<Navigate to="/welcome" replace />} />
    </Routes>
  );
}
