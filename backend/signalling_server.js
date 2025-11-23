// signaling_server.js
import WebSocket, { WebSocketServer } from "ws";
import http from "http";

const server = http.createServer();
const wss = new WebSocketServer({ server });

let mlSocket = null; // store ML server connection

wss.on("connection", (ws) => {
  console.log("🔗 New WebSocket connection");

  ws.on("message", (msg) => {
    let data;
    try {
      data = JSON.parse(msg);
    } catch {
      console.error("❌ Invalid JSON:", msg.toString());
      return;
    }

    // 🧠 When Python ML server registers itself
    if (data.register === "mlserver") {
      mlSocket = ws;
      ws.isML = true;
      console.log("✅ ML server registered");
      return;
    }

    // 🧩 React client → ML server
    if (data.type === "offer") {
      console.log("📨 Offer received from React");
      if (mlSocket && mlSocket.readyState === WebSocket.OPEN) {
        mlSocket.send(JSON.stringify(data));
      } else {
        console.error("❌ No ML server connected");
      }
    }

    // 🧩 ML server → React client
    else if (data.type === "answer") {
      console.log("📡 Answer received from ML server");
      for (const client of wss.clients) {
        if (!client.isML && client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify(data));
        }
      }
    }

    // 🧩 Handle ICE candidates (both directions)
    else if (data.type === "candidate") {
      for (const client of wss.clients) {
        if (client !== ws && client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify(data));
        }
      }
    }
  });

  ws.on("close", () => {
    if (ws.isML) {
      console.log("❌ ML server disconnected");
      mlSocket = null;
    } else {
      console.log("❌ React client disconnected");
    }
  });
});

server.listen(4000, () =>
  console.log("🚀 Signaling server running on ws://localhost:4000")
);
