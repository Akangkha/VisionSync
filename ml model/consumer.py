import pika, json, base64, io, os
from PIL import Image
from datetime import datetime

RABBITMQ_URL = "amqp://akangkha:akangkha@localhost:5672/"
QUEUE_NAME = "image_queue"
RESULT_QUEUE = "results_queue"
UPLOADS_DIR = "processed_images"

# Ensure folder exists
os.makedirs(UPLOADS_DIR, exist_ok=True)

# Connect to RabbitMQ
params = pika.URLParameters(RABBITMQ_URL)
connection = pika.BlockingConnection(params)
channel = connection.channel()

# Declare queues
channel.queue_declare(queue=QUEUE_NAME)
channel.queue_declare(queue=RESULT_QUEUE)

print("🐍 Python ML Consumer waiting for images...")

def classify_image(image: Image.Image) -> str:
    """Dummy ML logic """
    grayscale = image.convert("L")
    avg_pixel = sum(grayscale.getdata()) / (grayscale.width * grayscale.height)
    return "bright" if avg_pixel > 127 else "dark"

def callback(ch, method, properties, body):
    try:
        payload = json.loads(body.decode())
        base64_image = payload.get("image")

        if base64_image:
            if base64_image.startswith("data:image"):
                base64_image = base64_image.split(",")[1]

            image_data = base64.b64decode(base64_image)
            image = Image.open(io.BytesIO(image_data))

            result = classify_image(image)  # Perform classification

            # Save image for reference
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            file_path = os.path.join(UPLOADS_DIR, f"{result}_{timestamp}.png")
            image.save(file_path)
            print(f"✅ Saved processed image: {file_path}")
            print(f"🧠 Classification result: {result}")

            # Send result back to RabbitMQ
            result_payload = json.dumps({"classification": result})
            channel.basic_publish(
                exchange="",
                routing_key=RESULT_QUEUE,
                body=result_payload
            )
            print(f"📤 Sent result to {RESULT_QUEUE}: {result}")

        else:
            print("⚠️ No image field found in message.")

    except Exception as e:
        print("❌ Error processing message:", e)

    ch.basic_ack(delivery_tag=method.delivery_tag)

# Start consuming
channel.basic_consume(queue=QUEUE_NAME, on_message_callback=callback)
channel.start_consuming()
