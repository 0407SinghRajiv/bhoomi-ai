"""
Unit and Integration Tests for Phase 5 Cross-Document Reconciliation Engine
Smart India Hackathon 2026 - Problem Statement 26018
"""
import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.services.reconciliation.unit_converter import LandUnitConverter
from app.services.reconciliation.cadastral_normalizer import CadastralNormalizer
from app.services.reconciliation.reconciliation_engine import ReconciliationEngine
from app.database import SessionLocal
from app.models.document import Document

client = TestClient(app)


# ================= 1. NORMALIZATION TESTS =================

def test_whitespace_and_punctuation_normalization():
    raw = "   Gat   No.    142/3  –  Wagholi,   Pune.   "
    clean_ws = CadastralNormalizer.normalize_whitespace(raw)
    assert clean_ws == "Gat No. 142/3 – Wagholi, Pune."

    punc = CadastralNormalizer.normalize_punctuation("“Village: Wagholi” — Taluka (Haveli)")
    assert "Wagholi" in punc
    assert "Haveli" in punc


def test_devanagari_and_ocr_noise_in_numbers():
    # Devanagari digits ०-९
    assert CadastralNormalizer.normalize_digits("१४२/३") == "142/3"
    assert CadastralNormalizer.normalize_digits("८९४") == "894"

    # Common OCR misreads in cadastral numbers
    # 'O'/'o' for 0, 'l'/'I' for 1, 'S' for 5
    assert CadastralNormalizer.clean_ocr_noise_in_number("142/3") == "142/3"
    assert CadastralNormalizer.clean_ocr_noise_in_number("l42/3") == "142/3"
    assert CadastralNormalizer.clean_ocr_noise_in_number("894 / 3") == "894/3"


def test_indian_name_normalization_and_transliteration():
    # Honorific stripping and Devanagari transliteration
    assert CadastralNormalizer.normalize_person_name("Shri Rajesh Kumar") == "Rajesh Kumar"
    assert CadastralNormalizer.normalize_person_name("राजेश कुमार") == "Rajesh Kumar"
    assert CadastralNormalizer.normalize_person_name("श्री राजेश कुमार (Rajesh Kumar)") == "Rajesh Kumar"
    assert CadastralNormalizer.normalize_person_name("Rajesh Kumar s/o Rameshwar Kumar") == "Rajesh Kumar"

    # Name comparison: exact
    status, sim, exp = CadastralNormalizer.compare_names("Rajesh Kumar", "Rajesh Kumar")
    assert status == "EXACT_MATCH"

    # Name comparison: minor typo/variance (Rajesh vs Rakesh) -> CONFLICT with non-fraud wording
    status, sim, exp = CadastralNormalizer.compare_names("Rajesh Kumar", "Rakesh Kumar")
    assert status == "CONFLICT"
    assert "Potential inconsistency detected" in exp
    assert "Manual verification recommended" in exp
    assert "fraud" not in exp.lower()


def test_date_normalization():
    # ISO
    assert CadastralNormalizer.normalize_date("2018-11-14") == "2018-11-14"
    # Indian DD/MM/YYYY
    assert CadastralNormalizer.normalize_date("14/11/2018") == "2018-11-14"
    assert CadastralNormalizer.normalize_date("14-11-2018") == "2018-11-14"
    # Devanagari date
    assert CadastralNormalizer.normalize_date("१४/११/२०१८") == "2018-11-14"
    # Verbal
    assert CadastralNormalizer.normalize_date("14th November 2018") == "2018-11-14"


# ================= 2. LAND UNIT CONVERTER TESTS =================

def test_all_eight_land_units_conversion():
    # 1. Acre
    a1 = LandUnitConverter.parse_area("2.00 Acres")
    assert a1 is not None
    assert round(a1.normalized_hectares, 3) == 0.809

    # 2. Hectare
    a2 = LandUnitConverter.parse_area("0.809 Hectares")
    assert a2 is not None
    assert round(a2.normalized_hectares, 3) == 0.809

    # 3. Square Meter
    a3 = LandUnitConverter.parse_area("8090 Sq. Meters")
    assert a3 is not None
    assert round(a3.normalized_hectares, 3) == 0.809

    # 4. Square Feet
    a4 = LandUnitConverter.parse_area("87120 Sq. Feet")
    assert a4 is not None
    assert round(a4.normalized_hectares, 2) == 0.81

    # 5. Guntha
    a5 = LandUnitConverter.parse_area("80 Guntha")
    assert a5 is not None
    assert round(a5.normalized_hectares, 3) == 0.809

    # 6. Bigha
    a6 = LandUnitConverter.parse_area("3.2 Bigha")
    assert a6 is not None
    assert a6.normalized_hectares > 0.80

    # 7. Cent
    a7 = LandUnitConverter.parse_area("200 Cent")
    assert a7 is not None
    assert round(a7.normalized_hectares, 3) == 0.809

    # 8. Decimal
    a8 = LandUnitConverter.parse_area("200 Decimal")
    assert a8 is not None
    assert round(a8.normalized_hectares, 3) == 0.809


def test_area_comparison_and_tolerance():
    # 2 Acres vs 0.809 Hectares should be recognized as approximately equivalent within 2% tolerance
    doc_areas = [
        {"doc_id": 1, "doc_title": "Sale Deed", "area_text": "2.00 Acres"},
        {"doc_id": 2, "doc_title": "Mutation Record", "area_text": "0.809 Hectares"},
        {"doc_id": 3, "doc_title": "7/12 Extract", "area_text": "०.८०९ हे.आर."},
    ]
    report = LandUnitConverter.compare_areas(doc_areas, tolerance_pct=2.0)
    assert report.status in ("EXACT_MATCH", "APPROXIMATE_MATCH", "MINOR_DIFFERENCE")
    assert report.max_difference_pct <= 2.0
    assert len(report.items) == 3

    # Area discrepancy exceeding tolerance
    divergent_areas = [
        {"doc_id": 1, "doc_title": "Sale Deed", "area_text": "2.00 Acres"},
        {"doc_id": 2, "doc_title": "Mutation Record", "area_text": "4.50 Acres"},
    ]
    report_div = LandUnitConverter.compare_areas(divergent_areas, tolerance_pct=2.0)
    assert report_div.status == "CONFLICT"
    assert "Potential inconsistency detected" in report_div.explanation


# ================= 3. RECONCILIATION ENGINE INTEGRATION TESTS =================

def test_multi_document_reconciliation_execution():
    db = SessionLocal()
    try:
        docs = db.query(Document).all()
        assert len(docs) >= 3
        doc_ids = [d.id for d in docs[:3]]

        # Run engine directly
        result = ReconciliationEngine.reconcile_documents(db, doc_ids)

        assert "case_id" in result
        assert "case_number" in result
        assert result["documents_count"] == 3
        assert len(result["fields"]) == 17

        # Check Owner Name conflict is detected
        owner_field = next(f for f in result["fields"] if f["field_key"] == "owner_name")
        assert owner_field["status"] == "CONFLICT"
        assert "Potential inconsistency detected" in owner_field["explanation"]
        assert "fraud" not in owner_field["explanation"].lower()

        # Check Area field has area_comparison
        area_field = next(f for f in result["fields"] if f["field_key"] == "area")
        assert area_field["area_comparison"] is not None
        assert area_field["status"] in ("EXACT_MATCH", "APPROXIMATE_MATCH", "MINOR_DIFFERENCE")

        # Check Survey / Gat Number match
        gat_field = next(f for f in result["fields"] if f["field_key"] == "gat_number")
        assert gat_field["status"] == "EXACT_MATCH"

        # Check Village and District match
        village_field = next(f for f in result["fields"] if f["field_key"] == "village")
        assert village_field["status"] == "EXACT_MATCH"

        # Check conflicts list
        assert len(result["conflicts"]) >= 1
        conf = result["conflicts"][0]
        assert conf["field_name"] == "owner_name"
        assert conf["severity"] == "HIGH"
        assert "Potential inconsistency detected" in conf["explanation"]

    finally:
        db.close()


def test_reconciliation_run_api_endpoint():
    docs_res = client.get("/api/documents")
    assert docs_res.status_code == 200
    docs = docs_res.json()
    assert len(docs) >= 3

    # Select seeded Triad documents specifically (Sale Deed, Mutation, 7/12 Extract)
    sale_doc = next(d for d in docs if "sale_deed_doc" in d["file_name"].lower())
    mut_doc = next(d for d in docs if "ferfar" in d["file_name"].lower())
    extract_doc = next(d for d in docs if "7_12_extract_gat" in d["file_name"].lower())
    doc_ids = [sale_doc["id"], mut_doc["id"], extract_doc["id"]]

    # Call POST /api/reconciliation/run
    response = client.post("/api/reconciliation/run", json={"document_ids": doc_ids})
    assert response.status_code == 200
    data = response.json()

    assert data["documents_count"] == 3
    assert len(data["fields"]) == 17
    assert "summary_stats" in data
    assert data["summary_stats"]["total_fields"] == 17
    assert data["summary_stats"]["conflicts"] >= 1
    assert data["risk_level"] in ("CRITICAL", "HIGH", "MEDIUM")


    # Check case details
    case_number = data["case_number"]
    detail_res = client.get(f"/api/reconciliation/cases/{case_number}")
    assert detail_res.status_code == 200
    case_detail = detail_res.json()
    assert case_detail["case_number"] == case_number
    assert len(case_detail["results"]) >= 17
