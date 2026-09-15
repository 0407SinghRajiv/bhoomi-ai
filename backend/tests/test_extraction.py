"""
Phase 4 Automated Tests: Structured Land Record Extraction
Smart India Hackathon 2026 - Problem Statement 26018
"""
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.main import app
from app.database import Base, get_db
from app.models.document import Document
from app.models.document_page import DocumentPage
from app.models.ocr_result import OCRResult
from app.models.extracted_field import ExtractedField
from app.services.extraction.document_classifier import DocumentClassifier
from app.services.extraction.normalizer import FieldNormalizer
from app.services.extraction.extractor import EntityExtractor
from app.services.document_service import DocumentService


# Test DB setup
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"
engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="module")
def db_session():
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()
        Base.metadata.drop_all(bind=engine)


@pytest.fixture(scope="module")
def client(db_session):
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


# ==============================================================================
# 1. DOCUMENT CLASSIFIER TESTS
# ==============================================================================

def test_document_classifier_7_12():
    text = "महाराष्ट्र शासन गाव नमुना सात (७/१२) अधिकार अभिलेख पत्रक भूमापन क्रमांक १४२/३"
    result = DocumentClassifier.classify(text)
    assert result["code"] == "7_12_EXTRACT"
    assert "7/12" in result["name"]


def test_document_classifier_sale_deed():
    text = "This DEED OF ABSOLUTE SALE executed on this 14th day of February 2024 between the VENDOR and PURCHASER"
    result = DocumentClassifier.classify(text)
    assert result["code"] == "SALE_DEED"


def test_document_classifier_mutation():
    text = "महाराष्ट्र शासन फेरफार नोंदवही (गाव नमुना ६) नोंद क्रमांक ६४८१ वारस फेरफार"
    result = DocumentClassifier.classify(text)
    assert result["code"] == "MUTATION_RECORD"



def test_document_classifier_rtc():
    text = "Government of Karnataka Form No 16 Record of Rights, Tenancy and Crops (RTC / Pahani) survey no 84"
    result = DocumentClassifier.classify(text)
    assert result["code"] == "RTC"


def test_document_classifier_khatauni():
    text = "उत्तर प्रदेश राजस्व परिषद खतौनी (अधिकार अभिलेख) फसली वर्ष खाता संख्या १२५"
    result = DocumentClassifier.classify(text)
    assert result["code"] == "KHATAUNI"


def test_document_classifier_jamabandi():
    text = "Government of Punjab Jamabandi Nakal Register Haqdaran Zameen khewat no 45"
    result = DocumentClassifier.classify(text)
    assert result["code"] == "JAMABANDI"


# ==============================================================================
# 2. FIELD NORMALIZER TESTS
# ==============================================================================

def test_normalize_devanagari_digits():
    raw = "गट क्र. १४२/३ क्षेत्र ०.८०९ हेक्टर"
    norm = FieldNormalizer.normalize_digits(raw)
    assert "142/3" in norm
    assert "0.809" in norm


def test_normalize_area_guntha():
    raw = "32 Guntha"
    val, unit, ha = FieldNormalizer.normalize_area(raw)
    assert unit == "Guntha"
    assert val == 32.0
    # 32 Guntha = 32 * 0.010117 = ~0.3237 Hectares
    assert 0.32 < ha < 0.33


def test_normalize_area_devanagari():
    raw = "०.८०९ हेक्टर"
    val, unit, ha = FieldNormalizer.normalize_area(raw)
    assert ha == 0.809
    assert unit == "Hectare"


def test_normalize_dates():
    assert FieldNormalizer.normalize_date("14/02/2024") == "2024-02-14"
    assert FieldNormalizer.normalize_date("2024-02-14") == "2024-02-14"
    assert FieldNormalizer.normalize_date("१४/०२/२०२४") == "2024-02-14"


def test_transliterate_devanagari():
    assert FieldNormalizer.transliterate_devanagari("गणेश विठ्ठल पाटील") == "Ganesh Vitthal Patil"
    assert FieldNormalizer.transliterate_devanagari("पुणे") == "Pune"


# ==============================================================================
# 3. STRUCTURED ENTITY EXTRACTOR TESTS
# ==============================================================================

def test_entity_extractor_7_12():
    pages = [
        {
            "page_number": 1,
            "text": """
            महाराष्ट्र शासन गाव नमुना सात (७/१२) अधिकार अभिलेख पत्रक
            गाव: हवेली   तालुका: हवेली   जिल्हा: पुणे
            गट क्रमांक: १४२/३
            खाते क्रमांक: ३८२
            भोगवटादाराचे नाव: गणेश विठ्ठल पाटील
            एकूण क्षेत्र: ०.८०९ हेक्टर
            आकार किंवा जुडी: रु. ५.६०
            फेरफार क्रमांक: ६४८१
            """,
            "bounding_boxes": [
                {"text": "गट क्रमांक: १४२/३", "box": [0.15, 0.20, 0.20, 0.45]},
                {"text": "गणेश विठ्ठल पाटील", "box": [0.30, 0.20, 0.35, 0.60]},
            ]
        }
    ]

    extracted_fields, land_record = EntityExtractor.extract_from_pages(pages, "7_12")

    # Check Gat Number
    gat = next((f for f in extracted_fields if f["field_name"] == "gat_number"), None)
    assert gat is not None
    assert gat["raw_value"] == "१४२/३"
    assert gat["normalized_value"] == "142/3"
    assert gat["status"] == "EXTRACTED"
    assert gat["bounding_box"] is not None

    # Check Owner Name
    owner = next((f for f in extracted_fields if f["field_name"] == "owner_name"), None)
    assert owner is not None
    assert "गणेश" in owner["raw_value"]
    assert "Ganesh" in owner["normalized_value"]

    # Check Area
    area = next((f for f in extracted_fields if f["field_name"] == "area"), None)
    assert area is not None
    assert "0.809" in area["normalized_value"]

    # Check Land Record compiled
    assert land_record["gat_number"] == "142/3"
    assert land_record["district"] == "Pune"
    assert land_record["area_value"] == 0.809

    # Check missing fields are cleanly handled and not hallucinated
    khasra = next((f for f in extracted_fields if f["field_name"] == "khasra_number"), None)
    assert khasra is not None
    assert khasra["status"] == "MISSING"
    assert khasra["raw_value"] is None


# ==============================================================================
# 4. ROUTER API TESTS
# ==============================================================================

def test_api_document_extractions(client, db_session):
    # Create test document with page and OCR result
    doc = Document(
        file_name="demo_satbara_test.pdf",
        file_path="storage/demo_samples/sample_7_12_extract.pdf",
        file_type="application/pdf",
        file_size=1024,
        language="mr",
        status="COMPLETED",
        quality_status="GOOD",
        page_count=1,
    )
    db_session.add(doc)
    db_session.commit()
    db_session.refresh(doc)

    page = DocumentPage(
        document_id=doc.id,
        page_number=1,
        image_path="",
        width=1000,
        height=1400,
    )
    db_session.add(page)
    db_session.commit()
    db_session.refresh(page)

    ocr = OCRResult(
        document_page_id=page.id,
        language="mr",
        text="महाराष्ट्र शासन गाव नमुना सात (७/१२)\nगाव: बाणेर तालुका: हवेली जिल्हा: पुणे\nगट क्रमांक: १७५/२\nभोगवटादाराचे नाव: रमेश हरी शिंदे\nएकूण क्षेत्र: १.२० हेक्टर",
        confidence=0.94,
        bounding_boxes='[{"text": "गट क्रमांक: १७५/२", "box": [0.15, 0.20, 0.20, 0.40]}]',
        status="SUCCESS",
    )
    db_session.add(ocr)
    db_session.commit()

    # Call GET /api/documents/{id}/extractions
    response = client.get(f"/api/documents/{doc.id}/extractions")
    assert response.status_code == 200
    data = response.json()
    assert data["document_id"] == doc.id
    assert data["document_type_code"] == "7_12_EXTRACT"
    assert len(data["fields"]) > 0

    # Call POST /api/documents/{id}/extract
    re_response = client.post(f"/api/documents/{doc.id}/extract")
    assert re_response.status_code == 200
    re_data = re_response.json()
    assert re_data["document_id"] == doc.id
    assert re_data["document_type_code"] == "7_12_EXTRACT"

