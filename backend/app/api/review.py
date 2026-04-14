from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import desc
from app.database import get_db
from app.models.models import Conversion, ReviewDismissal
from app.api.users import HARDCODED_USER_ID
import random

router = APIRouter(prefix="/review", tags=["review"])


@router.get("")
def get_review_items(db: Session = Depends(get_db)):
    dismissed_ids = {
        str(r.conversion_id)
        for r in db.query(ReviewDismissal.conversion_id)
        .filter(ReviewDismissal.user_id == HARDCODED_USER_ID)
        .all()
    }

    records = (
        db.query(Conversion)
        .filter(
            Conversion.user_id == HARDCODED_USER_ID,
            ~Conversion.id.in_([r for r in dismissed_ids]),
        )
        .order_by(desc(Conversion.created_at))
        .limit(100)
        .all()
    )

    items = [
        {
            "id": str(r.id),
            "source": r.source,
            "category": r.category,
            "sub_category": r.sub_category,
            "korean_input": r.korean_input,
            "outputs": r.outputs,
        }
        for r in records
    ]

    random.shuffle(items)
    return items


@router.post("/{item_id}/dismiss")
def dismiss_review_item(item_id: str, db: Session = Depends(get_db)):
    record = (
        db.query(Conversion)
        .filter(Conversion.id == item_id, Conversion.user_id == HARDCODED_USER_ID)
        .first()
    )
    if not record:
        raise HTTPException(status_code=404, detail="Item not found")

    already = (
        db.query(ReviewDismissal)
        .filter(
            ReviewDismissal.conversion_id == item_id,
            ReviewDismissal.user_id == HARDCODED_USER_ID,
        )
        .first()
    )
    if not already:
        db.add(ReviewDismissal(user_id=HARDCODED_USER_ID, conversion_id=item_id))
        db.commit()

    return {"ok": True}
