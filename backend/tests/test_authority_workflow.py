import sys
from pathlib import Path
import pytest
from fastapi.testclient import TestClient

# Ensure backend root is on sys.path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.main import app

client = TestClient(app)


def test_authority_dashboard_stats():
    response = client.get("/api/authority/dashboard-stats")
    assert response.status_code == 200
    data = response.json()
    assert "pending_cases" in data
    assert "high_priority" in data
    assert "under_review" in data
    assert "verified" in data
    assert "rejected" in data
    assert "escalated" in data
    assert "total_cases" in data
    assert isinstance(data["total_cases"], int)
    assert data["total_cases"] >= 1


def test_authority_filter_options():
    response = client.get("/api/authority/filter-options")
    assert response.status_code == 200
    data = response.json()
    assert "states" in data
    assert "districts" in data
    assert "talukas" in data
    assert "villages" in data
    assert "document_types" in data
    assert "risks" in data
    assert "statuses" in data
    assert "CRITICAL" in data["risks"]
    assert "APPROVED" in data["statuses"]


def test_authority_cases_queue():
    response = client.get("/api/authority/cases")
    assert response.status_code == 200
    cases = response.json()
    assert isinstance(cases, list)
    assert len(cases) >= 1

    first_case = cases[0]
    assert "case_number" in first_case
    assert "citizen_submission_id" in first_case
    assert "documents_count" in first_case
    assert "conflicts_count" in first_case
    assert "risk_level" in first_case
    assert "status" in first_case
    assert "assigned_officer" in first_case


def test_authority_cases_filters():
    # Filter by state
    res_state = client.get("/api/authority/cases?state=Maharashtra")
    assert res_state.status_code == 200

    # Filter by risk
    res_risk = client.get("/api/authority/cases?risk=HIGH")
    assert res_risk.status_code == 200

    # Filter by search
    res_search = client.get("/api/authority/cases?search=CASE-MH-2026-001")
    assert res_search.status_code == 200
    assert len(res_search.json()) >= 1


def test_authority_case_detail_full():
    res = client.get("/api/authority/cases/CASE-MH-2026-001")
    assert res.status_code == 200
    detail = res.json()
    assert detail["case_number"] == "CASE-MH-2026-001"
    assert "documents" in detail
    assert "ocr_transcripts" in detail
    assert "extracted_fields" in detail
    assert "conflicts" in detail
    assert "timeline" in detail
    assert "jurisdiction" in detail
    assert "risk_assessment" in detail


def test_officer_action_requires_reason():
    # Attempting an action with no reason should fail with 400
    payload = {
        "action": "APPROVE",
        "reason": "",
    }
    res = client.post("/api/authority/cases/CASE-MH-2026-001/actions", json=payload)
    assert res.status_code == 400

    # Attempting an action with reason shorter than 3 chars should fail
    payload_short = {
        "action": "APPROVE",
        "reason": "ok",
    }
    res_short = client.post("/api/authority/cases/CASE-MH-2026-001/actions", json=payload_short)
    assert res_short.status_code == 400


def test_officer_action_verify_field():
    payload = {
        "action": "VERIFY_FIELD",
        "field_name": "survey_number",
        "reason": "Survey number 142/3 verified against original village map.",
        "officer_name": "Officer R. K. Patil (Tehsildar)",
        "officer_role": "Revenue Officer",
    }
    res = client.post("/api/authority/cases/CASE-MH-2026-001/actions", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    assert "verified field 'survey_number'" in data["message"].lower()

    # Verify audit timeline recorded the action with user, role, and reason
    detail = client.get("/api/authority/cases/CASE-MH-2026-001").json()
    matching_log = next((ev for ev in detail["timeline"] if ev["action"] == "FIELD_VERIFIED"), None)
    assert matching_log is not None
    assert matching_log["reason"] == payload["reason"]
    assert "Officer R. K. Patil" in matching_log["user"]


def test_officer_action_edit_field():
    payload = {
        "action": "EDIT_FIELD",
        "field_name": "owner_name",
        "new_value": "Rajesh Kumar",
        "reason": "Corrected phonetic Devanagari spelling typo in Mutation Record #894.",
        "officer_name": "Officer R. K. Patil (Tehsildar)",
        "officer_role": "Revenue Officer",
    }
    res = client.post("/api/authority/cases/CASE-MH-2026-001/actions", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    assert "FIELD_CORRECTED" in data["action"]

    # Verify audit timeline contains previous and new values
    detail = client.get("/api/authority/cases/CASE-MH-2026-001").json()
    matching_log = next((ev for ev in detail["timeline"] if ev["action"] == "FIELD_CORRECTED"), None)
    assert matching_log is not None
    assert matching_log["new_value"] == "Rajesh Kumar"
    assert matching_log["reason"] == payload["reason"]


def test_officer_action_resolve_conflict():
    payload = {
        "action": "RESOLVE_CONFLICT",
        "field_name": "owner_name",
        "reason": "Registered sale deed index confirms authentic grantee is Rajesh Kumar.",
        "officer_name": "Officer R. K. Patil (Tehsildar)",
        "officer_role": "Revenue Officer",
    }
    res = client.post("/api/authority/cases/CASE-MH-2026-001/actions", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    assert "CONFLICT_RESOLVED" in data["action"]

    # Verify conflict marked resolved
    detail = client.get("/api/authority/cases/CASE-MH-2026-001").json()
    conflict = next((c for c in detail["conflicts"] if c["field_name"] == "owner_name"), None)
    assert conflict is not None
    assert conflict["status"] == "RESOLVED"


def test_citizen_submission_to_authority_flow():
    # 1. Citizen submits verification request
    submit_payload = {
        "case_id": "CASE-MH-2026-001",
        "message": "Citizen formally requests Sub-Registrar endorsement after Ferfar review.",
    }
    sub_res = client.post("/api/verification/submit", json=submit_payload)
    assert sub_res.status_code == 200
    sub_data = sub_res.json()
    assert sub_data["success"] is True
    assert sub_data["status"] == "PENDING_AUTHORITY_REVIEW"

    # 2. Case appears in Authority Queue under pending filter
    cases_res = client.get("/api/authority/cases?status=PENDING_AUTHORITY_REVIEW")
    assert cases_res.status_code == 200
    found = any(c["case_number"] == "CASE-MH-2026-001" for c in cases_res.json())
    assert found is True

    # 3. Officer performs approval action
    approve_payload = {
        "action": "APPROVE",
        "reason": "All title conditions and spatial bounds verified in order under Maharashtra Land Revenue Code.",
    }
    act_res = client.post("/api/authority/cases/CASE-MH-2026-001/actions", json=approve_payload)
    assert act_res.status_code == 200
    assert act_res.json()["new_status"] == "APPROVED"

    # 4. Citizen checks case detail and sees status APPROVED
    detail_res = client.get("/api/reconciliation/cases/CASE-MH-2026-001")
    assert detail_res.status_code == 200
    assert detail_res.json()["status"] == "APPROVED"
