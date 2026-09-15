"""
Tests for Phase 6: Explainable Evidence, WHAT/WHY/WHERE Framework,
and the 6 Operational Risk Dimensions.
"""
import pytest
from datetime import datetime
from app.services.reconciliation.risk_engine import RiskEngine
from app.services.reconciliation.reconciliation_engine import ReconciliationEngine
from app.models.document import Document
from app.models.state import State, DocumentType




def test_extraction_confidence_levels():
    """Verify that extraction confidence is cleanly mapped to qualitative tiers."""
    assert RiskEngine.get_extraction_confidence_level(0.95) == "High"
    assert RiskEngine.get_extraction_confidence_level(0.85) == "High"
    assert RiskEngine.get_extraction_confidence_level(0.84) == "Medium"
    assert RiskEngine.get_extraction_confidence_level(0.70) == "Medium"
    assert RiskEngine.get_extraction_confidence_level(0.69) == "Low"
    assert RiskEngine.get_extraction_confidence_level(0.40) == "Low"
    assert RiskEngine.get_extraction_confidence_level(None) == "Medium"


def test_operational_risk_owner_conflict():
    """Conflicting owner must trigger CRITICAL or HIGH risk and fail dimension."""
    fields = [
        {
            "field_key": "owner_name",
            "status": "CONFLICT",
            "doc_values": [
                {"doc_id": 1, "doc_type_name": "Sale Deed", "raw_value": "Rajesh Kumar", "confidence": 0.98},
                {"doc_id": 2, "doc_type_name": "Mutation", "raw_value": "Rakesh Kumar", "confidence": 0.89},
            ],
        }
    ]
    docs = [Document(id=1, file_name="doc1.pdf"), Document(id=2, file_name="doc2.pdf")]
    conflicts = [{"field_name": "owner_name", "severity": "HIGH"}]

    res = RiskEngine.evaluate_case_risk(fields, docs, conflicts)
    assert res["overall_risk"] in ("CRITICAL", "HIGH")
    assert res["risk_dimensions"]["conflicting_owner"]["status"] == "FAIL"
    assert "Conflicting Owner Name" in res["risk_factors"]
    assert res["risk_score"] >= 40


def test_operational_risk_area_tolerance():
    """Area discrepancy > 2% must trigger area risk factor."""
    fields = [
        {"field_key": "owner_name", "status": "EXACT_MATCH", "doc_values": []},
        {"field_key": "area", "status": "CONFLICT", "doc_values": []},
    ]
    docs = [Document(id=1, file_name="d1.pdf"), Document(id=2, file_name="d2.pdf")]
    conflicts = [{"field_name": "area", "severity": "MEDIUM"}]

    res = RiskEngine.evaluate_case_risk(fields, docs, conflicts)
    assert res["risk_dimensions"]["area_difference"]["status"] == "FAIL"
    assert "Area Variance > ±2.0%" in res["risk_factors"]


def test_operational_risk_chronology_inversion():
    """Mutation date earlier than sale deed date must trigger chronology risk."""
    fields = [
        {
            "field_key": "document_date",
            "status": "LIKELY_MATCH",
            "doc_values": [{"doc_id": 1, "normalized_value": "2020-05-15"}],
        },
        {
            "field_key": "mutation_date",
            "status": "LIKELY_MATCH",
            "doc_values": [{"doc_id": 2, "normalized_value": "2018-01-10"}],  # Earlier!
        },
    ]
    docs = [Document(id=1, file_name="d1.pdf"), Document(id=2, file_name="d2.pdf")]
    conflicts = []

    res = RiskEngine.evaluate_case_risk(fields, docs, conflicts)
    assert res["risk_dimensions"]["chronology_inconsistency"]["status"] == "FAIL"
    assert "Chronological Sequence Inversion" in res["risk_factors"]
    assert "precedes Sale Deed" in res["risk_dimensions"]["chronology_inconsistency"]["explanation"]


from app.database import SessionLocal


def test_end_to_end_reconciliation_evidence():
    """Verify that full reconciliation generates WHAT, WHY, WHERE and risk metrics."""
    db = SessionLocal()
    try:
        # Query demo triad
        docs = db.query(Document).order_by(Document.id.asc()).limit(3).all()
        if len(docs) < 2:
            pytest.skip("Not enough documents seeded for cross-document reconciliation.")

        res = ReconciliationEngine.reconcile_documents(
            db=db,
            document_ids=[d.id for d in docs],
        )

        assert "risk_assessment" in res
        assert "risk_dimensions" in res["risk_assessment"]
        assert len(res["fields"]) == 17

        # Check that owner_name field has WHAT, WHY, WHERE
        owner_field = next(f for f in res["fields"] if f["field_key"] == "owner_name")
        assert owner_field["what"] is not None
        assert owner_field["why"] is not None
        assert "The owner names differ" in owner_field["why"]
        assert "Manual verification is recommended" in owner_field["why"]
        assert len(owner_field["where"]) > 0

        # Ensure evidence coordinates exist
        first_where = owner_field["where"][0]
        assert "page_number" in first_where
        assert "source_text" in first_where
        assert "bounding_box" in first_where
        assert "extraction_confidence_level" in first_where

        # Verify conflict item has WHAT, WHY, WHERE
        assert len(res["conflicts"]) > 0
        first_conflict = res["conflicts"][0]
        assert first_conflict["what"] is not None
        assert first_conflict["why"] is not None
        assert len(first_conflict["where"]) > 0
    finally:
        db.close()

