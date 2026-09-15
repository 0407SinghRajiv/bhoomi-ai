from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict


class StateBase(BaseModel):
    name: str
    code: str
    is_active: bool = True


class StateRead(StateBase):
    id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class DocumentTypeBase(BaseModel):
    name: str
    code: str
    description: Optional[str] = None
    state_id: Optional[int] = None
    is_active: bool = True


class DocumentTypeRead(DocumentTypeBase):
    id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
