import cv2
import numpy as np
from PIL import Image
import mediapipe as mp
import json
import os

# ===========================
# CONFIGURATION
# ===========================
IMAGE_PATH = r"C:\Users\KIIT\Desktop\major project 2\VisionSync\ml model\test.png"   # calibration image (first run)
SECOND_IMAGE_PATH = r"C:\Users\KIIT\Desktop\major project 2\VisionSync\ml model\test6.png"  # change to evaluate a 2nd image
CALIB_FILE = "calibration.json"
TARGET_SIZE = (640, 640)
# small upward offset so the calibration image is treated as "up" baseline
CALIB_UP_OFFSET = 0.04

# ===========================
# INITIALIZE MEDIAPIPE
# ===========================
mp_face_mesh = mp.solutions.face_mesh

# ===========================
# GAZE DETECTION FUNCTION
# ===========================
def detect_gaze_direction(landmarks, calibration):
    try:
        # landmarks: Mediapipe normalized coordinates (0..1)
        left_iris = landmarks[474]
        right_iris = landmarks[469]
        nose_tip = landmarks[1]

        mid_x = (left_iris.x + right_iris.x) / 2.0
        mid_y = (left_iris.y + right_iris.y) / 2.0

        # observed offset of iris mid vs nose tip
        obs_x = mid_x - nose_tip.x
        obs_y = mid_y - nose_tip.y

        # calibration is the baseline observed offsets for the 'up' reference image
        calib_x = calibration.get("x", 0.0)
        calib_y = calibration.get("y", 0.0)

        # compute delta relative to calibration
        dx = obs_x - calib_x
        dy = obs_y - calib_y

        # debug info
        print(f"DEBUG obs (x,y): {obs_x:.5f},{obs_y:.5f}  calib (x,y): {calib_x:.5f},{calib_y:.5f}  delta (dx,dy): {dx:.5f},{dy:.5f}")

        # deadzone thresholds (tweak these for your dataset)
        x_deadzone = 0.025   # horizontal sensitivity
        y_deadzone = 0.025   # vertical sensitivity

        # if both deltas are small -> consider baseline ('up' baseline)
        if abs(dx) <= x_deadzone and abs(dy) <= y_deadzone:
            return "up"

        # decide dominant axis
        if abs(dx) >= abs(dy):
            # horizontal movement dominates
            return "right" if dx > 0 else "left"
        else:
            # vertical movement dominates
            return "down" if dy > 0 else "up"

    except Exception as e:
        print(f"DEBUG detect_gaze_direction error: {e}")
        return "unknown"

# ===========================
# HELPERS
# ===========================
def prepare_image(path):
    if not os.path.exists(path):
        raise FileNotFoundError(path)
    image = Image.open(path).convert("RGB")
    image = image.resize(TARGET_SIZE)
    image_np = np.asarray(image)
    image_np = np.ascontiguousarray(image_np).astype(np.uint8)
    # Save debug copy
    debug_path = os.path.join(os.path.dirname(path), os.path.basename(path).replace(".png", "_debug.png"))
    Image.fromarray(image_np).save(debug_path)
    print("DEBUG saved resized image to:", debug_path)
    print("DEBUG image shape/dtype:", image_np.shape, image_np.dtype)
    return image_np

def process_with_fm(fm, image_np, save_calib_if_missing=False):
    output = fm.process(image_np)
    print("DEBUG raw output:", output)
    if not output or not output.multi_face_landmarks:
        return {
            "alert": True,
            "direction": "N/A",
            "message": "🚨 Face not detected — possible out-of-frame or obscured."
        }

    landmarks = output.multi_face_landmarks[0].landmark
    left_iris = landmarks[474]
    right_iris = landmarks[469]
    nose_tip = landmarks[1]

    observed_x = ((left_iris.x + right_iris.x) / 2.0) - nose_tip.x
    observed_y = ((left_iris.y + right_iris.y) / 2.0) - nose_tip.y

    # When saving calibration, store the observed offsets and a small upward bias so the saved image
    # is treated as 'up' baseline. If you want exact center, remove CALIB_UP_OFFSET.
    if save_calib_if_missing and not os.path.exists(CALIB_FILE):
        calibration = {"x": observed_x, "y": observed_y + CALIB_UP_OFFSET}
        try:
            with open(CALIB_FILE, "w") as f:
                json.dump(calibration, f)
            print(f"DEBUG saved calibration: {calibration}")
        except Exception as e:
            print(f"DEBUG saving calibration failed: {e}")

    # load calibration for evaluation
    try:
        with open(CALIB_FILE, "r") as f:
            calibration = json.load(f)
    except Exception:
        calibration = {"x": 0.0, "y": 0.0}
        print("DEBUG no calibration file found, using zeros")

    gaze = detect_gaze_direction(landmarks, calibration)

    # Only "up" is non-alert; other values are alert
    alert_status = False if gaze == "up" else True

    return {
        "alert": alert_status,
        "direction": gaze,
        "message": f"User is looking {gaze}."
    }

# ===========================
# RUN: SECTION 1 -> measure calibration image (test.png)
# ===========================
try:
    image_np = prepare_image(IMAGE_PATH)
except FileNotFoundError:
    print(json.dumps({
        "alert": True,
        "direction": "N/A",
        "message": f"Calibration image not found: {IMAGE_PATH}"
    }, indent=4))
    exit()

with mp_face_mesh.FaceMesh(refine_landmarks=True, max_num_faces=1, static_image_mode=True, min_detection_confidence=0.2) as fm:
    result_calib = process_with_fm(fm, image_np, save_calib_if_missing=True)

print("Calibration run result:")
print(json.dumps(result_calib, indent=4))

# ===========================
# RUN: SECTION 2 -> evaluate a 2nd image against saved calibration
# ===========================
try:
    image2_np = prepare_image(SECOND_IMAGE_PATH)
except FileNotFoundError:
    print(json.dumps({
        "alert": True,
        "direction": "N/A",
        "message": f"Test image not found: {SECOND_IMAGE_PATH}"
    }, indent=4))
    exit()

with mp_face_mesh.FaceMesh(refine_landmarks=True, max_num_faces=1, static_image_mode=True, min_detection_confidence=0.2) as fm:
    result_test2 = process_with_fm(fm, image2_np, save_calib_if_missing=False)

print("Second image run result:")
print(json.dumps(result_test2, indent=4))
