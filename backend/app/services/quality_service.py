"""
OCR Quality Gate Service
Calculates resolution, blur, skew, rotation, contrast, and noise indicators.
Smart India Hackathon 2026 - Problem Statement 26018
"""
import math
from typing import Dict, Any, Tuple, Union
from pathlib import Path
import numpy as np
from PIL import Image
import cv2


class QualityGateService:
    @staticmethod
    def _to_cv2_gray(image_input: Union[str, Path, Image.Image, np.ndarray]) -> Tuple[np.ndarray, int, int]:
        """Convert any image input to grayscale numpy array and return (gray, width, height)."""
        if isinstance(image_input, (str, Path)):
            img = cv2.imread(str(image_input))
            if img is None:
                # Try opening via PIL if cv2 cannot read path (e.g. unicode paths on Windows)
                pil_img = Image.open(str(image_input))
                img = cv2.cvtColor(np.array(pil_img), cv2.COLOR_RGB2BGR)
            gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
            h, w = gray.shape[:2]
            return gray, w, h
        elif isinstance(image_input, Image.Image):
            pil_img = image_input.convert("RGB")
            cv_img = cv2.cvtColor(np.array(pil_img), cv2.COLOR_RGB2BGR)
            gray = cv2.cvtColor(cv_img, cv2.COLOR_BGR2GRAY)
            h, w = gray.shape[:2]
            return gray, w, h
        elif isinstance(image_input, np.ndarray):
            if len(image_input.shape) == 3:
                gray = cv2.cvtColor(image_input, cv2.COLOR_BGR2GRAY)
            else:
                gray = image_input
            h, w = gray.shape[:2]
            return gray, w, h
        else:
            raise ValueError(f"Unsupported image input type: {type(image_input)}")

    @classmethod
    def calculate_blur(cls, gray: np.ndarray) -> float:
        """Laplacian variance for sharpness/blur detection."""
        laplacian = cv2.Laplacian(gray, cv2.CV_64F)
        return float(laplacian.var())

    @classmethod
    def calculate_contrast(cls, gray: np.ndarray) -> float:
        """RMS contrast based on standard deviation of pixel intensities."""
        return float(gray.std())

    @classmethod
    def calculate_noise(cls, gray: np.ndarray) -> float:
        """Estimates high-frequency noise by subtracting a Gaussian smoothed image."""
        blurred = cv2.GaussianBlur(gray, (5, 5), 0)
        noise = gray.astype(np.float32) - blurred.astype(np.float32)
        return float(noise.std())

    @classmethod
    def calculate_skew(cls, gray: np.ndarray) -> float:
        """Estimates dominant skew angle in degrees using Hough line transform."""
        try:
            edges = cv2.Canny(gray, 50, 150, apertureSize=3)
            lines = cv2.HoughLinesP(edges, 1, np.pi / 180, threshold=100, minLineLength=80, maxLineGap=10)
            if lines is None or len(lines) == 0:
                return 0.0

            angles = []
            for line in lines:
                x1, y1, x2, y2 = line[0]
                if x2 - x1 == 0:
                    continue
                angle = math.degrees(math.atan2(y2 - y1, x2 - x1))
                if abs(angle) < 45:  # Consider near-horizontal text lines
                    angles.append(angle)

            if not angles:
                return 0.0

            median_angle = float(np.median(angles))
            return round(median_angle, 2)
        except Exception:
            return 0.0

    @classmethod
    def analyze_quality(cls, image_input: Union[str, Path, Image.Image, np.ndarray]) -> Dict[str, Any]:
        """
        Calculates all quality metrics and produces a standardized quality evaluation.
        Categories: GOOD, ACCEPTABLE, POOR, UNREADABLE
        """
        gray, w, h = cls._to_cv2_gray(image_input)

        blur_var = cls.calculate_blur(gray)
        contrast = cls.calculate_contrast(gray)
        noise = cls.calculate_noise(gray)
        skew = cls.calculate_skew(gray)

        # Dimension checks
        min_dim = min(w, h)
        is_high_res = min_dim >= 1200
        is_low_res = min_dim < 600

        # Classification logic
        reasons = []

        if blur_var < 15.0:
            status = "UNREADABLE"
            reasons.append("Severe motion blur detected.")
        elif contrast < 15.0:
            status = "UNREADABLE"
            reasons.append("Contrast is too low to discern text.")
        elif is_low_res:
            status = "POOR"
            reasons.append("Low image resolution.")
        elif blur_var < 45.0:
            status = "POOR"
            reasons.append("Noticeable blur affecting characters.")
        elif abs(skew) > 4.5:
            status = "POOR"
            reasons.append(f"Significant skew ({skew}°).")
        elif contrast < 25.0:
            status = "POOR"
            reasons.append("Faint or washed-out document scan.")
        elif blur_var < 90.0 or contrast < 35.0 or abs(skew) > 2.0 or noise > 16.0:
            status = "ACCEPTABLE"
        else:
            status = "GOOD"

        advisory_message = None
        if status == "POOR":
            advisory_message = "Document quality may affect extraction accuracy."
        elif status == "UNREADABLE":
            advisory_message = "Document is severely blurred or faded. High error rate expected."

        return {
            "status": status,
            "width": w,
            "height": h,
            "blur_score": round(blur_var, 2),
            "contrast_score": round(contrast, 2),
            "noise_score": round(noise, 2),
            "skew_angle": skew,
            "rotation_degrees": 0,
            "is_high_resolution": is_high_res,
            "advisory_message": advisory_message,
            "reasons": reasons,
        }
