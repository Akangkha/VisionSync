import cv2
import json
import asyncio
import websockets
import time
import os
import numpy as np
import mediapipe as mp
import pika  # <-- new

# Optional: enable keyboard control for the game (pip install pyautogui)
try:
    import pyautogui
    KEYBOARD_AVAILABLE = True
except Exception:
    KEYBOARD_AVAILABLE = False

CALIB_FILE = "calibration.json"
CALIB_UP_OFFSET = 0.04
TARGET_FPS = 15
WEBSOCKET_PORT = 8765

# RabbitMQ settings (optional - will be used if RABBITMQ_URL set or default provided)
RESULT_QUEUE = os.getenv("RESULT_QUEUE", "results_queue")
RABBITMQ_URL = os.getenv(
    "RABBITMQ_URL",
    "amqps://tvccbsoq:GeTnThLYePzJW7hl5kyTAT6yD-luoH3i@campbell.lmq.cloudamqp.com/tvccbsoq",
)

# Setup RabbitMQ connection (optional; safe fallback if broker unreachable)
RABBITMQ_CONN = None
RABBITMQ_CH = None
def init_rabbitmq():
    global RABBITMQ_CONN, RABBITMQ_CH
    try:
        params = pika.URLParameters(RABBITMQ_URL)
        RABBITMQ_CONN = pika.BlockingConnection(params)
        RABBITMQ_CH = RABBITMQ_CONN.channel()
        RABBITMQ_CH.queue_declare(queue=RESULT_QUEUE, durable=True)
        print("RabbitMQ connected, publishing to queue:", RESULT_QUEUE)
    except Exception as e:
        print("RabbitMQ init failed (continuing without MQ):", e)
        RABBITMQ_CONN = None
        RABBITMQ_CH = None

def publish_to_rabbit(msg: dict):
    """Publish JSON message to results queue if RabbitMQ initialized."""
    try:
        if RABBITMQ_CH is None:
            return
        body = json.dumps(msg)
        RABBITMQ_CH.basic_publish(
            exchange="",
            routing_key=RESULT_QUEUE,
            body=body,
            properties=pika.BasicProperties(delivery_mode=2),  # persistent
        )
        # debug log each published message
        print(f"Published to RabbitMQ queue '{RESULT_QUEUE}': {body}")
    except Exception as e:
        # keep running even if publish fails
        print("RabbitMQ publish failed:", e)

mp_face_mesh = mp.solutions.face_mesh

# Landmarks used (MediaPipe FaceMesh refined landmarks)
LEFT_IRIS_IDX = 474
RIGHT_IRIS_IDX = 469
NOSE_TIP_IDX = 1

# Deadzones (tweak as needed)
X_DEADZONE = 0.025
Y_DEADZONE = 0.025

# Broadcast queue to send messages to connected websocket clients
WS_CLIENTS = set()


async def ws_handler(websocket, path):
    WS_CLIENTS.add(websocket)
    try:
        async for _ in websocket:
            # No inbound messages are required; keep connection open
            pass
    finally:
        WS_CLIENTS.remove(websocket)


async def broadcast_message(msg: dict):
    if not WS_CLIENTS:
        return
    payload = json.dumps(msg)
    await asyncio.wait([ws.send(payload) for ws in WS_CLIENTS])


def load_calibration():
    if os.path.exists(CALIB_FILE):
        try:
            with open(CALIB_FILE, "r") as f:
                return json.load(f)
        except Exception:
            pass
    return {"x": 0.0, "y": 0.0}


def save_calibration(calib):
    try:
        with open(CALIB_FILE, "w") as f:
            json.dump(calib, f)
    except Exception as e:
        print("Failed to save calibration:", e)


def decide_direction(obs_x, obs_y, calib_x, calib_y, x_thresh=0.03, y_thresh=0.03):
    """
    Decide one of four directions (left, right, up, down) from observed iris vs nose offsets.
    - obs_x, obs_y : observed offsets (iris midpoint - nose) from current frame
    - calib_x, calib_y : baseline offsets saved at calibration
    - x_thresh, y_thresh : minimum movement to consider for each axis (tweak for sensitivity)

    Note: MediaPipe normalized y grows downward, so positive dy -> gaze moves down.
    """
    dx = obs_x - calib_x
    dy = obs_y - calib_y

    # Deadzone: if both deltas are small, treat as baseline ("up" by your spec)
    if abs(dx) < x_thresh and abs(dy) < y_thresh:
        return "up"

    # Choose dominant axis to avoid diagonal ambiguity
    if abs(dx) >= abs(dy):
        return "right" if dx > 0 else "left"
    else:
        return "down" if dy > 0 else "up"


async def main_loop(use_keyboard=False):
    # initialize rabbitmq if available
    init_rabbitmq()

    # start websocket server
    ws_server = await websockets.serve(ws_handler, "0.0.0.0", WEBSOCKET_PORT)
    print(f"WebSocket server started on ws://localhost:{WEBSOCKET_PORT}")

    calibration = load_calibration()
    print("Loaded calibration:", calibration)
    cap = cv2.VideoCapture(0, cv2.CAP_DSHOW)

    with mp_face_mesh.FaceMesh(
        static_image_mode=False,
        max_num_faces=1,
        refine_landmarks=True,
        min_detection_confidence=0.5,
        min_tracking_confidence=0.5,
    ) as fm:
        last_send = 0
        last_direction = None
        while True:
            ret, frame = cap.read()
            if not ret:
                print("Camera read failed")
                break

            # Resize for speed but keep aspect
            height, width = frame.shape[:2]
            rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            results = fm.process(rgb)

            frame_out = frame.copy()
            timestamp = time.time()

            if results and results.multi_face_landmarks:
                lm = results.multi_face_landmarks[0].landmark

                # compute normalized offsets using mediapipe normalized coordinates
                left = lm[LEFT_IRIS_IDX]
                right = lm[RIGHT_IRIS_IDX]
                nose = lm[NOSE_TIP_IDX]

                mid_x = (left.x + right.x) / 2.0
                mid_y = (left.y + right.y) / 2.0
                obs_x = mid_x - nose.x
                obs_y = mid_y - nose.y

                # determine direction
                direction = decide_direction(obs_x, obs_y, calibration.get("x", 0.0), calibration.get("y", 0.0))
                alert = False if direction == "up" else True

                # Build the message payload
                msg = {
                    "timestamp": timestamp,
                    "direction": direction,
                    "alert": alert,
                    "dx": obs_x - calibration.get("x", 0.0),
                    "dy": obs_y - calibration.get("y", 0.0),
                }

                # broadcast to websockets and publish to RabbitMQ
                if timestamp - last_send > 1.0 / TARGET_FPS or direction != last_direction:
                    asyncio.create_task(broadcast_message(msg))
                    publish_to_rabbit(msg)  # <-- publish direction to results queue
                    last_send = timestamp
                    last_direction = direction

                # visualization code (unchanged)
                def to_px(norm_x, norm_y):
                    return int(norm_x * width), int(norm_y * height)

                lx, ly = to_px(left.x, left.y)
                rx, ry = to_px(right.x, right.y)
                nx, ny = to_px(nose.x, nose.y)
                cv2.circle(frame_out, (lx, ly), 3, (0, 255, 0), -1)
                cv2.circle(frame_out, (rx, ry), 3, (0, 255, 0), -1)
                cv2.circle(frame_out, (nx, ny), 3, (0, 0, 255), -1)
                cv2.line(frame_out, (lx, ly), (rx, ry), (255, 255, 0), 1)
                info = f"Dir: {direction}  alert: {alert}  dx:{msg['dx']:.4f} dy:{msg['dy']:.4f}"
                cv2.putText(frame_out, info, (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 255), 2)

                # optional keyboard control
                if use_keyboard and KEYBOARD_AVAILABLE:
                    if direction == "left":
                        pyautogui.press("left")
                    elif direction == "right":
                        pyautogui.press("right")
                    elif direction == "up":
                        pyautogui.press("up")
                    elif direction == "down":
                        pyautogui.press("down")

            else:
                cv2.putText(frame_out, "Face not detected", (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 0, 255), 2)
                # broadcast face-missing alert and publish to queue
                if timestamp - last_send > 1.0 / TARGET_FPS:
                    msg = {"timestamp": timestamp, "direction": "N/A", "alert": True, "message": "face_not_detected"}
                    asyncio.create_task(broadcast_message(msg))
                    publish_to_rabbit(msg)
                    last_send = timestamp

            cv2.imshow("Realtime Gaze (press 'c' to calibrate, 'q' to quit)", frame_out)
            key = cv2.waitKey(1) & 0xFF
            if key == ord("q"):
                break
            if key == ord("c"):
                # if face currently detected, save calibration using current observed offsets
                if results and results.multi_face_landmarks:
                    calibration = {"x": obs_x, "y": obs_y + CALIB_UP_OFFSET}
                    save_calibration(calibration)
                    print("Calibration saved:", calibration)
                else:
                    print("No face to calibrate. Move face into frame and press 'c'.")

    cap.release()
    cv2.destroyAllWindows()
    # close rabbitmq gracefully
    try:
        if RABBITMQ_CONN:
            RABBITMQ_CONN.close()
    except Exception:
        pass
    ws_server.close()
    await ws_server.wait_closed()


if __name__ == "_main_":
    # run main loop (keyboard control optional: set True to enable pyautogui presses)
    use_keyboard_control = False
    asyncio.run(main_loop(use_keyboard=use_keyboard_control))