import cv2
import json
import asyncio
import websockets
import time
import os
import numpy as np
import mediapipe as mp

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


def decide_direction(obs_x, obs_y, calib_x, calib_y):
    dx = obs_x - calib_x
    dy = obs_y - calib_y
    # debug: return numeric deltas if needed
    if abs(dx) <= X_DEADZONE and abs(dy) <= Y_DEADZONE:
        return "up"
    if abs(dx) >= abs(dy):
        return "right" if dx > 0 else "left"
    else:
        return "down" if dy > 0 else "up"


async def main_loop(use_keyboard=False):
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

                # visualize points (convert normalized to pixel)
                def to_px(norm_x, norm_y):
                    return int(norm_x * width), int(norm_y * height)

                lx, ly = to_px(left.x, left.y)
                rx, ry = to_px(right.x, right.y)
                nx, ny = to_px(nose.x, nose.y)
                cv2.circle(frame_out, (lx, ly), 3, (0, 255, 0), -1)
                cv2.circle(frame_out, (rx, ry), 3, (0, 255, 0), -1)
                cv2.circle(frame_out, (nx, ny), 3, (0, 0, 255), -1)
                cv2.line(frame_out, (lx, ly), (rx, ry), (255, 255, 0), 1)

                direction = decide_direction(obs_x, obs_y, calibration.get("x", 0.0), calibration.get("y", 0.0))
                alert = False if direction == "up" else True

                # Display info
                info = f"Dir: {direction}  alert: {alert}  dx:{(obs_x-calibration.get('x',0)):.4f} dy:{(obs_y-calibration.get('y',0)):.4f}"
                cv2.putText(frame_out, info, (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 255), 2)

                # send updates at most TARGET_FPS
                if timestamp - last_send > 1.0 / TARGET_FPS or direction != last_direction:
                    msg = {"timestamp": timestamp, "direction": direction, "alert": alert}
                    asyncio.create_task(broadcast_message(msg))
                    last_send = timestamp
                    last_direction = direction

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
                # broadcast face-missing alert
                if timestamp - last_send > 1.0 / TARGET_FPS:
                    msg = {"timestamp": timestamp, "direction": "N/A", "alert": True, "message": "face_not_detected"}
                    asyncio.create_task(broadcast_message(msg))
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
    ws_server.close()
    await ws_server.wait_closed()


if __name__ == "__main__":
    # run main loop (keyboard control optional: set True to enable pyautogui presses)
    use_keyboard_control = False
    asyncio.run(main_loop(use_keyboard=use_keyboard_control))