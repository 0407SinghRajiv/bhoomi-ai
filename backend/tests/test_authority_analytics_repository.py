import sys
from pathlib import Path
import pytest
from fastapi.testclient import TestClient

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.main import app

client = TestClient(app)


def test_authority_analytics_endpoint():
    """Verify comprehensive analytics endpoint returns all requested categories"""
    res = client.get("/api/authority/analytics")
    assert res.status_code == 200
    data = res.json()

    # 1. Number of documents processed
    assert "documents_stats" in data
    assert data["documents_stats"]["total_processed"] >= 1
    assert data["documents_stats"]["total_pages_ocr"] >= 1
    assert "by_type" in data["documents_stats"]

    # 2. Extraction accuracy
    assert "extraction_accuracy" in data
    assert data["extraction_accuracy"]["overall_accuracy"] > 0
    assert "owner_name_accuracy" in data["extraction_accuracy"]
    assert "survey_number_accuracy" in data["extraction_accuracy"]

    # 3. Validation status
    assert "validation_status_breakdown" in data
    assert "Verified" in data["validation_status_breakdown"]
    assert "Pending Authority Review" in data["validation_status_breakdown"]

    # 4. Pending verification cases
    assert data["pending_cases"] >= 0
    assert data["high_priority"] >= 0

    # 5. Error statistics
    assert "error_statistics" in data
    assert "quality_gate_failures" in data["error_statistics"]
    assert "unresolved_conflicts" in data["error_statistics"]

    # 6. State-wise and district-wise digitization progress
    assert "digitization_progress" in data
    assert len(data["digitization_progress"]) >= 5
    mh = next((p for p in data["digitization_progress"] if p["state"] == "Maharashtra"), None)
    assert mh is not None
    assert mh["district"] == "Pune"
    assert mh["percentage"] > 0


def test_authority_secure_document_repository():
    """Verify document repository listing, SHA-256 integrity hash, and audit trail"""
    # 1. List documents
    res = client.get("/api/authority/documents")
    assert res.status_code == 200
    docs = res.json()
    assert len(docs) >= 1
    doc = docs[0]
    assert "sha256_hash" in doc
    assert doc["sha256_hash"].startswith("sha256:")
    assert "audit_events_count" in doc

    doc_id = doc["id"]

    # 2. Document detail with full audit trail
    detail_res = client.get(f"/api/authority/documents/{doc_id}")
    assert detail_res.status_code == 200
    detail = detail_res.json()
    assert "document" in detail
    assert "audit_trail" in detail
    assert "extracted_fields" in detail

    # 3. Update document metadata
    patch_payload = {
        "language": "mr",
        "quality_status": "PASSED",
        "officer_name": "Tahsildar Haveli, Pune",
        "remarks": "Verified manual clarity and stamped official certified copy",
    }
    patch_res = client.patch(f"/api/authority/documents/{doc_id}/metadata", json=patch_payload)
    assert patch_res.status_code == 200
    updated_doc = patch_res.json()
    assert updated_doc["language"] == "mr"
    assert updated_doc["quality_status"] == "PASSED"

    # 4. Re-check audit trail contains the modification
    recheck_res = client.get(f"/api/authority/documents/{doc_id}")
    audit_events = recheck_res.json()["audit_trail"]
    assert any(a["action"] == "DOCUMENT_METADATA_UPDATED" for a in audit_events)
