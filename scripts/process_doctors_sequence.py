import cv2
import os
import sys
import numpy as np

def process_sequence():
    video_path = '/Users/tejasmane/Documents/ngo/assets/vidssave.com Microscopic World of Viruses and Bacteria A Stunning 720P.mp4'
    output_dir = '/Users/tejasmane/Documents/ngo/doctors-sequence'

    if not os.path.exists(video_path):
        print(f"Error: Video file not found at {video_path}")
        sys.exit(1)

    os.makedirs(output_dir, exist_ok=True)

    cap = cv2.VideoCapture(video_path)
    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    fps = cap.get(cv2.CAP_PROP_FPS)

    print(f"Source Doctors Video: {total_frames} frames @ {fps} FPS")

    frame_idx = 0
    saved_count = 0

    gaussian_kernel = (5, 5)

    while True:
        ret, frame = cap.read()
        if not ret:
            break

        frame_idx += 1
        
        # Subtle unsharp masking for microscopic detail enhancement (viruses & bacteria)
        blurred = cv2.GaussianBlur(frame, gaussian_kernel, 0)
        sharpened = cv2.addWeighted(frame, 1.2, blurred, -0.2, 0)

        # Subtle contrast/brightness balance for rich deep-space microscopic look
        enhanced = cv2.convertScaleAbs(sharpened, alpha=1.04, beta=3)

        out_name = f"ezgif-frame-{frame_idx:03d}.jpg"
        out_path = os.path.join(output_dir, out_name)

        # Save with high JPEG quality (quality=95)
        cv2.imwrite(out_path, enhanced, [int(cv2.IMWRITE_JPEG_QUALITY), 95])
        saved_count += 1

        if saved_count % 30 == 0 or saved_count == total_frames:
            print(f"Processed & saved {saved_count}/{total_frames} frames into doctors-sequence...")

    cap.release()
    print(f"Successfully processed {saved_count} frames into {output_dir}")

if __name__ == "__main__":
    process_sequence()
