"""
PDF Document Processing Service
Handles digital vs scanned PDF detection, page splitting, and rendering.
Smart India Hackathon 2026 - Problem Statement 26018
"""
from typing import List, Dict, Any, Tuple
from pathlib import Path
import fitz  # PyMuPDF
from PIL import Image
from app.config import settings


class PDFProcessingService:
    @staticmethod
    def inspect_and_render_pdf(
        pdf_path: str,
        document_id: int,
        dpi: int = 200,
    ) -> List[Dict[str, Any]]:
        """
        Opens PDF, detects whether pages are digital or scanned,
        renders each page to a PNG preview image, and returns page metadata.
        """
        doc = fitz.open(pdf_path)
        pages_meta = []

        pages_dir = Path(settings.STORAGE_DIR) / "pages" / str(document_id)
        pages_dir.mkdir(parents=True, exist_ok=True)

        for page_index in range(len(doc)):
            page_number = page_index + 1
            page = doc[page_index]

            # Direct text extraction check
            native_text = page.get_text("text").strip()
            word_count = len(native_text.split())

            # A page is scanned if it has virtually no native text stream (< 5 words)
            is_scanned = word_count < 5

            # Render page to PNG image
            zoom = dpi / 72.0
            matrix = fitz.Matrix(zoom, zoom)
            pix = page.get_pixmap(matrix=matrix, alpha=False)

            image_filename = f"page_{page_number}.png"
            image_disk_path = pages_dir / image_filename
            pix.save(str(image_disk_path))

            # PyMuPDF rect dimensions (in points)
            rect = page.rect
            width = int(rect.width)
            height = int(rect.height)

            pages_meta.append({
                "page_number": page_number,
                "is_scanned": is_scanned,
                "has_native_text": not is_scanned,
                "native_text": native_text,
                "word_count": word_count,
                "image_path": str(image_disk_path),
                "image_filename": image_filename,
                "width": width,
                "height": height,
                "pixel_width": pix.width,
                "pixel_height": pix.height,
            })

        doc.close()
        return pages_meta

    @staticmethod
    def inspect_and_render_image(
        image_path: str,
        document_id: int,
    ) -> List[Dict[str, Any]]:
        """
        Handles image files (PNG, JPG, TIFF), converts to standard PNG page image.
        """
        pages_dir = Path(settings.STORAGE_DIR) / "pages" / str(document_id)
        pages_dir.mkdir(parents=True, exist_ok=True)

        with Image.open(image_path) as img:
            w, h = img.size
            out_img = img.convert("RGB")
            image_filename = "page_1.png"
            image_disk_path = pages_dir / image_filename
            out_img.save(str(image_disk_path), format="PNG")

        return [{
            "page_number": 1,
            "is_scanned": True,
            "has_native_text": False,
            "native_text": "",
            "word_count": 0,
            "image_path": str(image_disk_path),
            "image_filename": image_filename,
            "width": w,
            "height": h,
            "pixel_width": w,
            "pixel_height": h,
        }]
