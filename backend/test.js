import express from "express";
import { WebSocketServer } from "ws";
import amqp from "amqplib";

const PORT = 4000;
const RABBITMQ_URL = "amqp://localhost";
const app = express();
const server = app.listen(PORT, () =>
  console.log(` Server running on http://localhost:${PORT}`)
);

const wss = new WebSocketServer({ server });

let channel;
const setupRabbit = async () => {
  try {
    const connection = await amqp.connect(RABBITMQ_URL);
    channel = await connection.createChannel();
    await channel.assertQueue("image_queue");
    console.log("Connected to RabbitMQ");
  } catch (err) {
    console.error("RabbitMQ connection failed:", err);
  }
};
setupRabbit();

wss.on("connection", (ws) => {
  console.log("WebSocket client connected.");

  ws.on("message", async (data) => {
    const message = data.toString();
    console.log("Received from frontend:", message);

    if (channel) {
      channel.sendToQueue("image_queue", Buffer.from(message));
      console.log("Sent to RabbitMQ:", message);
    }

    setTimeout(() => {
      const simulatedResult = message.includes("straight")
        ? " User is looking straight"
        : "Please face the camera";
      ws.send(simulatedResult);
      console.log("Sent back to frontend:", simulatedResult);
    }, 1000);
  });

  ws.on("close", () => console.log("WebSocket client disconnected."));
});

import WebSocket from "ws";

const ws = new WebSocket("ws://localhost:4000");

ws.on("open", () => {
  console.log("✅ Connected to backend via WebSocket.");

  setInterval(() => {
    const msg = Math.random() > 0.5 ? "straight" : "left";
    console.log("Sending:", msg);
    ws.send(msg);
  }, 2000);
});

ws.on("message", (data) => {
  console.log(" Received from server:", data.toString());
});
