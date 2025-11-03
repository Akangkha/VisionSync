import React, { useEffect, useRef, useState } from "react";

const CameraCapture = () => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [socket, setSocket] = useState(null);
  const [logMessages, setLogMessages] = useState("");
  const [alertMessages, setAlertMessages] = useState("");

  // Setup WebSocket connection
  useEffect(() => {
    const ws = new WebSocket("ws://localhost:4000"); // connect to backend
    setSocket(ws);

    ws.onopen = () => console.log("✅ Connected to WebSocket server");
    ws.onclose = () => console.log("❌ Disconnected from WebSocket server");
    ws.onerror = (err) => console.error("⚠️ WebSocket error:", err);

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
          console.log("📤 Sent image to server");
        }, 5000); //time
        return () => clearInterval(interval);
      } catch (err) {
        console.error("Error accessing camera:", err);
      }
    };

    startCamera();

    return () => ws.close();
  }, []);

  // // Start the camera
  // useEffect(() => {
  //   const startCamera = async () => {
  //     try {
  //       const stream = await navigator.mediaDevices.getUserMedia({
  //         video: true,
  //         audio: false,
  //       });
  //       if (videoRef.current) {
  //         videoRef.current.srcObject = stream;
  //       }
  //     } catch (error) {
  //       console.error("Error accessing camera:", error);
  //     }
  //   };
  //   startCamera();
  // }, []);

  const sendDummyText = () => {
    // if (socket && socket.readyState === WebSocket.OPEN) {
    //   socket.send("Hello from client 👋");
    //   setLogMessages("📤 Sent: Hello from client 👋");
    // } else {
    //   setLogMessages("❌ WebSocket not connected");
    // }
  };

  return (
    <div className="flex flex-col items-center gap-4 p-4">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        className="rounded-lg border-2 border-gray-400"
        style={{ width: "300px", height: "200px", objectFit: "cover" }}
      />
      <canvas ref={canvasRef} style={{ display: "none" }} />

      <button
        onClick={sendDummyText}
        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
      >
        Send Dummy Text
      </button>

      <div className="mt-4 w-full text-center">
        <p>{logMessages}</p>
        <p>{alertMessages}</p>
      </div>
    </div>
  );
};

export default CameraCapture;
