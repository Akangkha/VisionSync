import sys
# set selector loop on Windows before other asyncio imports
if sys.platform.startswith("win"):
    import asyncio
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

import os
import time
import json
import asyncio
import traceback

import cv2
import numpy as np
import mediapipe as mp
import pika
import websockets
from aiohttp import ClientSession
from aiortc import RTCPeerConnection, RTCSessionDescription

# CONFIG
SIGNALING_WS = os.getenv("SIGNALING_WS", "ws://10.201.141.75:4000")  # same endpoint used by local.py
CALIB_FILE = "calibration.json"
CALIB_UP_OFFSET = 0.04
SEND_INTERVAL = float(os.getenv("SEND_INTERVAL", "4.0"))
RESULT_QUEUE = os.getenv("RESULT_QUEUE", "results_queue")
RABBITMQ_URL = os.getenv("RABBITMQ_URL", "amqps://tvccbsoq:GeTnThLYePzJW7hl5kyTAT6yD-luoH3i@campbell.lmq.cloudamqp.com/tvccbsoq")
WEBSOCKET_PORT = int(os.getenv("WEBSOCKET_PORT", "8765"))

# mediapipe indices
LEFT_IRIS_IDX = 474
RIGHT_IRIS_IDX = 469
NOSE_TIP_IDX = 1
X_DEADZONE = 0.03
Y_DEADZONE = 0.03

# RabbitMQ helpers (synchronous)
RABBIT_CONN = None
RABBIT_CH = None


def init_rabbitmq():
    global RABBIT_CONN, RABBIT_CH
    try:
        params = pika.URLParameters(RABBITMQ_URL)
        RABBIT_CONN = pika.BlockingConnection(params)
        RABBIT_CH = RABBIT_CONN.channel()
        RABBIT_CH.queue_declare(queue=RESULT_QUEUE, durable=True)
        print("RabbitMQ connected ->", RESULT_QUEUE)
    except Exception as e:
        RABBIT_CONN = None
        RABBIT_CH = None
        print("RabbitMQ init failed (continuing without MQ):", e)


def sync_publish(msg: dict):
    if RABBIT_CH is None:
        return
    try:
        body = json.dumps(msg)
        RABBIT_CH.basic_publish(exchange="", routing_key=RESULT_QUEUE, body=body,
                               properties=pika.BasicProperties(delivery_mode=2))
        print("Published to RabbitMQ:", body)
    except Exception as e:
        print("RabbitMQ publish failed:", e)


# WebSocket broadcaster for game/clients
WS_CLIENTS = set()


async def ws_handler(ws, path):
    WS_CLIENTS.add(ws)
    try:
        async for _ in ws:
            pass
    finally:
        WS_CLIENTS.remove(ws)


async def broadcast_message(msg: dict):
    if not WS_CLIENTS:
        return
    payload = json.dumps(msg)
    await asyncio.wait([ws.send(payload) for ws in WS_CLIENTS])


# calibration and gaze logic
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
        print("Failed saving calibration:", e)


def decide_direction(obs_x, obs_y, calib_x, calib_y, x_thresh=X_DEADZONE, y_thresh=Y_DEADZONE):
    dx = obs_x - calib_x
    dy = obs_y - calib_y
    if abs(dx) <= x_thresh and abs(dy) <= y_thresh:
        return "up"
    if abs(dx) >= abs(dy):
        return "right" if dx > 0 else "left"
    else:
        return "down" if dy > 0 else "up"


# main: connect to your signaling server (same protocol as local.py) and process incoming track
async def run():
    init_rabbitmq()
    # start websocket server for clients
    ws_server = await websockets.serve(ws_handler, "0.0.0.0", WEBSOCKET_PORT)
    print(f"WebSocket server on ws://localhost:{WEBSOCKET_PORT}")

    calibration = load_calibration()
    print("Loaded calibration:", calibration)

    mp_face_mesh = mp.solutions.face_mesh
    face_mesh = mp_face_mesh.FaceMesh(static_image_mode=False, max_num_faces=1, refine_landmarks=True,
                                      min_detection_confidence=0.4, min_tracking_confidence=0.4)

    pc = RTCPeerConnection()

    async with ClientSession() as session:
        # open signaling websocket (same approach as local.py)
        async with session.ws_connect(SIGNALING_WS) as ws:
            # register like local.py (optional, depends on server)
            try:
                await ws.send_json({"register": "mlserver"})
            except Exception:
                pass

            @pc.on("track")
            def on_track(track):
                print("Track received:", track.kind)

                async def recv_loop():
                    nonlocal calibration
                    last_send = 0.0
                    # receive frames from track
                    while True:
                        try:
                            frame = await track.recv()
                        except Exception:
                            break
                        img = frame.to_ndarray(format="bgr24")
                        rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
                        results = face_mesh.process(rgb)

                        direction = "N/A"
                        dx = dy = 0.0
                        obs_x = obs_y = 0.0
                        if results and results.multi_face_landmarks:
                            lm = results.multi_face_landmarks[0].landmark
                            left = lm[LEFT_IRIS_IDX]
                            right = lm[RIGHT_IRIS_IDX]
                            nose = lm[NOSE_TIP_IDX]

                            mid_x = (left.x + right.x) / 2.0
                            mid_y = (left.y + right.y) / 2.0
                            obs_x = mid_x - nose.x
                            obs_y = mid_y - nose.y

                            if calibration.get("x", 0.0) == 0.0 and calibration.get("y", 0.0) == 0.0:
                                calibration = {"x": obs_x, "y": obs_y + CALIB_UP_OFFSET}
                                save_calibration(calibration)
                                print("Auto-saved calibration:", calibration)

                            dx = obs_x - calibration.get("x", 0.0)
                            dy = obs_y - calibration.get("y", 0.0)
                            direction = decide_direction(obs_x, obs_y, calibration.get("x", 0.0), calibration.get("y", 0.0))

                        now = time.time()
                        if (now - last_send) >= SEND_INTERVAL:
                            # per your earlier request keep alert False
                            msg = {"timestamp": now, "direction": direction, "alert": False, "dx": dx, "dy": dy}
                            print("Gaze msg:", msg)
                            # publish to RabbitMQ in executor
                            if RABBIT_CH:
                                asyncio.get_event_loop().run_in_executor(None, sync_publish, msg)
                            # broadcast to WS clients
                            asyncio.create_task(broadcast_message(msg))
                            last_send = now

                        # preview window (optional)
                        try:
                            cv2.putText(img, f"{direction}", (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (255, 255, 0), 2)
                            cv2.imshow("ML Stream Gaze", img)
                            if cv2.waitKey(1) & 0xFF == ord("q"):
                                break
                        except Exception:
                            pass

                asyncio.create_task(recv_loop())

            # handle signaling messages: receive offer/candidate, send answer
            async for msg in ws:
                if msg.type != 1:  # TEXT
                    continue
                try:
                    data = json.loads(msg.data)
                except Exception:
                    continue

                # server sends type "offer" with sdp
                if data.get("type") == "offer":
                    offer = RTCSessionDescription(sdp=data["sdp"], type="offer")
                    await pc.setRemoteDescription(offer)
                    answer = await pc.createAnswer()
                    await pc.setLocalDescription(answer)
                    # send answer back using the same ws protocol expected by your signalling server
                    try:
                        await ws.send_json({"type": "answer", "sdp": pc.localDescription.sdp})
                    except Exception:
                        pass

                elif data.get("type") == "candidate":
                    try:
                        await pc.addIceCandidate(data["candidate"])
                    except Exception:
                        pass

    # cleanup
    face_mesh.close()
    await pc.close()
    cv2.destroyAllWindows()
    if RABBIT_CONN:
        try:
            RABBIT_CONN.close()
        except Exception:
            pass
    ws_server.close()
    await ws_server.wait_closed()


if __name__ == "__main__":
    try:
        asyncio.run(run())
    except KeyboardInterrupt:
        print("Interrupted")
    except Exception as e:
        print("Unhandled error:", repr(e))
        traceback.print_exc()