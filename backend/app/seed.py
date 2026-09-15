"""
BhoomiAI Database Seed Script
Populates initial states, document types, and fictional demonstration records.
Smart India Hackathon 2026 - Problem Statement 26018
Notice: All records seeded are strictly:
'Demo Record — Not an Official Government Record'
"""
import sys
import json
from pathlib import Path
from datetime import datetime, timezone, timedelta

# Ensure backend root is on sys.path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.database import SessionLocal, engine
from app.models import (
    Base,
    State,
    DocumentType,
    Document,
    DocumentPage,
    DocumentProcessingJob,
    OCRResult,
    ExtractedField,
    LandRecord,
    ReconciliationCase,
    ReconciliationResult,
    Conflict,
    VerificationRequest,
    VerificationAction,
    AuditLog,
    Notification,
    GISLocation,
    CadastralParcel,
    AccessRequest,
)

NOTICE_TEXT = "Demo Record — Not an Official Government Record"


def seed_database():
    # Ensure all tables exist with latest schema
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:

        print("Seeding States...")
        states_data = [
            {"name": "Maharashtra", "code": "MH"},
            {"name": "Karnataka", "code": "KA"},
            {"name": "Telangana", "code": "TS"},
            {"name": "Uttar Pradesh", "code": "UP"},
            {"name": "Madhya Pradesh", "code": "MP"},
            {"name": "Rajasthan", "code": "RJ"},
            {"name": "Gujarat", "code": "GJ"},
            {"name": "Bihar", "code": "BR"},
            {"name": "West Bengal", "code": "WB"},
            {"name": "Tamil Nadu", "code": "TN"},
            {"name": "Kerala", "code": "KL"},
            {"name": "Andhra Pradesh", "code": "AP"},
            {"name": "Odisha", "code": "OD"},
            {"name": "Punjab", "code": "PB"},
            {"name": "Haryana", "code": "HR"},
            {"name": "Other", "code": "OTH"},
        ]

        state_objs = {}
        for s in states_data:
            state = State(name=s["name"], code=s["code"], is_active=True)
            db.add(state)
            db.flush()
            state_objs[s["name"]] = state

        print("Seeding Document Types...")
        mh_state = state_objs["Maharashtra"]
        ka_state = state_objs["Karnataka"]
        up_state = state_objs["Uttar Pradesh"]

        doc_types_data = [
            {"name": "7/12 Extract", "code": "7_12_EXTRACT", "description": "Saat-Baara land title extract with occupancy rights", "state_id": mh_state.id},
            {"name": "8A Extract", "code": "8A_EXTRACT", "description": "Holding account khata extract", "state_id": mh_state.id},
            {"name": "Ferfar / Mutation Record", "code": "MUTATION_RECORD", "description": "Form 6 mutation register recording title transfers", "state_id": mh_state.id},
            {"name": "RTC (Pahani)", "code": "RTC", "description": "Record of Rights, Tenancy and Crops", "state_id": ka_state.id},
            {"name": "Khatauni", "code": "KHATAUNI", "description": "Record of land tenure holders in UP", "state_id": up_state.id},
            {"name": "Jamabandi", "code": "JAMABANDI", "description": "Annual land title and tenancy ledger", "state_id": None},
            {"name": "Property Card", "code": "PROPERTY_CARD", "description": "Urban cadastral property card", "state_id": None},
            {"name": "Sale Deed", "code": "SALE_DEED", "description": "Registered conveyance title transfer deed", "state_id": None},
            {"name": "Registration Document", "code": "REGISTRATION_DOC", "description": "Sub-registrar office registration document", "state_id": None},
            {"name": "Generic Land Record", "code": "GENERIC_LAND_RECORD", "description": "Standardized generic cadastral document", "state_id": None},
        ]

        doc_type_objs = {}
        for dt in doc_types_data:
            obj = DocumentType(
                name=dt["name"],
                code=dt["code"],
                description=dt["description"],
                state_id=dt["state_id"],
                is_active=True,
            )
            db.add(obj)
            db.flush()
            doc_type_objs[dt["code"]] = obj

        print("Seeding Fictional Reconciliation Case...")
        now = datetime.now(timezone.utc)
        case = ReconciliationCase(
            case_number="CASE-MH-2026-001",
            status="UNDER_VERIFICATION",
            risk_level="HIGH",
            created_by_type="DEMO_CITIZEN",
            created_at=now - timedelta(days=2),
            updated_at=now,
        )
        db.add(case)
        db.flush()

        print("Seeding 3 Fictional Demo Documents (Sale Deed, Mutation, 7/12)...")
        # Document 1: Sale Deed
        doc_sale_deed = Document(
            case_id=case.id,
            demo_owner_type="DEMO_CITIZEN",
            file_name="Sale_Deed_Doc_142_3.pdf",
            file_path="storage/demo/Sale_Deed_Doc_142_3.pdf",
            file_type="application/pdf",
            file_size=245800,
            state_id=mh_state.id,
            document_type_id=doc_type_objs["SALE_DEED"].id,
            language="en",
            status="COMPLETED",
            quality_status="GOOD",
            page_count=3,
            uploaded_at=now - timedelta(days=2),
        )
        db.add(doc_sale_deed)
        db.flush()

        # Document 2: Mutation Record (Ferfar)
        doc_mutation = Document(
            case_id=case.id,
            demo_owner_type="DEMO_CITIZEN",
            file_name="Ferfar_Mutation_Entry_894.pdf",
            file_path="storage/demo/Ferfar_Mutation_Entry_894.pdf",
            file_type="application/pdf",
            file_size=184200,
            state_id=mh_state.id,
            document_type_id=doc_type_objs["MUTATION_RECORD"].id,
            language="mr",
            status="COMPLETED",
            quality_status="ACCEPTABLE",
            page_count=2,
            uploaded_at=now - timedelta(days=2),
        )
        db.add(doc_mutation)
        db.flush()

        # Document 3: Current 7/12 Extract
        doc_extract = Document(
            case_id=case.id,
            demo_owner_type="DEMO_CITIZEN",
            file_name="7_12_Extract_Gat_142_3.pdf",
            file_path="storage/demo/7_12_Extract_Gat_142_3.pdf",
            file_type="application/pdf",
            file_size=162000,
            state_id=mh_state.id,
            document_type_id=doc_type_objs["7_12_EXTRACT"].id,
            language="mr",
            status="COMPLETED",
            quality_status="GOOD",
            page_count=1,
            uploaded_at=now - timedelta(days=2),
        )
        db.add(doc_extract)
        db.flush()

        # Pages & OCR Scaffolding for Document 1 (Sale Deed)
        p1 = DocumentPage(
            document_id=doc_sale_deed.id,
            page_number=1,
            image_path="storage/demo/pages/sale_deed_p1.png",
            width=2480,
            height=3508,
        )
        db.add(p1)
        db.flush()

        ocr1 = OCRResult(
            document_page_id=p1.id,
            language="en",
            text=f"[{NOTICE_TEXT}] Conveyance Deed made between Vendor Suresh Patel and Purchaser Rajesh Kumar for Land Survey 142/3 measuring 2.00 Acres in Wagholi, Pune.",
            confidence=0.96,
            bounding_boxes=json.dumps([
                {"box": [120, 240, 480, 280], "text": "Rajesh Kumar", "label": "PURCHASER"},
                {"box": [510, 310, 680, 340], "text": "Survey 142/3", "label": "SURVEY_NO"},
                {"box": [720, 410, 890, 440], "text": "2.00 Acres", "label": "AREA"}
            ]),
            status="COMPLETED",
        )
        db.add(ocr1)

        # LandRecord for Document 1 (Sale Deed)
        lr1 = LandRecord(
            document_id=doc_sale_deed.id,
            owner_name="Rajesh Kumar",
            survey_number="142/3",
            gat_number="142/3",
            village="Wagholi",
            taluka_tehsil="Haveli",
            district="Pune",
            state_id=mh_state.id,
            area_value=2.0,
            area_unit="Acre",
            land_type="Agricultural",
            registration_number="REG-2018-74921",
            document_date=now - timedelta(days=365 * 6),
        )
        db.add(lr1)

        # Extracted fields for Document 1
        # Extracted fields for Document 1
        ef1_1 = ExtractedField(
            document_id=doc_sale_deed.id,
            field_name="owner_name",
            raw_value="Rajesh Kumar",
            normalized_value="Rajesh Kumar",
            confidence=0.98,
            page_number=1,
            bounding_box=json.dumps([0.14, 0.22, 0.22, 0.58]),
            source_text="Rajesh Kumar s/o Rameshwar Kumar",
            status="VERIFIED",
        )
        ef1_2 = ExtractedField(
            document_id=doc_sale_deed.id,
            field_name="area",
            raw_value="2 Acres",
            normalized_value="0.809 Hectares",
            confidence=0.97,
            page_number=1,
            bounding_box=json.dumps([0.38, 0.22, 0.44, 0.52]),
            source_text="measuring in the aggregate 2.00 Acres",
            status="VERIFIED",
        )
        ef1_3 = ExtractedField(
            document_id=doc_sale_deed.id,
            field_name="survey_number",
            raw_value="142/3",
            normalized_value="142/3",
            confidence=0.99,
            page_number=1,
            bounding_box=json.dumps([0.25, 0.22, 0.31, 0.55]),
            source_text="Land Survey 142/3 in Wagholi",
            status="VERIFIED",
        )
        db.add_all([ef1_1, ef1_2, ef1_3])

        # Pages & OCR Scaffolding for Document 2 (Mutation Record)
        p2 = DocumentPage(
            document_id=doc_mutation.id,
            page_number=1,
            image_path="storage/demo/pages/mutation_p1.png",
            width=2480,
            height=3508,
        )
        db.add(p2)
        db.flush()

        ocr2 = OCRResult(
            document_page_id=p2.id,
            language="mr",
            text=f"[{NOTICE_TEXT}] फेरफार नोंद क्रमांक ८९४. मौजे वाघोली, गट नंबर १४२/३. खरेदीदार राकेश कुमार (Rakesh Kumar). क्षेत्र ०.८०९ हेक्टर.",
            confidence=0.91,
            bounding_boxes=json.dumps([
                {"box": [140, 260, 490, 290], "text": "राकेश कुमार (Rakesh Kumar)", "label": "KHATEDAR"},
                {"box": [520, 320, 690, 350], "text": "गट १४२/३", "label": "GAT_NO"}
            ]),
            status="COMPLETED",
        )
        db.add(ocr2)

        # LandRecord for Document 2 (Mutation Record with typographical variance Rakesh vs Rajesh)
        lr2 = LandRecord(
            document_id=doc_mutation.id,
            owner_name="Rakesh Kumar",  # TYPOGRAPHICAL VARIANCE
            survey_number="142/3",
            gat_number="142/3",
            village="Wagholi",
            taluka_tehsil="Haveli",
            district="Pune",
            state_id=mh_state.id,
            area_value=0.809,
            area_unit="Hectare",
            land_type="Agricultural",
            mutation_number="FERFAR-894",
            mutation_date=now - timedelta(days=365 * 5),
        )
        db.add(lr2)

        ef2_1 = ExtractedField(
            document_id=doc_mutation.id,
            field_name="owner_name",
            raw_value="Rakesh Kumar",
            normalized_value="Rakesh Kumar",
            confidence=0.89,
            page_number=1,
            bounding_box=json.dumps([0.16, 0.24, 0.24, 0.62]),
            source_text="खरेदीदार राकेश कुमार (Rakesh Kumar)",
            status="NEEDS_REVIEW",
        )
        ef2_2 = ExtractedField(
            document_id=doc_mutation.id,
            field_name="survey_number",
            raw_value="142/3",
            normalized_value="142/3",
            confidence=0.95,
            page_number=1,
            bounding_box=json.dumps([0.26, 0.22, 0.32, 0.54]),
            source_text="गट नंबर १४२/३",
            status="VERIFIED",
        )
        db.add_all([ef2_1, ef2_2])

        # Pages & OCR Scaffolding for Document 3 (7/12 Extract)
        p3 = DocumentPage(
            document_id=doc_extract.id,
            page_number=1,
            image_path="storage/demo/pages/extract_p1.png",
            width=2480,
            height=3508,
        )
        db.add(p3)
        db.flush()

        ocr3 = OCRResult(
            document_page_id=p3.id,
            language="mr",
            text=f"[{NOTICE_TEXT}] गाव नमुना सात (अधिकार अभिलेख पत्रक). गाव: वाघोली, गट क्र.: १४२/३. खातेदार: राजेश कुमार. एकूण क्षेत्र: ०.८०९ हे.आर.",
            confidence=0.95,
            bounding_boxes=json.dumps([
                {"box": [110, 220, 460, 250], "text": "राजेश कुमार", "label": "KHATEDAR"},
                {"box": [500, 300, 670, 330], "text": "०.८०९ हे.आर.", "label": "AREA"}
            ]),
            status="COMPLETED",
        )
        db.add(ocr3)

        # LandRecord for Document 3 (Current 7/12 Extract)
        lr3 = LandRecord(
            document_id=doc_extract.id,
            owner_name="Rajesh Kumar",
            survey_number="142/3",
            gat_number="142/3",
            village="Wagholi",
            taluka_tehsil="Haveli",
            district="Pune",
            state_id=mh_state.id,
            area_value=0.809,
            area_unit="Hectare",
            land_type="Agricultural",
            registration_number="7-12-PUNE-WAG-142-3",
            document_date=now - timedelta(days=2),
        )
        db.add(lr3)

        ef3_1 = ExtractedField(
            document_id=doc_extract.id,
            field_name="owner_name",
            raw_value="राजेश कुमार",
            normalized_value="Rajesh Kumar",
            confidence=0.96,
            page_number=1,
            bounding_box=json.dumps([0.15, 0.20, 0.23, 0.56]),
            source_text="खातेदार: राजेश कुमार",
            status="VERIFIED",
        )
        ef3_2 = ExtractedField(
            document_id=doc_extract.id,
            field_name="survey_number",
            raw_value="१४२/३",
            normalized_value="142/3",
            confidence=0.98,
            page_number=1,
            bounding_box=json.dumps([0.25, 0.20, 0.31, 0.54]),
            source_text="गट क्र.: १४२/३",
            status="VERIFIED",
        )
        db.add_all([ef3_1, ef3_2])


        # Processing Jobs scaffolding
        job1 = DocumentProcessingJob(
            document_id=doc_sale_deed.id,
            job_type="DOCUMENT_ANALYSIS",
            status="COMPLETED",
            progress=100,
            message="Document ingestion and text recognition complete",
            started_at=now - timedelta(days=2),
            completed_at=now - timedelta(days=2, minutes=-2),
        )
        job2 = DocumentProcessingJob(
            document_id=doc_mutation.id,
            job_type="DOCUMENT_ANALYSIS",
            status="COMPLETED",
            progress=100,
            message="Devanagari script OCR complete with confidence 91%",
            started_at=now - timedelta(days=2),
            completed_at=now - timedelta(days=2, minutes=-2),
        )
        job3 = DocumentProcessingJob(
            document_id=doc_extract.id,
            job_type="DOCUMENT_ANALYSIS",
            status="COMPLETED",
            progress=100,
            message="Cadastral field normalization complete",
            started_at=now - timedelta(days=2),
            completed_at=now - timedelta(days=2, minutes=-2),
        )
        db.add_all([job1, job2, job3])

        print("Seeding Reconciliation Results & Conflicts...")
        res1 = ReconciliationResult(
            case_id=case.id,
            field_name="survey_number",
            status="EXACT_MATCH",
            explanation=f"[{NOTICE_TEXT}] Cadastral Gat No 142/3 is consistent across Sale Deed, Ferfar, and 7/12 Extract.",
        )
        res2 = ReconciliationResult(
            case_id=case.id,
            field_name="area_normalization",
            status="EXACT_MATCH",
            explanation=f"[{NOTICE_TEXT}] Area of 2.00 Acres in Sale Deed normalized exactly to 0.809 Hectares matching 7/12 Extract (conversion factor 1 Acre = 0.404686 Ha).",
        )
        res3 = ReconciliationResult(
            case_id=case.id,
            field_name="owner_name",
            status="CONFLICT",
            explanation=f"[{NOTICE_TEXT}] Owner name variance detected: Sale Deed and 7/12 record 'Rajesh Kumar', while Ferfar Mutation #894 records 'Rakesh Kumar'.",
        )
        db.add_all([res1, res2, res3])

        # Conflict Record
        conflict1 = Conflict(
            case_id=case.id,
            field_name="owner_name",
            severity="HIGH",
            status="OPEN",
            explanation=f"[{NOTICE_TEXT}] Typographical / phonetic mismatch between Mutation Entry #894 ('Rakesh Kumar') and Title Deed ('Rajesh Kumar'). Manual verification recommended.",
            documents_involved=json.dumps(["Ferfar / Mutation Record", "Sale Deed", "7/12 Extract"]),
            values=json.dumps({
                str(doc_mutation.id): "Rakesh Kumar",
                str(doc_sale_deed.id): "Rajesh Kumar",
                str(doc_extract.id): "Rajesh Kumar",
            }),
            created_at=now - timedelta(days=2),
        )
        db.add(conflict1)

        print("Seeding Verification Request & Actions...")
        v_req = VerificationRequest(
            case_id=case.id,
            status="UNDER_REVIEW",
            submitted_by_type="DEMO_CITIZEN",
            request_message=f"[{NOTICE_TEXT}] Discrepancy observed in spelling of Khatedar name between Ferfar entry and Registered Sale Deed. Requesting clarification / correction.",
            authority_response="Under review by Circle Officer. Verification of original Sub-Registrar index underway.",
            created_at=now - timedelta(days=1),
        )
        db.add(v_req)

        v_action = VerificationAction(
            case_id=case.id,
            action="CLARIFICATION_REQUESTED",
            field_name="owner_name",
            previous_value="Rakesh Kumar",
            new_value="Rajesh Kumar",
            reason=f"[{NOTICE_TEXT}] Talathi cross-verifying biometric and photo index on registered sale deed #REG-2018-74921.",
            performed_by_type="DEMO_AUTHORITY",
            created_at=now - timedelta(hours=12),
        )
        db.add(v_action)

        print("Seeding Audit Log Timeline...")
        audit_logs = [
            AuditLog(
                case_id=case.id,
                action="CASE_INITIALIZED",
                actor_type="DEMO_CITIZEN",
                description=f"[{NOTICE_TEXT}] Citizen initiated triad reconciliation for Gat 142/3, Wagholi, Pune.",
                metadata_json=json.dumps({"state": "Maharashtra", "district": "Pune", "case_number": case.case_number}),
                created_at=now - timedelta(days=2),
            ),
            AuditLog(
                case_id=case.id,
                action="DOCUMENTS_INGESTED",
                actor_type="SYSTEM",
                description=f"[{NOTICE_TEXT}] Ingested 3 documents: Registered Sale Deed, Ferfar #894, and 7/12 Extract.",
                metadata_json=json.dumps({"document_count": 3, "quality_score": "GOOD"}),
                created_at=now - timedelta(days=2, minutes=-5),
            ),
            AuditLog(
                case_id=case.id,
                action="CONFLICT_FLAGGED",
                actor_type="SYSTEM",
                description=f"[{NOTICE_TEXT}] High-severity conflict flagged: 'Rakesh Kumar' vs 'Rajesh Kumar'.",
                metadata_json=json.dumps({"field": "owner_name", "severity": "HIGH"}),
                created_at=now - timedelta(days=2, minutes=-10),
            ),
            AuditLog(
                case_id=case.id,
                action="VERIFICATION_QUEUED",
                actor_type="DEMO_AUTHORITY",
                description=f"[{NOTICE_TEXT}] Case triaged and assigned to Revenue Officer verification workbench.",
                metadata_json=json.dumps({"assigned_role": "Revenue Officer / Tehsildar"}),
                created_at=now - timedelta(days=1),
            ),
        ]
        db.add_all(audit_logs)

        print("Seeding Notification & GIS Location...")
        notif1 = Notification(
            recipient_type="DEMO_AUTHORITY",
            case_id=case.id,
            title="High-Priority Discrepancy Flagged",
            message=f"[{NOTICE_TEXT}] Case {case.case_number} has an owner name conflict on Gat 142/3 (Wagholi, Pune).",
            is_read=False,
            created_at=now - timedelta(days=1),
        )
        notif2 = Notification(
            recipient_type="DEMO_CITIZEN",
            case_id=case.id,
            title="Discrepancy Analysis Ready",
            message=f"[{NOTICE_TEXT}] Your documents for Gat 142/3 have been analyzed. 1 discrepancy was flagged for authority review.",
            is_read=True,
            created_at=now - timedelta(days=2),
        )
        db.add_all([notif1, notif2])

        gis = GISLocation(
            case_id=case.id,
            document_id=doc_extract.id,
            latitude=18.5793,
            longitude=73.9814,
            village="Wagholi",
            district="Pune",
            survey_number="142/3",
            geometry_data=json.dumps({
                "type": "Polygon",
                "coordinates": [[
                    [73.9810, 18.5790],
                    [73.9825, 18.5790],
                    [73.9825, 18.5802],
                    [73.9810, 18.5802],
                    [73.9810, 18.5790]
                ]]
            }),
            created_at=now,
        )
        db.add(gis)

        print("Seeding Phase 8 LandRecords & Cadastral Parcels...")
        # 1. Land Record for Survey 124/2 (Rajendra Dattatray Patil)
        lr_124_2 = LandRecord(
            document_id=doc_extract.id,
            owner_name="Rajendra Dattatray Patil",
            survey_number="124/2",
            gat_number="124/2",
            khasra_number="124/2",
            khata_number="894",
            village="Wagholi",
            taluka_tehsil="Haveli",
            district="Pune",
            state_id=mh_state.id,
            area_value=1.42,
            area_unit="Hectare",
            land_type="Agricultural (Jirayat)",
            mutation_number="FERFAR-894",
            registration_number="REG-2018-74921",
            document_date=now - timedelta(days=365 * 6),
        )
        # 2. Land Record for Survey 208/1 (Rajendra Dattatray Patil)
        lr_208_1 = LandRecord(
            document_id=None,
            owner_name="Rajendra Dattatray Patil",
            survey_number="208/1",
            gat_number="208/1",
            khasra_number="208/1",
            khata_number="894",
            village="Wagholi",
            taluka_tehsil="Haveli",
            district="Pune",
            state_id=mh_state.id,
            area_value=0.87,
            area_unit="Hectare",
            land_type="Agricultural (Irrigated)",
            mutation_number="FERFAR-412",
            registration_number="7-12-PUNE-WAG-208-1",
            document_date=now - timedelta(days=180),
        )
        db.add_all([lr_124_2, lr_208_1])
        db.flush()

        # Load GeoJSON features from demo_cadastral.geojson
        geojson_path = Path(__file__).resolve().parent.parent / "data" / "demo_cadastral.geojson"
        if geojson_path.exists():
            with open(geojson_path, "r", encoding="utf-8") as f:
                geojson_data = json.load(f)

            for feat in geojson_data.get("features", []):
                props = feat.get("properties", {})
                geom = feat.get("geometry", {})
                p_num = props.get("parcel_number")

                rec_id = None
                src_doc_id = None
                if p_num == "124/2":
                    rec_id = lr_124_2.id
                    src_doc_id = doc_extract.id
                elif p_num == "208/1":
                    rec_id = lr_208_1.id

                parcel = CadastralParcel(
                    parcel_number=p_num,
                    survey_number=props.get("survey_number", p_num),
                    gat_number=props.get("gat_number", p_num),
                    khasra_number=props.get("khasra_number", p_num),
                    khata_number=props.get("khata_number"),
                    village=props.get("village", "Wagholi"),
                    tehsil=props.get("tehsil", "Haveli"),
                    district=props.get("district", "Pune"),
                    state=props.get("state", "Maharashtra"),
                    area=float(props.get("area", 1.0)),
                    area_unit=props.get("area_unit", "Hectare"),
                    land_type=props.get("land_type", "Agricultural"),
                    owner_name=props.get("owner_name", "Unknown"),
                    owner_name_native=props.get("owner_name_native"),
                    owner_name_normalized=props.get("owner_name_normalized"),
                    record_id=rec_id,
                    source_document_id=src_doc_id,
                    geometry=json.dumps(geom),
                    centroid_lat=float(props.get("centroid_lat", 18.5794)),
                    centroid_lng=float(props.get("centroid_lng", 73.9816)),
                    status=props.get("status", "NEEDS_REVIEW"),
                    confidence=float(props.get("confidence", 0.95)),
                )
                db.add(parcel)

        # Backwards compatibility parcel 142/3
        parcel_142 = CadastralParcel(
            parcel_number="142/3",
            survey_number="142/3",
            gat_number="142/3",
            khasra_number="142/3",
            khata_number="894",
            village="Wagholi",
            tehsil="Haveli",
            district="Pune",
            state="Maharashtra",
            area=0.809,
            area_unit="Hectare",
            land_type="Agricultural",
            owner_name="Rajesh Kumar",
            owner_name_native="राजेश कुमार",
            owner_name_normalized="Rajesh Kumar",
            record_id=lr3.id,
            source_document_id=doc_extract.id,
            geometry=json.dumps({
                "type": "Polygon",
                "coordinates": [[
                    [73.9810, 18.5790],
                    [73.9825, 18.5790],
                    [73.9825, 18.5802],
                    [73.9810, 18.5802],
                    [73.9810, 18.5790]
                ]]
            }),
            centroid_lat=18.5793,
            centroid_lng=73.9814,
            status="NEEDS_REVIEW",
            confidence=0.91,
        )
        db.add(parcel_142)

        # Seed Sample Citizen Access Requests
        print("Seeding Citizen Access Requests...")
        req1 = AccessRequest(
            applicant_name="Rajendra Dattatray Patil",
            applicant_role="CITIZEN",
            applicant_contact="+91 98220 14920",
            target_record_id=lr3.id,
            target_parcel_id=parcel_142.id,
            survey_number="142/3",
            village="Wagholi",
            district="Pune",
            owner_name="Rajesh Kumar",
            reason_category="BOUNDARY_VERIFICATION",
            reason_description="Requesting official land record and extract to verify southern boundary line adjacent to Gat 124/2 for erecting demarcation fence.",
            status="APPROVED",
            reviewed_by="Tahsildar Haveli, Pune",
            review_remarks="Approved under MLRC Sec 148 for certified adjacent landowner boundary verification.",
            valid_until=now + timedelta(days=30),
        )

        req2 = AccessRequest(
            applicant_name="Rajendra Dattatray Patil",
            applicant_role="CITIZEN",
            applicant_contact="+91 98220 14920",
            target_record_id=None,
            target_parcel_id=3,
            survey_number="124/3",
            village="Wagholi",
            district="Pune",
            owner_name="Rameshwar Sadashivrao Patil",
            reason_category="TITLE_DILIGENCE",
            reason_description="Title due diligence and encumbrance check for intended family agricultural parcel consolidation.",
            status="PENDING",
            reviewed_by=None,
            review_remarks=None,
            valid_until=None,
        )
        db.add_all([req1, req2])

        db.commit()
        print("Successfully seeded all BhoomiAI Phase 2 database records!")

    except Exception as e:
        db.rollback()
        print(f"Error seeding database: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed_database()
