from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.state import State, DocumentType
from app.schemas.state import StateRead, DocumentTypeRead

router = APIRouter(prefix="/api", tags=["States & Document Types"])


@router.get("/states", response_model=List[StateRead])
def get_states(
    db: Session = Depends(get_db),
    active_only: bool = True
):
    query = db.query(State)
    if active_only:
        query = query.filter(State.is_active == True)
    return query.order_by(State.name.asc()).all()


@router.get("/document-types", response_model=List[DocumentTypeRead])
def get_document_types(
    state_id: Optional[int] = Query(None, description="Optional state ID filter"),
    db: Session = Depends(get_db),
    active_only: bool = True
):
    query = db.query(DocumentType)
    if active_only:
        query = query.filter(DocumentType.is_active == True)
    if state_id is not None:
        # Return state-specific types or generic types (state_id is None)
        query = query.filter((DocumentType.state_id == state_id) | (DocumentType.state_id == None))
    return query.order_by(DocumentType.name.asc()).all()
