import amqplib from "amqplib";

(async () => {
  try {
    console.log("Connecting to RabbitMQ...");
    const conn = await amqplib.connect(
      "amqp://esperance:esperance@127.0.0.1:5672/"
    );
    console.log("✅ Connected to RabbitMQ!");
    await conn.close();
  } catch (err) {
    console.error("❌ Connection failed:", err.message);
  }
})();
