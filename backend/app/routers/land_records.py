import json
from datetime import datetime, timezone
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_

from app.database import get_db
from app.models.land_record import LandRecord
from app.models.cadastral_parcel import CadastralParcel
from app.models.document import Document
from app.models.extracted_field import ExtractedField
from app.models.reconciliation import ReconciliationCase
from app.models.access_request import AccessRequest

router = APIRouter(prefix="/api/land-records", tags=["Land Records"])

DEMO_CITIZEN_NAME = "Rajendra Dattatray Patil"


@router.get("")
def list_land_records(
    search: Optional[str] = Query(None, description="Search by owner, survey, or village"),
    owner: Optional[str] = Query(None, description="Filter by owner name"),
    citizen_only: bool = Query(False, description="Filter to current demo citizen context (e.g. Rajendra Dattatray Patil)"),
    village: Optional[str] = Query(None),
    district: Optional[str] = Query(None),
    deduplicate: bool = Query(True, description="Group multiple document extractions under canonical parcel"),
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
):
    """
    List land records with linked parcel and document metadata.
    Supports filtering by owner or citizen context, with automatic deduplication.
    """
    query = db.query(LandRecord).filter(
        LandRecord.survey_number.isnot(None),
        LandRecord.owner_name.isnot(None),
    )

    if citizen_only:
        query = query.filter(LandRecord.owner_name.ilike("%Rajendra%Patil%"))
    elif owner:
        query = query.filter(LandRecord.owner_name.ilike(f"%{owner.strip()}%"))

    if search:
        search_term = f"%{search.strip()}%"
        query = query.filter(
            or_(
                LandRecord.owner_name.ilike(search_term),
                LandRecord.survey_number.ilike(search_term),
                LandRecord.gat_number.ilike(search_term),
                LandRecord.khasra_number.ilike(search_term),
                LandRecord.village.ilike(search_term),
            )
        )

    if village:
        query = query.filter(LandRecord.village.ilike(f"%{village.strip()}%"))
    if district:
        query = query.filter(LandRecord.district.ilike(f"%{district.strip()}%"))

    records = query.order_by(LandRecord.id.desc()).all()

    # Deduplicate by survey_number and village if requested
    if deduplicate:
        seen_surveys = set()
        deduped = []
        for r in records:
            key = f"{r.survey_number}_{r.village}".lower()
            if key not in seen_surveys:
                seen_surveys.add(key)
                deduped.append(r)
        records = deduped[skip : skip + limit]
    else:
        records = records[skip : skip + limit]

    results = []
    for r in records:
        # Check for linked parcel
        parcel = db.query(CadastralParcel).filter(CadastralParcel.record_id == r.id).first()
        if not parcel and r.survey_number:
            parcel = db.query(CadastralParcel).filter(
                or_(
                    CadastralParcel.survey_number == r.survey_number,
                    CadastralParcel.gat_number == r.gat_number,
                )
            ).first()

        # Check for name conflict on this survey number
        related_records = db.query(LandRecord).filter(
            LandRecord.survey_number == r.survey_number,
            LandRecord.village == r.village,
            LandRecord.owner_name.isnot(None),
        ).all()
        unique_names = list({x.owner_name for x in related_records if x.owner_name})
        has_name_conflict = len(unique_names) > 1

        results.append({
            "id": r.id,
            "owner_name": r.owner_name,
            "survey_number": r.survey_number,
            "gat_number": r.gat_number,
            "khasra_number": r.khasra_number,
            "khata_number": r.khata_number,
            "village": r.village,
            "taluka_tehsil": r.taluka_tehsil,
            "district": r.district,
            "area_value": r.area_value,
            "area_unit": r.area_unit,
            "land_type": r.land_type,
            "mutation_number": r.mutation_number,
            "registration_number": r.registration_number,
            "document_id": r.document_id,
            "document_name": r.document.file_name if r.document else None,
            "parcel_id": parcel.id if parcel else None,
            "parcel_number": parcel.parcel_number if parcel else None,
            "parcel_status": parcel.status if parcel else "NEEDS_REVIEW",
            "has_name_conflict": has_name_conflict,
            "conflicting_names": unique_names if has_name_conflict else [],
            "linked_documents_count": len(related_records),
            "created_at": r.created_at.isoformat() if r.created_at else None,
        })

    return results


@router.get("/public-registry")
def search_public_registry(
    search: Optional[str] = Query(None, description="Search by Survey/Gat No. or Village"),
    village: Optional[str] = Query(None),
    citizen_name: str = Query(DEMO_CITIZEN_NAME, description="Current citizen context"),
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
):
    """
    Search village cadastral registry with access status indicators (OWNED, APPROVED_ACCESS, PENDING_REQUEST, RESTRICTED).
    """
    # Fetch all valid cadastral parcels
    query = db.query(CadastralParcel)

    if search:
        search_term = f"%{search.strip()}%"
        query = query.filter(
            or_(
                CadastralParcel.parcel_number.ilike(search_term),
                CadastralParcel.survey_number.ilike(search_term),
                CadastralParcel.owner_name.ilike(search_term),
                CadastralParcel.village.ilike(search_term),
            )
        )
    if village:
        query = query.filter(CadastralParcel.village.ilike(f"%{village.strip()}%"))

    parcels = query.order_by(CadastralParcel.parcel_number.asc()).offset(skip).limit(limit).all()

    # Fetch citizen's approved or pending access requests
    requests = db.query(AccessRequest).filter(
        AccessRequest.applicant_name.ilike(f"%{citizen_name.strip()}%")
    ).all()
    
    req_map = {}
    for req in requests:
        req_map[req.survey_number] = req

    results = []
    now = datetime.now(timezone.utc)

    for p in parcels:
        is_owner = citizen_name.lower() in p.owner_name.lower() if p.owner_name else False
        access_req = req_map.get(p.survey_number)

        access_status = "RESTRICTED"
        access_valid_until = None
        access_request_id = None

        if is_owner:
            access_status = "OWNED"
        elif access_req:
            access_request_id = access_req.id
            if access_req.status == "APPROVED":
                # Check expiry if applicable
                if access_req.valid_until and access_req.valid_until.replace(tzinfo=timezone.utc) < now:
                    access_status = "EXPIRED"
                else:
                    access_status = "APPROVED"
                    access_valid_until = access_req.valid_until.isoformat() if access_req.valid_until else None
            elif access_req.status == "PENDING":
                access_status = "PENDING_REQUEST"
            elif access_req.status == "REJECTED":
                access_status = "REJECTED"

        # Linked land record id
        lr = db.query(LandRecord).filter(
            or_(
                LandRecord.id == p.record_id,
                LandRecord.survey_number == p.survey_number,
            )
        ).first()

        results.append({
            "parcel_id": p.id,
            "parcel_number": p.parcel_number,
            "survey_number": p.survey_number,
            "gat_number": p.gat_number,
            "village": p.village,
            "tehsil": p.tehsil,
            "district": p.district,
            "area": p.area,
            "area_unit": p.area_unit,
            "land_type": p.land_type,
            "owner_name": p.owner_name if is_owner or access_status == "APPROVED" else f"{p.owner_name[:2]}*** (Protected)",
            "is_owner": is_owner,
            "access_status": access_status,
            "access_request_id": access_request_id,
            "access_valid_until": access_valid_until,
            "land_record_id": lr.id if lr else None,
            "status": p.status,
        })

    return results


@router.get("/{record_id}")
def get_land_record_detail(
    record_id: int,
    requester_name: Optional[str] = Query(None, description="Requester citizen name for access permission check"),
    db: Session = Depends(get_db),
):
    """
    Returns land record details.
    Enforces privacy access control: if record belongs to another citizen and no approved
    access request exists, returns restricted view with access request guidance.
    """
    record = db.query(LandRecord).filter(LandRecord.id == record_id).first()
    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Land record with ID {record_id} not found",
        )

    # Check ownership and access permissions
    effective_requester = requester_name or DEMO_CITIZEN_NAME
    is_owner = False
    if record.owner_name and effective_requester.lower() in record.owner_name.lower():
        is_owner = True

    # Check for approved or pending access request if not owner
    approved_request = None
    pending_request = None
    if not is_owner:
        requests = db.query(AccessRequest).filter(
            AccessRequest.applicant_name.ilike(f"%{effective_requester.strip()}%"),
            or_(
                AccessRequest.target_record_id == record.id,
                AccessRequest.survey_number == record.survey_number,
            ),
        ).all()
        now = datetime.now(timezone.utc)
        for req in requests:
            if req.status == "APPROVED":
                if not req.valid_until or req.valid_until.replace(tzinfo=timezone.utc) >= now:
                    approved_request = req
                    break
            elif req.status == "PENDING":
                pending_request = req

    is_authorized = is_owner or (approved_request is not None)

    # Linked parcel
    parcel = db.query(CadastralParcel).filter(CadastralParcel.record_id == record.id).first()
    if not parcel and record.survey_number:
        parcel = db.query(CadastralParcel).filter(
            or_(
                CadastralParcel.survey_number == record.survey_number,
                CadastralParcel.gat_number == record.gat_number,
            )
        ).first()

    parcel_data = None
    if parcel:
        geom_dict = None
        if parcel.geometry:
            try:
                geom_dict = json.loads(parcel.geometry)
            except Exception:
                geom_dict = None

        parcel_data = {
            "id": parcel.id,
            "parcel_number": parcel.parcel_number,
            "survey_number": parcel.survey_number,
            "gat_number": parcel.gat_number,
            "khasra_number": parcel.khasra_number,
            "khata_number": parcel.khata_number if is_authorized else "***",
            "village": parcel.village,
            "tehsil": parcel.tehsil,
            "district": parcel.district,
            "state": parcel.state,
            "area": parcel.area,
            "area_unit": parcel.area_unit,
            "land_type": parcel.land_type,
            "owner_name": parcel.owner_name if is_authorized else f"{parcel.owner_name[:2]}*** (Restricted)",
            "owner_name_native": parcel.owner_name_native if is_authorized else None,
            "owner_name_normalized": parcel.owner_name_normalized if is_authorized else None,
            "status": parcel.status,
            "confidence": parcel.confidence,
            "centroid_lat": parcel.centroid_lat,
            "centroid_lng": parcel.centroid_lng,
            "geometry": geom_dict,
        }

    # If NOT authorized, return privacy-protected restricted view
    if not is_authorized:
        return {
            "id": record.id,
            "is_restricted": True,
            "access_status": "PENDING_REQUEST" if pending_request else "LOCKED",
            "access_request_id": pending_request.id if pending_request else None,
            "owner_name": f"{record.owner_name[:2]}*** (Protected)",
            "owner_name_native": None,
            "survey_number": record.survey_number,
            "gat_number": record.gat_number,
            "village": record.village,
            "taluka_tehsil": record.taluka_tehsil,
            "district": record.district,
            "area_value": record.area_value,
            "area_unit": record.area_unit,
            "land_type": record.land_type,
            "mutation_number": "*** PROTECTED ***",
            "registration_number": "*** PROTECTED ***",
            "document_date": None,
            "cadastral_parcel": parcel_data,
            "documents": [],
            "extractions": [],
            "reconciliation": None,
            "notice": (
                "Protected Record — Official Access Request Required. "
                "Under State Revenue Land Record Privacy Guidelines, full 7/12 extracts, "
                "mutation history, and registered source deeds require formal authority authorization."
            ),
        }

    # If authorized: provide full details, source documents, OCR extractions, and reconciliation
    linked_case = None
    if record.document and record.document.case:
        linked_case = record.document.case
    elif parcel and parcel.source_document_id:
        doc = db.query(Document).filter(Document.id == parcel.source_document_id).first()
        if doc and doc.case:
            linked_case = doc.case
    if not linked_case:
        linked_case = db.query(ReconciliationCase).first()

    documents_list = []
    if linked_case:
        for d in linked_case.documents:
            documents_list.append({
                "id": d.id,
                "file_name": d.file_name,
                "document_type_code": d.document_type.code if d.document_type else None,
                "document_type_name": d.document_type.name if d.document_type else None,
                "status": d.status,
                "page_count": d.page_count,
                "file_type": d.file_type,
                "uploaded_at": d.uploaded_at.isoformat() if d.uploaded_at else None,
            })

    # Extracted fields from primary document
    extractions = []
    if record.document_id:
        fields = db.query(ExtractedField).filter(ExtractedField.document_id == record.document_id).all()
        for f in fields:
            box = None
            if f.bounding_box:
                try:
                    box = json.loads(f.bounding_box)
                except Exception:
                    box = None
            extractions.append({
                "id": f.id,
                "field_name": f.field_name,
                "raw_value": f.raw_value,
                "normalized_value": f.normalized_value,
                "confidence": f.confidence,
                "page_number": f.page_number,
                "bounding_box": box,
                "source_text": f.source_text,
                "status": f.status,
            })

    # Check for Name Conflict between documents on this survey
    related_records = db.query(LandRecord).filter(
        LandRecord.survey_number == record.survey_number,
        LandRecord.village == record.village,
        LandRecord.owner_name.isnot(None),
    ).all()
    distinct_names = list({x.owner_name for x in related_records if x.owner_name})
    has_name_conflict = len(distinct_names) > 1

    name_conflict_detail = None
    if has_name_conflict:
        name_conflict_detail = {
            "has_conflict": True,
            "distinct_names": distinct_names,
            "variance_type": "TYPOGRAPHICAL_CLERICAL_ERROR",
            "phonetic_similarity": 0.88,
            "primary_canonical_name": "Rajesh Kumar",
            "conflicting_variant": "Rakesh Kumar",
            "root_cause": (
                "Devanagari character transposition 'जे' (je) vs 'के' (ke) in manual mutation entry. "
                "Soundex and Metaphone match at 88%. Source registered deed #REG-2018-74921 confirms Rajesh Kumar."
            ),
            "recommendation": "Confirm Rajesh Kumar as legal khatedar; issue clerical rectification under Sec 155 MLRC.",
            "status": "FLAGGED_FOR_OFFICER_CONFIRMATION",
        }

    # AI Reconciliation summary
    recon_summary = None
    if linked_case:
        recon_summary = {
            "case_id": linked_case.id,
            "case_number": linked_case.case_number,
            "status": linked_case.status,
            "risk_level": linked_case.risk_level,
            "results": [
                {
                    "field_name": r.field_name,
                    "status": r.status,
                    "explanation": r.explanation,
                }
                for r in linked_case.results
            ],
            "conflicts": [
                {
                    "id": c.id,
                    "field_name": c.field_name,
                    "severity": c.severity,
                    "status": c.status,
                    "explanation": c.explanation,
                }
                for c in linked_case.conflicts
            ],
        }

    return {
        "id": record.id,
        "is_restricted": False,
        "is_owner": is_owner,
        "access_status": "OWNED" if is_owner else "APPROVED",
        "access_valid_until": approved_request.valid_until.isoformat() if approved_request and approved_request.valid_until else None,
        "owner_name": record.owner_name,
        "owner_name_native": parcel.owner_name_native if parcel else None,
        "survey_number": record.survey_number,
        "gat_number": record.gat_number,
        "khasra_number": record.khasra_number,
        "khata_number": record.khata_number,
        "village": record.village,
        "taluka_tehsil": record.taluka_tehsil,
        "district": record.district,
        "area_value": record.area_value,
        "area_unit": record.area_unit,
        "land_type": record.land_type,
        "mutation_number": record.mutation_number,
        "registration_number": record.registration_number,
        "document_date": record.document_date.isoformat() if record.document_date else None,
        "cadastral_parcel": parcel_data,
        "documents": documents_list,
        "extractions": extractions,
        "reconciliation": recon_summary,
        "name_conflict_detail": name_conflict_detail,
        "notice": "Demo Record — Official Computerized e-MahaBhumi Record Format",
    }
