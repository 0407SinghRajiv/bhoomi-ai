"""
Phase 3 OCR & Ingestion Pipeline Tests
Smart India Hackathon 2026 - Problem Statement 26018
"""
import sys
from pathlib import Path
import pytest
from fastapi.testclient import TestClient

# Ensure backend root is on sys.path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.main import app
from app.services.quality_service import QualityGateService
from app.services.language_service import LanguageDetectionService
from app.services.pdf_service import PDFProcessingService

client = TestClient(app)
SAMPLES_DIR = Path(__file__).resolve().parent.parent / "storage" / "demo_samples"


def test_quality_gate_metrics():
    sample_img = SAMPLES_DIR / "sample_mutation_scan.png"
    assert sample_img.exists()
    quality = QualityGateService.analyze_quality(sample_img)

    assert "status" in quality
    assert quality["status"] in ["GOOD", "ACCEPTABLE", "POOR", "UNREADABLE"]
    assert quality["width"] == 1600
    assert quality["height"] == 1200
    assert quality["blur_score"] > 0
    assert quality["contrast_score"] > 0
    assert quality["noise_score"] >= 0
    assert isinstance(quality["skew_angle"], float)


def test_language_detection():
    # Marathi text test
    mr_text = "गाव नमुना सात अधिकार अभिलेख पत्रक वाघोली गट क्रमांक १४२/३ खातेदार राजेश कुमार एकूण क्षेत्र ०.८०९ हेक्टर"
    mr_res = LanguageDetectionService.detect_language(mr_text)
    assert mr_res["language_code"] == "mr"
    assert mr_res["language_name"] == "Marathi"
    assert mr_res["script"] == "Devanagari"

    # Hindi text test
    hi_text = "उत्तर प्रदेश भूलेख खतौनी खाता विवरण खसरा संख्या १२३ काश्तकार का नाम रामेश्वर कुमार"
    hi_res = LanguageDetectionService.detect_language(hi_text)
    assert hi_res["language_code"] == "hi"
    assert hi_res["language_name"] == "Hindi"

    # English text test
    en_text = "Registered Deed of Absolute Conveyance executed between Vendor and Purchaser for agricultural land."
    en_res = LanguageDetectionService.detect_language(en_text)
    assert en_res["language_code"] == "en"
    assert en_res["language_name"] == "English"


def test_pdf_digital_vs_scanned():
    pdf_path = SAMPLES_DIR / "sample_7_12_extract.pdf"
    assert pdf_path.exists()
    pages = PDFProcessingService.inspect_and_render_pdf(str(pdf_path), document_id=9999)

    assert len(pages) == 1
    p = pages[0]
    assert p["page_number"] == 1
    assert p["has_native_text"] is True
    assert p["is_scanned"] is False
    assert "वाघोली" in p["native_text"] or "Gat Number" in p["native_text"]
    assert Path(p["image_path"]).exists()


def test_upload_empty_file_rejected():
    empty_file = SAMPLES_DIR / "empty_sample.pdf"
    with open(empty_file, "rb") as f:
        res = client.post("/api/documents/upload", files={"file": ("empty.pdf", f, "application/pdf")})
    assert res.status_code == 400
    assert "empty" in res.json()["message"].lower()


def test_upload_corrupted_file_rejected():
    corrupted_file = SAMPLES_DIR / "corrupted_sample.pdf"
    with open(corrupted_file, "rb") as f:
        res = client.post("/api/documents/upload", files={"file": ("corrupted.pdf", f, "application/pdf")})
    assert res.status_code == 400
    assert "corrupted" in res.json()["message"].lower() or "invalid" in res.json()["message"].lower()


def test_upload_invalid_extension_rejected():
    res = client.post(
        "/api/documents/upload",
        files={"file": ("script.exe", b"binary content", "application/octet-stream")},
    )
    assert res.status_code == 400
    assert "unsupported file format" in res.json()["message"].lower()


def test_upload_and_process_real_pdf():
    pdf_path = SAMPLES_DIR / "sample_7_12_extract.pdf"
    with open(pdf_path, "rb") as f:
        res = client.post(
            "/api/documents/upload",
            files={"file": ("sample_7_12_extract.pdf", f, "application/pdf")},
            data={"demo_owner_type": "DEMO_CITIZEN"},
        )
    assert res.status_code == 201
    data = res.json()
    doc_id = data["document_id"]
    assert doc_id > 0
    assert data["status"] == "COMPLETED"

    # Verify status endpoint
    status_res = client.get(f"/api/documents/{doc_id}/status")
    assert status_res.status_code == 200
    status_data = status_res.json()
    assert status_data["document_id"] == doc_id
    assert status_data["status"] == "COMPLETED"
    assert status_data["progress"] == 100
    assert len(status_data["pages"]) >= 1

    page = status_data["pages"][0]
    assert page["page_number"] == 1
    assert "quality" in page
    assert page["quality"]["status"] in ["GOOD", "ACCEPTABLE", "POOR", "UNREADABLE"]
    assert len(page["bounding_boxes"]) > 0
    assert "वाघोली" in page["text"] or "Gat Number" in page["text"]

    # Verify page image endpoint
    img_res = client.get(f"/api/documents/{doc_id}/pages/1/image")
    assert img_res.status_code == 200
    assert img_res.headers["content-type"] == "image/png"
    assert len(img_res.content) > 1000


def test_upload_and_process_scanned_image():
    img_path = SAMPLES_DIR / "sample_mutation_scan.png"
    with open(img_path, "rb") as f:
        res = client.post(
            "/api/documents/upload",
            files={"file": ("sample_mutation_scan.png", f, "image/png")},
            data={"demo_owner_type": "DEMO_CITIZEN"},
        )
    assert res.status_code == 201
    doc_id = res.json()["document_id"]

    status_res = client.get(f"/api/documents/{doc_id}/status")
    assert status_res.status_code == 200
    status_data = status_res.json()
    assert status_data["status"] == "COMPLETED"
    assert len(status_data["pages"]) == 1
    assert len(status_data["pages"][0]["bounding_boxes"]) > 0
