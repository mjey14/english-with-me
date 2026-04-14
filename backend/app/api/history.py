from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import desc, cast, Text, or_
from app.database import get_db
from app.models.models import Conversion
from app.api.users import HARDCODED_USER_ID

router = APIRouter(prefix="/history", tags=["history"])


@router.get("")
def get_history(
    q: str | None = Query(None),
    db: Session = Depends(get_db),
):
    query = db.query(Conversion).filter(Conversion.user_id == HARDCODED_USER_ID)

    if q:
        query = query.filter(
            or_(
                Conversion.korean_input.ilike(f"%{q}%"),
                cast(Conversion.outputs, Text).ilike(f"%{q}%"),
            )
        )

    records = query.order_by(desc(Conversion.created_at)).limit(100).all()

    return [
        {
            "id": str(r.id),
            "source": r.source,
            "category": r.category,
            "sub_category": r.sub_category,
            "korean_input": r.korean_input,
            "outputs": r.outputs,
            "created_at": r.created_at.isoformat(),
        }
        for r in records
    ]


@router.delete("/{item_id}")
def delete_history(item_id: str, db: Session = Depends(get_db)):
    record = db.query(Conversion).filter(
        Conversion.id == item_id,
        Conversion.user_id == HARDCODED_USER_ID,
    ).first()
    if not record:
        raise HTTPException(status_code=404, detail="Item not found")
    db.delete(record)
    db.commit()
    return {"ok": True}
