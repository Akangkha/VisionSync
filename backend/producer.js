import express from "express";
import { WebSocketServer } from "ws";
import amqp from "amqplib";
import { loadEnvFile } from "node:process";
loadEnvFile();

const PORT = 5000;
const RABBITMQ_URL = process.env.RABBITMQ_URL1;
const IMAGE_QUEUE = process.env.QUEUE_NAME; // queue for images
const RESULT_QUEUE = process.env.QUEUE_NAME_RELAY; // queue for ML results
console.log(RABBITMQ_URL);
const app = express();
const server = app.listen(PORT, () =>
  console.log(`Server running on http://localhost:${PORT}`)
);

const wss = new WebSocketServer({ server });

let channel;

(async () => {
  try {
    const connection = await amqp.connect(RABBITMQ_URL);
    channel = await connection.createChannel();

    await channel.assertQueue(IMAGE_QUEUE, { durable: true });
    await channel.assertQueue(RESULT_QUEUE, { durable: true });
    console.log("Connected to RabbitMQ");

    channel.consume(RESULT_QUEUE, (msg) => {
      if (msg) {
        const payload = JSON.parse(msg.content.toString());
        console.log("ML Result received:", payload);
        wss.clients.forEach((client) => {
          if (client.readyState === 1) {
            client.send(JSON.stringify(payload));
          }
        });

        channel.ack(msg);
      }
    });
  } catch (err) {
    console.error("RabbitMQ connection failed:", err);
  }
})();

wss.on("connection", (ws) => {
  console.log(" WebSocket client connected.");

  ws.on("message", (raw) => {
    try {
      const msg = JSON.parse(raw.toString());

      if (msg.type === "image" && msg.image) {
        console.log("📸 Received image from client");
        if (channel) {
          channel.sendToQueue(
            IMAGE_QUEUE,
            Buffer.from(JSON.stringify({ image: msg.image }))
          );
          console.log("Image pushed to RabbitMQ queue");
          ws.send(JSON.stringify({ message: "Image forwarded to RabbitMQ" }));
        } else {
          ws.send(JSON.stringify({ message: "RabbitMQ channel not ready" }));
        }
      } else {
        ws.send(JSON.stringify({ message: "Invalid message format" }));
      }
    } catch (err) {
      console.error("Error parsing message:", err);
      ws.send(JSON.stringify({ message: "Invalid JSON" }));
    }
  });

  ws.on("close", () => console.log("Client disconnected"));
});
