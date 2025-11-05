import React, { useEffect, useRef, useState } from "react";
import ServerStatus from "./ServerStatus";
import AlertStatus from "./AlertStatus";

const CameraCapture = () => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [socket, setSocket] = useState(null);
  const [logMessages, setLogMessages] = useState("");
  const [alertMessages, setAlertMessages] = useState(false);

  // Setup WebSocket connection
  useEffect(() => {
    const ws = new WebSocket("ws://localhost:4000"); // connect to backend
    setSocket(ws);

    ws.onopen = () => setLogMessages("connected to server");
    ws.onclose = () => setLogMessages("disconnected from server");
    ws.onerror = (err) => setLogMessages("error:", err);

    // Start camera
    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }

        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d");

        // Capture and send image
        const interval = setInterval(() => {
          if (!videoRef.current || ws.readyState !== WebSocket.OPEN) return;

          const video = videoRef.current;
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          context.drawImage(video, 0, 0, canvas.width, canvas.height);

          const imageData = canvas.toDataURL("image/jpeg");
          ws.send(JSON.stringify({ type: "image", image: imageData }));
          // console.log("📤 Sent image to server");
        }, 5000); //time
        return () => clearInterval(interval);
      } catch (err) {
        console.error("Error accessing camera:", err);
      }
    };

    startCamera();

    return () => ws.close();
  }, []);

  return (
    <div className="flex flex-col items-center gap-4 p-4 w-[70%]">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        className="rounded-lg border-2 border-[rgba(0,255,255,0.3)] p-4 m-2"
        style={{
          width: "100%",
          height: "180px",
          objectFit: "cover",
          borderRadius: "100%",
          boxShadow: "0 0 20px rgba(0,255,255,0.3)",
        }}
      />
      <canvas
        ref={canvasRef}
        className="p-4"
        style={{ display: "none", borderRadius: "100%" }}
      />
      <ServerStatus status={logMessages} />
      <AlertStatus status={alertMessages} />

      <div className="text-center text-black bg-amber-600">
        <p>{alertMessages}</p>
      </div>
    </div>
  );
};

export default CameraCapture;
