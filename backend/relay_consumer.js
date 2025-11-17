import amqp from "amqplib";
import WebSocket from "ws";
import { loadEnvFile } from "node:process";
loadEnvFile();

const RABBITMQ_URL = process.env.RABBITMQ_URL2;
const RESULT_QUEUE = process.env.QUEUE_NAME_RELAY;
const WS_SERVER_URL = "ws://localhost:4000";
console.log(RABBITMQ_URL);
(async () => {
  const connection = await amqp.connect(RABBITMQ_URL);
  const channel = await connection.createChannel();
  await channel.assertQueue(RESULT_QUEUE, { durable: true });

  console.log(`🐰 Listening for messages on queue: ${RESULT_QUEUE}`);

  channel.consume(RESULT_QUEUE, (msg) => {
    try {
      const payload = JSON.parse(msg.content.toString());
      console.log("Received result from RabbitMQ:", payload);

      const ws = new WebSocket(WS_SERVER_URL);

      ws.on("open", () => {
        ws.send(JSON.stringify(payload));
        console.log("Sent result to WebSocket:", payload);
        ws.close();
      });

      ws.on("error", (err) => console.error("⚠️ WebSocket error:", err));
    } catch (err) {
      console.error("Failed to parse message:", err);
    }

    channel.ack(msg);
  });
})();
