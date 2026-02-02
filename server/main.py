from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from database import SessionLocal, engine, Base
from models import Lead

Base.metadata.create_all(bind=engine)

app = FastAPI(title="OsonTrack Leads API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # prod-da domeningizni yozing
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def db_session():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

class LeadIn(BaseModel):
    full_name: str = Field(min_length=3, max_length=160)
    phone: str = Field(min_length=7, max_length=32)
    business_type: str | None = Field(default=None, max_length=80)
    note: str | None = None
    source_page: str | None = Field(default=None, max_length=120)

@app.post("/api/leads")
def create_lead(payload: LeadIn, db: Session = Depends(db_session)):
    phone = payload.phone.strip()

    lead = Lead(
        full_name=payload.full_name.strip(),
        phone=phone,
        business_type=(payload.business_type or "").strip() or None,
        note=(payload.note or "").strip() or None,
        source_page=(payload.source_page or "").strip() or None,
    )
    db.add(lead)
    db.commit()
    db.refresh(lead)
    return {"ok": True, "id": lead.id}
