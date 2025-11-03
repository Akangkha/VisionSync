import express from "express";
import { WebSocketServer } from "ws";
import amqp from "amqplib";
import { loadEnvFile } from "node:process";
loadEnvFile();

const PORT = 4000;
const RABBITMQ_URL = process.env.RABBITMQ_URL2;
const QUEUE_NAME = process.env.QUEUE_NAME;

const app = express();
const server = app.listen(PORT, () =>
  console.log(`🚀 Server running on http://localhost:${PORT}`)
);

const wss = new WebSocketServer({ server });
let channel;
(async () => {
  try {
    const connection = await amqp.connect(RABBITMQ_URL);
    channel = await connection.createChannel();
    await channel.assertQueue(QUEUE_NAME);
    console.log("Connected to RabbitMQ");
  } catch (err) {
    console.error("RabbitMQ connection failed:", err);
  }
})();

wss.on("connection", (ws) => {
  console.log("WebSocket client connected.");

  ws.on("message", (raw) => {
    try {
      const msg = JSON.parse(raw.toString());

      if (msg.type === "image" && msg.image) {
        console.log("📩 Received image from client");
        if (channel) {
          channel.sendToQueue(
            QUEUE_NAME,
            Buffer.from(JSON.stringify({ image: msg.image }))
          );
          console.log("📤 Image pushed to RabbitMQ queue");
          ws.send("✅ Image forwarded to RabbitMQ");
        } else {
          ws.send("RabbitMQ channel not ready");
        }
      } else {
        ws.send("Invalid message format");
      }
    } catch (err) {
      console.error("Error parsing message:", err);
      ws.send("Invalid JSON");
    }
  });

  ws.on("close", () => console.log("Client disconnected"));
});
