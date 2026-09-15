"""
Backend API Unit Tests
Smart India Hackathon 2026 - Problem Statement 26018
"""
import sys
from pathlib import Path
import pytest
from fastapi.testclient import TestClient

# Ensure backend root is on sys.path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.main import app

client = TestClient(app)


def test_health_endpoint():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["service"] == "BhoomiAI API"


def test_root_endpoint():
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "online"
    assert data["mode"] == "Production Environment"


def test_states_endpoint():
    response = client.get("/api/states")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 15
    state_names = [s["name"] for s in data]
    assert "Maharashtra" in state_names
    assert "Karnataka" in state_names
    assert "Uttar Pradesh" in state_names


def test_document_types_endpoint():
    response = client.get("/api/document-types")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 8
    doc_codes = [d["code"] for d in data]
    assert "SALE_DEED" in doc_codes
    assert "7_12_EXTRACT" in doc_codes


def test_documents_endpoint():
    response = client.get("/api/documents")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 3
    doc_files = [d["file_name"] for d in data]
    assert any("Sale_Deed" in f for f in doc_files)

    # Test single document detail
    first_doc_id = data[0]["id"]
    detail_res = client.get(f"/api/documents/{first_doc_id}")
    assert detail_res.status_code == 200
    detail = detail_res.json()
    assert detail["id"] == first_doc_id
    assert "pages" in detail
    assert "extracted_fields" in detail


def test_reconciliation_cases_endpoint():
    response = client.get("/api/reconciliation/cases")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 1
    case = data[0]
    assert "CASE-MH-2026-001" in case["case_number"]

    # Test case detail by case_number
    detail_res = client.get(f"/api/reconciliation/cases/{case['case_number']}")
    assert detail_res.status_code == 200
    detail = detail_res.json()
    assert detail["case_number"] == case["case_number"]
    assert len(detail["documents"]) >= 3
    assert len(detail["conflicts"]) >= 1
    assert len(detail["timeline"]) >= 1


def test_verification_requests_endpoint():
    response = client.get("/api/verification-requests")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 1


def test_not_found_handling():
    response = client.get("/api/documents/999999")
    assert response.status_code == 404
    data = response.json()
    assert data["error"] is True
    assert "not found" in data["message"].lower()
