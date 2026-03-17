import sys


def main():
    try:
        import cv2
        import mediapipe as mp
    except ImportError as error:
        missing = getattr(error, "name", "dependency")
        print(
            f"Missing Python dependency: {missing}. "
            "Install from tools/requirements-hand-tracking-debug.txt",
            file=sys.stderr,
        )
        return 1

    mp_hands = mp.solutions.hands
    mp_face = mp.solutions.face_detection
    mp_draw = mp.solutions.drawing_utils

    camera = cv2.VideoCapture(0)
    if not camera.isOpened():
        print("Cannot open camera 0", file=sys.stderr)
        return 1

    with mp_hands.Hands(
        max_num_hands=2,
        min_detection_confidence=0.45,
        min_tracking_confidence=0.45,
    ) as hands, mp_face.FaceDetection(
        model_selection=0,
        min_detection_confidence=0.45,
    ) as face_detection:
        while True:
            ok, frame = camera.read()
            if not ok:
                print("Cannot read frame from camera", file=sys.stderr)
                break

            frame = cv2.flip(frame, 1)
            rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)

            hand_result = hands.process(rgb_frame)
            face_result = face_detection.process(rgb_frame)

            hand_count = len(hand_result.multi_hand_landmarks or [])
            face_count = len(face_result.detections or [])

            if hand_result.multi_hand_landmarks:
                for hand_landmarks in hand_result.multi_hand_landmarks:
                    mp_draw.draw_landmarks(
                        frame,
                        hand_landmarks,
                        mp_hands.HAND_CONNECTIONS,
                    )

            if face_result.detections:
                for detection in face_result.detections:
                    mp_draw.draw_detection(frame, detection)

            cv2.putText(
                frame,
                f"Hands: {hand_count}",
                (20, 36),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.9,
                (0, 255, 255),
                2,
            )
            cv2.putText(
                frame,
                f"Faces: {face_count}",
                (20, 74),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.9,
                (0, 255, 0),
                2,
            )
            cv2.putText(
                frame,
                "Press Q to exit",
                (20, 112),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.75,
                (255, 255, 255),
                2,
            )

            cv2.imshow("Hand Tracking Debug", frame)

            if cv2.waitKey(1) & 0xFF == ord("q"):
                break

    camera.release()
    cv2.destroyAllWindows()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
