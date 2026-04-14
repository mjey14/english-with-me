from contextlib import asynccontextmanager
import asyncio
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from app.database import engine
from app.models.models import Base
from app.api import users, convert, history, learn, review

load_dotenv()


async def _init_db():
    if engine is None:
        return
    try:
        await asyncio.to_thread(Base.metadata.create_all, engine)
    except Exception as e:
        print(f"[DB] create_all failed: {e}", flush=True)


@asynccontextmanager
async def lifespan(app: FastAPI):
    asyncio.create_task(_init_db())
    yield


app = FastAPI(title="English With Me API", lifespan=lifespan)

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
