from app.routers.health import router as health_router
from app.routers.states import router as states_router
from app.routers.documents import router as documents_router
from app.routers.reconciliation import router as reconciliation_router
from app.routers.verification import router as verification_router
from app.routers.authority import router as authority_router
from app.routers.cadastral import router as cadastral_router
from app.routers.land_records import router as land_records_router
from app.routers.access_requests import router as access_requests_router

__all__ = [
    "health_router",
    "states_router",
    "documents_router",
    "reconciliation_router",
    "verification_router",
    "authority_router",
    "cadastral_router",
    "land_records_router",
    "access_requests_router",
]

