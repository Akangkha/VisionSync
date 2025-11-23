import fs from "fs";
import path from "path";
import amqp from "amqplib";
import { loadEnvFile } from "node:process";
loadEnvFile();
const uploadDir = path.resolve("uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
  console.log("📁 Created uploads folder");
}
console.log("📁 Uploads folder exists at:", uploadDir);
const RABBITMQ_URL = process.env.RABBITMQ_URL1;
const QUEUE_NAME = process.env.QUEUE_NAME;

(async () => {
  const connection = await amqp.connect(RABBITMQ_URL);
  const channel = await connection.createChannel();
  await channel.assertQueue(QUEUE_NAME);

  console.log("🐰 Waiting for messages...");

  channel.consume(QUEUE_NAME, (msg) => {
    try {
      const payload = JSON.parse(msg.content.toString());
      const base64Image = payload.image;

      if (base64Image) {
        const matches = base64Image.match(/^data:image\/(\w+);base64,(.+)$/);

        if (!matches) {
          console.warn("⚠️ Invalid base64 image format received");
        } else {
          const imageType = matches[1];
          const imageData = matches[2];
          const buffer = Buffer.from(imageData, "base64");
          const uploadDir = "uploads";
          if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);
          const filePath = path.join(
            uploadDir,
            `image-${Date.now()}.${imageType}`
          );
          // fs.writeFileSync(filePath, buffer);

          // console.log(`✅ Saved image as ${filePath}`);
        }
      } else {
        console.warn("⚠️ Received JSON without image field");
      }
    } catch (err) {
      console.error("❌ Failed to parse message:", err);
    }
    channel.ack(msg);
  });
})();
