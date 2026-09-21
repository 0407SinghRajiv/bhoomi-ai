import sys
from pathlib import Path
import pytest
from fastapi.testclient import TestClient

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.main import app

client = TestClient(app)


def test_list_land_records_citizen_only():
    """Citizen only filter must strictly return only citizen's own records"""
    res = client.get("/api/land-records?citizen_only=true")
    assert res.status_code == 200
    data = res.json()
    assert len(data) >= 1
    for item in data:
        assert "Rajendra" in item["owner_name"] and "Patil" in item["owner_name"]


def test_public_registry_search():
    """Public registry returns parcels with correct ownership and access badges"""
    res = client.get("/api/land-records/public-registry?citizen_name=Rajendra+Dattatray+Patil")
    assert res.status_code == 200
    data = res.json()
    assert len(data) >= 1
    
    # Check that parcel 124/2 is owned by citizen
    p124 = next((p for p in data if p["survey_number"] == "124/2"), None)
    assert p124 is not None
    assert p124["is_owner"] is True
    assert p124["access_status"] == "OWNED"

    # Check that parcel 142/3 has approved access (from seed)
    p142 = next((p for p in data if p["survey_number"] == "142/3"), None)
    assert p142 is not None
    assert p142["is_owner"] is False
    assert p142["access_status"] == "APPROVED"


def test_access_request_lifecycle():
    """Citizen can submit access request, authority can review (approve/reject)"""
    # 1. Submit request
    payload = {
        "applicant_name": "Rajendra Dattatray Patil",
        "applicant_contact": "+91 98220 14920",
        "survey_number": "124/1",
        "village": "Wagholi",
        "district": "Pune",
        "owner_name": "Suresh Chandra Patel",
        "reason_category": "BOUNDARY_VERIFICATION",
        "reason_description": "Boundary alignment check along east perimeter",
    }
    create_res = client.post("/api/access-requests", json=payload)
    assert create_res.status_code == 201
    req = create_res.json()
    req_id = req["id"]
    assert req["status"] == "PENDING"
    assert req["applicant_name"] == "Rajendra Dattatray Patil"

    # 2. List requests
    list_res = client.get(f"/api/access-requests?applicant_name=Rajendra+Dattatray+Patil")
    assert list_res.status_code == 200
    all_reqs = list_res.json()
    assert any(r["id"] == req_id for r in all_reqs)

    # 3. Authority approve request
    review_payload = {
        "status": "APPROVED",
        "reviewed_by": "Tahsildar Haveli, Pune",
        "review_remarks": "Approved after document verification",
        "valid_days": 30,
    }
    patch_res = client.patch(f"/api/access-requests/{req_id}/review", json=review_payload)
    assert patch_res.status_code == 200
    updated = patch_res.json()
    assert updated["status"] == "APPROVED"
    assert updated["reviewed_by"] == "Tahsildar Haveli, Pune"
    assert updated["valid_until"] is not None


def test_restricted_record_detail_privacy():
    """When a citizen accesses another citizen's record without approval, sensitive fields are masked"""
    # Create an unapproved record test or query with a random requester name
    res = client.get("/api/land-records/2?requester_name=Unknown+Citizen")
    assert res.status_code == 200
    data = res.json()
    assert data["is_restricted"] is True
    assert data["access_status"] in ["LOCKED", "PENDING_REQUEST"]
    assert "Protected" in data["owner_name"] or "***" in data["owner_name"]
    assert len(data["documents"]) == 0


def test_cadastral_parcel_neighbor_access_control():
    """When querying cadastral parcel of another citizen without approved request, sensitive deeds are hidden"""
    res = client.get("/api/cadastral-parcels/2?requester_name=Unknown+Citizen")
    assert res.status_code == 200
    data = res.json()
    assert data["is_restricted"] is True
    assert data["access_status"] in ["RESTRICTED", "PENDING_REQUEST"]
    assert len(data["documents"]) == 0
    assert "***" in data["owner_name"]

