import os
from abc import ABC, abstractmethod
from pathlib import Path
from app.config import settings


class StorageBackend(ABC):
    @abstractmethod
    def save(self, file_path: str, data: bytes) -> str:
        """Save file bytes to destination and return path or URL."""
        pass

    @abstractmethod
    def read(self, file_path: str) -> bytes:
        """Read file bytes from destination."""
        pass

    @abstractmethod
    def delete(self, file_path: str) -> bool:
        """Delete file at destination."""
        pass

    @abstractmethod
    def exists(self, file_path: str) -> bool:
        """Check if file exists."""
        pass


class LocalStorageBackend(StorageBackend):
    def __init__(self, base_dir: str = None):
        self.base_dir = Path(base_dir or settings.STORAGE_DIR)
        self.base_dir.mkdir(parents=True, exist_ok=True)

    def _resolve_path(self, file_path: str) -> Path:
        target = Path(file_path)
        if target.is_absolute():
            return target
        return self.base_dir / file_path

    def save(self, file_path: str, data: bytes) -> str:
        target = self._resolve_path(file_path)
        target.parent.mkdir(parents=True, exist_ok=True)
        with open(target, "wb") as f:
            f.write(data)
        return str(target)

    def read(self, file_path: str) -> bytes:
        target = self._resolve_path(file_path)
        if not target.exists():
            raise FileNotFoundError(f"File not found: {file_path}")
        with open(target, "rb") as f:
            return f.read()

    def delete(self, file_path: str) -> bool:
        target = self._resolve_path(file_path)
        if target.exists():
            target.unlink()
            return True
        return False

    def exists(self, file_path: str) -> bool:
        target = self._resolve_path(file_path)
        return target.exists()


storage: StorageBackend = LocalStorageBackend()
