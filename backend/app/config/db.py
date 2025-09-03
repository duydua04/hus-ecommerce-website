from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from .settings import settings

#Engine
engine = create_engine(settings.DATABASE_URL, echo=False, future=True, pool_pre_ping=True)

SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False, expire_on_commit=False, future=True)

Base = declarative_base()

# Hàm dependcy cho fastapi
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()