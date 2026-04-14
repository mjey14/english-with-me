from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from app.database import get_db
from app.models.models import User
import uuid

router = APIRouter(prefix="/users", tags=["users"])

# v1: hardcoded user ID
HARDCODED_USER_ID = uuid.UUID("00000000-0000-0000-0000-000000000001")


DEFAULT_ROLE_MODEL = (
    "Michelle Obama / Cate Blanchett — articulate, eloquent, warm but powerful, "
    "precise word choice. Not casual texting style."
)


def get_or_create_user(db: Session) -> User:
    user = db.query(User).filter(User.id == HARDCODED_USER_ID).first()
    if not user:
        user = User(id=HARDCODED_USER_ID, role_model_description=DEFAULT_ROLE_MODEL)
        db.add(user)
        db.commit()
        db.refresh(user)
    return user


class ProfileUpdate(BaseModel):
    role_model_description: str

class ModesUpdate(BaseModel):
    enabled_modes: list[str]


@router.get("/me")
def get_profile(db: Session = Depends(get_db)):
    user = get_or_create_user(db)
    return {
        "id": str(user.id),
        "role_model_description": user.role_model_description,
        "enabled_modes": user.enabled_modes,
    }


@router.patch("/me")
def update_profile(body: ProfileUpdate, db: Session = Depends(get_db)):
    user = get_or_create_user(db)
    user.role_model_description = body.role_model_description
    db.commit()
    db.refresh(user)
    return {
        "id": str(user.id),
        "role_model_description": user.role_model_description,
        "enabled_modes": user.enabled_modes,
    }


@router.patch("/me/modes")
def update_modes(body: ModesUpdate, db: Session = Depends(get_db)):
    user = get_or_create_user(db)
    user.enabled_modes = body.enabled_modes
    db.commit()
    db.refresh(user)
    return {"enabled_modes": user.enabled_modes}
