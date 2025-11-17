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
          // ws.send(JSON.stringify({ type: "image", image: imageData }));
          // console.log("📤 Sent image to server");
        }, 65000); //time
        return () => clearInterval(interval);
      } catch (err) {
        console.error("Error accessing camera:", err);
      }
    };

    // startCamera();

    return () => ws.close();
  }, []);

  useEffect(() => {
    const ws = new WebSocket("ws://localhost:4000"); // signaling server
    let pc;

    ws.onopen = async () => {
      // setStatus("Connected to signaling server");

      // 1️⃣ get camera stream
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480 },
        audio: false,
      });
      videoRef.current.srcObject = stream;

      // 2️⃣ create WebRTC peer
      pc = new RTCPeerConnection({
        iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
      });

      // send each track
      stream.getTracks().forEach((t) => pc.addTrack(t, stream));

      // 3️⃣ handle ICE candidates
      pc.onicecandidate = (e) => {
        if (e.candidate)
          ws.send(
            JSON.stringify({ type: "candidate", candidate: e.candidate })
          );
      };

      // 4️⃣ create and send SDP offer
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      ws.send(JSON.stringify({ type: "offer", sdp: offer.sdp }));
    };

    ws.onmessage = async (msg) => {
      const data = JSON.parse(msg.data);
      if (data.type === "answer") {
        await pc.setRemoteDescription({ type: "answer", sdp: data.sdp });
        console.log("Streaming to ML server...");
      } else if (data.type === "candidate") {
        await pc.addIceCandidate(data.candidate);
      }
    };

    return () => {
      ws.close();
      pc && pc.close();
    };
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
