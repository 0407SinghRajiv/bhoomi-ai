import json
from typing import List, Optional, Union
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.database import get_db
from app.models.cadastral_parcel import CadastralParcel
from app.models.land_record import LandRecord
from app.models.document import Document
from app.models.reconciliation import ReconciliationCase, ReconciliationResult
from app.models.conflict import Conflict
from app.models.audit import AuditLog
from app.schemas.cadastral import (
    CadastralParcelRead,
    CadastralParcelDetail,
    CadastralGeoJSONCollection,
    CadastralGeoJSONFeature,
    CadastralDocumentSummary,
    CadastralReconciliationSummary,
    ParcelVerifyRequest,
)

router = APIRouter(prefix="/api/cadastral-parcels", tags=["Cadastral GIS"])


@router.get("", response_model=Union[CadastralGeoJSONCollection, List[CadastralParcelRead]])
def list_cadastral_parcels(
    search: Optional[str] = Query(None, description="Search by Survey/Gat/Khasra/Parcel No. or Owner Name"),
    village: Optional[str] = Query(None, description="Filter by village"),
    tehsil: Optional[str] = Query(None, description="Filter by tehsil"),
    district: Optional[str] = Query(None, description="Filter by district"),
    status_filter: Optional[str] = Query(None, alias="status", description="Filter by status (VERIFIED, NEEDS_REVIEW, etc.)"),
    as_geojson: bool = Query(False, description="Return as standard GeoJSON FeatureCollection"),
    db: Session = Depends(get_db),
):
    """
    Lists cadastral parcels with search and GIS filtering.
    Can return standard JSON list or GeoJSON FeatureCollection for Leaflet map overlay.
    """
    query = db.query(CadastralParcel)

    if search:
        search_term = f"%{search.strip()}%"
        query = query.filter(
            or_(
                CadastralParcel.parcel_number.ilike(search_term),
                CadastralParcel.survey_number.ilike(search_term),
                CadastralParcel.gat_number.ilike(search_term),
                CadastralParcel.khasra_number.ilike(search_term),
                CadastralParcel.owner_name.ilike(search_term),
                CadastralParcel.owner_name_native.ilike(search_term),
                CadastralParcel.village.ilike(search_term),
            )
        )

    if village:
        query = query.filter(CadastralParcel.village.ilike(f"%{village.strip()}%"))
    if tehsil:
        query = query.filter(CadastralParcel.tehsil.ilike(f"%{tehsil.strip()}%"))
    if district:
        query = query.filter(CadastralParcel.district.ilike(f"%{district.strip()}%"))
    if status_filter:
        query = query.filter(CadastralParcel.status == status_filter.upper())

    parcels = query.order_by(CadastralParcel.parcel_number.asc()).all()

    if as_geojson:
        features = []
        for p in parcels:
            geom = {}
            if p.geometry:
                try:
                    geom = json.loads(p.geometry)
                except Exception:
                    geom = {"type": "Polygon", "coordinates": []}
            
            features.append(CadastralGeoJSONFeature(
                type="Feature",
                id=p.id,
                properties={
                    "id": p.id,
                    "parcel_number": p.parcel_number,
                    "survey_number": p.survey_number,
                    "gat_number": p.gat_number,
                    "khasra_number": p.khasra_number,
                    "khata_number": p.khata_number,
                    "village": p.village,
                    "tehsil": p.tehsil,
                    "district": p.district,
                    "state": p.state,
                    "area": p.area,
                    "area_unit": p.area_unit,
                    "land_type": p.land_type,
                    "owner_name": p.owner_name,
                    "owner_name_native": p.owner_name_native,
                    "owner_name_normalized": p.owner_name_normalized,
                    "status": p.status,
                    "confidence": p.confidence,
                    "centroid_lat": p.centroid_lat,
                    "centroid_lng": p.centroid_lng,
                    "record_id": p.record_id,
                    "source_document_id": p.source_document_id,
                    "notice": "Demo Record — Not an Official Government Record",
                },
                geometry=geom,
            ))
        return CadastralGeoJSONCollection(
            type="FeatureCollection",
            name="Cadastral_Parcels",
            features=features,
        )

    return parcels


@router.get("/{parcel_id}", response_model=CadastralParcelDetail)
def get_cadastral_parcel_detail(
    parcel_id: int,
    db: Session = Depends(get_db),
):
    """
    Returns full cadastral parcel detail, including linked LandRecord,
    associated source documents, parsed GeoJSON geometry, and reconciliation status.
    """
    parcel = db.query(CadastralParcel).filter(CadastralParcel.id == parcel_id).first()
    if not parcel:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Cadastral parcel with ID {parcel_id} not found",
        )

    # Parse geometry
    geom_dict = None
    if parcel.geometry:
        try:
            geom_dict = json.loads(parcel.geometry)
        except Exception:
            geom_dict = None

    # Linked LandRecord
    land_rec_dict = None
    linked_case = None
    if parcel.record_id:
        lr = db.query(LandRecord).filter(LandRecord.id == parcel.record_id).first()
        if lr:
            land_rec_dict = {
                "id": lr.id,
                "owner_name": lr.owner_name,
                "survey_number": lr.survey_number,
                "gat_number": lr.gat_number,
                "khasra_number": lr.khasra_number,
                "khata_number": lr.khata_number,
                "village": lr.village,
                "taluka_tehsil": lr.taluka_tehsil,
                "district": lr.district,
                "area_value": lr.area_value,
                "area_unit": lr.area_unit,
                "land_type": lr.land_type,
                "mutation_number": lr.mutation_number,
                "registration_number": lr.registration_number,
                "document_date": lr.document_date.isoformat() if lr.document_date else None,
            }
            if lr.document and lr.document.case:
                linked_case = lr.document.case

    # If not found through LandRecord, try source_document
    if not linked_case and parcel.source_document_id:
        doc = db.query(Document).filter(Document.id == parcel.source_document_id).first()
        if doc and doc.case:
            linked_case = doc.case

    # Default fallback to primary demo case if available
    if not linked_case:
        linked_case = db.query(ReconciliationCase).first()

    # Associated documents
    docs_summary = []
    if linked_case:
        for d in linked_case.documents:
            docs_summary.append(CadastralDocumentSummary(
                id=d.id,
                file_name=d.file_name,
                document_type_code=d.document_type.code if d.document_type else None,
                document_type_name=d.document_type.name if d.document_type else None,
                status=d.status,
                page_count=d.page_count,
                file_type=d.file_type,
                uploaded_at=d.uploaded_at,
            ))

    # Reconciliation summary
    recon_summary = None
    if linked_case:
        results_data = [
            {
                "field_name": r.field_name,
                "status": r.status,
                "explanation": r.explanation,
            }
            for r in linked_case.results
        ]
        conflicts_data = [
            {
                "id": c.id,
                "field_name": c.field_name,
                "severity": c.severity,
                "status": c.status,
                "explanation": c.explanation,
            }
            for c in linked_case.conflicts
        ]
        recon_summary = CadastralReconciliationSummary(
            case_id=linked_case.id,
            case_number=linked_case.case_number,
            status=linked_case.status,
            risk_level=linked_case.risk_level,
            results=results_data,
            conflicts=conflicts_data,
            conflicts_count=len(conflicts_data),
        )

    return CadastralParcelDetail(
        id=parcel.id,
        parcel_number=parcel.parcel_number,
        survey_number=parcel.survey_number,
        gat_number=parcel.gat_number,
        khasra_number=parcel.khasra_number,
        khata_number=parcel.khata_number,
        village=parcel.village,
        tehsil=parcel.tehsil,
        district=parcel.district,
        state=parcel.state,
        area=parcel.area,
        area_unit=parcel.area_unit,
        land_type=parcel.land_type,
        owner_name=parcel.owner_name,
        owner_name_native=parcel.owner_name_native,
        owner_name_normalized=parcel.owner_name_normalized,
        status=parcel.status,
        confidence=parcel.confidence,
        centroid_lat=parcel.centroid_lat,
        centroid_lng=parcel.centroid_lng,
        record_id=parcel.record_id,
        source_document_id=parcel.source_document_id,
        geometry=parcel.geometry,
        created_at=parcel.created_at,
        updated_at=parcel.updated_at,
        land_record=land_rec_dict,
        documents=docs_summary,
        reconciliation=recon_summary,
        geometry_geojson=geom_dict,
    )


@router.get("/{parcel_id}/documents", response_model=List[CadastralDocumentSummary])
def get_parcel_documents(
    parcel_id: int,
    db: Session = Depends(get_db),
):
    """
    Returns source documents connected to the specified cadastral parcel.
    """
    detail = get_cadastral_parcel_detail(parcel_id=parcel_id, db=db)
    return detail.documents


@router.get("/{parcel_id}/reconciliation", response_model=Optional[CadastralReconciliationSummary])
def get_parcel_reconciliation(
    parcel_id: int,
    db: Session = Depends(get_db),
):
    """
    Returns AI cross-document reconciliation results and conflicts for the specified parcel.
    """
    detail = get_cadastral_parcel_detail(parcel_id=parcel_id, db=db)
    return detail.reconciliation


@router.patch("/{parcel_id}/verify", response_model=CadastralParcelDetail)
def verify_cadastral_parcel(
    parcel_id: int,
    req: ParcelVerifyRequest,
    db: Session = Depends(get_db),
):
    """
    Authority verification and correction endpoint for cadastral parcel.
    Updates parcel attributes (Owner, Survey, Area, Status) and registers
    an immutable AuditLog entry in the database.
    """
    parcel = db.query(CadastralParcel).filter(CadastralParcel.id == parcel_id).first()
    if not parcel:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Cadastral parcel with ID {parcel_id} not found",
        )

    changes = []
    if req.owner_name and req.owner_name.strip() != parcel.owner_name:
        changes.append(f"Owner updated from '{parcel.owner_name}' to '{req.owner_name.strip()}'")
        parcel.owner_name = req.owner_name.strip()
        parcel.owner_name_normalized = req.owner_name.strip()

    if req.survey_number and req.survey_number.strip() != parcel.survey_number:
        changes.append(f"Survey number updated from '{parcel.survey_number}' to '{req.survey_number.strip()}'")
        parcel.survey_number = req.survey_number.strip()
        parcel.parcel_number = req.survey_number.strip()

    if req.area is not None and req.area != parcel.area:
        changes.append(f"Area updated from {parcel.area} to {req.area} {parcel.area_unit}")
        parcel.area = req.area

    if req.status and req.status.upper() != parcel.status:
        old_status = parcel.status
        parcel.status = req.status.upper()
        changes.append(f"Status changed from {old_status} to {parcel.status}")

    # Also update linked LandRecord if present
    if parcel.record_id:
        lr = db.query(LandRecord).filter(LandRecord.id == parcel.record_id).first()
        if lr:
            if req.owner_name:
                lr.owner_name = req.owner_name.strip()
            if req.survey_number:
                lr.survey_number = req.survey_number.strip()
            if req.area is not None:
                lr.area_value = req.area

    # Create Audit Log
    desc = f"Authority verification on Parcel {parcel.parcel_number}. Officer: {req.officer_name}. Reason: {req.reason}. Changes: {', '.join(changes) if changes else 'Verified without changes.'}"
    
    # Associate audit log with linked case if available
    case_id = None
    if parcel.record_id and parcel.land_record and parcel.land_record.document:
        case_id = parcel.land_record.document.case_id

    audit = AuditLog(
        case_id=case_id,
        action="CADASTRAL_PARCEL_VERIFIED",
        actor_type="DEMO_AUTHORITY",
        description=f"[Demo Record — Not an Official Government Record] {desc}",
        metadata_json=json.dumps({
            "parcel_id": parcel.id,
            "parcel_number": parcel.parcel_number,
            "officer_name": req.officer_name,
            "reason": req.reason,
            "status": parcel.status,
            "changes": changes,
        }),
    )
    db.add(audit)
    db.commit()
    db.refresh(parcel)

    return get_cadastral_parcel_detail(parcel_id=parcel.id, db=db)
