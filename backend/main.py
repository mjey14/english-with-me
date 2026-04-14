from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from app.database import engine
from app.models.models import Base
from app.api import users, convert, history, learn, review

load_dotenv()

Base.metadata.create_all(bind=engine)

app = FastAPI(title="English With Me API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(users.router)
app.include_router(convert.router)
app.include_router(history.router)
app.include_router(learn.router)
app.include_router(review.router)


@app.get("/health")
def health_check():
    return {"status": "ok"}
