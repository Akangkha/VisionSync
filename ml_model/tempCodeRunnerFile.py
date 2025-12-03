import os
import pika
import json
import base64
import io
from PIL import Image
from datetime import datetime


QUEUE_NAME = "image_queue"
RABBITMQ_URL = "YOUR URL"
RESULT_QUEUE = "results_queue"
UPLOADS_DIR = "processed_images"

# Ensure upload directory exists
os.makedirs(UPLOADS_DIR, exist_ok=True)

# Connect to RabbitMQ
params = pika.URLParameters(RABBITMQ_URL)
connection = pika.BlockingConnection(params)
channel = connection.channel()

# Declare queues (non-durable to match Node setup)
channel.queue_declare(queue=QUEUE_NAME, durable=True)
channel.queue_declare(queue=RESULT_QUEUE, durable=True)


print(f"🐍 ML Consumer connected to RabbitMQ at {RABBITMQ_URL}")
print(f"📥 Listening for images on queue: {QUEUE_NAME}")
print(f"📤 Results will be published to: {RESULT_QUEUE}\n")

def classify_image(image: Image.Image) -> str:
    """Dummy classification logic - replace with your ML model later."""
    grayscale = image.convert("L")
    avg_pixel = sum(grayscale.getdata()) / (grayscale.width * grayscale.height)
    return "bright" if avg_pixel > 127 else "dark"

def callback(ch, method, properties, body):
    try:
        payload = json.loads(body.decode())
        base64_image = payload.get("image")

        if base64_image:
            # Remove data:image/... prefix if present
            if base64_image.startswith("data:image"):
                base64_image = base64_image.split(",")[1]

            image_data = base64.b64decode(base64_image)
            image = Image.open(io.BytesIO(image_data))

            # Perform ML classification
            result = classify_image(image)

            # Save processed image
            # timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            # file_path = os.path.join(UPLOADS_DIR, f"{result}_{timestamp}.png")
            # image.save(file_path)
            # print(f"✅ Processed and saved image: {file_path}")
            # print(f"🧠 Classification result: {result}")

            # Publish result
            result_payload = json.dumps({"alert": result,
                                         "direction": "N/A",
                                         "message": f"Image classified as {result}"}).encode()
            channel.basic_publish(
                exchange="",
                routing_key=RESULT_QUEUE,
                body=result_payload
            )
            print(f"📤 Published result to {RESULT_QUEUE}: {result_payload}\n")

        else:
            print("⚠️ Received message without image field")

    except Exception as e:
        print(f"❌ Error processing message: {e}")

    ch.basic_ack(delivery_tag=method.delivery_tag)

# Start consuming
channel.basic_consume(queue=QUEUE_NAME, on_message_callback=callback)
channel.start_consuming()
