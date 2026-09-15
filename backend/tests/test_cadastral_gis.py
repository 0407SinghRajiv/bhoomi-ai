import sys
from pathlib import Path
import pytest
from fastapi.testclient import TestClient

# Ensure backend root is on sys.path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.main import app

client = TestClient(app)


def test_list_cadastral_parcels():
    res = client.get("/api/cadastral-parcels")
    assert res.status_code == 200
    data = res.json()
    assert isinstance(data, list)
    assert len(data) >= 2
    
    # Check fields on a parcel
    p1 = next((p for p in data if p["parcel_number"] == "124/2"), None)
    assert p1 is not None
    assert p1["owner_name"] == "Rajendra Dattatray Patil"
    assert p1["owner_name_native"] == "राजेंद्र दत्तात्रय पाटील"
    assert p1["area"] == 1.42
    assert p1["area_unit"] == "Hectare"
    assert p1["village"] == "Wagholi"


def test_cadastral_parcels_geojson():
    res = client.get("/api/cadastral-parcels?as_geojson=true")
    assert res.status_code == 200
    data = res.json()
    assert data["type"] == "FeatureCollection"
    assert "features" in data
    assert len(data["features"]) >= 2
    
    f = data["features"][0]
    assert f["type"] == "Feature"
    assert "geometry" in f
    assert f["geometry"]["type"] == "Polygon"
    assert "properties" in f
    assert "owner_name" in f["properties"]


def test_cadastral_parcels_search():
    res = client.get("/api/cadastral-parcels?search=Rajendra")
    assert res.status_code == 200
    data = res.json()
    assert len(data) >= 1
    assert any(p["parcel_number"] == "124/2" for p in data)

    res_num = client.get("/api/cadastral-parcels?search=124/2")
    assert res_num.status_code == 200
    data_num = res_num.json()
    assert len(data_num) >= 1
    assert data_num[0]["parcel_number"] == "124/2"


def test_get_cadastral_parcel_detail():
    # First get parcel ID for 124/2
    parcels = client.get("/api/cadastral-parcels").json()
    p124 = next(p for p in parcels if p["parcel_number"] == "124/2")
    
    res = client.get(f"/api/cadastral-parcels/{p124['id']}")
    assert res.status_code == 200
    detail = res.json()
    assert detail["parcel_number"] == "124/2"
    assert detail["owner_name"] == "Rajendra Dattatray Patil"
    assert "documents" in detail
    assert "geometry_geojson" in detail
    assert detail["geometry_geojson"]["type"] == "Polygon"


def test_cadastral_parcel_documents_and_reconciliation():
    parcels = client.get("/api/cadastral-parcels").json()
    p124 = next(p for p in parcels if p["parcel_number"] == "124/2")

    # Documents endpoint
    docs_res = client.get(f"/api/cadastral-parcels/{p124['id']}/documents")
    assert docs_res.status_code == 200
    docs = docs_res.json()
    assert isinstance(docs, list)

    # Reconciliation endpoint
    recon_res = client.get(f"/api/cadastral-parcels/{p124['id']}/reconciliation")
    assert recon_res.status_code == 200


def test_authority_verify_cadastral_parcel():
    parcels = client.get("/api/cadastral-parcels").json()
    p124 = next(p for p in parcels if p["parcel_number"] == "124/2")

    verify_payload = {
        "owner_name": "Rajendra Dattatray Patil",
        "survey_number": "124/2",
        "area": 1.42,
        "status": "VERIFIED",
        "reason": "Verified against registered deed REG-2018-74921 and certified Mutation #894.",
        "officer_name": "Revenue Officer R. K. Patil",
    }
    patch_res = client.patch(f"/api/cadastral-parcels/{p124['id']}/verify", json=verify_payload)
    assert patch_res.status_code == 200
    updated = patch_res.json()
    assert updated["status"] == "VERIFIED"
    assert updated["owner_name"] == "Rajendra Dattatray Patil"

    # Verify audit log was created
    logs = client.get("/api/authority/audit-logs").json()
    matching_log = next((l for l in logs if "CADASTRAL_PARCEL_VERIFIED" in l["action"]), None)
    assert matching_log is not None
    assert "R. K. Patil" in matching_log["description"]


def test_land_records_api():
    # List land records
    res = client.get("/api/land-records")
    assert res.status_code == 200
    records = res.json()
    assert isinstance(records, list)
    assert len(records) >= 2

    r_124 = next((r for r in records if r["survey_number"] == "124/2"), None)
    assert r_124 is not None
    assert r_124["owner_name"] == "Rajendra Dattatray Patil"

    # Detail land record
    detail_res = client.get(f"/api/land-records/{r_124['id']}")
    assert detail_res.status_code == 200
    detail = detail_res.json()
    assert detail["owner_name"] == "Rajendra Dattatray Patil"
    assert detail["cadastral_parcel"] is not None
    assert detail["cadastral_parcel"]["parcel_number"] == "124/2"


def test_document_file_and_page_serving():
    docs = client.get("/api/documents").json()
    assert len(docs) >= 1
    doc_id = docs[0]["id"]

    # File download endpoint
    file_res = client.get(f"/api/documents/{doc_id}/file")
    assert file_res.status_code == 200
    assert len(file_res.content) > 0

    # Page detail endpoint
    page_res = client.get(f"/api/documents/{doc_id}/pages/1")
    assert page_res.status_code == 200
    page_data = page_res.json()
    assert page_data["page_number"] == 1
    assert "image_url" in page_data
    assert "bounding_boxes" in page_data
