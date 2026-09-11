import logging
import os
from contextlib import contextmanager
from pathlib import Path

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, Session

logger = logging.getLogger("vehicle-health")

ROOT_DIR = Path(__file__).resolve().parents[3]
DEFAULT_SQLITE_PATH = ROOT_DIR / "vehicle_health.db"

RAW_DB_URL = os.getenv("DATABASE_URL", "").strip()
if not RAW_DB_URL:
    DATABASE_URL = f"sqlite:///{DEFAULT_SQLITE_PATH}"
elif RAW_DB_URL.lower() == "disabled":
    DATABASE_URL = ""
else:
    # Render and some hosted Postgres providers still emit the legacy scheme.
    DATABASE_URL = RAW_DB_URL.replace("postgres://", "postgresql+psycopg://", 1)

connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}
engine = create_engine(DATABASE_URL, pool_pre_ping=True, connect_args=connect_args) if DATABASE_URL else None

class Base(DeclarativeBase):
    pass

@contextmanager
def session_scope():
    if engine is None:
        yield None
        return
    session = Session(engine)
    try:
        yield session
        session.commit()
    except Exception:
        session.rollback()
        logger.exception("Database operation failed")
        raise
    finally:
        session.close()

def initialize_database() -> None:
    if engine is None:
        logger.info("DATABASE_URL not configured; persistence disabled")
        return
    from . import models
    Base.metadata.create_all(engine)
    logger.info("Database schema ready")
