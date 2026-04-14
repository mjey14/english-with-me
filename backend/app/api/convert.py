from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from app.database import get_db
from app.models.models import Conversion
from app.api.users import get_or_create_user, HARDCODED_USER_ID
from app.agents.convert_agent import convert
import uuid

router = APIRouter(prefix="/convert", tags=["convert"])

VALID_CATEGORIES = {"work", "friends", "todo", "academia"}
VALID_SUB_CATEGORIES = {
    "work": {"meeting", "video_call", "messenger", "small_talk", "work_email", "presentation"},
    "friends": {"whatsapp", "in_person", "group_chat"},
    "academia": {"prof_meeting", "seminar", "thesis", "prof_email", "conference_qa"},
    "todo": set(),
}


class ConvertRequest(BaseModel):
    korean_input: str
    category: str
    sub_category: str | None = None
    user_context: str | None = None


@router.post("")
def convert_text(body: ConvertRequest, db: Session = Depends(get_db)):
    if body.category not in VALID_CATEGORIES:
        raise HTTPException(status_code=400, detail=f"Invalid category: {body.category}")

    valid_subs = VALID_SUB_CATEGORIES.get(body.category, set())
    if valid_subs and body.sub_category not in valid_subs:
        raise HTTPException(status_code=400, detail=f"Invalid sub_category: {body.sub_category}")

    user = get_or_create_user(db)

    try:
        outputs = convert(
            korean_input=body.korean_input,
            category=body.category,
            sub_category=body.sub_category,
            role_model_description=user.role_model_description,
            user_context=body.user_context,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI conversion failed: {str(e)}")

    record = Conversion(
        user_id=HARDCODED_USER_ID,
        category=body.category,
        sub_category=body.sub_category,
        korean_input=body.korean_input,
        outputs=outputs,
    )
    db.add(record)
    db.commit()

    return {"outputs": outputs, "id": str(record.id)}
