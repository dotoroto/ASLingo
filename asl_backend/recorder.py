import mediapipe as mp
import cv2
import numpy as np
from dummy_model import DummyModel
import pandas as pd

model = DummyModel()

# Suppose you've pre-trained a classifier `model` that maps landmarks → sign label

mp_hands = mp.solutions.hands
hands = mp_hands.Hands(max_num_hands=2, min_detection_confidence=0.7, min_tracking_confidence=0.7)
mp_draw = mp.solutions.drawing_utils

cap = cv2.VideoCapture(0)
cap.release()
cv2.destroyAllWindows()

cap = cv2.VideoCapture(0)

data = []
label = "wait"  # change this each time you record a new sign

print("Collecting data for:", label)


# while True:
#     ret, img = cap.read()
#     if not ret:
#         break
#     img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
#     results = hands.process(img_rgb)
#     if results.multi_hand_landmarks:
#         for handLms in results.multi_hand_landmarks:
#             # collect normalized landmark positions
#             coords = []
#             for lm in handLms.landmark:
#                 coords.append([lm.x, lm.y, lm.z])
#             coords = np.array(coords).flatten()  # shape e.g. (63,)
#             # predict
#             label = model.predict([coords])[0]
#             cv2.putText(img, label, (10, 40), cv2.FONT_HERSHEY_SIMPLEX, 1, (0,255,0), 2)
#             mp_draw.draw_landmarks(img, handLms, mp_hands.HAND_CONNECTIONS)
#     cv2.imshow("Sign → Label", img)
#     if cv2.waitKey(1) & 0xFF == 27:
#         break

while True:
    ret, img = cap.read()
    if not ret:
        break
    img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
    results = hands.process(img_rgb)
    if results.multi_hand_landmarks:
        for handLms in results.multi_hand_landmarks:
            coords = []
            for lm in handLms.landmark:
                coords.extend([lm.x, lm.y, lm.z])
            data.append(coords + [label])
            mp_draw.draw_landmarks(img, handLms, mp_hands.HAND_CONNECTIONS)
    cv2.imshow("Collecting Data", img)
    if cv2.waitKey(1) & 0xFF == 27:
        break

cap.release()
cv2.destroyAllWindows()

df = pd.DataFrame(data)
df.to_csv(f"test_data/raw/{label}data.csv", index=False)